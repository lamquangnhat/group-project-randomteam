# q — searches across name, city, country, category, description all at once using ILIKE (case-insensitive)
# category — optional filter to narrow by category
# country — optional filter to narrow by country
# limit/offset — pagination support so you don't return 1000 results at once
# total — returns total count so frontend can show "Found 5 results"

from sqlalchemy.orm import Session
from app.models.location import Location


def search_locations(
    db: Session,
    q: str = "",
    category: str = "",
    country: str = "",
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """
    Search locations by keyword across name, city, country, category, description.
    Optionally filter by category and country.
    """
    query = db.query(Location)

    # Keyword search across multiple columns
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            Location.name.ilike(search_term) |
            Location.city.ilike(search_term) |
            Location.country.ilike(search_term) |
            Location.category.ilike(search_term) |
            Location.description.ilike(search_term)
        )

    # Optional filters
    if category:
        query = query.filter(Location.category.ilike(f"%{category}%"))

    if country:
        query = query.filter(Location.country.ilike(f"%{country}%"))

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    locations = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": [_to_dict(loc) for loc in locations]
    }


def _to_dict(location: Location) -> dict:
    return {
        "id": str(location.id),
        "name": location.name,
        "description": location.description,
        "image_url": location.image_url,
        "address": location.address,
        "city": location.city,
        "country": location.country,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "category": location.category,
        "avg_rating": location.avg_rating,
        "total_reviews": location.total_reviews,
    }