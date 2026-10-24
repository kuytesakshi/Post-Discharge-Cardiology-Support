import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models import Role, User, UserRole

logger = logging.getLogger(__name__)

ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")


async def seed_admin(db: AsyncSession) -> None:
    if not settings.SEED_ADMIN:
        return

    if not settings.ADMIN_PASSWORD:
        logger.warning("SEED_ADMIN is enabled but ADMIN_PASSWORD is not set")
        return

    role = await db.scalar(select(Role).where(Role.name == UserRole.ADMIN.value))
    if role is None:
        role = Role(id=ADMIN_ROLE_ID, name=UserRole.ADMIN.value)
        db.add(role)
        await db.flush()

    email = settings.ADMIN_EMAIL.lower()
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        if existing_user.role.name != UserRole.ADMIN.value:
            logger.warning("An existing non-admin user already uses ADMIN_EMAIL")
        return

    admin = User(
        name=settings.ADMIN_NAME,
        email=email,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=role,
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    logger.info("Seeded admin user %s", email)
