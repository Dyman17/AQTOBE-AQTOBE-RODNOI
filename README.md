# Aqbobek Lyceum — Единый школьный портал (Итоговое ТЗ)

Этот файл — единый источник правды для финального ТЗ. Сюда фиксируем согласованные требования, критерии и решения, которые потом реализуем.

## 0. Быстрый статус (на 31.03.2026)
### Что уже реализовано
- Авторизация по ролям `student/teacher/parent/admin` + guest-режим.
- Account flow:
  - `register student` (email/class/password),
  - `register parent` c привязкой к email ученика,
  - `auth login` по email/password.
- Student analytics: `grades`, risk scoring (`/risk`), AI advice (`/ai-advice`).
- Timetable модуль на данных EduPage (`/timetable`) с фильтрацией.
- Fallback расписания: при недоступности EduPage автоматически используется mock-источник.
- Large seed data:
  - ~1800 учеников,
  - ~120 учителей,
  - много классов (7A-12D) и in-memory академические данные.
- Teacher Early Warning:
  - endpoint списка at-risk учеников,
  - one-click AI class report.
- Admin Intelligence:
  - school metrics,
  - announcement center с target roles/classes.
- Smart Schedule Generator:
  - генерация расписания (greedy+constraints),
  - валидация конфликтов,
  - change log.
- Realtime слой:
  - WebSocket канал `/ws/updates`,
  - live refresh в UI при ключевых событиях.
- Student-Parent collaborative layer:
  - общий social feed,
  - комментарии родителя к постам ученика,
  - portfolio items.
- Adaptive Substitution Engine:
  - создание заявок на отсутствие;
  - score-based варианты и fallback;
  - approve/reject;
  - уведомления.
- Kiosk Mode:
  - авто-ротация экранов;
  - fullscreen;
  - объявления / топ-ученики / замены / события.
- Demo Flow shortcuts:
  - one-click переходы `student -> teacher -> admin -> kiosk`.
- UI pass:
  - упрощенный минималистичный и более читаемый интерфейс.

### Что в фокусе до демо-финиша
- Дополировать UX расписания под максимально близкий вид к оригинальному EduPage (классы/учителя/кабинеты).
- Укрепить тестовый контур и сценарий перезапуска данных перед защитой.
- Микрополиш интерфейса по вашему финальному скриншоту/фидбеку.

### Навигация по документу
- `1-10`: продукт, роли, архитектура, позиционирование.
- `13`: что уже работает в текущем MVP.
- `14`: детальный рабочий spec по Substitution Engine.
- `15`: блоки работ и их текущий статус.

## 1. Цели и контекст
- Заказчик: Aqbobek Lyceum.
- Проблема: разрозненность данных успеваемости, мероприятий и достижений; ручная работа по расписанию.
- Цель: многоролевой портал + AI‑аналитика успеваемости + умная автоматизация процессов (включая динамическое расписание).

## 1.1 Value Proposition (Почему это важно)
- Снижение риска провала учеников за счёт раннего выявления (Early Warning System).
- Экономия времени администрации за счёт автоматической генерации расписания.
- Централизация всех школьных данных в единой системе.

Ожидаемый эффект:
- ↓ ручной работы администрации до 80–90%
- ↑ успеваемости за счёт персональных рекомендаций

## 2. Роли и доступы
- Ученик
- Учитель
- Родитель
- Администратор

## 3. MVP (обязательный функционал)
### Ученик
- Дашборд успеваемости (BilimClass API / Mock‑сервер).
- AI‑тьютор и предиктивная аналитика.
- Цифровое портфолио достижений.
- Геймификация (лидерборды, ачивки).

### Учитель
- Early Warning System (риски падения успеваемости).
- AI‑генерация отчетов по классу.

### Родитель
- Режим наблюдателя.
- Еженедельная AI‑выжимка и рекомендации.

### Администрация
- Глобальные дашборды по качеству образования.
- Центр уведомлений и таргетированная лента.
- Базовое создание расписания (лента/урок/пара/акад. час/мероприятие).

## 4. Hardcore: Smart Schedule
- Ввод ограничений: доступность учителей, кабинеты, ленты (параллельные группы).
- Автогенерация расписания без конфликтов.
- Динамическая перестройка при изменениях (болезнь учителя).
- Push‑уведомления об изменениях.

## 5. Kiosk Mode (интерактивная стенгазета)
- Автоскролл, крупная типографика.
- Без мыши/клавиатуры.
- Топ‑ученики дня, актуальные замены, анонсы.

