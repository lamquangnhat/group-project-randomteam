from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from app.db.base import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True)

    title = Column(String)
    description = Column(String, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)