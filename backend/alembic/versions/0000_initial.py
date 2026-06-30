"""initial schema — create all base tables

Revision ID: 0000
Revises:
Create Date: 2026-06-30

Creates users, bikes, fuel_logs, service_logs, expenses, reminders in their
original form. Incremental migrations 0001–0006 apply column changes on top.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ── bikes (without cc, colour, tank_capacity — added in 0001 / 0002) ──────
    op.create_table(
        'bikes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('make', sa.String(100), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('odometer_unit', sa.Enum('km', 'miles', name='odometerunit'), nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('purchase_price', sa.Float(), nullable=True),
        sa.Column('plate_number', sa.String(50), nullable=True),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bikes_user_id', 'bikes', ['user_id'])

    # ── fuel_logs (date = Date; renamed to logged_at DateTime in 0003) ────────
    op.create_table(
        'fuel_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('bike_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('odometer_reading', sa.Float(), nullable=False),
        sa.Column('fuel_quantity', sa.Float(), nullable=False),
        sa.Column('fuel_price_per_unit', sa.Float(), nullable=False),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('is_full_tank', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('station_name', sa.String(200), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(['bike_id'], ['bikes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_fuel_logs_bike_id', 'fuel_logs', ['bike_id'])
    op.create_index('ix_fuel_logs_date', 'fuel_logs', ['date'])

    # ── service_logs (date = Date, service_type = Enum; both changed in 0004/0005)
    op.create_table(
        'service_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('bike_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('odometer_reading', sa.Float(), nullable=True),
        sa.Column('service_type', sa.Enum(
            'oil_change', 'tire', 'brake', 'chain', 'filter',
            'battery', 'spark_plug', 'coolant', 'general', 'other',
            name='servicetype',
        ), nullable=False),
        sa.Column('cost', sa.Float(), nullable=False),
        sa.Column('workshop_name', sa.String(200), nullable=True),
        sa.Column('next_service_km', sa.Float(), nullable=True),
        sa.Column('next_service_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.ForeignKeyConstraint(['bike_id'], ['bikes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_service_logs_bike_id', 'service_logs', ['bike_id'])
    op.create_index('ix_service_logs_date', 'service_logs', ['date'])

    # ── expenses (date = Date; renamed to logged_at DateTime in 0006) ─────────
    op.create_table(
        'expenses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('bike_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('category', sa.Enum(
            'insurance', 'tax', 'parking', 'accessories', 'repair', 'cleaning', 'fine', 'other',
            name='expensecategory',
        ), nullable=False),
        sa.Column('cost', sa.Float(), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('receipt_image_url', sa.String(500), nullable=True),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.ForeignKeyConstraint(['bike_id'], ['bikes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_expenses_bike_id', 'expenses', ['bike_id'])
    op.create_index('ix_expenses_date', 'expenses', ['date'])

    # ── reminders (final schema — no further migrations) ──────────────────────
    op.create_table(
        'reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('bike_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('service', 'insurance', 'tax', 'custom', name='remindertype'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('trigger_km', sa.Float(), nullable=True),
        sa.Column('trigger_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(['bike_id'], ['bikes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reminders_bike_id', 'reminders', ['bike_id'])


def downgrade() -> None:
    op.drop_index('ix_reminders_bike_id', table_name='reminders')
    op.drop_table('reminders')

    op.drop_index('ix_expenses_date', table_name='expenses')
    op.drop_index('ix_expenses_bike_id', table_name='expenses')
    op.drop_table('expenses')

    op.drop_index('ix_service_logs_date', table_name='service_logs')
    op.drop_index('ix_service_logs_bike_id', table_name='service_logs')
    op.drop_table('service_logs')

    op.drop_index('ix_fuel_logs_date', table_name='fuel_logs')
    op.drop_index('ix_fuel_logs_bike_id', table_name='fuel_logs')
    op.drop_table('fuel_logs')

    op.drop_index('ix_bikes_user_id', table_name='bikes')
    op.drop_table('bikes')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS remindertype')
    op.execute('DROP TYPE IF EXISTS expensecategory')
    op.execute('DROP TYPE IF EXISTS servicetype')
    op.execute('DROP TYPE IF EXISTS odometerunit')
