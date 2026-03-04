"""initial rooms schema"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "floors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("dormitory", sa.String(length=64), nullable=False),
    )
    op.create_index("ix_floors_id", "floors", ["id"])

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number", sa.String(length=32), nullable=False),
        sa.Column("floor_id", sa.Integer(), sa.ForeignKey("floors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("free_places", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
    )
    op.create_index("ix_rooms_id", "rooms", ["id"])
    op.create_index("ix_rooms_floor_id", "rooms", ["floor_id"])

    op.create_table(
        "residences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), sa.ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("check_in_date", sa.Date(), nullable=False),
        sa.Column("check_out_date", sa.Date(), nullable=True),
    )
    op.create_index("ix_residences_id", "residences", ["id"])
    op.create_index("ix_residences_student_id", "residences", ["student_id"])
    op.create_index("ix_residences_room_id", "residences", ["room_id"])


def downgrade() -> None:
    op.drop_index("ix_residences_room_id", table_name="residences")
    op.drop_index("ix_residences_student_id", table_name="residences")
    op.drop_index("ix_residences_id", table_name="residences")
    op.drop_table("residences")

    op.drop_index("ix_rooms_floor_id", table_name="rooms")
    op.drop_index("ix_rooms_id", table_name="rooms")
    op.drop_table("rooms")

    op.drop_index("ix_floors_id", table_name="floors")
    op.drop_table("floors")
