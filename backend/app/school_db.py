from __future__ import annotations

import random
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
SLOTS = ["08:30", "09:25", "10:20", "11:15", "12:10", "13:05", "14:00"]

SUBJECT_TOPICS: dict[str, list[str]] = {
    "Mathematics": ["Algebra", "Functions", "Equations", "Geometry"],
    "Physics": ["Kinematics", "Vectors", "Forces", "Optics"],
    "History": ["World War II", "Cold War", "Independence", "Modern Era"],
    "English": ["Reading", "Writing", "Vocabulary", "Listening"],
    "Informatics": ["Algorithms", "Python", "Data", "Networks"],
    "Biology": ["Cells", "Genetics", "Ecology", "Human Body"],
    "Chemistry": ["Atoms", "Bonds", "Reactions", "Organic Basics"],
}

SUBJECT_REQUIREMENTS = {
    "Mathematics": 4,
    "Physics": 3,
    "English": 3,
    "History": 2,
    "Informatics": 2,
    "Biology": 2,
    "Chemistry": 2,
}

CLASS_IDS = [f"{grade}{section}" for grade in range(7, 13) for section in ["A", "B", "C", "D"]]
ROOMS = [f"{100 + idx}" for idx in range(1, 46)] + ["Lab-1", "Lab-2", "IT-1", "IT-2"]

FIRST_NAMES = [
    "Aruzhan",
    "Damir",
    "Ainur",
    "Madi",
    "Nurtas",
    "Dana",
    "Mira",
    "Aidos",
    "Kamilya",
    "Yerzhan",
    "Aigerim",
    "Alikhan",
    "Sanzhar",
    "Zarina",
    "Arman",
    "Aidana",
    "Duman",
    "Madina",
]
LAST_NAMES = [
    "Sarsen",
    "Nursultan",
    "Kudaibergen",
    "Rakhim",
    "Omar",
    "Mukan",
    "Beisen",
    "Duisen",
    "Akhmet",
    "Tursyn",
    "Sadyk",
    "Karimov",
    "Zhaksylykov",
    "Nurpeis",
    "Abdrakhman",
]

DEFAULT_RANDOM_SEED = 20260331
RNG = random.Random(DEFAULT_RANDOM_SEED)

STUDENTS: dict[str, dict[str, Any]] = {}
TEACHERS: dict[str, dict[str, Any]] = {}
STUDENT_ACADEMIC: dict[str, dict[str, Any]] = {}
TOKENS: dict[str, dict[str, Any]] = {}
AUTH_USERS: dict[str, dict[str, Any]] = {}
AUTH_USERS_BY_ID: dict[str, dict[str, Any]] = {}
ANNOUNCEMENTS: list[dict[str, Any]] = []
SOCIAL_POSTS: list[dict[str, Any]] = []
PORTFOLIO_ITEMS: list[dict[str, Any]] = []
GENERATED_SCHEDULES: dict[str, dict[str, Any]] = {}
SCHEDULE_CHANGE_LOG: list[dict[str, Any]] = []


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slug(value: str) -> str:
    return "".join(char.lower() if char.isalnum() else "." for char in value).strip(".")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _choice_weighted_levels() -> tuple[float, int]:
    chance = RNG.random()
    if chance < 0.14:
        return RNG.uniform(0.58, 0.76), RNG.randint(2, 6)
    if chance < 0.48:
        return RNG.uniform(0.77, 0.89), RNG.randint(1, 4)
    return RNG.uniform(0.90, 0.99), RNG.randint(0, 2)


def _student_subject_payload(student_id: str) -> list[dict[str, Any]]:
    data = STUDENT_ACADEMIC.get(student_id, {})
    subjects = data.get("subjects", {})
    rows: list[dict[str, Any]] = []
    for subject, payload in subjects.items():
        rows.append(
            {
                "name": subject,
                "grades": payload["grades"],
                "attendance": payload["attendance"],
                "topics": payload["topics"],
                "missing_assignments": payload["missing_assignments"],
            }
        )
    return rows


