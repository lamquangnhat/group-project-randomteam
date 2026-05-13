from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.services.database import get_db
from app.services.location_crawl_service import (
    crawl_and_save_location,
    crawl_bulk_locations,
    _to_dict,
)
from app.services.location_service import search_locations
from app.models.location import Location

location_router = APIRouter(prefix="/locations", tags=["Locations"])


# ─── Request Schemas ──────────────────────────────────────────────────────────

class CrawlSingleRequest(BaseModel):
    name: str
    category: str
    country: str = ""


class CrawlBulkRequest(BaseModel):
    places: list[CrawlSingleRequest]


# ─── Get All Locations ────────────────────────────────────────────────────────

@location_router.get("/")
def get_locations(request: Request, db: Session = Depends(get_db)):
    user = request.state.user
    if user:
        print("User ID:", user.get("user_id"))
    else:
        print("No user")
    return db.query(Location).all()


# ─── Search Locations ─────────────────────────────────────────────────────────
# Search endpoint added
@location_router.get("/search")
def search(
    q: str = Query(default="", description="Search keyword"),
    category: str = Query(default="", description="Filter by category"),
    country: str = Query(default="", description="Filter by country"),
    limit: int = Query(default=20, ge=1, le=100, description="Results per page"),
    offset: int = Query(default=0, ge=0, description="Skip N results"),
    db: Session = Depends(get_db),
):
    """
    Search locations by keyword.
    Examples:
    - /locations/search?q=bali
    - /locations/search?q=beach&category=beach
    - /locations/search?q=asia&country=Japan
    - /locations/search?q=paris&limit=5&offset=0
    """
    return search_locations(
        db=db,
        q=q,
        category=category,
        country=country,
        limit=limit,
        offset=offset,
    )


# ─── Get Single Location ──────────────────────────────────────────────────────

@location_router.get("/{location_id}")
def get_location(location_id: str, db: Session = Depends(get_db)):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return _to_dict(location)


# ─── Crawl Single Location ────────────────────────────────────────────────────

@location_router.post("/crawl/single")
async def crawl_single(payload: CrawlSingleRequest, db: Session = Depends(get_db)):
    """
    Crawl one destination from Wikipedia + OpenStreetMap and save to DB.
    Example body: { "name": "Bali", "category": "beach", "country": "Indonesia" }
    """
    result = await crawl_and_save_location(
        place_name=payload.name,
        category=payload.category,
        db=db,
        country=payload.country,
    )
    return result


# ─── Crawl Bulk Locations ─────────────────────────────────────────────────────

@location_router.post("/crawl/bulk")
async def crawl_bulk(payload: CrawlBulkRequest, db: Session = Depends(get_db)):
    """
    Crawl multiple destinations at once.
    Example body:
    {
      "places": [
        { "name": "Paris", "category": "city", "country": "France" },
        { "name": "Bali",  "category": "beach", "country": "Indonesia" }
      ]
    }
    """
    results = await crawl_bulk_locations(
        [p.model_dump() for p in payload.places], db
    )
    return {"total": len(results), "results": results}

#Fixing wiki response
@location_router.get("/debug/wikipedia")
async def debug_wikipedia(name: str = Query(default="Bali")):
    """Temporary debug endpoint to test Wikipedia API response."""
    import httpx
    
    results = {}
    
    # Test 1 — Direct lookup
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{name.replace(' ', '_')}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10)
            results["direct_status"] = response.status_code
            results["direct_data"] = response.json()
        except Exception as e:
            results["direct_error"] = str(e)

        # Test 2 — Search API
        try:
            search_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": name,
                "format": "json",
                "srlimit": 1,
            }
            search_response = await client.get(search_url, params=params, timeout=10)
            results["search_status"] = search_response.status_code
            results["search_data"] = search_response.json()
        except Exception as e:
            results["search_error"] = str(e)

    return results