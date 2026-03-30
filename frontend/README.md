# Frontend Integration Guide

This document is the frontend source of truth for the current MVP.
Use it when extending UI, integrating with backend, or onboarding a new frontend engineer.

## 1. Purpose

Frontend responsibilities:
- Guest mode (no auth) and role login mode.
- Account auth mode (register/login by email with student-parent linkage).
- Student analytics UI (`grades`, `risk`, `ai-advice`).
- Parent observer UI (`/parent/weekly-summary`).
- Timetable page available in both guest and authorized modes.
- Kiosk mode wall display (auto-rotating fullscreen slides).
- Operations UI for non-student roles (`schedule`).
- Adaptive Substitution Engine operator panel:
  - absence request creation
  - request queue and detail view
  - option selection per lesson
  - approve/reject decision
  - notifications feed
- Teacher early warning + class report UI.
- Admin metrics + announcements + schedule generation UI.
- Shared student-parent social feed and portfolio UI.

## 2. Stack

- React + Vite
- Plain CSS (single source: `src/styles.css`)
- `fetch`-based API client (`src/api.js`)

## 3. Project Structure

```text
frontend/
  src/
    api.js                # backend API wrapper
    App.jsx               # main dashboard shell + student/ops views
    SubstitutionLab.jsx   # substitution workflow test panel
    styles.css            # visual system and responsive styles
    main.jsx              # app bootstrap
```

## 4. Environment

Required env var:
- `VITE_API_URL`

Example:

```env
VITE_API_URL=https://your-backend.onrender.com
```

If not provided, frontend defaults to:
- `http://localhost:8000`

## 5. Backend API Contract (Used by Frontend)

### Auth and Profile

1) `POST /login`
- Request:
```json
{ "role": "student" }
```
- Response:
```json
{ "token": "uuid", "role": "student" }
```

2) `GET /me`
- Header: `Authorization: Bearer <token>`
- Response:
```json
{ "role": "student" }
```

Allowed roles:
- `student`
- `teacher`
- `parent`
- `admin`

### Student Intelligence

3) `GET /grades`
- Response:
```json
{
  "student": "Duman",
  "subjects": [
    {
      "name": "Physics",
      "grades": [5, 4, 3, 3],
      "attendance": 0.7,
      "topics": ["Kinematics", "Forces"]
    }
  ]
}
```

4) `POST /risk`
- Request:
```json
{
  "subject": "Physics",
  "grades": [5, 4, 3, 3],
  "attendance": 0.7
}
```
- Response:
```json
{
  "subject": "Physics",
  "risk": 70,
  "level": "high"
}
```

5) `POST /ai-advice`
- Request:
```json
{
  "subject": "Physics",
  "grades": [5, 4, 3, 3],
  "attendance": 0.7,
  "risk": 70
}
```
- Response:
```json
{
  "subject": "Physics",
  "risk": 70,
  "advice": "text",
  "source": "fallback"
}
```

6) `GET /parent/weekly-summary`
- Response:
```json
{
  "week_label": "Current week",
  "child_name": "Duman",
  "class_id": "10A",
  "average_grade": 3.83,
  "average_attendance": 0.813,
  "risk_score": 37,
  "risk_level": "medium",
  "strong_subjects": ["Mathematics"],
  "attention_subjects": ["Physics", "History"],
  "summary": "text",
  "recommendation": "text",
  "source": "fallback",
  "generated_at": "2026-03-30T..."
}
```

### Timetable (Public/Guest)

7) `GET /timetable`
- No auth required.
- Backend source: EduPage RPC by default (`TIMETABLE_SOURCE=edupage`), with automatic fallback to mock on remote failure.
- Supports optional query params:
  - `day` (`Monday`...`Friday`)
  - `class_id` (e.g. `10A`)
  - `teacher` (partial name match)
- Response:
```json
{
  "source": "edupage_rpc:nisaktau",
  "school": "NIS Aktau",
  "timezone": "Asia/Almaty",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "entries": [
    {
      "day": "Monday",
      "slot": "09:25",
      "class_id": "10A",
      "subject": "Physics",
      "teacher": "Aidana Sarsen",
      "room": "Lab-1"
    }
  ]
}
```

### Operations (Authorized)

8) `GET /schedule?role=admin`
- Response shape depends on role:
  - `lessons[]` for teacher/student
  - `events[]` for admin

### Kiosk Mode (Guest + Authorized)

