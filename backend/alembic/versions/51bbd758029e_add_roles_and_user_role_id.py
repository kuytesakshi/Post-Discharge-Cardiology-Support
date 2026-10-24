"""add roles and user role id

Revision ID: 51bbd758029e
Revises: 0001_initial
Create Date: 2026-10-24 12:42:58.559942

"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "51bbd758029e"
down_revision: str | Sequence[str] | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DOCTOR_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
PATIENT_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)

    roles = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
    )
    op.bulk_insert(
        roles,
        [
            {"id": DOCTOR_ROLE_ID, "name": "doctor"},
            {"id": PATIENT_ROLE_ID, "name": "patient"},
        ],
    )

    op.add_column("users", sa.Column("role_id", sa.Uuid(), nullable=True))
    op.execute(
        """
        UPDATE users
        SET role_id = roles.id
        FROM roles
        WHERE roles.name = users.role::text
        """
    )
    op.alter_column("users", "role_id", existing_type=sa.Uuid(), nullable=False)
    op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)
    op.create_foreign_key(
        "fk_users_role_id_roles",
        "users",
        "roles",
        ["role_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.drop_column("users", "role")
    op.execute("DROP TYPE IF EXISTS user_role")

    op.alter_column(
        "users",
        "full_name",
        new_column_name="name",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "name",
        new_column_name="full_name",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )

    op.execute("CREATE TYPE user_role AS ENUM ('patient', 'doctor')")
    op.add_column(
        "users",
        sa.Column(
            "role",
            postgresql.ENUM("patient", "doctor", name="user_role", create_type=False),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE users
        SET role = roles.name::user_role
        FROM roles
        WHERE roles.id = users.role_id
        """
    )
    op.alter_column(
        "users",
        "role",
        existing_type=postgresql.ENUM(name="user_role", create_type=False),
        nullable=False,
    )

    op.drop_constraint("fk_users_role_id_roles", "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_role_id"), table_name="users")
    op.drop_column("users", "role_id")

    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_table("roles")
