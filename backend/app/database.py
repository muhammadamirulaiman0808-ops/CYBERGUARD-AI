from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app import config

_is_sqlite = config.DATABASE_URL.startswith("sqlite")

_engine_options = {"pool_pre_ping": True}
if _is_sqlite:
    _engine_options["connect_args"] = {"check_same_thread": False}
else:
    _engine_options.update(pool_size=5, max_overflow=5, pool_recycle=300)

engine = create_engine(config.DATABASE_URL, **_engine_options)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