def _generate_teachers(total_teachers: int = 120) -> None:
    for idx in range(total_teachers):
        first = FIRST_NAMES[idx % len(FIRST_NAMES)]
        last = LAST_NAMES[(idx * 3) % len(LAST_NAMES)]
        display_name = f"{first} {last}"
        subject_primary = list(SUBJECT_TOPICS.keys())[idx % len(SUBJECT_TOPICS)]
        subject_secondary = list(SUBJECT_TOPICS.keys())[(idx + 2) % len(SUBJECT_TOPICS)]
        teacher_id = f"teacher_{idx + 1:03d}"
        classes = RNG.sample(CLASS_IDS, k=RNG.randint(4, 8))
        TEACHERS[teacher_id] = {
            "id": teacher_id,
            "name": display_name,
            "subjects": [subject_primary, subject_secondary],
            "classes": classes,
            "max_daily_lessons": RNG.randint(5, 7),
        }


def _generate_students(total_students: int = 1800) -> None:
    for idx in range(total_students):
        class_id = CLASS_IDS[idx % len(CLASS_IDS)]
        first = FIRST_NAMES[(idx * 5) % len(FIRST_NAMES)]
        last = LAST_NAMES[(idx * 7) % len(LAST_NAMES)]
        display_name = f"{first} {last}"
        student_id = f"student_{idx + 1:05d}"
        email = f"{_slug(first)}.{_slug(last)}.{idx + 1}@aqbobek.kz"
        STUDENTS[student_id] = {
            "id": student_id,
            "name": display_name,
            "class_id": class_id,
            "email": email,
            "parent_ids": [],
        }

        subject_rows: dict[str, dict[str, Any]] = {}
        for subject, topics in SUBJECT_TOPICS.items():
            attendance, missing = _choice_weighted_levels()
            base = RNG.randint(3, 5)
            grades = []
            for _ in range(6):
                delta = RNG.choice([-1, 0, 0, 1])
                value = max(2, min(5, base + delta))
                grades.append(value)
                if RNG.random() < 0.18:
                    base = max(2, min(5, base + RNG.choice([-1, 1])))
            subject_rows[subject] = {
                "grades": grades,
                "attendance": round(attendance, 2),
                "topics": topics,
                "missing_assignments": missing,
            }

        STUDENT_ACADEMIC[student_id] = {
            "student_id": student_id,
            "subjects": subject_rows,
        }


def _bootstrap_demo_accounts() -> None:
    # Admin
    create_account(
        role="admin",
        display_name="Admin Operator",
        email="admin@aqbobek.kz",
        password="admin123",
    )
    # Teacher
    teacher = next(iter(TEACHERS.values()))
    create_account(
        role="teacher",
        display_name=teacher["name"],
        email="teacher@aqbobek.kz",
        password="teacher123",
        linked_teacher_id=teacher["id"],
    )
    # Demo student + parent pair
    student = next(iter(STUDENTS.values()))
    create_account(
        role="student",
        display_name=student["name"],
        email="student@aqbobek.kz",
        password="student123",
        linked_student_id=student["id"],
        class_id=student["class_id"],
    )
    parent = create_account(
        role="parent",
        display_name=f"Parent of {student['name']}",
        email="parent@aqbobek.kz",
        password="parent123",
        linked_student_id=student["id"],
        class_id=student["class_id"],
    )
    STUDENTS[student["id"]]["parent_ids"].append(parent["user_id"])

    # Seed announcements + social posts
    ANNOUNCEMENTS.extend(
        [
            {
                "id": str(uuid4()),
                "title": "Safety Drill",
                "message": "School-wide safety drill at 11:30. Follow class teacher instructions.",
                "priority": "high",
                "target_roles": ["student", "teacher", "parent", "admin"],
                "target_classes": [],
                "created_by": "admin@aqbobek.kz",
                "created_at": _now_iso(),
            },
            {
                "id": str(uuid4()),
                "title": "Physics Workshop",
                "message": "Open lab session for grades 9-11 on Thursday at IT-2.",
                "priority": "medium",
                "target_roles": ["student", "parent"],
                "target_classes": ["9A", "10A", "11A", "11B"],
                "created_by": "admin@aqbobek.kz",
                "created_at": _now_iso(),
            },
        ]
    )
    SOCIAL_POSTS.append(
        {
            "id": str(uuid4()),
            "student_id": student["id"],
            "author_role": "student",
            "author_name": student["name"],
            "content": "Completed my Physics vector exercises today.",
            "created_at": _now_iso(),
            "comments": [
                {
                    "id": str(uuid4()),
                    "author_role": "parent",
                    "author_name": "Parent",
                    "text": "Great progress, keep the routine.",
                    "created_at": _now_iso(),
                }
            ],
        }
    )


