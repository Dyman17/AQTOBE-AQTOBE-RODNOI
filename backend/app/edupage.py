from __future__ import annotations

import json
import threading
import time
from copy import deepcopy
from dataclasses import dataclass
from datetime import date
from typing import Any
from urllib import error, request


class EduPageError(Exception):
    pass


@dataclass(frozen=True)
class EduPageConfig:
    school: str = "nisaktau"
    year: int | None = None
    tt_num: str | None = None
    timeout_seconds: int = 25
    cache_ttl_seconds: int = 300
    timezone: str = "Asia/Almaty"


_CACHE_LOCK = threading.Lock()
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def _infer_school_year(today: date | None = None) -> int:
    current = today or date.today()
    return current.year - 1 if current.month < 8 else current.year


def _rpc_post(url: str, args: list[Any], timeout_seconds: int) -> dict[str, Any]:
    payload = {
        "__args": args,
        "__gsh": "00000000",
        "__client_redirect": "",
    }
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Aqbobek-MVP/1.0",
        },
    )

    try:
        with request.urlopen(req, timeout=timeout_seconds) as response:
            raw = response.read().decode("utf-8")
    except (error.URLError, TimeoutError, OSError) as exc:
        raise EduPageError(f"EduPage request failed: {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise EduPageError("EduPage returned invalid JSON") from exc

    if not isinstance(data, dict):
        raise EduPageError("EduPage JSON root is not an object")
    return data


def _table_map(dbi_tables: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for table in dbi_tables:
        table_id = table.get("id")
        if isinstance(table_id, str):
            out[table_id] = table
    return out


def _rows_by_id(table: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    if not table:
        return {}
    rows = table.get("data_rows")
    if not isinstance(rows, list):
        return {}

    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        row_id = row.get("id")
        if row_id is None:
            continue
        out[str(row_id)] = row
    return out


def _safe_name(row: dict[str, Any] | None, *fields: str, default: str = "") -> str:
    if not row:
        return default
    for field in fields:
        value = row.get(field)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return default


def _sort_day_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    def _row_key(row: dict[str, Any]) -> tuple[int, str]:
        raw_id = str(row.get("id", ""))
        try:
            return (int(raw_id), "")
        except ValueError:
            return (999, raw_id)

    return sorted(rows, key=_row_key)


def _sort_time_key(value: str) -> tuple[int, int]:
    try:
        hours, minutes = value.split(":")
        return int(hours), int(minutes)
    except (ValueError, TypeError):
        return 99, 99


def _decode_timetable_payload(
    school: str,
    timezone: str,
    tt_num: str,
    raw: dict[str, Any],
) -> dict[str, Any]:
    root = raw.get("r")
    if not isinstance(root, dict):
        raise EduPageError("Missing r in EduPage response")
    accessor = root.get("dbiAccessorRes")
    if not isinstance(accessor, dict):
        raise EduPageError("Missing dbiAccessorRes in EduPage response")

    tables = accessor.get("tables")
    if not isinstance(tables, list):
        raise EduPageError("Missing tables in EduPage response")

    table_by_id = _table_map([t for t in tables if isinstance(t, dict)])

    days_table = table_by_id.get("days")
    periods_table = table_by_id.get("periods")
    classes_table = table_by_id.get("classes")
    subjects_table = table_by_id.get("subjects")
    teachers_table = table_by_id.get("teachers")
    lessons_table = table_by_id.get("lessons")
    cards_table = table_by_id.get("cards")
    classrooms_table = table_by_id.get("classrooms")
    globals_table = table_by_id.get("globals")

    day_rows = _sort_day_rows(days_table.get("data_rows", []) if days_table else [])
    day_names = [_safe_name(row, "name", "short", default=f"Day {idx + 1}") for idx, row in enumerate(day_rows)]
    if not day_names:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    periods_by_id = _rows_by_id(periods_table)
    classes_by_id = _rows_by_id(classes_table)
    subjects_by_id = _rows_by_id(subjects_table)
    teachers_by_id = _rows_by_id(teachers_table)
    lessons_by_id = _rows_by_id(lessons_table)
    classrooms_by_id = _rows_by_id(classrooms_table)

    school_name = school
    globals_rows = globals_table.get("data_rows", []) if globals_table else []
    if isinstance(globals_rows, list) and globals_rows:
        first = globals_rows[0]
        if isinstance(first, dict):
            school_name = _safe_name(first, "reg_name", "name", default=school)

    cards_rows = cards_table.get("data_rows", []) if cards_table else []
    if not isinstance(cards_rows, list):
        cards_rows = []

    dedup: set[tuple[str, str, str, str, str, str]] = set()
    entries: list[dict[str, str]] = []

    for card in cards_rows:
        if not isinstance(card, dict):
            continue
        lesson_id = str(card.get("lessonid", ""))
        lesson = lessons_by_id.get(lesson_id)
        if not lesson:
            continue

        class_ids = [str(cid) for cid in lesson.get("classids", []) if cid is not None]
        if not class_ids:
            continue

        period = periods_by_id.get(str(card.get("period", "")), {})
        slot = _safe_name(period, "starttime", default="")
        if not slot:
            continue

        subject = _safe_name(subjects_by_id.get(str(lesson.get("subjectid", ""))), "name", "short", default="Subject")
        teacher_ids = [str(tid) for tid in lesson.get("teacherids", []) if tid is not None]
        teacher_names = [
            _safe_name(teachers_by_id.get(tid), "name", "short", default=tid)
            for tid in teacher_ids
        ]
        teacher_names = [name for name in teacher_names if name]
        teacher = ", ".join(dict.fromkeys(teacher_names))

        room_ids = [str(rid) for rid in card.get("classroomids", []) if rid is not None]
        room_names = [
            _safe_name(classrooms_by_id.get(rid), "short", "name", default=rid)
            for rid in room_ids
        ]
        room_names = [name for name in room_names if name]
        room = ", ".join(dict.fromkeys(room_names))

        day_mask = str(card.get("days", ""))
        for day_index, bit in enumerate(day_mask):
            if bit != "1":
                continue
            day = day_names[day_index] if day_index < len(day_names) else f"Day {day_index + 1}"
            for class_id in class_ids:
                class_row = classes_by_id.get(class_id)
                class_name = _safe_name(class_row, "name", "short", default=class_id)
                key = (day, slot, class_name, subject, teacher, room)
                if key in dedup:
                    continue
                dedup.add(key)
                entries.append(
                    {
                        "day": day,
                        "slot": slot,
                        "class_id": class_name,
                        "subject": subject,
                        "teacher": teacher,
                        "room": room,
                    }
                )

    day_order = {day: idx for idx, day in enumerate(day_names)}
    entries.sort(
        key=lambda entry: (
            day_order.get(entry["day"], 999),
            _sort_time_key(entry["slot"]),
            entry["class_id"],
            entry["subject"],
        )
    )
    slots = sorted({entry["slot"] for entry in entries if entry.get("slot")}, key=_sort_time_key)

    return {
        "source": f"edupage_rpc:{school}",
        "school": school_name,
        "timezone": timezone,
        "tt_num": tt_num,
        "days": day_names,
        "slots": slots,
        "entries": entries,
    }


def _fetch_timetable_uncached(config: EduPageConfig) -> dict[str, Any]:
    school = config.school.strip().lower()
    if not school:
        raise EduPageError("EduPage school slug is empty")

    year = config.year if config.year is not None else _infer_school_year()

    base_url = f"https://{school}.edupage.org/timetable/server"

    viewer_url = f"{base_url}/ttviewer.js?__func=getTTViewerData"
    viewer_response = _rpc_post(viewer_url, [None, year], config.timeout_seconds)
    viewer_root = viewer_response.get("r")
    if not isinstance(viewer_root, dict):
        raise EduPageError("Invalid getTTViewerData response")

    resolved_tt_num = config.tt_num
    if not resolved_tt_num:
        regular = viewer_root.get("regular")
        if not isinstance(regular, dict):
            raise EduPageError("Missing regular block in getTTViewerData response")
        default_tt_num = regular.get("default_num")
        if not default_tt_num:
            raise EduPageError("Missing default timetable number in getTTViewerData")
        resolved_tt_num = str(default_tt_num)

    regular_url = f"{base_url}/regulartt.js?__func=regularttGetData"
    regular_response = _rpc_post(regular_url, [None, str(resolved_tt_num)], config.timeout_seconds)
    return _decode_timetable_payload(
        school=school,
        timezone=config.timezone,
        tt_num=str(resolved_tt_num),
        raw=regular_response,
    )


def fetch_timetable(config: EduPageConfig) -> dict[str, Any]:
    cache_key = f"{config.school}|{config.year}|{config.tt_num}"
    now = time.time()

    with _CACHE_LOCK:
        cached = _CACHE.get(cache_key)
        if cached and now - cached[0] < config.cache_ttl_seconds:
            return deepcopy(cached[1])

    data = _fetch_timetable_uncached(config)

    with _CACHE_LOCK:
        _CACHE[cache_key] = (time.time(), data)

    return deepcopy(data)
