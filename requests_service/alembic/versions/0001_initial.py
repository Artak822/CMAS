"""initial requests schema"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "maintenance_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("assignee_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_maintenance_requests_id", "maintenance_requests", ["id"])
    op.create_index("ix_maintenance_requests_student_id", "maintenance_requests", ["student_id"])
    op.create_index("ix_maintenance_requests_room_id", "maintenance_requests", ["room_id"])

    op.create_table(
        "request_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "request_id",
            sa.Integer(),
            sa.ForeignKey("maintenance_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_request_comments_id", "request_comments", ["id"])
    op.create_index("ix_request_comments_request_id", "request_comments", ["request_id"])


def downgrade() -> None:
    op.drop_index("ix_request_comments_request_id", table_name="request_comments")
    op.drop_index("ix_request_comments_id", table_name="request_comments")
    op.drop_table("request_comments")

    op.drop_index("ix_maintenance_requests_room_id", table_name="maintenance_requests")
    op.drop_index("ix_maintenance_requests_student_id", table_name="maintenance_requests")
    op.drop_index("ix_maintenance_requests_id", table_name="maintenance_requests")
    op.drop_table("maintenance_requests")
