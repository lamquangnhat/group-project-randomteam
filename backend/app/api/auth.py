from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.utils import verify_google_token, create_jwt
from app.services import get_db, get_or_create_google_user, register_user, login_user

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

class TokenRequest(BaseModel):
    id_token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@auth_router.post("/google")
def google_auth(
    req: TokenRequest,
    db: Session = Depends(get_db)
):
    print(req.id_token)
    try:
        user_info = verify_google_token(req.id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_or_create_google_user(db, user_info)

    access_token = create_jwt(user)

    return {"access_token": access_token}

@auth_router.post("/register")
def register(
    req: RegisterRequest,
    db: Session = Depends(get_db)
):
    user = register_user(db, req.email, req.password)

    access_token = create_jwt(user)

    return {"access_token": access_token}

@auth_router.post("/login")
def login(
    req: LoginRequest,
    db: Session = Depends(get_db)
):
    user = login_user(db, req.email, req.password)

    access_token = create_jwt(user)

    return {"access_token": access_token}