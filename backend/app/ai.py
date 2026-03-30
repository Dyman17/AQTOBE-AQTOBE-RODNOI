from __future__ import annotations

import os
from typing import Iterable

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()


def _fallback_advice(risk: int, grades: Iterable[int], attendance: float, subject: str) -> str:
    grades_list = list(grades)
    avg = sum(grades_list) / len(grades_list) if grades_list else 0

    if risk >= 60:
        return (
            f"High risk in {subject}. Focus on core topics, add 20-30 minutes "
            "of daily practice, and close missed classes first."
        )
    if risk >= 30:
        return (
            f"Medium risk in {subject}. Review weak topics, consolidate the last 2 lessons, "
            "and keep attendance above 85%."
        )
    return (
        f"Low risk in {subject}. Keep the same pace: "
        f"average grade {avg:.2f}, attendance {attendance * 100:.0f}%."
    )


async def generate_ai_advice(risk: int, grades: list[int], attendance: float, subject: str) -> tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key:
        return _fallback_advice(risk, grades, attendance, subject), "fallback"

    try:
        from openai import AsyncOpenAI
    except Exception:
        return _fallback_advice(risk, grades, attendance, subject), "fallback"

    client = AsyncOpenAI(api_key=api_key)

    prompt = (
        "Give a concise student recommendation in 2-4 sentences. "
        f"Subject: {subject}. Risk: {risk}/100. Grades: {grades}. "
        f"Attendance: {attendance:.2f}."
    )

    try:
        response = await client.responses.create(
            model=model,
            temperature=0.4,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are an academic tutor. Write concrete, practical advice with no fluff. "
                        "Prioritize actions for the next 1-2 weeks."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        text = (response.output_text or "").strip()
        if text:
            return text, "openai"
    except Exception:
        pass

    return _fallback_advice(risk, grades, attendance, subject), "fallback"


def _fallback_parent_summary(
    child_name: str,
    risk_score: int,
    average_attendance: float,
    strong_subjects: list[str],
    attention_subjects: list[str],
) -> tuple[str, str]:
    strengths = ", ".join(strong_subjects) if strong_subjects else "stable subjects"
    concerns = ", ".join(attention_subjects) if attention_subjects else "no critical subjects"
    summary = (
        f"{child_name}'s weekly risk is {risk_score}/100. "
        f"Strong areas: {strengths}. "
        f"Attention areas: {concerns}. "
        f"Attendance is {average_attendance * 100:.0f}%."
    )
    recommendation = (
        "Keep a short 20-minute review routine for attention subjects, "
        "and maintain attendance above 90% next week."
    )
    return summary, recommendation


async def generate_parent_weekly_summary(
    child_name: str,
    risk_score: int,
    average_attendance: float,
    strong_subjects: list[str],
    attention_subjects: list[str],
) -> tuple[str, str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    fallback_summary, fallback_recommendation = _fallback_parent_summary(
        child_name=child_name,
        risk_score=risk_score,
        average_attendance=average_attendance,
        strong_subjects=strong_subjects,
        attention_subjects=attention_subjects,
    )

    if not api_key:
        return fallback_summary, fallback_recommendation, "fallback"

    try:
        from openai import AsyncOpenAI
    except Exception:
        return fallback_summary, fallback_recommendation, "fallback"

    client = AsyncOpenAI(api_key=api_key)
    prompt = (
        f"Create a concise parent weekly summary for {child_name}. "
        f"Risk score: {risk_score}/100. Attendance: {average_attendance:.2f}. "
        f"Strong subjects: {strong_subjects}. Attention subjects: {attention_subjects}. "
        "Return exactly two short paragraphs: summary and recommendation."
    )

    try:
        response = await client.responses.create(
            model=model,
            temperature=0.4,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are an academic assistant for parents. "
                        "Write clear, practical and calm weekly guidance."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        text = (response.output_text or "").strip()
        if text:
            parts = [part.strip() for part in text.split("\n\n") if part.strip()]
            if len(parts) >= 2:
                return parts[0], parts[1], "openai"
            return text, fallback_recommendation, "openai"
    except Exception:
        pass

    return fallback_summary, fallback_recommendation, "fallback"


async def generate_teacher_class_report(context: dict) -> tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    fallback_report = (
        f"Class {context['class_id']}: total students {context['total_students']}, "
        f"high risk {context['high_risk']}, medium risk {context['medium_risk']}, "
        f"average risk {context['average_risk']}. "
        "Recommended action: prioritize top 5 high-risk students, assign targeted remediation for weak topics, "
        "and monitor attendance for the next 7 days."
    )

    if not api_key:
        return fallback_report, "fallback"

    try:
        from openai import AsyncOpenAI
    except Exception:
        return fallback_report, "fallback"

    client = AsyncOpenAI(api_key=api_key)
    prompt = (
        "Write a concise class report for a teacher with practical next actions. "
        f"Context: {context}."
    )
    try:
        response = await client.responses.create(
            model=model,
            temperature=0.3,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a school analytics assistant. "
                        "Provide short, actionable class-level reports."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        text = (response.output_text or "").strip()
        if text:
            return text, "openai"
    except Exception:
        pass

    return fallback_report, "fallback"
