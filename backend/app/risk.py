from __future__ import annotations


def calculate_risk(grades: list[int], attendance: float) -> int:
    if not grades:
        return 100 if attendance < 0.75 else 50

    avg = sum(grades) / len(grades)
    risk = 0

    if avg < 3.5:
        risk += 40
    elif avg < 4:
        risk += 20

    if attendance < 0.75:
        risk += 30

    trend = grades[-1] - grades[0]
    if trend < 0:
        risk += 20

    return min(risk, 100)


def risk_level(risk: int) -> str:
    if risk >= 60:
        return "high"
    if risk >= 30:
        return "medium"
    return "low"
