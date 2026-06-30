"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-30

Single migration that creates the full schema from scratch.
All timestamps are TIMESTAMPTZ (timezone-aware).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Enum types ─────────────────────────────────────────────────────────────
    odometerunit = postgresql.ENUM(
        "km", "miles", name="odometerunit", create_type=False
    )
    odometerunit.create(op.get_bind(), checkfirst=True)

    expensecategory = postgresql.ENUM(
        "insurance", "tax", "parking", "accessories",
        "repair", "cleaning", "fine", "other",
        name="expensecategory", create_type=False,
    )
    expensecategory.create(op.get_bind(), checkfirst=True)

    remindertype = postgresql.ENUM(
        "service", "insurance", "tax", "custom",
        name="remindertype", create_type=False,
    )
    remindertype.create(op.get_bind(), checkfirst=True)

    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",              postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("email",           sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name",       sa.String(255), nullable=False),
        sa.Column("is_active",       sa.Boolean(),   nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified",     sa.Boolean(),   nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── bikes ──────────────────────────────────────────────────────────────────
    op.create_table(
        "bikes",
        sa.Column("id",             postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id",        postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name",           sa.String(100), nullable=False),
        sa.Column("make",           sa.String(100)),
        sa.Column("model",          sa.String(100)),
        sa.Column("year",           sa.Integer()),
        sa.Column("cc",             sa.Integer()),
        sa.Column("colour",         sa.String(100)),
        sa.Column("tank_capacity",  sa.Float()),
        sa.Column("odometer_unit",  sa.Enum("km", "miles", name="odometerunit"), nullable=False, server_default="km"),
        sa.Column("purchase_date",  sa.Date()),
        sa.Column("purchase_price", sa.Float()),
        sa.Column("plate_number",   sa.String(50)),
        sa.Column("notes",          sa.String(1000)),
        sa.Column("image_url",      sa.String(500)),
    )
    op.create_index("ix_bikes_user_id", "bikes", ["user_id"])

    # ── fuel_logs ──────────────────────────────────────────────────────────────
    op.create_table(
        "fuel_logs",
        sa.Column("id",                   postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",           sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",           sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("bike_id",              postgresql.UUID(as_uuid=True), sa.ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("logged_at",            sa.DateTime(timezone=True), nullable=False),
        sa.Column("odometer_reading",     sa.Float(), nullable=False),
        sa.Column("fuel_quantity",        sa.Float(), nullable=False),
        sa.Column("fuel_price_per_unit",  sa.Float(), nullable=False),
        sa.Column("total_cost",           sa.Float(), nullable=False),
        sa.Column("is_full_tank",         sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("station_name",         sa.String(200)),
        sa.Column("notes",                sa.String(500)),
    )
    op.create_index("ix_fuel_logs_bike_id",  "fuel_logs", ["bike_id"])
    op.create_index("ix_fuel_logs_logged_at", "fuel_logs", ["logged_at"])

    # ── service_logs ───────────────────────────────────────────────────────────
    # service_items: [{name: str, cost: float}, ...]  — individual line items
    # cost: pre-computed sum of service_items costs
    op.create_table(
        "service_logs",
        sa.Column("id",               postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("bike_id",          postgresql.UUID(as_uuid=True), sa.ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("logged_at",        sa.DateTime(timezone=True), nullable=False),
        sa.Column("odometer_reading", sa.Float()),
        sa.Column("service_items",    postgresql.JSONB(), nullable=False),
        sa.Column("cost",             sa.Float(), nullable=False),
        sa.Column("workshop_name",    sa.String(200)),
        sa.Column("next_service_km",  sa.Float()),
        sa.Column("next_service_date", sa.Date()),
        sa.Column("notes",            sa.String(1000)),
    )
    op.create_index("ix_service_logs_bike_id",  "service_logs", ["bike_id"])
    op.create_index("ix_service_logs_logged_at", "service_logs", ["logged_at"])

    # ── expenses ───────────────────────────────────────────────────────────────
    op.create_table(
        "expenses",
        sa.Column("id",                  postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",          sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("bike_id",             postgresql.UUID(as_uuid=True), sa.ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("logged_at",           sa.DateTime(timezone=True), nullable=False),
        sa.Column("category",            sa.Enum(
            "insurance", "tax", "parking", "accessories",
            "repair", "cleaning", "fine", "other",
            name="expensecategory",
        ), nullable=False),
        sa.Column("cost",                sa.Float(), nullable=False),
        sa.Column("description",         sa.String(500)),
        sa.Column("receipt_image_url",   sa.String(500)),
        sa.Column("notes",               sa.String(1000)),
    )
    op.create_index("ix_expenses_bike_id",  "expenses", ["bike_id"])
    op.create_index("ix_expenses_logged_at", "expenses", ["logged_at"])

    # ── reminders ──────────────────────────────────────────────────────────────
    op.create_table(
        "reminders",
        sa.Column("id",               postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("bike_id",          postgresql.UUID(as_uuid=True), sa.ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type",             sa.Enum("service", "insurance", "tax", "custom", name="remindertype"), nullable=False),
        sa.Column("title",            sa.String(200), nullable=False),
        sa.Column("trigger_km",       sa.Float()),
        sa.Column("trigger_date",     sa.Date()),
        sa.Column("is_active",        sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_notified_at", sa.DateTime(timezone=True)),
        sa.Column("notes",            sa.String(500)),
    )
    op.create_index("ix_reminders_bike_id", "reminders", ["bike_id"])


def downgrade() -> None:
    op.drop_index("ix_reminders_bike_id",    table_name="reminders")
    op.drop_table("reminders")

    op.drop_index("ix_expenses_logged_at",   table_name="expenses")
    op.drop_index("ix_expenses_bike_id",     table_name="expenses")
    op.drop_table("expenses")

    op.drop_index("ix_service_logs_logged_at", table_name="service_logs")
    op.drop_index("ix_service_logs_bike_id",   table_name="service_logs")
    op.drop_table("service_logs")

    op.drop_index("ix_fuel_logs_logged_at",  table_name="fuel_logs")
    op.drop_index("ix_fuel_logs_bike_id",    table_name="fuel_logs")
    op.drop_table("fuel_logs")

    op.drop_index("ix_bikes_user_id",  table_name="bikes")
    op.drop_table("bikes")

    op.drop_index("ix_users_email",  table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS remindertype")
    op.execute("DROP TYPE IF EXISTS expensecategory")
    op.execute("DROP TYPE IF EXISTS odometerunit")
