"""
Import all SQLAlchemy ORM models here so Alembic autogenerate can discover them.

Each feature should define its ORM models in `app/infrastructure/<feature>/models.py`,
then this module should import that feature module.
"""

from __future__ import annotations

from app.infrastructure.users import models as _users_models  # noqa: F401
from app.infrastructure.auth import models as _auth_models  # noqa: F401
