# QUNAR - Deployment & Access Guide

This file documents how to run, deploy, and access the QUNAR backend, frontend, and admin tools.

## 1) Local Development

### Backend

```bash
cd qunar-fullstack/backend
uvicorn app.main:app --reload
```

- API base: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

### Frontend (Vite)

```bash
cd qunar-fullstack/frontend_main
npm install
npm run dev
```

- Frontend: http://localhost:8080

### Admin Panel (local static)

```bash
cd qunar-fullstack/admin
python -m http.server 5501
```

- Admin UI: http://127.0.0.1:5501

## 2) Production URLs

### Backend (Render)

- Base: https://qunar.onrender.com
- Docs: https://qunar.onrender.com/docs
- Health: https://qunar.onrender.com/health

### Frontend (Vercel)

- URL: https://qunar-six.vercel.app

## 3) Environment Variables

### Backend (Render)

Required:

```
SQLALCHEMY_DATABASE_URI=<Render Postgres internal URL>
SECRET_KEY=<strong-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=production
LOG_LEVEL=INFO
BACKEND_CORS_ORIGINS=["https://qunar-six.vercel.app"]
```

Optional (admin bootstrap, use once then remove):

```
ADMIN_BOOTSTRAP_TOKEN=<one-time-secret>
```

### Frontend (Vercel)

```
VITE_API_BASE_URL=https://qunar.onrender.com
```

## 4) Admin Bootstrap (one-time)

Endpoint (enabled only if `ADMIN_BOOTSTRAP_TOKEN` is set):

```
POST /api/v1/admin/bootstrap
```

Example:

```json
{
  "secret": "<ADMIN_BOOTSTRAP_TOKEN>",
  "email": "ddumanjembai@gmail.com",
  "password": "Duman2010,",
  "full_name": "Dyman17"
}
```

- This works only if **no admin exists yet**.
- Remove `ADMIN_BOOTSTRAP_TOKEN` after success.

## 5) Admin DB API (requires admin JWT)

```
GET /api/admin/dyman/tables
GET /api/admin/dyman/table/{table}?limit=50&offset=0
POST /api/admin/dyman/table/{table}
PATCH /api/admin/dyman/table/{table}/{id}
DELETE /api/admin/dyman/table/{table}/{id}
```

## 6) Normal User Flow

1. Register user (`/auth/register`)
2. Login (`/auth/login`)
3. Use access token for protected endpoints
4. Refresh token via `/auth/refresh`

Protected API examples:
- `/users/me`
- `/farms`
- `/plants`
- `/sensors`

## 7) Troubleshooting

- **401 on login**: user not created in the current DB (Render DB is separate from local).
- **CORS errors**: check `BACKEND_CORS_ORIGINS` in Render env.
- **Render build errors on 3.14**: use Python 3.11 via `backend/runtime.txt`.

## 8) Quick Scripts

- Run everything locally:

```bash
python qunar-fullstack/run_all.py
```

---

This file is intended to keep deployment and access steps in one place.