def init_school_db() -> None:
    if STUDENTS:
        return
    _generate_teachers()
    _generate_students()
    _bootstrap_demo_accounts()


def create_account(
    role: str,
    display_name: str,
    email: str,
    password: str,
    linked_student_id: str | None = None,
    linked_teacher_id: str | None = None,
    class_id: str | None = None,
) -> dict[str, Any]:
    init_school_db()
    normalized_email = _normalize_email(email)
    if normalized_email in AUTH_USERS:
        raise ValueError("Account with this email already exists")
    if role not in {"student", "teacher", "parent", "admin"}:
        raise ValueError("Unsupported role")
    if role in {"student", "parent"} and not linked_student_id:
        raise ValueError("linked_student_id is required for student/parent")

    user_id = f"user_{uuid4().hex[:10]}"
    account = {
        "user_id": user_id,
        "role": role,
        "display_name": display_name.strip() or role.title(),
        "email": normalized_email,
        "password": password,
        "linked_student_id": linked_student_id,
        "linked_teacher_id": linked_teacher_id,
        "class_id": class_id,
        "created_at": _now_iso(),
    }
    AUTH_USERS[normalized_email] = account
    AUTH_USERS_BY_ID[user_id] = account
    return deepcopy(account)


def register_student(name: str, class_id: str, email: str, password: str) -> dict[str, Any]:
    init_school_db()
    class_id = class_id.strip().upper()
    if class_id not in CLASS_IDS:
        raise ValueError("Unknown class_id")

    student_id = f"student_{uuid4().hex[:10]}"
    student_name = name.strip() or "Student"
    student_email = _normalize_email(email)
    if student_email in AUTH_USERS:
        raise ValueError("Email already registered")
    if any(_normalize_email(student["email"]) == student_email for student in STUDENTS.values()):
        raise ValueError("Student with this email already exists")

    STUDENTS[student_id] = {
        "id": student_id,
        "name": student_name,
        "class_id": class_id,
        "email": student_email,
        "parent_ids": [],
    }

    subject_rows: dict[str, dict[str, Any]] = {}
    for subject, topics in SUBJECT_TOPICS.items():
        base = RNG.randint(3, 5)
        grades = [max(2, min(5, base + RNG.choice([-1, 0, 1]))) for _ in range(6)]
        subject_rows[subject] = {
            "grades": grades,
            "attendance": round(RNG.uniform(0.78, 0.98), 2),
            "topics": topics,
            "missing_assignments": RNG.randint(0, 3),
        }

    STUDENT_ACADEMIC[student_id] = {"student_id": student_id, "subjects": subject_rows}
    account = create_account(
        role="student",
        display_name=student_name,
        email=student_email,
        password=password,
        linked_student_id=student_id,
        class_id=class_id,
    )
    return {"student_id": student_id, "account": account}


def register_parent(name: str, email: str, password: str, child_student_email: str) -> dict[str, Any]:
    init_school_db()
    child_email = _normalize_email(child_student_email)
    child = next((row for row in STUDENTS.values() if _normalize_email(row["email"]) == child_email), None)
    if not child:
        raise ValueError("Linked student by email not found")
    account = create_account(
        role="parent",
        display_name=name.strip() or "Parent",
        email=email,
        password=password,
        linked_student_id=child["id"],
        class_id=child["class_id"],
    )
    child["parent_ids"].append(account["user_id"])
    return {"parent_user_id": account["user_id"], "linked_student_id": child["id"], "account": account}


def authenticate(email: str, password: str) -> dict[str, Any]:
    init_school_db()
    normalized_email = _normalize_email(email)
    account = AUTH_USERS.get(normalized_email)
    if not account or account["password"] != password:
        raise ValueError("Invalid email or password")
    return deepcopy(account)


def create_token_session(account: dict[str, Any]) -> dict[str, Any]:
    token = str(uuid4())
    TOKENS[token] = deepcopy(account)
    return {"token": token, "role": account["role"]}


