from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
SLOT_ORDER = ["08:30", "09:25", "10:20", "11:15", "12:10", "13:05", "14:00"]

SCHOOLS: dict[str, dict[str, Any]] = {
    "aqbobek": {
        "id": "aqbobek",
        "name": "Aqbobek Lyceum",
        "teachers": [
            {
                "id": "t_phy_1",
                "name": "Aidana Sarsen",
                "primary_subjects": ["Physics"],
                "related_subjects": ["Mathematics"],
                "classes": ["10A", "10B", "10C"],
                "max_daily_lessons": 5,
            },
            {
                "id": "t_phy_2",
                "name": "Arman Bekov",
                "primary_subjects": ["Physics"],
                "related_subjects": ["Mathematics"],
                "classes": ["11A", "11B", "10A"],
                "max_daily_lessons": 6,
            },
            {
                "id": "t_phy_3",
                "name": "Mira Tursyn",
                "primary_subjects": ["Physics"],
                "related_subjects": ["Science"],
                "classes": ["9A", "9B"],
                "max_daily_lessons": 4,
            },
            {
                "id": "t_math_1",
                "name": "Damir Nursultan",
                "primary_subjects": ["Mathematics"],
                "related_subjects": ["Physics"],
                "classes": ["10A", "10B"],
                "max_daily_lessons": 5,
            },
            {
                "id": "t_hist_1",
                "name": "Aruzhan Kudaibergen",
                "primary_subjects": ["History"],
                "related_subjects": [],
                "classes": ["10C"],
                "max_daily_lessons": 5,
            },
        ],
        "lessons": [
            {"lesson_id": "aq_l1", "day": "Monday", "slot": "08:30", "class_id": "10A", "subject": "Mathematics", "teacher_id": "t_math_1", "room": "201"},
            {"lesson_id": "aq_l2", "day": "Monday", "slot": "09:25", "class_id": "10A", "subject": "Physics", "teacher_id": "t_phy_1", "room": "Lab-1"},
            {"lesson_id": "aq_l3", "day": "Monday", "slot": "10:20", "class_id": "10B", "subject": "Physics", "teacher_id": "t_phy_1", "room": "Lab-1"},
            {"lesson_id": "aq_l4", "day": "Monday", "slot": "11:15", "class_id": "10C", "subject": "Physics", "teacher_id": "t_phy_1", "room": "Lab-1"},
            {"lesson_id": "aq_l5", "day": "Monday", "slot": "09:25", "class_id": "11A", "subject": "Physics", "teacher_id": "t_phy_2", "room": "Lab-2"},
            {"lesson_id": "aq_l6", "day": "Monday", "slot": "10:20", "class_id": "11B", "subject": "Physics", "teacher_id": "t_phy_2", "room": "Lab-2"},
            {"lesson_id": "aq_l7", "day": "Monday", "slot": "12:10", "class_id": "10C", "subject": "History", "teacher_id": "t_hist_1", "room": "105"},
            {"lesson_id": "aq_l8", "day": "Tuesday", "slot": "09:25", "class_id": "10A", "subject": "Physics", "teacher_id": "t_phy_1", "room": "Lab-1"},
            {"lesson_id": "aq_l9", "day": "Tuesday", "slot": "10:20", "class_id": "10B", "subject": "Physics", "teacher_id": "t_phy_1", "room": "Lab-1"},
            {"lesson_id": "aq_l10", "day": "Tuesday", "slot": "11:15", "class_id": "9A", "subject": "Physics", "teacher_id": "t_phy_3", "room": "Lab-3"},
        ],
    },
    "nazar_school": {
        "id": "nazar_school",
        "name": "Nazarbayev School Demo",
        "teachers": [
            {
                "id": "ns_math_1",
                "name": "Aidos Zhaksylykov",
                "primary_subjects": ["Mathematics"],
                "related_subjects": ["Informatics"],
                "classes": ["8A", "8B"],
                "max_daily_lessons": 5,
            },
            {
                "id": "ns_inf_1",
                "name": "Ainur Duisen",
                "primary_subjects": ["Informatics"],
                "related_subjects": ["Mathematics"],
                "classes": ["8A"],
                "max_daily_lessons": 5,
            },
        ],
        "lessons": [
            {"lesson_id": "ns_l1", "day": "Monday", "slot": "08:30", "class_id": "8A", "subject": "Mathematics", "teacher_id": "ns_math_1", "room": "A1"},
            {"lesson_id": "ns_l2", "day": "Monday", "slot": "09:25", "class_id": "8A", "subject": "Informatics", "teacher_id": "ns_inf_1", "room": "IT-1"},
        ],
    },
}

