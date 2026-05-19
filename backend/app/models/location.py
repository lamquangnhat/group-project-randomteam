import uuid
from sqlalchemy import Column, String, DateTime, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    name = Column(String, index=True)
    description = Column(String, nullable=True)

    address = Column(String, nullable=True)
    city = Column(String, index=True)
    country = Column(String, index=True)

    latitude = Column(Float)
    longitude = Column(Float)

    category = Column(String)
    price_level = Column(Integer, nullable=True)
    price = Column(Integer, nullable=True)
    tags = Column(String, nullable=True)

    avg_rating = Column(Float, default=0)
    total_reviews = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)