## 6. Тех‑ограничения и стек
- Mock‑сервер BilimClass, желательно возможность подтягивать реальные оценки.
- AI‑компонент через LLM API (OpenAI/Gemini и др.).
- Нельзя использовать только LLM: нужны собственные алгоритмы/оценивание.

## 6.1 Data Sources
- Schedule data: real EduPage public timetable (RPC import, configurable school) via `GET /timetable` (guest accessible).
- Academic performance: Mock BilimClass-style endpoints (`/grades`, `/risk`, `/ai-advice`).
- Integration strategy: combine multiple sources; do not replace academic source with schedule-only source.

## 7. Критерии оценки (чек‑лист жюри)
- Ядро и UI/UX (25%).
- Глубина AI‑интеграции (25%).
- Модуль расписания (20%).
- Архитектура и Mock API (15%).
- Защита и бизнес‑логика (15%).

## 8. Final Decisions
### Stack
- Frontend: React + Vite + Tailwind
- Backend: FastAPI (Python)
- Database: PostgreSQL (SQLite for demo)
- Realtime: WebSockets

### Architecture
- Single web application with role-based access (student, teacher, parent, admin).
- Separate `/kiosk` mode (fullscreen).

### AI Component
- Custom risk scoring algorithm:
  - Grade average
  - Performance trend
  - Attendance
  - Topic difficulty weights
- Output:
  - Risk score (0–100)
  - Weak knowledge areas
- LLM (OpenAI):
  - Personalized recommendations
  - Student feedback explanation
  - Teacher reports generation

### Schedule Engine (Extended)
- Greedy initial allocation.
- Constraint validation (teachers, rooms, classes).
- Local conflict resolution (light backtracking).
- Supports:
  - Lessons, pairs, academic hours, events
  - Parallel group sessions ("ленты")
- Dynamic behavior:
  - Automatic re-generation when constraints change
  - Real-time updates via WebSockets
- Demo scenario:
  - Teacher marked as unavailable -> schedule auto-updates -> users receive notifications

### Mock API
- Simulated BilimClass API with realistic data structure.
- Dynamic mock data generation.

### Priorities
- Priority 1: AI predictive analytics (student focus).
- Priority 2: Smart schedule generation and dynamic updates.
- Priority 3: Admin control panel.
- Secondary: Teacher analytics; parent summaries.
- Optional: Kiosk mode; gamification.

### Delivery Strategy
- Build a fast skeleton of all modules first (login/roles, dashboards, mock data, basic schedule).
- Deep‑polish 1–2 killer features: AI prediction (student) and Smart Schedule (admin).
- Then UI polish and remaining roles.

## 9. Demo Scenario
1. Student logs in:
   - Sees risk prediction for a subject
   - Gets AI-generated recommendations
2. Teacher logs in:
   - Sees list of at-risk students
3. Admin:
   - Marks teacher as unavailable
   - System automatically regenerates schedule
4. Kiosk Mode:
   - Displays updated schedule and announcements

## 10. Positioning
This is not just a school portal.

It is an AI-powered decision support system for education:
- Predicting student performance
- Automating school operations
- Improving overall educational quality

## 11. Нерешенные вопросы
- Какие минимальные данные нужны для Parent weekly summary в MVP (без лишних персональных данных)?
- Какие KPI выводим в Admin dashboard в финальной демо-версии (3-5 метрик)?
- Какие ограничения обязательно включаем в первую версию Smart Schedule Generator (MVP-core)?

## 12. План реализации (черновик)
- Step 1: Skeleton (fast and minimal).
- Step 2: AI prediction (deep, demo‑ready).
- Step 3: Smart schedule + dynamic updates.
- Step 4: UI polish (key screens).
- Step 5: Remaining features by time left.

