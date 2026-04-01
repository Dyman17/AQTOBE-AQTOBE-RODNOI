from __future__ import annotations

import asyncio
import logging
import os
import time
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .ai import (
    generate_ai_advice,
    generate_parent_weekly_summary,
    generate_teacher_class_report,
)
from .edupage import EduPageConfig, EduPageError, fetch_timetable
from .future_api import router as future_api_router
from .mock_data import MOCK_KIOSK_CONTENT, MOCK_SCHEDULE, MOCK_STUDENT_DATA, MOCK_TIMETABLE
from .risk import calculate_risk, risk_level
from .schemas import (
    AIAdviceRequest,
    AIAdviceResponse,
    AbsenceDecisionRequest,
    AbsenceRequestCreate,
    AbsenceRequestDetail,
    AbsenceRequestSummary,
    AnnouncementCreateRequest,
    AuthLoginRequest,
    AuthRegisterParentRequest,
    AuthRegisterStudentRequest,
    KioskPayload,
    LoginRequest,
    LoginResponse,
    MeResponse,
    NotificationItem,
    ParentWeeklySummaryResponse,
    PortfolioItemCreateRequest,
    RiskRequest,
    RiskResponse,
    ScheduleGenerateRequest,
    SchoolInfo,
    SocialCommentCreateRequest,
    SocialPostCreateRequest,
    TeacherClassReportRequest,
    TeacherClassReportResponse,
)
from .school_db import (
    DAYS,
    STUDENT_ACADEMIC,
    STUDENTS,
    add_portfolio_item,
    add_social_comment,
    admin_metrics_payload,
    authenticate,
    class_report_context,
    create_account,
    create_announcement,
    create_role_session,
    create_social_post,
    create_token_session,
    db_stats,
    generate_schedule,
    gamification_leaderboard,
    get_session_user,
    init_school_db,
    list_announcements,
    list_portfolio,
    list_schedule_changes,
    list_social_feed,
    parent_weekly_summary_payload,
    register_parent,
    register_student,
    reset_school_db,
    resolve_student_id,
    student_dashboard_payload,
    teacher_early_warning_payload,
    validate_schedule,
    verify_portfolio_item,
)
from .substitution import (
    create_absence_request,
    get_absence_request,
    get_notifications,
    list_approved_replacements,
    list_absence_requests,
    list_school_catalog,
    reset_substitution_state,
    review_absence_request,
)

_DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://localhost:5174,"
    "http://localhost:5175,"
    "http://localhost:5176,"
    "http://127.0.0.1:5173,"
    "http://127.0.0.1:5174,"
    "http://127.0.0.1:5175,"
    "http://127.0.0.1:5176"
)

ALLOWED_ROLES = {"student", "teacher", "parent", "admin"}

EDUPAGE_SCHOOL = os.getenv("EDUPAGE_SCHOOL", "nisaktau").strip()
EDUPAGE_TT_NUM = os.getenv("EDUPAGE_TT_NUM", "").strip() or None
EDUPAGE_YEAR_RAW = os.getenv("EDUPAGE_YEAR", "").strip()
EDUPAGE_TIMEOUT_SECONDS = int(os.getenv("EDUPAGE_TIMEOUT_SECONDS", "25"))
EDUPAGE_CACHE_TTL_SECONDS = int(os.getenv("EDUPAGE_CACHE_TTL_SECONDS", "300"))
EDUPAGE_TIMEZONE = os.getenv("EDUPAGE_TIMEZONE", "Asia/Almaty").strip() or "Asia/Almaty"
CORS_ALLOW_ORIGINS_RAW = os.getenv("CORS_ORIGINS", _DEFAULT_CORS_ORIGINS).strip()

EDUPAGE_YEAR: int | None = None
if EDUPAGE_YEAR_RAW:
    try:
        EDUPAGE_YEAR = int(EDUPAGE_YEAR_RAW)
    except ValueError:
        EDUPAGE_YEAR = None

CORS_ALLOW_ORIGINS = ["*"] if CORS_ALLOW_ORIGINS_RAW == "*" else [
    item.strip() for item in CORS_ALLOW_ORIGINS_RAW.split(",") if item.strip()
]
CORS_ALLOW_CREDENTIALS = CORS_ALLOW_ORIGINS != ["*"]

app = FastAPI(title="Aqbobek MVP API", version="0.2.0")
init_school_db()

LOGGER = logging.getLogger("aqbobek.api")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
APP_STARTED_AT = time.time()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(future_api_router)