ABSENCE_REQUESTS: dict[str, dict[str, Any]] = {}
NOTIFICATIONS: list[dict[str, Any]] = []


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slot_index(slot: str) -> int:
    try:
        return SLOT_ORDER.index(slot)
    except ValueError:
        return len(SLOT_ORDER) + 1


def _normalize_day(day: str) -> str:
    normalized = day.strip().capitalize()
    if normalized not in DAYS:
        raise ValueError(f"Unsupported day: {day}. Use one of: {', '.join(DAYS)}")
    return normalized


def _gaps_count(indices: list[int]) -> int:
    if len(indices) < 2:
        return 0
    ordered = sorted(indices)
    return sum(max(0, right - left - 1) for left, right in zip(ordered, ordered[1:]))


def _get_school(school_id: str) -> dict[str, Any]:
    school = SCHOOLS.get(school_id)
    if not school:
        raise ValueError(f"Unknown school_id: {school_id}")
    return school


def _get_teacher(school: dict[str, Any], teacher_id: str) -> dict[str, Any]:
    for teacher in school["teachers"]:
        if teacher["id"] == teacher_id:
            return teacher
    raise ValueError(f"Unknown teacher_id: {teacher_id} for school {school['id']}")


def _teacher_lessons_for_day(school: dict[str, Any], teacher_id: str, day: str) -> list[dict[str, Any]]:
    return [lesson for lesson in school["lessons"] if lesson["teacher_id"] == teacher_id and lesson["day"] == day]


def _subject_match(teacher: dict[str, Any], subject: str) -> tuple[str, int] | None:
    if subject in teacher.get("primary_subjects", []):
        return "exact", 50
    if subject in teacher.get("related_subjects", []):
        return "related", 25
    return None


def _teacher_busy_in_slot(
    school: dict[str, Any],
    teacher_id: str,
    day: str,
    slot: str,
    temp_assignments: dict[str, set[tuple[str, str]]],
) -> bool:
    for lesson in school["lessons"]:
        if lesson["teacher_id"] == teacher_id and lesson["day"] == day and lesson["slot"] == slot:
            return True
    for assigned_day, assigned_slot in temp_assignments.get(teacher_id, set()):
        if assigned_day == day and assigned_slot == slot:
            return True
    return False


def _teacher_slots_for_day_with_temp(
    school: dict[str, Any],
    teacher_id: str,
    day: str,
    temp_assignments: dict[str, set[tuple[str, str]]],
) -> list[int]:
    indices: set[int] = set()
    for lesson in school["lessons"]:
        if lesson["teacher_id"] == teacher_id and lesson["day"] == day:
            indices.add(_slot_index(lesson["slot"]))
    for assigned_day, assigned_slot in temp_assignments.get(teacher_id, set()):
        if assigned_day == day:
            indices.add(_slot_index(assigned_slot))
    return sorted(indices)


