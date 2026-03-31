from fastapi.testclient import TestClient

from app.main import app
from app.school_db import reload_school_db, reset_school_db
from app.substitution import reset_substitution_state


def test_registered_accounts_survive_backend_reload(monkeypatch, tmp_path):
    state_file = tmp_path / "runtime-state.json"
    monkeypatch.setenv("AQBOBEK_STATE_FILE", str(state_file))

    reset_school_db()
    reset_substitution_state()

    with TestClient(app) as client:
        student = client.post(
            "/auth/register-student",
            json={
                "name": "Persistent Student",
                "class_id": "10A",
                "email": "persistent.student@aqbobek.kz",
                "password": "pass1234",
            },
        )
        assert student.status_code == 200

        parent = client.post(
            "/auth/register-parent",
            json={
                "name": "Persistent Parent",
                "email": "persistent.parent@aqbobek.kz",
                "password": "pass1234",
                "child_student_email": "persistent.student@aqbobek.kz",
            },
        )
        assert parent.status_code == 200

    assert state_file.exists() is True

    reload_school_db()

    with TestClient(app) as client:
        student_login = client.post(
            "/auth/login",
            json={
                "email": "persistent.student@aqbobek.kz",
                "password": "pass1234",
            },
        )
        assert student_login.status_code == 200
        assert student_login.json()["role"] == "student"

        parent_login = client.post(
            "/auth/login",
            json={
                "email": "persistent.parent@aqbobek.kz",
                "password": "pass1234",
            },
        )
        assert parent_login.status_code == 200
        assert parent_login.json()["role"] == "parent"
