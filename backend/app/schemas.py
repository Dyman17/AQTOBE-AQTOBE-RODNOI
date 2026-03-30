from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    role: str = Field(pattern="^(student|teacher|parent|admin)$")


class LoginResponse(BaseModel):
    token: str
    role: str


class MeResponse(BaseModel):
    role: str
    user_id: str | None = None
    email: str | None = None
    display_name: str | None = None
    linked_student_id: str | None = None
    linked_teacher_id: str | None = None
    class_id: str | None = None


class AuthLoginRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=4)


class AuthRegisterStudentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    class_id: str = Field(min_length=2, max_length=10)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=4, max_length=200)


class AuthRegisterParentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=4, max_length=200)
    child_student_email: str = Field(min_length=5, max_length=200)


class RiskRequest(BaseModel):
    subject: str
    grades: list[int] = Field(min_length=1)
    attendance: float = Field(ge=0, le=1)


class RiskResponse(BaseModel):
    subject: str
    risk: int = Field(ge=0, le=100)
    level: str


class AIAdviceRequest(BaseModel):
    subject: str
    grades: list[int] = Field(min_length=1)
    attendance: float = Field(ge=0, le=1)
    risk: int | None = Field(default=None, ge=0, le=100)


class AIAdviceResponse(BaseModel):
    subject: str
    risk: int = Field(ge=0, le=100)
    advice: str
    source: str


class TeacherClassReportRequest(BaseModel):
    class_id: str = Field(min_length=2, max_length=10)


class TeacherClassReportResponse(BaseModel):
    class_id: str
    report: str
    source: str


class AnnouncementCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=3, max_length=1500)
    priority: Literal["high", "medium", "low"] = "medium"
    target_roles: list[str] = Field(default_factory=list)
    target_classes: list[str] = Field(default_factory=list)


class SocialPostCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class SocialCommentCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class PortfolioItemCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=2, max_length=2000)


class ScheduleGenerateRequest(BaseModel):
    class_ids: list[str] = Field(default_factory=list)


class SchoolInfo(BaseModel):
    id: str
    name: str


class AbsenceRequestCreate(BaseModel):
    school_id: str = Field(min_length=2)
    teacher_id: str = Field(min_length=2)
    day: str = Field(min_length=3)
    reason: str = Field(default="", max_length=500)
    submitted_by: str = Field(min_length=2)


class AbsenceRequestSummary(BaseModel):
    request_id: str
    school_id: str
    teacher_id: str
    teacher_name: str
    day: str
    status: str
    impacted_lessons: int
    submitted_by: str
    submitted_at: str


class AbsenceDecisionRequest(BaseModel):
    decision: Literal["approve", "reject"]
    approver_id: str = Field(min_length=2)
    approver_role: str = Field(pattern="^(admin|director|deputy)$")
    comment: str | None = Field(default=None, max_length=500)
    selected_options: dict[str, str] = Field(default_factory=dict)


class AbsenceRequestDetail(BaseModel):
    request_id: str
    school_id: str
    teacher_id: str
    teacher_name: str
    day: str
    reason: str
    status: str
    submitted_by: str
    submitted_at: str
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    review_comment: str | None = None
    proposal: dict[str, Any]
    approved_plan: dict[str, Any] | None = None


class NotificationItem(BaseModel):
    id: str
    school_id: str
    target_role: str
    target_user_id: str | None = None
    title: str
    message: str
    created_at: str
    request_id: str | None = None
    is_read: bool = False


class ParentWeeklySummaryResponse(BaseModel):
    week_label: str
    child_name: str
    class_id: str
    average_grade: float = Field(ge=0, le=5)
    average_attendance: float = Field(ge=0, le=1)
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    strong_subjects: list[str]
    attention_subjects: list[str]
    summary: str
    recommendation: str
    source: str
    generated_at: str


class KioskAnnouncement(BaseModel):
    id: str
    title: str
    message: str
    priority: Literal["high", "medium", "low"] = "medium"
    valid_until: str | None = None


class KioskTopStudent(BaseModel):
    id: str
    name: str
    class_id: str
    score: int = Field(ge=0, le=100)
    achievement: str


class KioskReplacement(BaseModel):
    id: str
    day: str
    slot: str
    class_id: str
    subject: str
    type: Literal["substitute_teacher", "reschedule", "self_study"]
    teacher_name: str | None = None
    note: str


class KioskEvent(BaseModel):
    id: str
    date: str
    time: str
    title: str
    location: str
    audience: str


class KioskPayload(BaseModel):
    generated_at: str
    source: str
    school_id: str
    school_name: str
    announcements: list[KioskAnnouncement]
    top_students: list[KioskTopStudent]
    replacements: list[KioskReplacement]
    events: list[KioskEvent]
