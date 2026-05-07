"""
Import all SQLAlchemy ORM models here so Alembic autogenerate can discover them.

Each feature should define its ORM models in `app/infrastructure/<feature>/models.py`,
then this module should import that feature module.
"""

from __future__ import annotations

from app.infrastructure.users import models as _users_models  # noqa: F401
from app.infrastructure.auth import models as _auth_models  # noqa: F401
from app.infrastructure.employees import models as _employees_models  # noqa: F401
from app.infrastructure.leave_requests import models as _leave_requests_models  # noqa: F401
from app.infrastructure.announcements import models as _announcements_models  # noqa: F401
from app.infrastructure.hr_tasks import models as _hr_tasks_models  # noqa: F401
from app.infrastructure.messenger import models as _messenger_models  # noqa: F401
