import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status, Request
from pydantic import BaseModel
from beanie import PydanticObjectId
from app.core.config import settings
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenPayload(BaseModel):
    id: str
    email: Optional[str] = None
    name: Optional[str] = None

def create_access_token(user: User) -> str:
    # Use timezone-aware UTC datetime
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    if "h" in settings.ACCESS_TOKEN_EXPIRY:
        hours = int(settings.ACCESS_TOKEN_EXPIRY.replace("h", ""))
        expire = datetime.now(timezone.utc) + timedelta(hours=hours)
    elif "m" in settings.ACCESS_TOKEN_EXPIRY:
        mins = int(settings.ACCESS_TOKEN_EXPIRY.replace("m", ""))
        expire = datetime.now(timezone.utc) + timedelta(minutes=mins)

    to_encode = {
        "_id": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": expire
    }
    return jwt.encode(to_encode, settings.ACCESS_TOKEN_SECRET, algorithm="HS256")

def create_refresh_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    if "d" in settings.REFRESH_TOKEN_EXPIRY:
        days = int(settings.REFRESH_TOKEN_EXPIRY.replace("d", ""))
        expire = datetime.now(timezone.utc) + timedelta(days=days)

    to_encode = {
        "_id": str(user.id),
        "exp": expire
    }
    return jwt.encode(to_encode, settings.REFRESH_TOKEN_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> User:
    token = request.cookies.get("accessToken")
    if not token:
        # Check authorization header as fallback if needed, but normally it's in the cookie
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(token, settings.ACCESS_TOKEN_SECRET, algorithms=["HS256"])
        user_id: str = payload.get("_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await User.get(PydanticObjectId(user_id), with_children=True)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
