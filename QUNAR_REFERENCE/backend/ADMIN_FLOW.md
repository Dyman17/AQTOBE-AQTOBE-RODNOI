# QUNAR Admin DB Flow

Base prefix: `/api/admin/dyman` (admin-only)

## 1. Таблицы

`GET /api/admin/dyman/tables` — получить список всех таблиц БД.

Response:
```json
{
  "tables": ["users", "plots", "crops", "sensors", "sensor_data", "..."]
}
```

## 2. Строки таблицы

`GET /api/admin/dyman/table/{table}?limit=50&offset=0&order_by=id&order_dir=desc` — получить строки и схему таблицы.

Response:
```json
{
  "table": "users",
  "primary_key": "id",
  "columns": [
    {"name": "id", "type": "INTEGER", "nullable": false, "primary_key": true, "default": null}
  ],
  "rows": [{ "id": 1, "email": "admin@example.com" }],
  "limit": 50,
  "offset": 0,
  "total": 123
}
```

## 3. CRUD по строкам

`POST /api/admin/dyman/table/{table}` — создать новую строку.

Request body:
```json
{
  "column": "value"
}
```

Response:
```json
{
  "message": "Row created",
  "affected": 1,
  "id": 42
}
```

`PATCH /api/admin/dyman/table/{table}/{id}` — обновить строку.

Request body:
```json
{
  "column": "new value"
}
```

Response:
```json
{
  "message": "Row updated",
  "affected": 1,
  "id": 42
}
```

`DELETE /api/admin/dyman/table/{table}/{id}` — удалить строку.

Response:
```json
{
  "message": "Row deleted",
  "affected": 1,
  "id": 42
}
```

## 4. Поток действий на фронте

1. Фронт делает `GET /tables` → получает список таблиц → рендерит селектор.
2. Пользователь выбирает таблицу → `GET /table/{table}` → получает строки + схему → строит таблицу.
3. Добавление / редактирование / удаление → `POST` / `PATCH` / `DELETE` → обновление таблицы на фронте.
