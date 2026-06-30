"""add cc and colour to bikes

Revision ID: 0001
Revises:
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = '0001'
down_revision = '0000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('bikes', sa.Column('cc', sa.Integer(), nullable=True))
    op.add_column('bikes', sa.Column('colour', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('bikes', 'colour')
    op.drop_column('bikes', 'cc')