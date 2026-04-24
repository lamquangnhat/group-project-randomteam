from sqlalchemy.orm import Session
from app.models.user import User
from app.utils import hash_password

def get_user_by_provider(db: Session, provider: str, provider_id: str):
    return db.query(User).filter(
        User.provider == provider,
        User.provider_id == provider_id
    ).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    email: str,
    provider: str,
    provider_id: str,
    full_name: str = None,
    password: str = None,
):
    user = User(
        email=email,
        provider=provider,
        provider_id=provider_id,
        full_name=full_name,
        hashed_password=hash_password(password) if password else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user