def _candidate_option(
    school: dict[str, Any],
    teacher: dict[str, Any],
    lesson: dict[str, Any],
    temp_assignments: dict[str, set[tuple[str, str]]],
) -> dict[str, Any] | None:
    if _teacher_busy_in_slot(school, teacher["id"], lesson["day"], lesson["slot"], temp_assignments):
        return None

    match = _subject_match(teacher, lesson["subject"])
    if not match:
        return None

    match_type, match_score = match
    teacher_slots = _teacher_slots_for_day_with_temp(school, teacher["id"], lesson["day"], temp_assignments)
    lesson_slot_idx = _slot_index(lesson["slot"])

    score = 0
    reasons: list[str] = []

    score += match_score
    reasons.append(f"+{match_score} subject match ({match_type})")

    if any(abs(idx - lesson_slot_idx) == 1 for idx in teacher_slots):
        score += 30
        reasons.append("+30 already in school nearby")
    elif teacher_slots:
        score += 15
        reasons.append("+15 already in school today")
    else:
        score -= 25
        reasons.append("-25 teacher is not in school today")

    before_gaps = _gaps_count(teacher_slots)
    after_gaps = _gaps_count(sorted(teacher_slots + [lesson_slot_idx]))
    delta = after_gaps - before_gaps
    if delta <= 0:
        score += 10
        reasons.append("+10 no extra gaps")
    else:
        penalty = delta * 10
        score -= penalty
        reasons.append(f"-{penalty} additional timetable gaps")

    daily_load = len(teacher_slots)
    if daily_load < 4:
        score += 20
        reasons.append("+20 healthy daily load")
    else:
        score -= 20
        reasons.append("-20 high daily load")

    if lesson["class_id"] in teacher.get("classes", []):
        score += 15
        reasons.append("+15 teacher already knows this class")

    assigned_today = len([1 for day, _ in temp_assignments.get(teacher["id"], set()) if day == lesson["day"]])
    if assigned_today > 0:
        fairness_penalty = assigned_today * 8
        score -= fairness_penalty
        reasons.append(f"-{fairness_penalty} fairness balancing penalty")

    max_daily = teacher.get("max_daily_lessons", 5)
    projected = daily_load + 1
    if projected > max_daily:
        return None
    if projected == max_daily:
        score -= 10
        reasons.append("-10 projected max daily load")

    return {
        "option_id": f"{lesson['lesson_id']}-sub-{teacher['id']}",
        "type": "substitute_teacher",
        "score": score,
        "teacher_id": teacher["id"],
        "teacher_name": teacher["name"],
        "reasoning": reasons,
        "day": lesson["day"],
        "slot": lesson["slot"],
    }


def _reschedule_option(
    school: dict[str, Any],
    lesson: dict[str, Any],
    absent_teacher_id: str,
    temp_assignments: dict[str, set[tuple[str, str]]],
) -> dict[str, Any] | None:
    day_index = DAYS.index(lesson["day"])
    search_days = DAYS[day_index : min(day_index + 3, len(DAYS))]

    for target_day in search_days:
        for target_slot in SLOT_ORDER:
            if target_day == lesson["day"] and _slot_index(target_slot) <= _slot_index(lesson["slot"]):
                continue

            best: dict[str, Any] | None = None
            for teacher in school["teachers"]:
                if teacher["id"] == absent_teacher_id:
                    continue
                match = _subject_match(teacher, lesson["subject"])
                if not match:
                    continue
                if _teacher_busy_in_slot(school, teacher["id"], target_day, target_slot, temp_assignments):
                    continue
                match_type, _ = match
                option_score = 35 if match_type == "exact" else 20
                if _teacher_lessons_for_day(school, teacher["id"], target_day):
                    option_score += 10
                candidate = {
                    "teacher_id": teacher["id"],
                    "teacher_name": teacher["name"],
                    "score": option_score,
                    "match_type": match_type,
                }
                if not best or candidate["score"] > best["score"]:
                    best = candidate

            if best:
                return {
                    "option_id": f"{lesson['lesson_id']}-reschedule-{target_day}-{target_slot}",
                    "type": "reschedule",
                    "score": best["score"] - 5,
                    "teacher_id": best["teacher_id"],
                    "teacher_name": best["teacher_name"],
                    "new_day": target_day,
                    "new_slot": target_slot,
                    "reasoning": [
                        "Fallback level 2: move lesson with minimal conflict",
                        f"Teacher match: {best['match_type']}",
                    ],
                }

    return None


