import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base import Base

from sqlalchemy import Index

class PlanActivity(Base):
    __tablename__ = "plan_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True, index=True)

    notes = Column(String, nullable=True)

    activity_date = Column(DateTime)

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    order_index = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_plan_activities_plan_order", "plan_id", "order_index"),
        Index("ix_plan_activities_plan_date", "plan_id", "activity_date"),
    )