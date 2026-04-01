from __future__ import annotations

import os
from typing import Any, Iterable

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()


DEFAULT_AI_PROVIDER = "openrouter"
DEFAULT_AI_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_AI_MODEL_PRIMARY = "stepfun/step-3.5-flash:free"


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _parse_model_fallbacks(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def _default_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    app_url = _env("AI_APP_URL")
    app_name = _env("AI_APP_NAME")
    if app_url:
        headers["HTTP-Referer"] = app_url
    if app_name:
        headers["X-OpenRouter-Title"] = app_name
    return headers


def _extract_text_from_completion(response: Any) -> str:
    choices = getattr(response, "choices", None) or []
    if not choices:
        return ""

    message = getattr(choices[0], "message", None)
    if message is None:
        return ""

    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ""

    parts: list[str] = []
    for item in content:
        if isinstance(item, str):
            if item.strip():
                parts.append(item.strip())
            continue
        if not isinstance(item, dict):
            continue
        if item.get("type") == "text":
            text = item.get("text")
            if isinstance(text, str) and text.strip():
                parts.append(text.strip())
    return "\n".join(parts).strip()


async def _complete_text(system_prompt: str, user_prompt: str, temperature: float) -> tuple[str, str] | None:
    api_key = _env("AI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import AsyncOpenAI
    except Exception:
        return None

    provider = _env("AI_PROVIDER", DEFAULT_AI_PROVIDER) or DEFAULT_AI_PROVIDER
    base_url = _env("AI_BASE_URL", DEFAULT_AI_BASE_URL) or DEFAULT_AI_BASE_URL
    primary_model = _env("AI_MODEL_PRIMARY", DEFAULT_AI_MODEL_PRIMARY) or DEFAULT_AI_MODEL_PRIMARY
    fallback_models = _parse_model_fallbacks(_env("AI_MODEL_FALLBACKS"))

    client_kwargs: dict[str, Any] = {
        "api_key": api_key,
        "base_url": base_url,
    }
    headers = _default_headers()
    if headers:
        client_kwargs["default_headers"] = headers

    client = AsyncOpenAI(**client_kwargs)
    request_kwargs: dict[str, Any] = {
        "model": primary_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
    }
    if fallback_models:
        request_kwargs["extra_body"] = {"models": fallback_models}

    try:
        response = await client.chat.completions.create(**request_kwargs)
    except Exception:
        return None

    text = _extract_text_from_completion(response)
    if not text:
        return None

    response_model = getattr(response, "model", None) or primary_model
    return text, f"{provider}:{response_model}"


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
    prompt = (
        "Give a concise student recommendation in 2-4 sentences. "
        f"Subject: {subject}. Risk: {risk}/100. Grades: {grades}. "
        f"Attendance: {attendance:.2f}."
    )

    completion = await _complete_text(
        system_prompt=(
            "You are an academic tutor. Write concrete, practical advice with no fluff. "
            "Prioritize actions for the next 1-2 weeks."
        ),
        user_prompt=prompt,
        temperature=0.4,
    )
    if completion:
        return completion

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
    fallback_summary, fallback_recommendation = _fallback_parent_summary(
        child_name=child_name,
        risk_score=risk_score,
        average_attendance=average_attendance,
        strong_subjects=strong_subjects,
        attention_subjects=attention_subjects,
    )

    completion = await _complete_text(
        system_prompt=(
            "You are an academic assistant for parents. "
            "Write clear, practical and calm weekly guidance."
        ),
        user_prompt=(
            f"Create a concise parent weekly summary for {child_name}. "
            f"Risk score: {risk_score}/100. Attendance: {average_attendance:.2f}. "
            f"Strong subjects: {strong_subjects}. Attention subjects: {attention_subjects}. "
            "Return exactly two short paragraphs: summary and recommendation."
        ),
        temperature=0.4,
    )
    if completion:
        text, source = completion
        parts = [part.strip() for part in text.split("\n\n") if part.strip()]
        if len(parts) >= 2:
            return parts[0], parts[1], source
        return text, fallback_recommendation, source

    return fallback_summary, fallback_recommendation, "fallback"


async def generate_teacher_class_report(context: dict) -> tuple[str, str]:
    fallback_report = (
        f"Class {context['class_id']}: total students {context['total_students']}, "
        f"high risk {context['high_risk']}, medium risk {context['medium_risk']}, "
        f"average risk {context['average_risk']}. "
        "Recommended action: prioritize top 5 high-risk students, assign targeted remediation for weak topics, "
        "and monitor attendance for the next 7 days."
    )

    completion = await _complete_text(
        system_prompt=(
            "You are a school analytics assistant. "
            "Provide short, actionable class-level reports."
        ),
        user_prompt=(
            "Write a concise class report for a teacher with practical next actions. "
            f"Context: {context}."
        ),
        temperature=0.3,
    )
    if completion:
        return completion

    return fallback_report, "fallback"