def _self_study_option(lesson: dict[str, Any]) -> dict[str, Any]:
    return {
        "option_id": f"{lesson['lesson_id']}-self-study",
        "type": "self_study",
        "score": 0,
        "assignment": (
            f"{lesson['subject']} independent task for {lesson['class_id']}: "
            "review previous lesson notes and solve 5 practice questions."
        ),
        "reasoning": ["Fallback level 3: no safe substitution found"],
    }


def _generate_plan_proposal(school: dict[str, Any], absent_teacher_id: str, day: str) -> dict[str, Any]:
    absent_teacher = _get_teacher(school, absent_teacher_id)
    impacted_lessons = sorted(
        [lesson for lesson in school["lessons"] if lesson["teacher_id"] == absent_teacher_id and lesson["day"] == day],
        key=lambda lesson: _slot_index(lesson["slot"]),
    )
    if not impacted_lessons:
        raise ValueError(f"No lessons found for teacher {absent_teacher_id} on {day}")

    temp_assignments: dict[str, set[tuple[str, str]]] = {}
    lesson_plans: list[dict[str, Any]] = []

    for lesson in impacted_lessons:
        candidate_options = []
        for teacher in school["teachers"]:
            if teacher["id"] == absent_teacher_id:
                continue
            option = _candidate_option(school, teacher, lesson, temp_assignments)
            if option:
                candidate_options.append(option)

        candidate_options.sort(key=lambda item: item["score"], reverse=True)
        top_candidates = candidate_options[:3]

        fallback_options: list[dict[str, Any]] = []
        reschedule = _reschedule_option(school, lesson, absent_teacher_id, temp_assignments)
        if reschedule:
            fallback_options.append(reschedule)
        fallback_options.append(_self_study_option(lesson))

        all_options = sorted(top_candidates + fallback_options, key=lambda item: item["score"], reverse=True)
        recommended = all_options[0]
        alternatives = [option for option in all_options[1:3]]

        if recommended["type"] == "substitute_teacher":
            teacher_id = recommended["teacher_id"]
            temp_assignments.setdefault(teacher_id, set()).add((lesson["day"], lesson["slot"]))

        lesson_plans.append(
            {
                "lesson_id": lesson["lesson_id"],
                "class_id": lesson["class_id"],
                "subject": lesson["subject"],
                "day": lesson["day"],
                "slot": lesson["slot"],
                "room": lesson["room"],
                "recommended": recommended,
                "alternatives": alternatives,
            }
        )

    summary = {
        "total_lessons": len(lesson_plans),
        "recommended_substitutions": len(
            [lesson for lesson in lesson_plans if lesson["recommended"]["type"] == "substitute_teacher"]
        ),
        "recommended_reschedules": len([lesson for lesson in lesson_plans if lesson["recommended"]["type"] == "reschedule"]),
        "recommended_self_study": len([lesson for lesson in lesson_plans if lesson["recommended"]["type"] == "self_study"]),
    }

    return {
        "school_id": school["id"],
        "day": day,
        "absent_teacher": {"id": absent_teacher["id"], "name": absent_teacher["name"]},
        "summary": summary,
        "lessons": lesson_plans,
    }


