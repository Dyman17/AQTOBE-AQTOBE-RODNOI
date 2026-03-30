from __future__ import annotations

import os
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

_DB_LOCK = threading.Lock()
_DB_INITIALIZED = False


def _db_path() -> Path:
    raw = os.getenv("AUTH_DB_PATH", "").strip()
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent.parent / "data" / "auth.db"


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_auth_db() -> None:
    global _DB_INITIALIZED
    with _DB_LOCK:
        if _DB_INITIALIZED:
            return
        with _connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    role TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    linked_student_id TEXT,
                    linked_teacher_id TEXT,
                    class_id TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
                """
            )
            conn.commit()
        _DB_INITIALIZED = True


def create_user(account: dict[str, Any]) -> None:
    init_auth_db()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO users (
                user_id, role, display_name, email, password, linked_student_id, linked_teacher_id, class_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                account["user_id"],
                account["role"],
                account["display_name"],
                account["email"],
                account["password"],
                account.get("linked_student_id"),
                account.get("linked_teacher_id"),
                account.get("class_id"),
                account["created_at"],
            ),
        )
        conn.commit()


def get_user_by_email(email: str) -> dict[str, Any] | None:
    init_auth_db()
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    init_auth_db()
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def create_session(token: str, user_id: str, created_at: str) -> None:
    init_auth_db()
    with _connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, created_at),
        )
        conn.commit()


def get_session_user(token: str) -> dict[str, Any] | None:
    init_auth_db()
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT u.*
            FROM sessions s
            JOIN users u ON u.user_id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()
    return dict(row) if row else None


def count_users() -> int:
    init_auth_db()
    with _connect() as conn:
        row = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()
    return int(row["cnt"]) if row else 0

