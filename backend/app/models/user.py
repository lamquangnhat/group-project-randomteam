from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)

    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    provider = Column(String, nullable=True)  # "local", "google", "facebook"
    provider_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)