def _apply_selected_options(proposal: dict[str, Any], selected_options: dict[str, str]) -> dict[str, Any]:
    final_lessons = []

    for lesson in proposal["lessons"]:
        all_options = [lesson["recommended"], *lesson.get("alternatives", [])]
        option_map = {option["option_id"]: option for option in all_options}
        selected_id = selected_options.get(lesson["lesson_id"], lesson["recommended"]["option_id"])
        chosen = option_map.get(selected_id, lesson["recommended"])
        final_lessons.append(
            {
                "lesson_id": lesson["lesson_id"],
                "class_id": lesson["class_id"],
                "subject": lesson["subject"],
                "day": lesson["day"],
                "slot": lesson["slot"],
                "chosen": chosen,
            }
        )

    return {
        "school_id": proposal["school_id"],
        "day": proposal["day"],
        "absent_teacher": proposal["absent_teacher"],
        "summary": {
            "total_lessons": len(final_lessons),
            "substitutions": len([lesson for lesson in final_lessons if lesson["chosen"]["type"] == "substitute_teacher"]),
            "reschedules": len([lesson for lesson in final_lessons if lesson["chosen"]["type"] == "reschedule"]),
            "self_study": len([lesson for lesson in final_lessons if lesson["chosen"]["type"] == "self_study"]),
        },
        "lessons": final_lessons,
    }


def _notify(
    school_id: str,
    target_role: str,
    title: str,
    message: str,
    request_id: str | None = None,
    target_user_id: str | None = None,
) -> None:
    NOTIFICATIONS.append(
        {
            "id": str(uuid4()),
            "school_id": school_id,
            "target_role": target_role,
            "target_user_id": target_user_id,
            "title": title,
            "message": message,
            "created_at": _now_iso(),
            "request_id": request_id,
            "is_read": False,
        }
    )


def list_school_catalog() -> list[dict[str, str]]:
    return [{"id": school["id"], "name": school["name"]} for school in SCHOOLS.values()]


def create_absence_request(
    school_id: str,
    teacher_id: str,
    day: str,
    reason: str,
    submitted_by: str,
) -> dict[str, Any]:
    school = _get_school(school_id)
    normalized_day = _normalize_day(day)
    teacher = _get_teacher(school, teacher_id)

    proposal = _generate_plan_proposal(school, teacher_id, normalized_day)
    request_id = str(uuid4())
    request = {
        "request_id": request_id,
        "school_id": school_id,
        "teacher_id": teacher_id,
        "teacher_name": teacher["name"],
        "day": normalized_day,
        "reason": reason,
        "status": "pending",
        "submitted_by": submitted_by,
        "submitted_at": _now_iso(),
        "reviewed_by": None,
        "reviewed_at": None,
        "review_comment": None,
        "proposal": proposal,
        "approved_plan": None,
    }
    ABSENCE_REQUESTS[request_id] = request

    _notify(
        school_id=school_id,
        target_role="admin",
        title="Absence request pending approval",
        message=f"{teacher['name']} requested absence for {normalized_day}. Review substitution plan.",
        request_id=request_id,
    )

    return {
        "request_id": request_id,
        "school_id": school_id,
        "teacher_id": teacher_id,
        "teacher_name": teacher["name"],
        "day": normalized_day,
        "status": "pending",
        "impacted_lessons": proposal["summary"]["total_lessons"],
        "submitted_by": submitted_by,
        "submitted_at": request["submitted_at"],
    }


def list_absence_requests(school_id: str, status: str | None = None) -> list[dict[str, Any]]:
    _get_school(school_id)
    rows = [request for request in ABSENCE_REQUESTS.values() if request["school_id"] == school_id]
    if status:
        rows = [request for request in rows if request["status"] == status]
    rows.sort(key=lambda item: item["submitted_at"], reverse=True)
    return [
        {
            "request_id": request["request_id"],
            "school_id": request["school_id"],
            "teacher_id": request["teacher_id"],
            "teacher_name": request["teacher_name"],
            "day": request["day"],
            "status": request["status"],
            "impacted_lessons": request["proposal"]["summary"]["total_lessons"],
            "submitted_by": request["submitted_by"],
            "submitted_at": request["submitted_at"],
        }
        for request in rows
    ]


def get_absence_request(request_id: str) -> dict[str, Any]:
    request = ABSENCE_REQUESTS.get(request_id)
    if not request:
        raise ValueError(f"Unknown request_id: {request_id}")
    return deepcopy(request)


