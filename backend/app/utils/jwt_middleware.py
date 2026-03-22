from fastapi import Request
from jose import jwt, JWTError
from typing import Optional, Dict, Any
from .config import config


async def jwt_middleware(request: Request, call_next):
    request.state.user = None

    auth_header: Optional[str] = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

        try:
            payload: Dict[str, Any] = jwt.decode(
                token,
                config.JWT_SECRET,
                algorithms=[config.JWT_ALGORITHM],
            )

            request.state.user = {
                "user_id": payload.get("sub"),
                "exp": payload.get("exp"),
                "raw": payload,
            }

        except JWTError:
            request.state.user = None

    response = await call_next(request)
    return response