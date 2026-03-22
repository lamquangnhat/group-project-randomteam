from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)

    name = Column(String, index=True)
    description = Column(String, nullable=True)

    address = Column(String, nullable=True)
    city = Column(String, index=True)
    country = Column(String, index=True)

    latitude = Column(String)
    longitude = Column(String)

    category = Column(String)

    avg_rating = Column(String, default="0")
    total_reviews = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)