"""
AGRI SMART — Model Importer
File: backend/app/database/base.py

Importing this file causes all ORM models to register themselves
with the shared Base metadata. Alembic needs this to detect schema changes.
"""

from app.database.base_class import Base  # noqa: F401

# Import every model module here so their classes are registered.
# Add new model imports as you create them in later phases.
from app.models import user  # noqa: F401
from app.models import farm  # noqa: F401
from app.models import crop  # noqa: F401
from app.models import ai_diagnosis  # noqa: F401
from app.models import consultation  # noqa: F401
from app.models import finance  # noqa: F401
from app.models import marketplace  # noqa: F401
