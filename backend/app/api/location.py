import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import nullslast, or_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.models.location import Location
from app.services.ai_service import extract_travel_intent, filter_locations_by_relevance
from app.services.database import get_db

location_router = APIRouter(prefix="/locations", tags=["Locations"])


class LocationResponse(BaseModel):
    id: uuid.UUID
    name: Optional[str]
    description: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    category: Optional[str]
    tags: Optional[str]
    price_level: Optional[int]
    price: Optional[int]
    avg_rating: Optional[float]
    total_reviews: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class AISearchRequest(BaseModel):
    prompt: str


VALID_CATEGORIES = {
    "food",
    "tourist_attraction",
    "mall",
    "hotel",
    "beach",
    "nature",
    "entertainment",
}


def _popularity_query(db: Session):
    return (
        db.query(Location)
        .filter(Location.total_reviews > 0)
        .order_by(
            (Location.avg_rating * Location.total_reviews).desc(),
            Location.avg_rating.desc(),
        )
    )


@location_router.get("/popular", response_model=List[LocationResponse])
def get_popular_locations(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return _popularity_query(db).limit(limit).all()


@location_router.get("/search", response_model=List[LocationResponse])
def search_locations(
    keyword: Optional[str] = Query(default=None, description="Search in name and description"),
    category: Optional[str] = Query(default=None, description=f"One of: {', '.join(sorted(VALID_CATEGORIES))}"),
    city: Optional[str] = Query(default=None),
    country: Optional[str] = Query(default=None),
    min_rating: Optional[float] = Query(default=None, ge=0, le=5),
    price_level: Optional[int] = Query(default=None, ge=1, le=4, description="1=budget, 2=mid-range, 3=upscale, 4=luxury"),
    min_price: Optional[int] = Query(default=None, ge=0, description="Minimum price in VND"),
    max_price: Optional[int] = Query(default=None, ge=0, description="Maximum price in VND"),
    sort_by: Optional[str] = Query(default=None, description="popular|rating|price_asc|price_desc|newest"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Location)

    if keyword:
        query = query.filter(
            or_(Location.name.ilike(f"%{keyword}%"), Location.description.ilike(f"%{keyword}%"))
        )
    if category:
        query = query.filter(Location.category == category.lower())
    if city:
        query = query.filter(Location.city.ilike(f"%{city}%"))
    if country:
        query = query.filter(Location.country.ilike(f"%{country}%"))
    if min_rating is not None:
        query = query.filter(Location.avg_rating >= min_rating)
    if price_level is not None:
        query = query.filter(Location.price_level == price_level)
    if min_price is not None:
        query = query.filter(Location.price >= min_price)
    if max_price is not None:
        query = query.filter(Location.price <= max_price)

    if sort_by == "popular":
        query = query.order_by(
            (Location.avg_rating * Location.total_reviews).desc(),
            Location.avg_rating.desc(),
        )
    elif sort_by == "rating":
        query = query.order_by(Location.avg_rating.desc(), Location.total_reviews.desc())
    elif sort_by == "price_asc":
        query = query.order_by(nullslast(Location.price.asc()))
    elif sort_by == "price_desc":
        query = query.order_by(nullslast(Location.price.desc()))
    elif sort_by == "newest":
        query = query.order_by(Location.created_at.desc())
    else:
        query = query.order_by(
            (Location.avg_rating * Location.total_reviews).desc(),
            Location.avg_rating.desc(),
        )

    return query.offset(offset).limit(limit).all()


@location_router.post("/ai-search", response_model=List[LocationResponse])
def ai_search_locations(body: AISearchRequest, db: Session = Depends(get_db)):
    intent = extract_travel_intent(body.prompt)

    if not intent or not intent.get("is_travel_related"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please describe a travel destination or activity you're looking for.",
        )

    category: Optional[str] = intent.get("category")
    keywords: List[str] = intent.get("keywords") or []

    logger.info("AI intent: category=%s, keywords=%s", category, keywords)

    def _build_candidates(include_category: bool, require_keywords: bool):
        q = db.query(Location)
        if include_category and category:
            q = q.filter(Location.category == category)
        if require_keywords and keywords:
            kw_filters = []
            for kw in keywords:
                kw_filters.extend([
                    Location.name.ilike(f"%{kw}%"),
                    Location.description.ilike(f"%{kw}%"),
                    Location.tags.ilike(f"%{kw}%"),
                ])
            q = q.filter(or_(*kw_filters))
        return (
            q.order_by(
                (Location.avg_rating * Location.total_reviews).desc(),
                Location.avg_rating.desc(),
            )
            .limit(10)
            .all()
        )

    candidates = _build_candidates(include_category=True, require_keywords=True)
    logger.info("Candidates (category+keywords): %d", len(candidates))

    if len(candidates) < 3 and keywords:
        candidates = _build_candidates(include_category=True, require_keywords=False)
        logger.info("Candidates (category only): %d", len(candidates))

    if len(candidates) < 3 and category:
        candidates = _build_candidates(include_category=False, require_keywords=False)
        logger.info("Candidates (no filters): %d", len(candidates))

    if not candidates:
        return []

    top_ids = filter_locations_by_relevance(body.prompt, candidates)
    logger.info("AI filter returned IDs: %s", top_ids)

    if not top_ids:
        return candidates[:5]

    id_map = {str(loc.id): loc for loc in candidates}
    return [id_map[i] for i in top_ids if i in id_map]