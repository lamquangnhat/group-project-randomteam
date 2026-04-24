from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.models.location import Location

location_router = APIRouter(prefix="/locations", tags=["Locations"])


@location_router.get("/")
def get_locations(request: Request, db: Session = Depends(get_db)):
    user = request.state.user

    if user:
        print("User ID:", user.get("user_id"))
    else:
        print("No user")

    return db.query(Location).all()