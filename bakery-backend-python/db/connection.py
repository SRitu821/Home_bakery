import os
import re
from decimal import Decimal
from typing import Any, List, Optional
from contextlib import contextmanager
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "bakery_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "bakery123")
DB_NAME = os.getenv("DB_NAME", "bakery_db")

conninfo = f"host={DB_HOST} port={DB_PORT} user={DB_USER} password={DB_PASSWORD} dbname={DB_NAME}"

import atexit

# Initialize connection pool
pool = ConnectionPool(
    conninfo=conninfo,
    min_size=1,
    max_size=20,
    kwargs={"row_factory": dict_row},
    open=True,
)
atexit.register(pool.close)


import datetime


def _convert_value(val: Any) -> Any:
    if isinstance(val, Decimal):
        return float(val)
    elif isinstance(val, (datetime.datetime, datetime.date)):
        return val.isoformat()
    elif isinstance(val, dict):
        return {k: _convert_value(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [_convert_value(v) for v in val]
    return val


def _normalize_query(query: str, params: Optional[List[Any]] = None) -> tuple[str, list]:
    """Converts PostgreSQL $1, $2, ... placeholders to %s for psycopg and expands params if repeated."""
    if not params:
        sql = re.sub(r"\$(\d+)", r"%s", query)
        return sql, []

    matches = list(re.finditer(r"\$(\d+)", query))
    if not matches:
        return query, list(params)

    # Build new params list based on placeholder index (1-based)
    new_params = []
    for m in matches:
        idx = int(m.group(1)) - 1
        if 0 <= idx < len(params):
            new_params.append(params[idx])
        else:
            new_params.append(None)

    new_sql = re.sub(r"\$(\d+)", r"%s", query)
    return new_sql, new_params


class QueryResult:
    def __init__(self, rows: List[dict], row_count: int = 0):
        self.rows = [_convert_value(r) for r in rows]
        self.rowCount = row_count

    def __iter__(self):
        return iter(self.rows)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, item):
        return self.rows[item]


class TransactionClient:
    """Transactional client mimicking pg PoolClient with query, commit, rollback, release."""

    def __init__(self, conn):
        self.conn = conn
        self._released = False

    def query(self, text: str, params: Optional[List[Any]] = None) -> QueryResult:
        sql, normalized_params = _normalize_query(text, params)
        with self.conn.cursor() as cur:
            cur.execute(sql, normalized_params)
            if cur.description:
                rows = cur.fetchall()
                return QueryResult(rows, cur.rowcount)
            return QueryResult([], cur.rowcount)

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def release(self):
        if not self._released:
            self._released = True
            pool.putconn(self.conn)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                self.rollback()
            else:
                self.commit()
        finally:
            self.release()


def query(text: str, params: Optional[List[Any]] = None) -> QueryResult:
    """Executes a single query against a pooled connection."""
    sql, normalized_params = _normalize_query(text, params)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, normalized_params)
            if cur.description:
                rows = cur.fetchall()
                return QueryResult(rows, cur.rowcount)
            conn.commit()
            return QueryResult([], cur.rowcount)


def get_client() -> TransactionClient:
    """Checks out a connection from the pool for transactional queries."""
    conn = pool.getconn()
    conn.autocommit = False
    return TransactionClient(conn)
