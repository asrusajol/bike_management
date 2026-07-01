"""fix logged_at timezone mislabel for pre-fix entries

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-01

The frontend used to build the datetime-local default/submission value from
new Date().toISOString(), which is UTC — so a user's local wall-clock time was
sent to the backend and stored as if it already were UTC. Every fuel/service/
expense `logged_at` written before this fix is therefore off by the user's
real UTC offset.

All production users are in Asia/Dhaka (UTC+6, no DST), so every existing
`logged_at` value is corrected by shifting it back 6 hours. This is a one-time
data fix — it must NOT be re-run after the corrected frontend is deployed,
since new entries already carry the correct UTC instant.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

TABLES = ("fuel_logs", "service_logs", "expenses")
OFFSET = "6 hours"


def upgrade() -> None:
    for table in TABLES:
        op.execute(
            sa.text(f"UPDATE {table} SET logged_at = logged_at - interval '{OFFSET}'")
        )


def downgrade() -> None:
    for table in TABLES:
        op.execute(
            sa.text(f"UPDATE {table} SET logged_at = logged_at + interval '{OFFSET}'")
        )
