"""service_log: service_types TEXT[] → service_items JSONB with individual costs

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('service_logs', sa.Column('service_items', postgresql.JSONB(), nullable=True))

    # Distribute existing total cost evenly across types; cost=0 if no types
    op.execute("""
        UPDATE service_logs
        SET service_items = (
            SELECT json_agg(
                json_build_object(
                    'name', t,
                    'cost', ROUND((cost / GREATEST(array_length(service_types, 1), 1))::numeric, 2)
                )
            )
            FROM unnest(service_types) t
        )
        WHERE array_length(service_types, 1) > 0
    """)
    # Rows with empty array get an empty array
    op.execute("""
        UPDATE service_logs SET service_items = '[]'::jsonb
        WHERE service_items IS NULL
    """)

    op.alter_column('service_logs', 'service_items', nullable=False)
    op.drop_column('service_logs', 'service_types')


def downgrade() -> None:
    op.add_column('service_logs', sa.Column(
        'service_types', postgresql.ARRAY(sa.String()), nullable=True
    ))
    op.execute("""
        UPDATE service_logs
        SET service_types = ARRAY(
            SELECT elem->>'name' FROM jsonb_array_elements(service_items) elem
        )
    """)
    op.alter_column('service_logs', 'service_types', nullable=False)
    op.drop_column('service_logs', 'service_items')