## 13. MVP Skeleton (реализовано)
### Backend (FastAPI)
- `POST /login` (fake auth по роли: student/teacher/parent/admin)
- `POST /auth/register-student` (регистрация ученика по email/class/password)
- `POST /auth/register-parent` (регистрация родителя + привязка к email ученика)
- `POST /auth/login` (вход по email/password)
- `GET /me` (возвращает роль по bearer token)
- `GET /healthz` / `GET /readyz` (production health/readiness probes)
- `GET /_future/slots` (реестр зарезервированных API-слотов под будущую разработку)
- `GET /db/stats` (масштаб seed-данных)
- `GET /grades` (реалистичные mock-данные)
- `GET /schedule` (mock schedule JSON)
- `GET /timetable` (EduPage live feed via RPC; при ошибке auto-fallback на mock)
- `POST /risk` (custom risk scoring 0-100)
- `POST /ai-advice` (OpenAI при наличии ключа, иначе fallback)
- `GET /parent/weekly-summary` (observer-выжимка и рекомендации для родителя)
- `GET /teacher/early-warning` (список at-risk учеников по классу)
- `POST /teacher/class-report` (one-click AI report по классу)
- `GET /admin/metrics` (агрегированные метрики школы + class heatmap)
- `POST /admin/reset-demo-data` (reset demo-state: seed данные + substitution state; только admin)
- `GET /announcements` / `POST /announcements` (таргетированные объявления; `POST` — только admin)
- `POST /schedule/generate` / `POST /schedule/validate` / `GET /schedule/changes` (ядро smart schedule; `POST` — только admin)
- `GET /social/feed` / `POST /social/feed` / `POST /social/feed/{post_id}/comment` (совместная student-parent лента)
- `GET /portfolio/items` / `POST /portfolio/items` / `POST /portfolio/verify/{item_id}` (портфолио и верификация)
- `GET /gamification/leaderboard` (improvement-first рейтинг)
- `GET /kiosk` (данные для стенгазеты: анонсы, топ-ученики, замены, события)
- `GET /ws/updates` (WebSocket realtime канал)
- `GET /substitution/schools` (каталог школ)
- `POST /substitution/absence-requests` (заявка на отсутствие)
- `GET /substitution/absence-requests` (лист заявок по школе)
- `GET /substitution/absence-requests/{request_id}` (детали + варианты)
- `POST /substitution/absence-requests/{request_id}/decision` (approve/reject только от авторизованного approver; payload должен совпадать с сессией)
- `GET /substitution/notifications` (уведомления для admin/teacher)

### Frontend (React + Vite)
- Экран входа с выбором роли (student/teacher/parent/admin)
- Экран account auth:
  - login по email/password,
  - регистрация student,
  - регистрация parent с привязкой к student email.
- Guest mode (без авторизации) с доступом к странице расписания
- Общая страница расписания (доступна и гостю, и авторизованным)
- Kiosk Mode:
  - полноэкранный режим для hallway display
  - автопереключение слайдов (announcements/top students/replacements/events)
  - горячие клавиши: `←`, `→`, `F`
- Student dashboard:
  - список предметов
  - риск с цветовой индикацией (red/yellow/green)
  - кнопка "Получить совет"
- Student/Parent shared wall:
  - social posts,
  - комментарии,
  - portfolio items.
- Teacher analytics:
  - early warning table,
  - one-click class report.
- Admin analytics:
  - school metrics,
  - announcement publishing,
  - schedule generation and change log.
- Teacher/Admin: базовый dashboard с расписанием (JSON view)
- Adaptive Substitution Lab:
  - создание заявки на отсутствие
  - просмотр scoring-вариантов и альтернатив
  - approve/reject с выбором альтернативных option_id
  - просмотр уведомлений admin/teacher

