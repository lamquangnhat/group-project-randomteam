import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base import Base

class PlanMember(Base):
    __tablename__ = "plan_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    role = Column(String, index=True)

    joined_at = Column(DateTime, default=datetime.utcnow)