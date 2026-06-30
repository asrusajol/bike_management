"""service_log: date→logged_at datetime, service_type enum→service_types text[]

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None

# Maps old enum values to human-readable display names
_TYPE_MAP = {
    'oil_change':  'Engine Oil',
    'tire':        'Tire',
    'brake':       'Brake Pad',
    'chain':       'Chain',
    'filter':      'Air Filter',
    'battery':     'Battery',
    'spark_plug':  'Spark Plug',
    'coolant':     'Coolant',
    'general':     'General Service',
    'other':       'Other',
}


def upgrade() -> None:
    # 1. date (Date) → logged_at (DateTime)
    op.add_column('service_logs', sa.Column('logged_at', sa.DateTime(), nullable=True))
    op.execute("UPDATE service_logs SET logged_at = date::TIMESTAMP")
    op.alter_column('service_logs', 'logged_at', nullable=False)
    op.create_index('ix_service_logs_logged_at', 'service_logs', ['logged_at'])
    op.drop_column('service_logs', 'date')

    # 2. service_type (Enum) → service_types (TEXT[])
    op.add_column('service_logs', sa.Column('service_types', postgresql.ARRAY(sa.String()), nullable=True))

    case_expr = "CASE service_type::text " + " ".join(
        f"WHEN '{k}' THEN '{v}'" for k, v in _TYPE_MAP.items()
    ) + " ELSE service_type::text END"
    op.execute(f"UPDATE service_logs SET service_types = ARRAY[{case_expr}]")

    op.alter_column('service_logs', 'service_types', nullable=False)
    op.drop_column('service_logs', 'service_type')
    # Drop the orphaned PostgreSQL enum type
    op.execute("DROP TYPE IF EXISTS servicetype")


def downgrade() -> None:
    op.execute("""
        CREATE TYPE servicetype AS ENUM (
            'oil_change','tire','brake','chain','filter',
            'battery','spark_plug','coolant','general','other'
        )
    """)
    op.add_column('service_logs', sa.Column('service_type', sa.Enum(
        'oil_change','tire','brake','chain','filter',
        'battery','spark_plug','coolant','general','other',
        name='servicetype'), nullable=True))
    op.execute("UPDATE service_logs SET service_type = 'other'")
    op.alter_column('service_logs', 'service_type', nullable=False)
    op.drop_column('service_logs', 'service_types')

    op.drop_index('ix_service_logs_logged_at', 'service_logs')
    op.add_column('service_logs', sa.Column('date', sa.Date(), nullable=True))
    op.execute("UPDATE service_logs SET date = logged_at::DATE")
    op.alter_column('service_logs', 'date', nullable=False)
    op.drop_column('service_logs', 'logged_at')
