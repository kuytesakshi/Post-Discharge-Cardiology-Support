"""add admin role

Revision ID: 37e341f93304
Revises: 51bbd758029e
Create Date: 2026-10-24 12:56:40.818415

"""

from collections.abc import Sequence

from alembic import op

revision: str = "37e341f93304"
down_revision: str | Sequence[str] | None = "51bbd758029e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO roles (id, name)
        VALUES ('00000000-0000-0000-0000-000000000003', 'admin')
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE role_id IN (SELECT id FROM roles WHERE name = 'admin')")
    op.execute("DELETE FROM roles WHERE name = 'admin'")
