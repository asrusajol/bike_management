"""rename fuel_logs.date to logged_at and change type to DateTime

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('fuel_logs', sa.Column('logged_at', sa.DateTime(), nullable=True))
    op.execute("UPDATE fuel_logs SET logged_at = date::TIMESTAMP")
    op.alter_column('fuel_logs', 'logged_at', nullable=False)
    op.drop_column('fuel_logs', 'date')
    op.create_index('ix_fuel_logs_logged_at', 'fuel_logs', ['logged_at'])


def downgrade() -> None:
    op.drop_index('ix_fuel_logs_logged_at', 'fuel_logs')
    op.add_column('fuel_logs', sa.Column('date', sa.Date(), nullable=True))
    op.execute("UPDATE fuel_logs SET date = logged_at::DATE")
    op.alter_column('fuel_logs', 'date', nullable=False)
    op.drop_column('fuel_logs', 'logged_at')
