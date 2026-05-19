from google.oauth2 import id_token
from google.auth.transport import requests
from .config import config
from jose import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID

def verify_google_token(token: str):
    idinfo = id_token.verify_oauth2_token(
        token,
        requests.Request(),
        GOOGLE_CLIENT_ID
    )
    return idinfo


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_jwt(user):
    payload = {
        "user_id": str(user.id),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")