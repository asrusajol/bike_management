#!/bin/sh
set -e

echo "[entrypoint] Running Alembic migrations…"
alembic upgrade head

echo "[entrypoint] Starting server (workers: ${WEB_CONCURRENCY:-2})…"
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers "${WEB_CONCURRENCY:-2}" \
  --no-access-log
