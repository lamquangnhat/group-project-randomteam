from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.base import Base

class PlanActivity(Base):
    __tablename__ = "plan_activities"

    id = Column(Integer, primary_key=True)

    plan_id = Column(Integer, ForeignKey("plans.id"))

    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)

    notes = Column(String, nullable=True)

    activity_date = Column(DateTime)

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    order_index = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)