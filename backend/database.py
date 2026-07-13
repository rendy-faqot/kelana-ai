import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# connection string: postgresql + driver://user:pass@host/db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:P%40ssw0rd@localhost/kelana_db",
)

# engine = the connection pool
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# SessionLocal = a factory for DB sessions
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

# Base = all ORM models inherit from this
Base = declarative_base()


def init_db() -> None:
    """Create all SQLAlchemy tables for the configured database."""
    Base.metadata.create_all(bind=engine)