9) `GET /kiosk?school_id=aqbobek`
- Response includes:
  - `announcements[]`
  - `top_students[]`
  - `replacements[]`
  - `events[]`
- Frontend behavior:
  - Auto-rotate slides every 9s
  - Refresh data feed every 45s

### Additional APIs (Current Build)
- `POST /auth/register-student`
- `POST /auth/register-parent`
- `POST /auth/login`
- `GET /healthz`, `GET /readyz`
- `GET /teacher/early-warning`
- `POST /teacher/class-report`
- `GET /admin/metrics`
- `POST /admin/reset-demo-data` (admin-only reset for repeatable demos)
- `GET /announcements`, `POST /announcements` (`POST` requires admin bearer token)
- `POST /schedule/generate`, `POST /schedule/validate`, `GET /schedule/changes` (`POST` requires admin bearer token)
- `GET /social/feed`, `POST /social/feed`, `POST /social/feed/{post_id}/comment`
- `GET /portfolio/items`, `POST /portfolio/items`, `POST /portfolio/verify/{item_id}`
- `GET /gamification/leaderboard`
- `GET /db/stats`
- `GET /ws/updates` (WebSocket realtime events)

### Adaptive Substitution Engine

10) `GET /substitution/schools`
- Response:
```json
[{ "id": "aqbobek", "name": "Aqbobek Lyceum" }]
```

11) `POST /substitution/absence-requests`
- Request:
```json
{
  "school_id": "aqbobek",
  "teacher_id": "t_phy_1",
  "day": "Monday",
  "reason": "Sick leave",
  "submitted_by": "t_phy_1"
}
```

12) `GET /substitution/absence-requests?school_id=aqbobek&status=pending`
- Response: list of request summaries.

13) `GET /substitution/absence-requests/{request_id}`
- Response includes:
  - `proposal.summary`
  - `proposal.lessons[].recommended`
  - `proposal.lessons[].alternatives`

14) `POST /substitution/absence-requests/{request_id}/decision`
- Requires bearer token of approver (`admin` in current MVP build).
- Request:
```json
{
  "decision": "approve",
  "approver_id": "demo_admin",
  "approver_role": "admin",
  "comment": "Approved",
  "selected_options": {
    "aq_l2": "aq_l2-sub-t_math_1"
  }
}
```

15) `GET /substitution/notifications?school_id=aqbobek&target_role=admin`

16) `GET /substitution/notifications?school_id=aqbobek&target_role=teacher&target_user_id=t_phy_1`

## 6. Current UI Mapping

`App.jsx`:
- Login shell with guest entry.
- Global timetable page (`schedule` tab) available for both modes.
  - Weekly matrix format: 10 lesson rows x 5 weekday columns.
  - Matrix cells are filled from `GET /timetable` data.
- Topbar shows live system status: API health probe, WebSocket connection state, and last sync timestamp.
- Student dashboard with metrics + subject cards + risk tags.
- Parent dashboard with weekly summary and recommendation.
- Admin controls include smart schedule generation and demo-data reset action.
- Non-student operations snapshot.
- Kiosk tab with fullscreen toggle, auto-rotation, and keyboard controls.
- Container for `SubstitutionLab`.

`SubstitutionLab.jsx`:
- Step 1: create absence request.
- Step 2: request queue + filters.
- Step 3: proposal detail + option selector + approve/reject.
- Step 4/5: admin and teacher notification feeds.

## 7. Frontend Behavior Rules

- Never hardcode backend URL in components. Use `VITE_API_URL`.
- On auth bootstrap failure, clear token and role from localStorage.
- Guest mode must still provide timetable page.
- When request status is not `pending`, option selectors and decision actions must be disabled.
- Keep the `school_id` visible in operator flows to avoid tenant confusion.
- Always show error text from API when available.

## 8. Deployment Notes

### Backend (Render)
- Deploy FastAPI service.
- Ensure public URL is stable.
- CORS should allow your Vercel domain (or `*` during MVP).

### Frontend (Vercel)
- Root: `frontend/`
- Build command: `npm run build`
- Output directory: `dist`
- Env var:
  - `VITE_API_URL=https://<render-service>.onrender.com`

## 9. Handoff Checklist for Future Frontend Work

- Confirm all endpoints in section 5 are reachable from target environment.
- Validate substitution flow end-to-end:
  - create request
  - open details
  - choose option
  - approve
  - verify notifications
- Keep UI copy and labels aligned with backend field names (`school_id`, `request_id`, `selected_options`).
- Preserve mobile behavior for 360-430 px viewport widths.
