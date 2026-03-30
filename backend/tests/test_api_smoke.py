def _quick_login(client, role: str) -> str:
    response = client.post("/login", json={"role": role})
    assert response.status_code == 200
    return response.json()["token"]


def _session_identity(client, role: str) -> tuple[str, dict]:
    token = _quick_login(client, role)
    me = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    return token, me.json()


def test_core_health_and_timetable(client):
    root = client.get("/")
    assert root.status_code == 200
    assert root.json()["status"] == "ok"

    health = client.get("/healthz")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    ready = client.get("/readyz")
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"
    assert ready.json()["checks"]["seed_students"] is True

    resp = client.get("/timetable")
    assert resp.status_code == 200
    data = resp.json()
    assert "entries" in data
    assert isinstance(data["entries"], list)


def test_register_login_parent_student_flow(client):
    student_resp = client.post(
        "/auth/register-student",
        json={
            "name": "Smoke Student",
            "class_id": "10A",
            "email": "smoke.student@aqbobek.kz",
            "password": "pass1234",
        },
    )
    assert student_resp.status_code == 200
    student_token = student_resp.json()["token"]

    me_student = client.get("/me", headers={"Authorization": f"Bearer {student_token}"})
    assert me_student.status_code == 200
    assert me_student.json()["role"] == "student"

    parent_resp = client.post(
        "/auth/register-parent",
        json={
            "name": "Smoke Parent",
            "email": "smoke.parent@aqbobek.kz",
            "password": "pass1234",
            "child_student_email": "smoke.student@aqbobek.kz",
        },
    )
    assert parent_resp.status_code == 200
    parent_token = parent_resp.json()["token"]

    me_parent = client.get("/me", headers={"Authorization": f"Bearer {parent_token}"})
    assert me_parent.status_code == 200
    assert me_parent.json()["role"] == "parent"


def test_teacher_admin_social_and_schedule(client):
    assert client.get("/teacher/early-warning?class_id=10A").status_code == 200
    assert client.get("/admin/metrics").status_code == 200

    admin_token = _quick_login(client, "admin")
    generated = client.post("/schedule/generate", json={}, headers={"Authorization": f"Bearer {admin_token}"})
    assert generated.status_code == 200
    payload = generated.json()
    assert payload["stats"]["total_entries"] > 0

    token = _quick_login(client, "student")
    post = client.post(
        "/social/feed",
        json={"content": "Smoke progress post"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert post.status_code == 200
    post_id = post.json()["id"]

    comment = client.post(
        f"/social/feed/{post_id}/comment",
        json={"text": "Smoke comment"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert comment.status_code == 200


def test_announcements_targeting(client):
    admin_token = _quick_login(client, "admin")
    student_token = _quick_login(client, "student")

    denied = client.post(
        "/announcements",
        json={
            "title": "Denied",
            "message": "Only admin can publish",
            "priority": "medium",
            "target_roles": ["student"],
            "target_classes": ["10A"],
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert denied.status_code == 403

    created = client.post(
        "/announcements",
        json={
            "title": "10A only",
            "message": "Custom note for class 10A students",
            "priority": "high",
            "target_roles": ["student"],
            "target_classes": ["10A"],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert created.status_code == 200
    created_id = created.json()["id"]

    visible_for_target = client.get("/announcements?role=student&class_id=10A")
    assert visible_for_target.status_code == 200
    assert created_id in {row["id"] for row in visible_for_target.json()}

    hidden_for_other_class = client.get("/announcements?role=student&class_id=11C")
    assert hidden_for_other_class.status_code == 200
    assert created_id not in {row["id"] for row in hidden_for_other_class.json()}

    hidden_for_other_role = client.get("/announcements?role=teacher&class_id=10A")
    assert hidden_for_other_role.status_code == 200
    assert created_id not in {row["id"] for row in hidden_for_other_role.json()}


def test_substitution_lifecycle_and_kiosk_projection(client):
    admin_token, admin_me = _session_identity(client, "admin")

    created = client.post(
        "/substitution/absence-requests",
        json={
            "school_id": "aqbobek",
            "teacher_id": "t_phy_1",
            "day": "Monday",
            "reason": "Sick leave",
            "submitted_by": "t_phy_1",
        },
    )
    assert created.status_code == 200
    created_data = created.json()
    request_id = created_data["request_id"]
    assert created_data["status"] == "pending"
    assert created_data["impacted_lessons"] > 0

    detail = client.get(f"/substitution/absence-requests/{request_id}")
    assert detail.status_code == 200
    lessons = detail.json()["proposal"]["lessons"]
    assert len(lessons) > 0
    assert "recommended" in lessons[0]

    decision = client.post(
        f"/substitution/absence-requests/{request_id}/decision",
        json={
            "decision": "approve",
            "approver_id": admin_me["user_id"],
            "approver_role": "admin",
            "comment": "Approved in smoke tests",
            "selected_options": {},
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert decision.status_code == 200
    assert decision.json()["status"] == "approved"

    teacher_notifications = client.get(
        "/substitution/notifications",
        params={"school_id": "aqbobek", "target_role": "teacher", "target_user_id": "t_phy_1"},
    )
    assert teacher_notifications.status_code == 200
    assert any(note["request_id"] == request_id for note in teacher_notifications.json())

    kiosk = client.get("/kiosk?school_id=aqbobek")
    assert kiosk.status_code == 200
    replacement_ids = {row["id"] for row in kiosk.json()["replacements"]}
    assert any(item.startswith(f"{request_id}:") for item in replacement_ids)


def test_admin_reset_demo_data(client):
    admin_token = _quick_login(client, "admin")
    student_token = _quick_login(client, "student")

    created_note = client.post(
        "/announcements",
        json={
            "title": "Temp note",
            "message": "Will be removed after reset",
            "priority": "medium",
            "target_roles": ["student", "teacher", "parent", "admin"],
            "target_classes": [],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert created_note.status_code == 200

    created_request = client.post(
        "/substitution/absence-requests",
        json={
            "school_id": "aqbobek",
            "teacher_id": "t_phy_1",
            "day": "Monday",
            "reason": "Temporary absence",
            "submitted_by": "t_phy_1",
        },
    )
    assert created_request.status_code == 200

    forbidden = client.post("/admin/reset-demo-data", headers={"Authorization": f"Bearer {student_token}"})
    assert forbidden.status_code == 403

    reset_response = client.post("/admin/reset-demo-data", headers={"Authorization": f"Bearer {admin_token}"})
    assert reset_response.status_code == 200
    payload = reset_response.json()
    assert payload["status"] == "ok"
    assert payload["substitution_state"] == {"absence_requests": 0, "notifications": 0}
    assert payload["stats"]["announcements"] == 2
    assert payload["stats"]["social_posts"] == 1
    assert payload["session"]["role"] == "admin"
    refreshed_token = payload["session"]["token"]
    me_after_reset = client.get("/me", headers={"Authorization": f"Bearer {refreshed_token}"})
    assert me_after_reset.status_code == 200
    assert me_after_reset.json()["role"] == "admin"

    requests_after = client.get("/substitution/absence-requests?school_id=aqbobek")
    assert requests_after.status_code == 200
    assert requests_after.json() == []
