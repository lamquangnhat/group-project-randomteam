from sqlalchemy.orm import Session
from .user_service import get_user_by_provider, get_user_by_email, create_user
from app.utils import verify_password
from fastapi import HTTPException


# GOOGLE
def get_or_create_google_user(db: Session, user_info: dict):
    google_id = user_info["sub"]
    email = user_info.get("email")

    user = get_user_by_provider(db, "google", google_id)
    if user:
        return user

    if email:
        user = get_user_by_email(db, email)
        if user:
            user.provider = "google"
            user.provider_id = google_id
            db.commit()
            db.refresh(user)
            return user

    return create_user(
        db=db,
        email=email,
        provider="google",
        provider_id=google_id,
        full_name=user_info.get("name"),
    )

# LOCAL
def register_user(db: Session, email: str, password: str):
    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(
        db=db,
        email=email,
        provider="local",
        provider_id=email,
        password=password
    )


def login_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")


    if not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user