class WebSocketHub:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, event: str, payload: dict[str, Any]) -> None:
        if not self.connections:
            return
        message = {
            "event": event,
            "payload": payload,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }
        dead: list[WebSocket] = []
        for conn in list(self.connections):
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.disconnect(conn)


WS_HUB = WebSocketHub()


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uptime_seconds() -> int:
    return int(max(0, time.time() - APP_STARTED_AT))


@app.middleware("http")
async def observability_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        LOGGER.exception("Unhandled server exception for %s %s", request.method, request.url.path)
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
        )

    duration_ms = (time.perf_counter() - started) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    LOGGER.info("%s %s -> %s %.2fms", request.method, request.url.path, response.status_code, duration_ms)
    return response


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid auth header format")
    return parts[1]


def _optional_session_user(authorization: str | None) -> dict[str, Any] | None:
    if not authorization:
        return None
    try:
        token = _extract_bearer_token(authorization)
    except HTTPException:
        return None
    return get_session_user(token)


def _require_session_user(authorization: str | None) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    user = get_session_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def _require_roles(authorization: str | None, allowed_roles: set[str]) -> dict[str, Any]:
    user = _require_session_user(authorization)
    user_role = str(user.get("role", ""))
    if user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Role '{user_role}' is not allowed for this action")
    return user


def _me_payload(user: dict[str, Any]) -> MeResponse:
    return MeResponse(
        role=user.get("role", ""),
        user_id=user.get("user_id"),
        email=user.get("email"),
        display_name=user.get("display_name"),
        linked_student_id=user.get("linked_student_id"),
        linked_teacher_id=user.get("linked_teacher_id"),
        class_id=user.get("class_id"),
    )


def _top_students(limit: int = 8) -> list[dict[str, Any]]:
    rows = []
    for student_id, student in STUDENTS.items():
        subjects = STUDENT_ACADEMIC.get(student_id, {}).get("subjects", {})
        if not subjects:
            continue
        all_grades = [grade for payload in subjects.values() for grade in payload["grades"]]
        attendance = sum(payload["attendance"] for payload in subjects.values()) / len(subjects)
        if not all_grades:
            continue
        avg_grade = sum(all_grades) / len(all_grades)
        score = round((avg_grade / 5) * 70 + attendance * 30)
        rows.append(
            {
                "id": student_id,
                "name": student["name"],
                "class_id": student["class_id"],
                "score": min(100, max(0, score)),
                "achievement": "Strong weekly academic trajectory",
            }
        )
    rows.sort(key=lambda row: row["score"], reverse=True)
    return rows[:limit]


def _resolve_feed_student(user: dict[str, Any], requested_student_id: str | None) -> str:
    if requested_student_id:
        student_id = requested_student_id.strip()
        if student_id in STUDENTS:
            return student_id
    student_id = resolve_student_id(user)
    if student_id and student_id in STUDENTS:
        return student_id
    return next(iter(STUDENTS))


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "aqbobek-api",
        "version": app.version,
        "time": _utcnow_iso(),
        "uptime_seconds": _uptime_seconds(),
    }


@app.get("/readyz")
async def readyz() -> dict[str, Any]:
    stats = db_stats()
    return {
        "status": "ready",
        "service": "aqbobek-api",
        "version": app.version,
        "time": _utcnow_iso(),
        "uptime_seconds": _uptime_seconds(),
        "checks": {
            "seed_students": stats["students"] > 0,
            "seed_teachers": stats["teachers"] > 0,
            "school_catalog": len(list_school_catalog()) > 0,
        },
    }


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "status": "ok",
        "message": "Aqbobek MVP API is running",
        "version": app.version,
        "time": _utcnow_iso(),
        "uptime_seconds": _uptime_seconds(),
    }


@app.websocket("/ws/updates")
async def ws_updates(websocket: WebSocket) -> None:
    await WS_HUB.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        WS_HUB.disconnect(websocket)


@app.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unknown role")
    session = create_role_session(payload.role)
    return LoginResponse(**session)


