import logging
from fastapi import Request
from jose import jwt, JWTError
from typing import Optional, Dict, Any
from .config import config

logger = logging.getLogger(__name__)


async def jwt_middleware(request: Request, call_next):
    request.state.user = None

    auth_header: Optional[str] = request.headers.get("Authorization")

    if not auth_header:
        logger.info("JWT: no Authorization header on %s %s", request.method, request.url.path)
    elif not auth_header.startswith("Bearer "):
        logger.warning("JWT: Authorization header missing 'Bearer ' prefix")
    else:
        token = auth_header.split(" ")[1]
        try:
            payload: Dict[str, Any] = jwt.decode(
                token,
                config.JWT_SECRET,
                algorithms=[config.JWT_ALGORITHM],
            )
            user_id = payload.get("user_id")
            logger.info("JWT: decoded OK — user_id=%s, exp=%s", user_id, payload.get("exp"))

            if not user_id:
                logger.error("JWT: token decoded but 'user_id' claim is missing. Payload keys: %s", list(payload.keys()))
            else:
                request.state.user = {
                    "user_id": user_id,
                    "exp": payload.get("exp"),
                    "raw": payload,
                }

        except JWTError as e:
            logger.error("JWT: decode failed — %s", e)
            request.state.user = None

    response = await call_next(request)
    return response