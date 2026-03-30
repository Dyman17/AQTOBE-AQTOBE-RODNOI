# Aqbobek OS Demo Runbook

## 1) Start services
```bash
# backend
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# frontend
cd frontend
npm install
npm run dev
```

PowerShell note (Windows): if execution policy blocks `npm.ps1`, run `npm.cmd install` and `npm.cmd run dev`.

## 1.1) Reset baseline before each defense run
Use one of the options below right before the live demo:

```bash
cd backend
python scripts/reset_demo_data.py
```

Or from UI:
- Login as `admin`.
- Open `Analytics` -> `Smart Schedule Engine`.
- Click `Reset demo data`.

## 2) Demo account options
- Quick role login: use role buttons (`student`, `teacher`, `parent`, `admin`).
- Real account flow:
  - Register student (email + class).
  - Open second browser tab.
  - Register parent linked to student email.
  - Login in each tab and show shared social feed.

## 3) Recommended live script (5-7 minutes)
1. Student tab:
   - Open `Analytics`.
   - Show risk cards and AI advice.
   - Add social post + portfolio item.
2. Parent tab:
   - Login as linked parent.
   - Open `Analytics`.
   - Show weekly summary and same shared feed.
   - Add parent comment under student post.
3. Teacher:
   - Open early warning and generate class report.
4. Admin:
   - Publish targeted announcement.
   - Generate smart schedule.
5. Kiosk:
   - Show announcement/top students/replacements/events auto-rotation.

## 4) Recovery plan if live source fails
- `/timetable` auto-fallbacks to mock data.
- UI shows fallback banner and remains functional.

## 5) Smoke checks
```bash
cd backend
python -m pytest -q
```

```bash
curl "http://localhost:8000/healthz"
curl "http://localhost:8000/readyz"
```