def create_role_session(role: str) -> dict[str, Any]:
    init_school_db()
    if role == "student":
        student = next(iter(STUDENTS.values()))
        account = {
            "user_id": "demo_student",
            "role": "student",
            "display_name": student["name"],
            "email": "demo.student@aqbobek.kz",
            "linked_student_id": student["id"],
            "class_id": student["class_id"],
        }
    elif role == "parent":
        student = next(iter(STUDENTS.values()))
        account = {
            "user_id": "demo_parent",
            "role": "parent",
            "display_name": f"Parent of {student['name']}",
            "email": "demo.parent@aqbobek.kz",
            "linked_student_id": student["id"],
            "class_id": student["class_id"],
        }
    elif role == "teacher":
        teacher = next(iter(TEACHERS.values()))
        account = {
            "user_id": "demo_teacher",
            "role": "teacher",
            "display_name": teacher["name"],
            "email": "demo.teacher@aqbobek.kz",
            "linked_teacher_id": teacher["id"],
        }
    else:
        account = {
            "user_id": "demo_admin",
            "role": "admin",
            "display_name": "Admin Operator",
            "email": "demo.admin@aqbobek.kz",
        }
    return create_token_session(account)


def get_session_user(token: str) -> dict[str, Any] | None:
    init_school_db()
    user = TOKENS.get(token)
    return deepcopy(user) if user else None


def resolve_student_id(user: dict[str, Any]) -> str | None:
    if user["role"] == "student":
        return user.get("linked_student_id")
    if user["role"] == "parent":
        return user.get("linked_student_id")
    return None


def student_dashboard_payload(student_id: str) -> dict[str, Any]:
    student = STUDENTS.get(student_id)
    if not student:
        raise ValueError("Student not found")
    subjects = _student_subject_payload(student_id)
    return {"student": student["name"], "class_id": student["class_id"], "subjects": subjects}


def _subject_risk(payload: dict[str, Any]) -> int:
    grades = payload["grades"]
    attendance = payload["attendance"]
    missing = payload["missing_assignments"]
    avg = sum(grades) / len(grades)
    trend = grades[-1] - grades[0]
    volatility = (max(grades) - min(grades)) / 3
    raw = 0
    if avg < 3.4:
        raw += 34
    elif avg < 4:
        raw += 18
    if attendance < 0.75:
        raw += 24
    elif attendance < 0.86:
        raw += 12
    if trend < 0:
        raw += 16
    if volatility > 0.9:
        raw += 10
    raw += min(16, missing * 4)
    return min(100, raw)


def student_overall_risk(student_id: str) -> dict[str, Any]:
    subjects = STUDENT_ACADEMIC.get(student_id, {}).get("subjects", {})
    if not subjects:
        return {"risk_score": 50, "risk_level": "medium", "subject_risks": []}
    subject_rows = []
    for subject, payload in subjects.items():
        risk = _subject_risk(payload)
        subject_rows.append({"subject": subject, "risk": risk, "missing_assignments": payload["missing_assignments"]})
    subject_rows.sort(key=lambda row: row["risk"], reverse=True)
    avg_risk = round(sum(row["risk"] for row in subject_rows) / len(subject_rows))
    level = "high" if avg_risk >= 70 else "medium" if avg_risk >= 40 else "low"
    return {"risk_score": avg_risk, "risk_level": level, "subject_risks": subject_rows}


def parent_weekly_summary_payload(student_id: str) -> dict[str, Any]:
    student = STUDENTS.get(student_id)
    if not student:
        raise ValueError("Linked student not found")
    data = STUDENT_ACADEMIC.get(student_id, {}).get("subjects", {})
    if not data:
        raise ValueError("No student data")

    total_grades: list[int] = []
    attendance_values: list[float] = []
    subject_scores: list[tuple[str, int]] = []
    for subject, payload in data.items():
        total_grades.extend(payload["grades"])
        attendance_values.append(payload["attendance"])
        subject_scores.append((subject, _subject_risk(payload)))
    subject_scores.sort(key=lambda item: item[1], reverse=True)

    risk_score = round(sum(score for _, score in subject_scores) / len(subject_scores))
    risk_level = "high" if risk_score >= 70 else "medium" if risk_score >= 40 else "low"
    attention = [name for name, score in subject_scores if score >= 40][:3]
    strong = [name for name, score in reversed(subject_scores) if score < 35][:3]

    return {
        "week_label": "Current week",
        "child_name": student["name"],
        "class_id": student["class_id"],
        "average_grade": round(sum(total_grades) / len(total_grades), 2),
        "average_attendance": round(sum(attendance_values) / len(attendance_values), 3),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "strong_subjects": strong,
        "attention_subjects": attention,
    }