@app.post("/auth/register-student")
async def auth_register_student(payload: AuthRegisterStudentRequest) -> dict[str, Any]:
    try:
        created = register_student(
            name=payload.name,
            class_id=payload.class_id,
            email=payload.email,
            password=payload.password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    session = create_token_session(created["account"])
    return {"token": session["token"], "role": session["role"], "student_id": created["student_id"]}


@app.post("/auth/register-parent")
async def auth_register_parent(payload: AuthRegisterParentRequest) -> dict[str, Any]:
    try:
        created = register_parent(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            child_student_email=payload.child_student_email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    session = create_token_session(created["account"])
    return {
        "token": session["token"],
        "role": session["role"],
        "linked_student_id": created["linked_student_id"],
    }


@app.post("/auth/login", response_model=LoginResponse)
async def auth_login(payload: AuthLoginRequest) -> LoginResponse:
    try:
        user = authenticate(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    session = create_token_session(user)
    return LoginResponse(**session)


@app.get("/me", response_model=MeResponse)
async def me(authorization: str | None = Header(default=None)) -> MeResponse:
    user = _require_session_user(authorization)
    return _me_payload(user)


@app.get("/db/stats")
async def stats() -> dict[str, Any]:
    return db_stats()


@app.get("/gamification/leaderboard")
async def leaderboard(limit: int = 20) -> list[dict[str, Any]]:
    return gamification_leaderboard(limit=limit)


@app.get("/grades")
async def grades(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _optional_session_user(authorization)
    if not user:
        return MOCK_STUDENT_DATA
    student_id = resolve_student_id(user)
    if not student_id:
        return MOCK_STUDENT_DATA
    try:
        return student_dashboard_payload(student_id)
    except ValueError:
        return MOCK_STUDENT_DATA


@app.get("/schedule")
async def schedule(role: str = "student") -> dict[str, Any]:
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unknown role")
    return MOCK_SCHEDULE.get(role, MOCK_SCHEDULE["student"])


@app.get("/timetable")
async def timetable(day: str | None = None, class_id: str | None = None, teacher: str | None = None) -> dict[str, Any]:
    fallback_reason = ""
    try:
        data = await asyncio.to_thread(
            fetch_timetable,
            EduPageConfig(
                school=EDUPAGE_SCHOOL,
                year=EDUPAGE_YEAR,
                tt_num=EDUPAGE_TT_NUM,
                timeout_seconds=EDUPAGE_TIMEOUT_SECONDS,
                cache_ttl_seconds=EDUPAGE_CACHE_TTL_SECONDS,
                timezone=EDUPAGE_TIMEZONE,
            ),
        )
    except (EduPageError, ValueError, TypeError, KeyError) as exc:
        data = deepcopy(MOCK_TIMETABLE)
        data["source"] = f"{MOCK_TIMETABLE.get('source', 'mock')}:fallback"
        fallback_reason = str(exc)

    entries = data["entries"]

    if day:
        entries = [entry for entry in entries if entry["day"].lower() == day.lower()]
    if class_id:
        entries = [entry for entry in entries if entry["class_id"].lower() == class_id.lower()]
    if teacher:
        entries = [entry for entry in entries if teacher.lower() in entry["teacher"].lower()]

    return {
        "source": data["source"],
        "school": data["school"],
        "timezone": data["timezone"],
        "days": data["days"],
        "slots": data.get("slots", []),
        "entries": entries,
        "filters": {
            "day": day or "",
            "class_id": class_id or "",
            "teacher": teacher or "",
        },
        "fallback_reason": fallback_reason,
        "is_fallback": bool(fallback_reason),
    }


@app.get("/kiosk", response_model=KioskPayload)
async def kiosk(school_id: str = "aqbobek") -> KioskPayload:
    schools = {row["id"]: row["name"] for row in list_school_catalog()}
    school_name = schools.get(school_id)
    if not school_name:
        raise HTTPException(status_code=400, detail=f"Unknown school_id: {school_id}")

    replacements = list_approved_replacements(school_id)
    if not replacements:
        replacements = MOCK_KIOSK_CONTENT["replacements"]

    dynamic_announcements = list_announcements(role=None, class_id=None)[:6]
    if dynamic_announcements:
        announcements = dynamic_announcements
    else:
        announcements = MOCK_KIOSK_CONTENT["announcements"]

    return KioskPayload(
        generated_at=datetime.now(timezone.utc).isoformat(),
        source="mock+substitution_engine+announcements",
        school_id=school_id,
        school_name=school_name,
        announcements=announcements,
        top_students=_top_students(),
        replacements=replacements[:12],
        events=MOCK_KIOSK_CONTENT["events"],
    )


@app.post("/risk", response_model=RiskResponse)
async def risk(payload: RiskRequest) -> RiskResponse:
    risk_value = calculate_risk(payload.grades, payload.attendance)
    return RiskResponse(subject=payload.subject, risk=risk_value, level=risk_level(risk_value))


@app.post("/ai-advice", response_model=AIAdviceResponse)
async def ai_advice(payload: AIAdviceRequest) -> AIAdviceResponse:
    risk_value = payload.risk
    if risk_value is None:
        risk_value = calculate_risk(payload.grades, payload.attendance)

    advice_text, source = await generate_ai_advice(
        risk=risk_value,
        grades=payload.grades,
        attendance=payload.attendance,
        subject=payload.subject,
    )
    return AIAdviceResponse(
        subject=payload.subject,
        risk=risk_value,
        advice=advice_text,
        source=source,
    )


@app.get("/parent/weekly-summary", response_model=ParentWeeklySummaryResponse)
async def parent_weekly_summary(authorization: str | None = Header(default=None)) -> ParentWeeklySummaryResponse:
    user = _optional_session_user(authorization)
    if user:
        student_id = resolve_student_id(user) or next(iter(STUDENTS))
    else:
        student_id = next(iter(STUDENTS))
    try:
        payload = parent_weekly_summary_payload(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    summary_text, recommendation_text, source = await generate_parent_weekly_summary(
        child_name=payload["child_name"],
        risk_score=payload["risk_score"],
        average_attendance=payload["average_attendance"],
        strong_subjects=payload["strong_subjects"],
        attention_subjects=payload["attention_subjects"],
    )

    return ParentWeeklySummaryResponse(
        week_label=payload["week_label"],
        child_name=payload["child_name"],
        class_id=payload["class_id"],
        average_grade=payload["average_grade"],
        average_attendance=payload["average_attendance"],
        risk_score=payload["risk_score"],
        risk_level=payload["risk_level"],
        strong_subjects=payload["strong_subjects"],
        attention_subjects=payload["attention_subjects"],
        summary=summary_text,
        recommendation=recommendation_text,
        source=source,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/teacher/early-warning")
async def teacher_early_warning(class_id: str = "10A", limit: int = 25) -> dict[str, Any]:
    try:
        rows = teacher_early_warning_payload(class_id=class_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"class_id": class_id.upper(), "rows": rows}


@app.post("/teacher/class-report", response_model=TeacherClassReportResponse)
async def teacher_class_report(payload: TeacherClassReportRequest) -> TeacherClassReportResponse:
    try:
        context = class_report_context(payload.class_id.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    report, source = await generate_teacher_class_report(context)
    return TeacherClassReportResponse(class_id=context["class_id"], report=report, source=source)


@app.get("/admin/metrics")
async def admin_metrics() -> dict[str, Any]:
    return admin_metrics_payload()


@app.post("/admin/reset-demo-data")
async def admin_reset_demo_data(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_roles(authorization, {"admin"})
    stats = reset_school_db()
    substitution_state = reset_substitution_state()
    fresh_session = create_role_session("admin")
    await WS_HUB.broadcast("demo-data-reset", {"stats": stats, "substitution_state": substitution_state})
    return {
        "status": "ok",
        "stats": stats,
        "substitution_state": substitution_state,
        "session": fresh_session,
    }


@app.get("/announcements")
async def announcements(role: str | None = None, class_id: str | None = None) -> list[dict[str, Any]]:
    return list_announcements(role=role, class_id=class_id)


@app.post("/announcements")
async def announcement_create(
    payload: AnnouncementCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _require_roles(authorization, {"admin"})
    created_by = user["email"]
    created = create_announcement(
        title=payload.title,
        message=payload.message,
        priority=payload.priority,
        target_roles=payload.target_roles,
        target_classes=payload.target_classes,
        created_by=created_by,
    )
    await WS_HUB.broadcast("announcement-published", {"announcement_id": created["id"], "priority": created["priority"]})
    return created


@app.post("/schedule/generate")
async def schedule_generate(
    payload: ScheduleGenerateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_roles(authorization, {"admin"})
    try:
        generated = generate_schedule(class_ids=payload.class_ids or None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await WS_HUB.broadcast(
        "schedule-updated",
        {
            "schedule_id": generated["schedule_id"],
            "entries": generated["stats"]["total_entries"],
            "unresolved": generated["stats"]["unresolved_count"],
        },
    )
    return generated


@app.post("/schedule/validate")
async def schedule_validate(
    payload: dict[str, Any],
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_roles(authorization, {"admin"})
    entries = payload.get("entries")
    if not isinstance(entries, list):
        raise HTTPException(status_code=400, detail="entries must be a list")
    return validate_schedule(entries)


@app.get("/schedule/changes")
async def schedule_changes(limit: int = 50) -> list[dict[str, Any]]:
    return list_schedule_changes(limit=limit)


@app.get("/social/feed")
async def social_feed(
    student_id: str | None = None,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _optional_session_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Auth required for social feed")
    target_student_id = _resolve_feed_student(user, student_id)
    return {"student_id": target_student_id, "posts": list_social_feed(target_student_id)}


@app.post("/social/feed")
async def social_feed_create(
    payload: SocialPostCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _require_session_user(authorization)
    target_student_id = _resolve_feed_student(user, None)
    post = create_social_post(
        student_id=target_student_id,
        author_role=user["role"],
        author_name=user.get("display_name") or user["role"].title(),
        content=payload.content,
    )
    await WS_HUB.broadcast("social-updated", {"student_id": target_student_id, "post_id": post["id"]})
    return post


@app.post("/social/feed/{post_id}/comment")
async def social_feed_comment(
    post_id: str,
    payload: SocialCommentCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _require_session_user(authorization)
    try:
        updated = add_social_comment(
            post_id=post_id,
            author_role=user["role"],
            author_name=user.get("display_name") or user["role"].title(),
            text=payload.text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await WS_HUB.broadcast("social-updated", {"post_id": post_id})
    return updated


@app.get("/portfolio/items")
async def portfolio_items(
    student_id: str | None = None,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _require_session_user(authorization)
    target_student_id = _resolve_feed_student(user, student_id)
    return {"student_id": target_student_id, "items": list_portfolio(target_student_id)}


@app.post("/portfolio/items")
async def portfolio_item_create(
    payload: PortfolioItemCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _require_session_user(authorization)
    target_student_id = _resolve_feed_student(user, None)
    try:
        item = add_portfolio_item(
            student_id=target_student_id,
            title=payload.title,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return item


@app.post("/portfolio/verify/{item_id}")
async def portfolio_verify(
    item_id: str,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_roles(authorization, {"teacher", "admin"})
    try:
        return verify_portfolio_item(item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/substitution/schools", response_model=list[SchoolInfo])
async def substitution_schools() -> list[SchoolInfo]:
    return [SchoolInfo(**row) for row in list_school_catalog()]


@app.post("/substitution/absence-requests", response_model=AbsenceRequestSummary)
async def substitution_create_request(payload: AbsenceRequestCreate) -> AbsenceRequestSummary:
    try:
        created = create_absence_request(
            school_id=payload.school_id,
            teacher_id=payload.teacher_id,
            day=payload.day,
            reason=payload.reason,
            submitted_by=payload.submitted_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await WS_HUB.broadcast("substitution-request-created", {"request_id": created["request_id"], "day": created["day"]})
    return AbsenceRequestSummary(**created)


@app.get("/substitution/absence-requests", response_model=list[AbsenceRequestSummary])
async def substitution_list_requests(school_id: str, status: str | None = None) -> list[AbsenceRequestSummary]:
    try:
        rows = list_absence_requests(school_id=school_id, status=status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return [AbsenceRequestSummary(**row) for row in rows]


@app.get("/substitution/absence-requests/{request_id}", response_model=AbsenceRequestDetail)
async def substitution_get_request(request_id: str) -> AbsenceRequestDetail:
    try:
        row = get_absence_request(request_id=request_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return AbsenceRequestDetail(**row)


@app.post("/substitution/absence-requests/{request_id}/decision", response_model=AbsenceRequestDetail)
async def substitution_decide_request(
    request_id: str,
    payload: AbsenceDecisionRequest,
    authorization: str | None = Header(default=None),
) -> AbsenceRequestDetail:
    user = _require_roles(authorization, {"admin", "director", "deputy"})
    if payload.approver_role != user["role"]:
        raise HTTPException(status_code=400, detail="approver_role must match authenticated user role")
    if user.get("user_id") and payload.approver_id != user["user_id"]:
        raise HTTPException(status_code=400, detail="approver_id must match authenticated user id")
    try:
        row = review_absence_request(
            request_id=request_id,
            decision=payload.decision,
            approver_id=payload.approver_id,
            approver_role=payload.approver_role,
            comment=payload.comment,
            selected_options=payload.selected_options,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await WS_HUB.broadcast(
        "substitution-decision",
        {"request_id": request_id, "status": row["status"], "day": row["day"], "school_id": row["school_id"]},
    )
    return AbsenceRequestDetail(**row)


@app.get("/substitution/notifications", response_model=list[NotificationItem])
async def substitution_notifications(
    school_id: str,
    target_role: str | None = None,
    target_user_id: str | None = None,
) -> list[NotificationItem]:
    try:
        rows = get_notifications(
            school_id=school_id,
            target_role=target_role,
            target_user_id=target_user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return [NotificationItem(**row) for row in rows]
