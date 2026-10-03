"""
SignVision AI - Database Layer
SQLite-backed persistence for recognition history, user accounts, and authentication sessions.
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Path configuration using relative resolution for portability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DB_DIR = os.path.join(PROJECT_DIR, "database")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "signvision.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with unique 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verify provided password against PBKDF2 hashed password string."""
    try:
        salt, key_hex = stored_password.split("$")
        new_key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False


class User(Base):
    """
    Stores registered user accounts with securely hashed passwords.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=True)
    role = Column(String(32), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name or self.username,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserSession(Base):
    """
    Tracks active authentication bearer tokens with expiration.
    """
    __tablename__ = "user_sessions"

    token = Column(String(128), primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class RecognitionHistory(Base):
    """
    Stores human movement recognition events with confidence scores,
    associated assistive emojis, generated speech messages, and input source.
    """
    __tablename__ = "recognition_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    detected_movement = Column(String(64), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    emoji = Column(String(16), nullable=False)
    generated_message = Column(String(256), nullable=False)
    source = Column(String(32), default="live_camera")  # "live_camera" or "simulation"

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else datetime.utcnow().isoformat(),
            "detected_movement": self.detected_movement,
            "confidence": round(float(self.confidence), 3),
            "emoji": self.emoji,
            "generated_message": self.generated_message,
            "source": self.source,
        }


def init_db():
    """Create all tables and seed default demo user if needed."""
    Base.metadata.create_all(bind=engine)

    # Seed default demo account if no users exist
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            demo_user = User(
                username="demo",
                email="demo@signvision.ai",
                hashed_password=hash_password("demo123"),
                full_name="Demo User",
                role="user"
            )
            db.add(demo_user)
            db.commit()
            print("[Database] Seeded initial demo user: username='demo', password='demo123'")
    except Exception as e:
        db.rollback()
        print(f"[Database Error seeding demo user]: {e}")
    finally:
        db.close()


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