def teacher_early_warning_payload(class_id: str, limit: int = 25) -> list[dict[str, Any]]:
    class_id = class_id.strip().upper()
    rows = []
    for student in STUDENTS.values():
        if student["class_id"] != class_id:
            continue
        risk = student_overall_risk(student["id"])
        top_subject = risk["subject_risks"][0] if risk["subject_risks"] else {"subject": "-", "risk": 0}
        reasons = []
        if top_subject["risk"] >= 60:
            reasons.append(f"High subject risk in {top_subject['subject']}")
        if top_subject.get("missing_assignments", 0) > 1:
            reasons.append("Missing assignments trend")
        avg_attendance = round(
            sum(item["attendance"] for item in STUDENT_ACADEMIC[student["id"]]["subjects"].values())
            / len(STUDENT_ACADEMIC[student["id"]]["subjects"]),
            2,
        )
        if avg_attendance < 0.85:
            reasons.append("Attendance below target")
        rows.append(
            {
                "student_id": student["id"],
                "student_name": student["name"],
                "class_id": student["class_id"],
                "risk_score": risk["risk_score"],
                "risk_level": risk["risk_level"],
                "top_subject": top_subject["subject"],
                "attendance": avg_attendance,
                "reasons": reasons or ["Stable but monitored"],
            }
        )
    rows.sort(key=lambda row: row["risk_score"], reverse=True)
    return rows[:limit]


def class_report_context(class_id: str) -> dict[str, Any]:
    rows = teacher_early_warning_payload(class_id=class_id, limit=200)
    total = len(rows)
    if total == 0:
        raise ValueError("No students for class")
    high = len([row for row in rows if row["risk_level"] == "high"])
    medium = len([row for row in rows if row["risk_level"] == "medium"])
    average_risk = round(sum(row["risk_score"] for row in rows) / total)
    return {
        "class_id": class_id,
        "total_students": total,
        "high_risk": high,
        "medium_risk": medium,
        "average_risk": average_risk,
        "top_cases": rows[:5],
    }


def admin_metrics_payload() -> dict[str, Any]:
    total_students = len(STUDENTS)
    total_teachers = len(TEACHERS)
    risk_rows = []
    class_totals: dict[str, list[int]] = {}
    for student in STUDENTS.values():
        risk = student_overall_risk(student["id"])["risk_score"]
        risk_rows.append(risk)
        class_totals.setdefault(student["class_id"], []).append(risk)
    high_risk = len([value for value in risk_rows if value >= 70])
    medium_risk = len([value for value in risk_rows if 40 <= value < 70])
    low_risk = len([value for value in risk_rows if value < 40])
    heatmap = [
        {"class_id": class_id, "avg_risk": round(sum(values) / len(values)), "students": len(values)}
        for class_id, values in class_totals.items()
    ]
    heatmap.sort(key=lambda item: item["avg_risk"], reverse=True)
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "high_risk_students": high_risk,
        "medium_risk_students": medium_risk,
        "low_risk_students": low_risk,
        "average_school_risk": round(sum(risk_rows) / len(risk_rows)),
        "class_heatmap": heatmap[:12],
    }


def create_announcement(
    title: str,
    message: str,
    priority: str,
    target_roles: list[str] | None,
    target_classes: list[str] | None,
    created_by: str,
) -> dict[str, Any]:
    announcement = {
        "id": str(uuid4()),
        "title": title.strip(),
        "message": message.strip(),
        "priority": priority if priority in {"high", "medium", "low"} else "medium",
        "target_roles": target_roles or ["student", "teacher", "parent", "admin"],
        "target_classes": [item.strip().upper() for item in (target_classes or []) if item.strip()],
        "created_by": created_by,
        "created_at": _now_iso(),
    }
    ANNOUNCEMENTS.append(announcement)
    return deepcopy(announcement)


