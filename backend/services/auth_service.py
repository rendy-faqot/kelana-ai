import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.user import User
from database import SessionLocal


# ── JWT config ────────────────────────────────────────────────────────────────
_SECRET_KEY  = os.getenv("JWT_SECRET_KEY", "change-me-to-a-long-random-secret")
_ALGORITHM   = os.getenv("JWT_ALGORITHM",  "HS256")
_EXPIRE_MINS = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

_bearer_scheme = HTTPBearer()


# ── DB session dependency ─────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt. Returns the hash as a UTF-8 string."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ── Token helpers ─────────────────────────────────────────────────────────────

def _create_access_token(user_id: int, email: str) -> str:
    """Create a signed JWT containing the user's id and email."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=_EXPIRE_MINS),
    }
    return jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> User:
    """
    FastAPI dependency — decode the Bearer JWT and return the matching User.
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Auth operations ───────────────────────────────────────────────────────────

def register_user(db: Session, name: str, email: str, password: str) -> User:
    """
    Create and persist a new User.

    Raises ValueError if the email is already taken.
    The caller is responsible for managing the session lifecycle.
    """
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        name          = name,
        email         = email,
        password_hash = hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """
    Validate credentials and return a JWT token response.

    Returns {"access_token": "...", "token_type": "bearer"}.
    Raises ValueError on invalid email or wrong password.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    token = _create_access_token(user.id, user.email)
    return {"access_token": token, "token_type": "bearer"}
