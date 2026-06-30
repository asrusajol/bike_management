"""expense: date (Date) -> logged_at (DateTime)

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add logged_at as nullable first so existing rows don't fail
    op.add_column("expenses", sa.Column("logged_at", sa.DateTime(), nullable=True))

    # Copy existing date values as midnight timestamps
    op.execute("UPDATE expenses SET logged_at = date::TIMESTAMP WHERE logged_at IS NULL")

    # Make non-nullable now that all rows have a value
    op.alter_column("expenses", "logged_at", nullable=False)

    # Add index
    op.create_index("ix_expenses_logged_at", "expenses", ["logged_at"])

    # Drop old date column
    op.drop_column("expenses", "date")


def downgrade() -> None:
    op.add_column("expenses", sa.Column("date", sa.Date(), nullable=True))
    op.execute("UPDATE expenses SET date = logged_at::DATE")
    op.alter_column("expenses", "date", nullable=False)
    op.drop_index("ix_expenses_logged_at", table_name="expenses")
    op.drop_column("expenses", "logged_at")
