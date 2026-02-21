from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone
from enum import Enum
from itertools import count
from typing import Dict, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field

app = FastAPI(
    title="Users Service",
    description="Сервис управления пользователями и ролями",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


class UserRole(str, Enum):
    student = "student"
    commandant = "commandant"
    admin = "admin"


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: UserRole = UserRole.student
    room_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    password_hash: str


class UserOut(UserBase):
    id: int


class LoginIn(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=1)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class AssignRoomIn(BaseModel):
    room_id: Optional[int] = None


_user_id = count(1)
users: Dict[int, User] = {}
users_by_email: Dict[str, int] = {}


def _hash_password(password: str) -> str:
    # bcrypt has a 72-byte limit; pre-hash to a fixed-length hex string.
    normalized = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(normalized)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    normalized = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(normalized, hashed_password)


def _create_access_token(user: User) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, int(timedelta(minutes=JWT_EXPIRE_MINUTES).total_seconds())


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        room_id=user.room_id,
    )


def _get_user_by_email(email: str) -> Optional[User]:
    user_id = users_by_email.get(email.lower())
    if user_id is None:
        return None
    return users.get(user_id)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_exception

    user = users.get(user_id)
    if not user:
        raise credentials_exception
    return user


# Seed users for local MVP testing
seed_admin = User(
    id=next(_user_id),
    full_name="Admin User",
    email="admin@cmas.local",
    role=UserRole.admin,
    room_id=None,
    password_hash=_hash_password("admin123"),
)
users[seed_admin.id] = seed_admin
users_by_email[seed_admin.email.lower()] = seed_admin.id


@app.get("/")
async def root():
    return {"service": "Users Service", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate) -> UserOut:
    if _get_user_by_email(payload.email):
        raise HTTPException(status_code=409, detail="User with this email already exists")

    user = User(
        id=next(_user_id),
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role,
        room_id=payload.room_id,
        password_hash=_hash_password(payload.password),
    )
    users[user.id] = user
    users_by_email[user.email.lower()] = user.id
    return _to_user_out(user)


@app.post("/login", response_model=TokenOut)
async def login(payload: LoginIn) -> TokenOut:
    user = _get_user_by_email(payload.email)
    if not user or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token, expires_in = _create_access_token(user)
    return TokenOut(access_token=token, expires_in=expires_in, user=_to_user_out(user))


@app.get("/users", response_model=list[UserOut])
async def list_users(_: User = Depends(get_current_user)) -> list[UserOut]:
    return [_to_user_out(user) for user in users.values()]


@app.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: int, _: User = Depends(get_current_user)) -> UserOut:
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_out(user)


@app.put("/users/{user_id}/room", response_model=UserOut)
async def assign_room(
    user_id: int,
    payload: AssignRoomIn,
    _: User = Depends(get_current_user),
) -> UserOut:
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = user.model_copy(update={"room_id": payload.room_id})
    users[user_id] = updated
    return _to_user_out(updated)
