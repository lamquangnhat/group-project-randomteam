from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.base import Base

class PlanMember(Base):
    __tablename__ = "plan_members"

    id = Column(Integer, primary_key=True)

    plan_id = Column(Integer, ForeignKey("plans.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String)

    joined_at = Column(DateTime, default=datetime.utcnow)