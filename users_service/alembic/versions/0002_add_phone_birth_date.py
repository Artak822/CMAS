"""add phone and birth_date to users"""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_phone_birth_date"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))

    op.execute("UPDATE users SET phone = '' WHERE phone IS NULL")
    op.execute("UPDATE users SET birth_date = DATE '1970-01-01' WHERE birth_date IS NULL")

    op.alter_column("users", "phone", nullable=False)
    op.alter_column("users", "birth_date", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "birth_date")
    op.drop_column("users", "phone")