def review_absence_request(
    request_id: str,
    decision: str,
    approver_id: str,
    approver_role: str,
    comment: str | None = None,
    selected_options: dict[str, str] | None = None,
) -> dict[str, Any]:
    request = ABSENCE_REQUESTS.get(request_id)
    if not request:
        raise ValueError(f"Unknown request_id: {request_id}")
    if request["status"] != "pending":
        raise ValueError(f"Request {request_id} is already {request['status']}")
    if approver_role not in {"admin", "director", "deputy"}:
        raise ValueError("Only admin/director/deputy can review requests")
    if decision not in {"approve", "reject"}:
        raise ValueError("decision must be 'approve' or 'reject'")

    request["status"] = "approved" if decision == "approve" else "rejected"
    request["reviewed_by"] = approver_id
    request["reviewed_at"] = _now_iso()
    request["review_comment"] = comment

    if decision == "approve":
        request["approved_plan"] = _apply_selected_options(request["proposal"], selected_options or {})
        _notify(
            school_id=request["school_id"],
            target_role="teacher",
            target_user_id=request["teacher_id"],
            title="Absence request approved",
            message=f"Your absence request for {request['day']} is approved. Substitution plan is ready.",
            request_id=request_id,
        )
    else:
        _notify(
            school_id=request["school_id"],
            target_role="teacher",
            target_user_id=request["teacher_id"],
            title="Absence request rejected",
            message=f"Your absence request for {request['day']} was rejected. Contact administration.",
            request_id=request_id,
        )

    return deepcopy(request)


def get_notifications(
    school_id: str,
    target_role: str | None = None,
    target_user_id: str | None = None,
) -> list[dict[str, Any]]:
    _get_school(school_id)
    rows = [note for note in NOTIFICATIONS if note["school_id"] == school_id]
    if target_role:
        rows = [note for note in rows if note["target_role"] == target_role]
    if target_user_id:
        rows = [note for note in rows if note["target_user_id"] == target_user_id]
    rows.sort(key=lambda item: item["created_at"], reverse=True)
    return deepcopy(rows)


def list_approved_replacements(school_id: str) -> list[dict[str, Any]]:
    _get_school(school_id)
    rows: list[dict[str, Any]] = []

    for request in ABSENCE_REQUESTS.values():
        if request["school_id"] != school_id or request["status"] != "approved":
            continue

        approved_plan = request.get("approved_plan") or {}
        lessons = approved_plan.get("lessons", [])
        for lesson in lessons:
            chosen = lesson.get("chosen") or {}
            replacement_type = chosen.get("type", "self_study")
            teacher_name = chosen.get("teacher_name")

            if replacement_type == "substitute_teacher":
                note = f"Substitute: {teacher_name or 'TBD'}"
            elif replacement_type == "reschedule":
                moved_day = chosen.get("new_day", "TBD")
                moved_slot = chosen.get("new_slot", "TBD")
                note = f"Moved to {moved_day} {moved_slot}"
            else:
                note = chosen.get("assignment", "Independent study task assigned")

            rows.append(
                {
                    "id": f"{request['request_id']}:{lesson.get('lesson_id', 'lesson')}",
                    "day": lesson.get("day", request.get("day", "Monday")),
                    "slot": lesson.get("slot", ""),
                    "class_id": lesson.get("class_id", ""),
                    "subject": lesson.get("subject", ""),
                    "type": replacement_type,
                    "teacher_name": teacher_name,
                    "note": note,
                }
            )

    rows.sort(
        key=lambda item: (
            DAYS.index(item["day"]) if item["day"] in DAYS else len(DAYS),
            _slot_index(item["slot"]),
        )
    )
    return rows


def reset_substitution_state() -> dict[str, int]:
    ABSENCE_REQUESTS.clear()
    NOTIFICATIONS.clear()
    return {"absence_requests": 0, "notifications": 0}
