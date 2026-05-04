from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.utils import config

engine = create_engine(
    config.DATABASE_URL,
    connect_args={"sslmode": "require"},
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)