import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), index=True)

    rating = Column(Integer, index=True)
    comment = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)