def list_announcements(role: str | None = None, class_id: str | None = None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    class_id_normalized = (class_id or "").strip().upper()
    for item in ANNOUNCEMENTS:
        if role and role not in item["target_roles"]:
            continue
        if class_id_normalized and item["target_classes"] and class_id_normalized not in item["target_classes"]:
            continue
        out.append(deepcopy(item))
    out.sort(key=lambda row: row["created_at"], reverse=True)
    return out


def _find_teachers_for_subject_class(subject: str, class_id: str) -> list[dict[str, Any]]:
    rows = []
    for teacher in TEACHERS.values():
        if subject not in teacher["subjects"]:
            continue
        if class_id not in teacher["classes"]:
            continue
        rows.append(teacher)
    return rows


def _pick_room(subject: str) -> str:
    if subject in {"Physics", "Chemistry", "Biology"}:
        return RNG.choice(["Lab-1", "Lab-2"])
    if subject == "Informatics":
        return RNG.choice(["IT-1", "IT-2"])
    return RNG.choice(ROOMS[:35])


def generate_schedule(class_ids: list[str] | None = None) -> dict[str, Any]:
    init_school_db()
    selected_classes = [item.strip().upper() for item in (class_ids or CLASS_IDS)]
    selected_classes = [item for item in selected_classes if item in CLASS_IDS]
    if not selected_classes:
        raise ValueError("No valid classes provided")

    teacher_busy: set[tuple[str, str, str]] = set()
    room_busy: set[tuple[str, str, str]] = set()
    class_busy: set[tuple[str, str, str]] = set()
    teacher_daily_load: dict[tuple[str, str], int] = {}
    entries: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []

    for class_id in selected_classes:
        for subject, need_count in SUBJECT_REQUIREMENTS.items():
            for _ in range(need_count):
                placed = False
                candidates = _find_teachers_for_subject_class(subject, class_id)
                RNG.shuffle(candidates)
                for day in DAYS:
                    for slot in SLOTS:
                        if (class_id, day, slot) in class_busy:
                            continue
                        for teacher in candidates:
                            teacher_key = (teacher["id"], day, slot)
                            if teacher_key in teacher_busy:
                                continue
                            day_load_key = (teacher["id"], day)
                            if teacher_daily_load.get(day_load_key, 0) >= teacher["max_daily_lessons"]:
                                continue
                            room = _pick_room(subject)
                            room_key = (room, day, slot)
                            if room_key in room_busy:
                                continue

                            entry = {
                                "id": str(uuid4()),
                                "class_id": class_id,
                                "subject": subject,
                                "teacher_id": teacher["id"],
                                "teacher_name": teacher["name"],
                                "room": room,
                                "day": day,
                                "slot": slot,
                                "type": "lesson",
                            }
                            entries.append(entry)
                            class_busy.add((class_id, day, slot))
                            teacher_busy.add(teacher_key)
                            room_busy.add(room_key)
                            teacher_daily_load[day_load_key] = teacher_daily_load.get(day_load_key, 0) + 1
                            placed = True
                            break
                        if placed:
                            break
                    if placed:
                        break

                if not placed:
                    unresolved.append({"class_id": class_id, "subject": subject, "reason": "No feasible slot"})

    schedule_id = str(uuid4())
    payload = {
        "schedule_id": schedule_id,
        "generated_at": _now_iso(),
        "classes": selected_classes,
        "entries": entries,
        "unresolved": unresolved,
        "stats": {
            "total_entries": len(entries),
            "unresolved_count": len(unresolved),
            "class_count": len(selected_classes),
        },
    }
    GENERATED_SCHEDULES[schedule_id] = deepcopy(payload)
    SCHEDULE_CHANGE_LOG.append(
        {
            "id": str(uuid4()),
            "event": "schedule_generated",
            "schedule_id": schedule_id,
            "created_at": _now_iso(),
            "meta": {"class_count": len(selected_classes), "entries": len(entries), "unresolved": len(unresolved)},
        }
    )
    return payload


def validate_schedule(entries: list[dict[str, Any]]) -> dict[str, Any]:
    teacher_slots: set[tuple[str, str, str]] = set()
    room_slots: set[tuple[str, str, str]] = set()
    class_slots: set[tuple[str, str, str]] = set()
    conflicts: list[dict[str, Any]] = []

    for entry in entries:
        teacher_key = (entry["teacher_id"], entry["day"], entry["slot"])
        room_key = (entry["room"], entry["day"], entry["slot"])
        class_key = (entry["class_id"], entry["day"], entry["slot"])

        if teacher_key in teacher_slots:
            conflicts.append({"type": "teacher_overlap", "entry_id": entry["id"], "teacher_id": entry["teacher_id"]})
        if room_key in room_slots:
            conflicts.append({"type": "room_overlap", "entry_id": entry["id"], "room": entry["room"]})
        if class_key in class_slots:
            conflicts.append({"type": "class_overlap", "entry_id": entry["id"], "class_id": entry["class_id"]})

        teacher_slots.add(teacher_key)
        room_slots.add(room_key)
        class_slots.add(class_key)

    return {"valid": len(conflicts) == 0, "conflicts": conflicts}


def list_schedule_changes(limit: int = 50) -> list[dict[str, Any]]:
    return deepcopy(sorted(SCHEDULE_CHANGE_LOG, key=lambda row: row["created_at"], reverse=True)[:limit])


def create_social_post(student_id: str, author_role: str, author_name: str, content: str) -> dict[str, Any]:
    if student_id not in STUDENTS:
        raise ValueError("Student not found")
    post = {
        "id": str(uuid4()),
        "student_id": student_id,
        "author_role": author_role,
        "author_name": author_name,
        "content": content.strip(),
        "created_at": _now_iso(),
        "comments": [],
    }
    SOCIAL_POSTS.append(post)
    return deepcopy(post)


def add_social_comment(post_id: str, author_role: str, author_name: str, text: str) -> dict[str, Any]:
    for post in SOCIAL_POSTS:
        if post["id"] != post_id:
            continue
        comment = {
            "id": str(uuid4()),
            "author_role": author_role,
            "author_name": author_name,
            "text": text.strip(),
            "created_at": _now_iso(),
        }
        post["comments"].append(comment)
        return deepcopy(post)
    raise ValueError("Post not found")


def list_social_feed(student_id: str) -> list[dict[str, Any]]:
    rows = [row for row in SOCIAL_POSTS if row["student_id"] == student_id]
    rows.sort(key=lambda row: row["created_at"], reverse=True)
    return deepcopy(rows)


def add_portfolio_item(student_id: str, title: str, description: str) -> dict[str, Any]:
    if student_id not in STUDENTS:
        raise ValueError("Student not found")
    item = {
        "id": str(uuid4()),
        "student_id": student_id,
        "title": title.strip(),
        "description": description.strip(),
        "status": "pending",
        "created_at": _now_iso(),
        "verified_at": None,
    }
    PORTFOLIO_ITEMS.append(item)
    return deepcopy(item)


def verify_portfolio_item(item_id: str) -> dict[str, Any]:
    for item in PORTFOLIO_ITEMS:
        if item["id"] != item_id:
            continue
        item["status"] = "verified"
        item["verified_at"] = _now_iso()
        return deepcopy(item)
    raise ValueError("Portfolio item not found")


def list_portfolio(student_id: str) -> list[dict[str, Any]]:
    return deepcopy([item for item in PORTFOLIO_ITEMS if item["student_id"] == student_id])


def db_stats() -> dict[str, Any]:
    return {
        "students": len(STUDENTS),
        "teachers": len(TEACHERS),
        "accounts": len(AUTH_USERS),
        "classes": len(CLASS_IDS),
        "announcements": len(ANNOUNCEMENTS),
        "social_posts": len(SOCIAL_POSTS),
    }


def gamification_leaderboard(limit: int = 20) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for student_id, student in STUDENTS.items():
        subjects = STUDENT_ACADEMIC.get(student_id, {}).get("subjects", {})
        if not subjects:
            continue
        deltas = []
        attendance_values = []
        for payload in subjects.values():
            grades = payload["grades"]
            deltas.append(grades[-1] - grades[0])
            attendance_values.append(payload["attendance"])
        avg_delta = sum(deltas) / len(deltas)
        avg_attendance = sum(attendance_values) / len(attendance_values)
        score = round((avg_delta + 2) * 25 + avg_attendance * 50)
        badge = "Consistency Hero" if avg_attendance >= 0.95 else "Progress Builder" if avg_delta > 0 else "On Track"
        rows.append(
            {
                "student_id": student_id,
                "student_name": student["name"],
                "class_id": student["class_id"],
                "improvement_score": max(0, min(100, score)),
                "badge": badge,
            }
        )
    rows.sort(key=lambda row: row["improvement_score"], reverse=True)
    return rows[:limit]


def reset_school_db(seed: int = DEFAULT_RANDOM_SEED) -> dict[str, Any]:
    RNG.seed(seed)
    STUDENTS.clear()
    TEACHERS.clear()
    STUDENT_ACADEMIC.clear()
    TOKENS.clear()
    AUTH_USERS.clear()
    AUTH_USERS_BY_ID.clear()
    ANNOUNCEMENTS.clear()
    SOCIAL_POSTS.clear()
    PORTFOLIO_ITEMS.clear()
    GENERATED_SCHEDULES.clear()
    SCHEDULE_CHANGE_LOG.clear()
    init_school_db()
    return db_stats()
