"""
QUNAR Admin Database Endpoints
Admin-only access to list, view, and mutate database tables.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import MetaData, Table, func, inspect, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.user import User
from app.schemas.admin import ActionResponse, TableDataResponse, TableListResponse, TableColumn

router = APIRouter(prefix="/api/admin/dyman", tags=["Admin DB"])


def _get_inspector(db: Session):
    return inspect(db.bind)


def _get_tables(db: Session) -> list[str]:
    inspector = _get_inspector(db)
    return inspector.get_table_names(schema="public")


def _get_table(db: Session, table_name: str) -> Table:
    if table_name not in _get_tables(db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
    metadata = MetaData()
    return Table(table_name, metadata, autoload_with=db.bind)


def _get_pk_column(db: Session, table_name: str) -> str | None:
    inspector = _get_inspector(db)
    pk = inspector.get_pk_constraint(table_name, schema="public")
    cols = pk.get("constrained_columns") if pk else None
    if not cols:
        return None
    if len(cols) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Composite primary keys are not supported",
        )
    return cols[0]


def _coerce_value(col: Any, value: Any) -> Any:
    if value is None:
        return None
    if value == "":
        return None
    try:
        py_type = col.type.python_type
    except Exception:
        return value

    try:
        if py_type is bool:
            if isinstance(value, str):
                return value.strip().lower() in {"1", "true", "yes", "on"}
            return bool(value)
        if py_type is int:
            return int(value)
        if py_type is float:
            return float(value)
        if py_type is datetime:
            if isinstance(value, str):
                return datetime.fromisoformat(value)
        if py_type is date:
            if isinstance(value, str):
                return date.fromisoformat(value)
    except Exception:
        return value

    return value


def _columns_info(db: Session, table_name: str) -> list[TableColumn]:
    inspector = _get_inspector(db)
    columns = inspector.get_columns(table_name, schema="public")
    pk_col = _get_pk_column(db, table_name)
    result: list[TableColumn] = []
    for col in columns:
        result.append(
            TableColumn(
                name=col["name"],
                type=str(col["type"]),
                nullable=bool(col.get("nullable", True)),
                primary_key=col["name"] == pk_col,
                default=str(col.get("default")) if col.get("default") is not None else None,
            )
        )
    return result


@router.get("/tables", response_model=TableListResponse)
async def list_tables(
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    tables = _get_tables(db)
    return TableListResponse(tables=tables)


@router.get("/table/{table_name}", response_model=TableDataResponse)
async def get_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order_by: str | None = Query(None),
    order_dir: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    table = _get_table(db, table_name)
    columns_info = _columns_info(db, table_name)
    pk_col = _get_pk_column(db, table_name)

    order_column = table.c.get(order_by) if order_by else None
    if order_column is None:
        order_column = table.c.get(pk_col) if pk_col else list(table.c)[0]

    stmt = select(table).order_by(order_column.asc() if order_dir == "asc" else order_column.desc())
    stmt = stmt.offset(offset).limit(limit)
    rows = db.execute(stmt).mappings().all()
    total = db.execute(select(func.count()).select_from(table)).scalar() or 0

    return TableDataResponse(
        table=table_name,
        primary_key=pk_col,
        columns=columns_info,
        rows=jsonable_encoder([dict(row) for row in rows]),
        limit=limit,
        offset=offset,
        total=total,
    )


@router.post("/table/{table_name}", response_model=ActionResponse)
async def create_row(
    request: Request,
    table_name: str,
    payload: dict[str, Any] = Body(...),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    table = _get_table(db, table_name)
    pk_col = _get_pk_column(db, table_name)

    data: dict[str, Any] = {}
    for col in table.c:
        if col.name in payload:
            data[col.name] = _coerce_value(col, payload[col.name])

    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid columns provided")

    try:
        inserted_id = None
        if pk_col and pk_col in table.c:
            result = db.execute(table.insert().values(**data).returning(table.c[pk_col]))
            inserted_id = result.scalar()
        else:
            result = db.execute(table.insert().values(**data))
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    log_activity(
        db,
        user_id=current_user.id,
        action="admin.db.insert",
        resource_type=table_name,
        resource_id=inserted_id,
        details={"table": table_name},
        request=request,
    )
    db.commit()

    return ActionResponse(message="Row created", affected=1, id=inserted_id)


@router.patch("/table/{table_name}/{row_id}", response_model=ActionResponse)
async def update_row(
    request: Request,
    table_name: str,
    row_id: str,
    payload: dict[str, Any] = Body(...),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    table = _get_table(db, table_name)
    pk_col = _get_pk_column(db, table_name)
    if not pk_col:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Primary key not found")

    data: dict[str, Any] = {}
    for col in table.c:
        if col.name in payload:
            data[col.name] = _coerce_value(col, payload[col.name])

    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid columns provided")

    pk_column = table.c[pk_col]
    pk_value = _coerce_value(pk_column, row_id)

    try:
        result = db.execute(table.update().where(pk_column == pk_value).values(**data))
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    log_activity(
        db,
        user_id=current_user.id,
        action="admin.db.update",
        resource_type=table_name,
        resource_id=pk_value,
        details={"table": table_name, "fields": list(data.keys())},
        request=request,
    )
    db.commit()

    return ActionResponse(message="Row updated", affected=result.rowcount or 0, id=pk_value)


@router.delete("/table/{table_name}/{row_id}", response_model=ActionResponse)
async def delete_row(
    request: Request,
    table_name: str,
    row_id: str,
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    table = _get_table(db, table_name)
    pk_col = _get_pk_column(db, table_name)
    if not pk_col:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Primary key not found")

    pk_column = table.c[pk_col]
    pk_value = _coerce_value(pk_column, row_id)

    try:
        result = db.execute(table.delete().where(pk_column == pk_value))
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    log_activity(
        db,
        user_id=current_user.id,
        action="admin.db.delete",
        resource_type=table_name,
        resource_id=pk_value,
        details={"table": table_name},
        request=request,
    )
    db.commit()

    return ActionResponse(message="Row deleted", affected=result.rowcount or 0, id=pk_value)