### Quick Start
```bash
# Backend
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

PowerShell note (Windows): если политика выполнения блокирует `npm.ps1`, используйте `npm.cmd install` и `npm.cmd run dev`.

Сброс демо-данных перед защитой:
```bash
cd backend
python scripts/reset_demo_data.py
```

Переменные окружения:
- `backend/.env.example` -> `OPENAI_API_KEY`, `OPENAI_MODEL`
- `frontend/.env.example` -> `VITE_API_URL`
- Frontend API/architecture guide: `frontend/README.md`
- Live demo runbook: `DEMO_RUNBOOK.md`

Пример запроса Kiosk:
```bash
curl "http://localhost:8000/kiosk?school_id=aqbobek"
```

Проверка readiness:
```bash
curl "http://localhost:8000/healthz"
curl "http://localhost:8000/readyz"
```

## 14. Adaptive Substitution Engine (Detailed Working Spec)
Этот раздел является рабочей спецификацией фичи. Во время разработки и ревью ориентироваться на него как на source of truth.

### 14.1 Product Goal
Цель фичи:
- Не просто найти свободного преподавателя.
- Минимизировать disruption (хаос) в учебном процессе при отсутствии учителя.
- Сохранить непрерывность уроков с минимальным ущербом для расписания, учеников и нагрузки коллег.

Ключевая формулировка для команды:
- "Система оптимизирует день школы, а не заполняет пустой слот любой ценой."

### 14.2 What Is Considered "Good Decision"
Решение считается качественным, если:
- Урок остается в исходный день/слот и ведется подходящим преподавателем.
- Замена назначена на учителя, который уже находится в школе рядом по времени.
- Не создаются лишние окна и перегрузка у преподавателей.
- Согласование проходит через ответственного руководителя (human-in-the-loop).

### 14.3 Scope and Non-Goals (MVP)
В scope:
- Заявка на отсутствие.
- Автоматическая генерация вариантов замены.
- Scoring вариантов и рекомендация.
- Подтверждение/отклонение руководителем.
- Уведомления участникам процесса.
- Изоляция по `school_id` (поддержка нескольких школ).

Вне scope MVP:
- Полная автоматическая перестройка всей недели.
- Интеграция с внешними кадровыми системами.
- Юридически значимый электронный документооборот.

### 14.4 Domain Model (MVP)
Сущности:
- `School`: школа/тенант.
- `Teacher`: преподаватель с предметами и лимитом нагрузки.
- `Lesson`: урок (день, слот, класс, предмет, преподаватель, кабинет).
- `AbsenceRequest`: заявка на отсутствие.
- `SubstitutionOption`: вариант решения по конкретному уроку.
- `Notification`: уведомление для роли/пользователя.

Ключевые связи:
- Все сущности фичи обязаны иметь `school_id`.
- Любой запрос без корректного `school_id` отклоняется.

### 14.5 Request Lifecycle
Статусы заявки:
1. `pending`:
   - заявка создана учителем;
   - система сгенерировала план (recommended + alternatives);
   - ожидается решение руководителя.
2. `approved`:
   - выбран итоговый план (по умолчанию recommended, либо вручную alternative).
3. `rejected`:
   - отсутствие не согласовано; план не применяется.

Переходы:
- `pending -> approved`
- `pending -> rejected`
- Повторное решение по уже закрытой заявке запрещено.

### 14.6 Optimization Objective and Scoring
Главная оптимизационная цель:
- максимизировать качество замены;
- минимизировать локальный и системный disruption.

Базовый scoring (MVP):
- Предмет:
  - `+50` exact match;
  - `+25` related match.
- Присутствие в школе:
  - `+30` если есть соседний слот (`already in school nearby`);
  - `+15` если есть уроки в этот день;
  - `-25` если в школе в этот день не запланирован.
- Влияние на окна:
  - `+10` если новые окна не создаются;
  - `-10 * delta_gaps` при появлении дополнительных окон.
- Нагрузка:
  - `+20` если дневная нагрузка < 4;
  - `-20` если высокая.
- Знакомство с классом:
  - `+15` если учитель уже ведет этот класс.
- Fairness:
  - `-8` за каждую уже назначенную замену в этом дне.
- Ограничения:
  - вариант исключается, если `projected_load > max_daily_lessons`.

Принцип выбора:
- Для каждого затронутого урока строится набор кандидатов и fallback-вариантов.
- Варианты сортируются по score.
- Первый вариант становится `recommended`.
- Следующие варианты становятся `alternatives`.

### 14.7 Candidate Selection Rules
Кандидат допустим, если:
- Имеет exact/related компетенцию по предмету.
- Свободен в нужный слот.
- Не превышает лимит дневной нагрузки.

Кандидат недопустим, если:
- Уже занят в тот же день/слот.
- Не имеет предметной совместимости.
- Превышает лимит нагрузки.

### 14.8 Fallback Ladder
Если оптимальная замена невозможна, применяются fallback уровни:
1. `substitute_teacher`:
   - прямая замена подходящим учителем.
2. `reschedule`:
   - перенос урока на ближайший доступный слот/день с минимальным конфликтом.
3. `self_study`:
   - самостоятельная работа с шаблонным заданием.

Правило:
- Система никогда не "ломается" без ответа.
- На каждый урок всегда должен быть хотя бы один исполнимый вариант.

### 14.9 Human-in-the-Loop Governance
Роли, которые могут принять решение:
- `admin`
- `director`
- `deputy`

Поток:
1. Учитель отправляет заявку (`pending`).
2. Руководитель получает уведомление и открывает предложения системы.
3. Руководитель:
   - подтверждает рекомендацию;
   - либо вручную выбирает альтернативные `option_id` по урокам;
   - либо отклоняет заявку.
4. Система фиксирует решение и рассылает уведомления.

Почему это важно:
- Решение остается контролируемым и объяснимым.
- Алгоритм помогает, но критичные решения принимает ответственный человек.

### 14.10 Notification Matrix
События и получатели:
- `Absence request pending approval` -> `target_role=admin`
- `Absence request approved` -> `target_role=teacher`, `target_user_id=teacher_id`
- `Absence request rejected` -> `target_role=teacher`, `target_user_id=teacher_id`

Требования:
- Уведомления фильтруются по `school_id`.
- Для учителя доступна фильтрация по `target_user_id`.

### 14.11 Multi-School (Tenant Isolation)
Текущий MVP уже реализует multi-school через `school_id`.

Правила изоляции:
- Все выборки ограничиваются текущей школой.
- Никакие заявки/уведомления не должны пересекать границы школ.
- В перспективе это позволяет развернуть SaaS на сеть школ.

### 14.12 API Contract (MVP)
Каталог школ:
- `GET /substitution/schools`

Создать заявку:
- `POST /substitution/absence-requests`
- Body:
```json
{
  "school_id": "aqbobek",
  "teacher_id": "t_phy_1",
  "day": "Monday",
  "reason": "Sick leave",
  "submitted_by": "t_phy_1"
}
```

Список заявок:
- `GET /substitution/absence-requests?school_id=aqbobek&status=pending`

Детали заявки:
- `GET /substitution/absence-requests/{request_id}`
- Возвращает:
  - `proposal.summary`
  - `proposal.lessons[].recommended`
  - `proposal.lessons[].alternatives`

Решение руководителя:
- `POST /substitution/absence-requests/{request_id}/decision`
- Body:
```json
{
  "decision": "approve",
  "approver_id": "admin_1",
  "approver_role": "admin",
  "comment": "Approved by deputy",
  "selected_options": {
    "aq_l2": "aq_l2-sub-t_math_1"
  }
}
```

Уведомления:
- `GET /substitution/notifications?school_id=aqbobek&target_role=admin`
- `GET /substitution/notifications?school_id=aqbobek&target_role=teacher&target_user_id=t_phy_1`

### 14.13 Frontend Test Panel (MVP)
В минимальном фронте для проверки системы реализован `Adaptive Substitution Lab`:
- Создание absence request.
- Просмотр очереди заявок с фильтром.
- Просмотр детального плана и score-оснований.
- Выбор альтернатив по урокам.
- Approve/Reject от имени `admin/director/deputy`.
- Просмотр admin/teacher уведомлений.

### 14.14 Demo Flow (Exact Script)
Демонстрация на защите:
1. Открыть `Substitution Lab`.
2. Выбрать `school_id=aqbobek`.
3. Создать заявку:
   - `teacher_id=t_phy_1`
   - `day=Monday`
4. Показать, что система предлагает не "любого свободного", а приоритетно того, кто уже в школе рядом по слотам.
5. Открыть альтернативы для одного урока и вручную выбрать другой вариант.
6. Выполнить `Approve` от `admin`.
7. Показать уведомления:
   - у администратора есть pending/processed история;
   - у учителя есть результат согласования.

### 14.15 Working Checklist (Do Not Drift)
Перед каждым изменением проверять:
- Эта правка снижает disruption или просто заполняет слот?
- Учитывается ли критерий "учитель уже в школе"?
- Нет ли роста окон/перегруза без необходимости?
- Остался ли human-in-the-loop (решение не делается silently)?
- Сохраняется ли tenant isolation по `school_id`?
- Демо-сценарий по шагам все еще воспроизводим вручную?

Если ответ "нет" хотя бы на один пункт:
- правка не считается завершенной.

## 15. Оставшиеся задачи (блоки работ)
Ниже backlog разбит на независимые блоки, чтобы идти по одному и закрывать демонстрационно.

### Блок A — Demo Polish и единый UX (быстрый выигрыш)
Статус:
- `in_progress` (базовые UX-правки уже внедрены).

Цель:
- сделать цельный пользовательский путь для защиты (без "пустых" экранов и технических шероховатостей).

Задачи:
- унифицировать тексты и метки по всем вкладкам (единый тон и терминология).
- добавить пустые/ошибочные/loading состояния для всех ключевых экранов.
- улучшить последовательность демо-переходов: student -> teacher -> admin -> kiosk.

Критерий готовности:
- демо-поток проходит без ручных объяснений "это пока заглушка".

### Блок B — Parent MVP (observer mode + summary)
Статус:
- `done (MVP)` — роль `parent` и weekly summary endpoint реализованы.

Цель:
- закрыть обязательную роль родителя в MVP.

Задачи:
- backend: добавить роль `parent` в auth-модель.
- backend: endpoint weekly summary (на mock-данных + AI текст).
- frontend: экран родителя с кратким статусом и actionable рекомендацией.

Критерий готовности:
- есть отдельный вход/режим родителя и стабильный еженедельный summary.

### Блок C — Teacher Early Warning как отдельный продуктовый сценарий
Статус:
- `done (MVP)` — endpoint ранжирования риска + one-click class report + teacher UI.

Цель:
- показать ценность для учителя не только через общую ленту.

Задачи:
- backend: endpoint списка at-risk учеников класса с объяснением факторов.
- frontend: таблица/карточки рисков с приоритетом вмешательства.
- backend/frontend: one-click AI class report.

Критерий готовности:
- учитель за 1 экран видит "кто в риске, почему, что делать".

### Блок D — Admin Intelligence и таргетированные объявления
Статус:
- `done (MVP)` — admin metrics + таргетированные announcements + UI публикации.

Цель:
- усилить управленческий слой для администрации.

Задачи:
- backend: агрегированные метрики по школе (риск, посещаемость, динамика).
- backend: CRUD объявлений с target-аудиторией (роль/класс).
- frontend: admin dashboard + публикация объявлений.
- связать объявления с Kiosk и role-based лентами.

Критерий готовности:
- админ может опубликовать объявление и увидеть его в нужных каналах.

### Блок E — Smart Schedule Generator (MVP-core)
Статус:
- `done (MVP)` — генерация, валидация и change log расписания реализованы.

Цель:
- добавить именно генерацию расписания, не только substitution.

Задачи:
- описать модель ограничений (учитель, кабинет, класс, слот, ленты).
- реализовать greedy генератор + conflict validator.
- добавить локальное разрешение конфликтов (light backtracking).
- backend API для запуска генерации и получения итогового плана.

Критерий готовности:
- система строит валидное базовое расписание без конфликтов на mock-данных.

### Блок F — Realtime слой и оперативные обновления
Статус:
- `done (MVP)` — WebSocket `/ws/updates` и live refresh ключевых экранов.

Цель:
- сделать обновления живыми для критичных действий.

Задачи:
- WebSocket канал для substitution decisions и расписания.
- push обновление Kiosk данных после approve/reject.
- frontend подписка и отображение обновлений без ручного refresh.

Критерий готовности:
- после решения по заявке замены UI/Kiosk обновляются автоматически.

### Блок G — Надежность, тесты, подготовка к защите
Статус:
- `in_progress` — добавлены smoke тесты API и runbook; расширяем покрытие перед финалом.

Цель:
- снизить риск поломок во время демо.

Задачи:
- добавить smoke/integration тесты по ключевым API.
- добавить фиксированные demo datasets и reset-сценарий.
- оформить короткий runbook для запуска и сценария защиты.

Критерий готовности:
- система поднимается по инструкции и стабильно отрабатывает демо-сценарий.

## 16. Порядок выполнения блоков
Рекомендуемый порядок:
1. Блок A
2. Блок B
3. Блок C
4. Блок D
5. Блок F
6. Блок E
7. Блок G

Принцип:
- закрываем блок полностью;
- фиксируем готовность по критерию;
- только потом переходим к следующему.

## 17. Alignment с BASED_README.docx
Проверка выполнена по `BASED_README.docx` (31.03.2026). В текущем MVP покрыты ключевые пункты blueprint:
- Explainable deterministic analytics (`risk`, teacher early warning, parent summary).
- Targeted communication (`announcements` с role/class targeting).
- Schedule intelligence (`generate/validate/changes` + substitution repair).
- Live surfaces (kiosk, realtime websocket updates, change events).
- Motivation and evidence (`gamification/leaderboard`, portfolio items + verify).
- Student-parent совместный operational loop (shared feed и комментарии в двух вкладках).

Осталось дополировать до финала:
- schedule UI ближе к оригинальному EduPage (визуально и UX-wise),
- расширить тесты beyond smoke,
- финальный demo script timing.
