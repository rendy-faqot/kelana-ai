import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()


def normalize_database_url(value: str | None) -> str | None:
    if value is None:
        return None

    database_url = value.strip()

    if database_url.startswith("psql "):
        database_url = database_url.removeprefix("psql ").strip()

    return database_url.strip("'\"")


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set in the environment.")

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
