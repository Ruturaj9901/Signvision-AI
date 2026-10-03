"""
SignVision AI - FastAPI Backend Server
Move. Express. Connect.
AI-Based Human Movement Recognition & Emoji-Based Communication for People with Mobility Disabilities.
Includes full User Authentication and Session Management backed by SQLite.
"""

import time
import os
import sys
import secrets
from datetime import datetime, timedelta
from typing import List, Optional

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.database import (
    init_db, get_db, User, UserSession, RecognitionHistory,
    hash_password, verify_password
)
from backend.schemas import (
    PredictRequest, PredictResponse, HistoryItem, HistoryCreateRequest,
    GestureItem, HealthResponse, UserRegisterRequest, UserLoginRequest,
    UserResponse, AuthResponse
)
from backend.classifier import classify_pose_request, get_classifier_info
from backend.gestures_data import SUPPORTED_GESTURES

# Initialize SQLite database schema
init_db()

# Application startup timestamp for uptime calculation
START_TIME = time.time()

app = FastAPI(
    title="SignVision AI API",
    description="Assistive Human Movement Recognition & Emoji Communication REST APIs with SQLite Authentication",
    version="1.0.0"
)

# Configure CORS for seamless frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Authentication Helper & Dependency
# ---------------------------------------------------------------------------

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Validate Bearer token and return active user."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1].strip()
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        return None

    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        return None

    user = db.query(User).filter(User.id == session.user_id).first()
    return user


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with hashed password and return auth token."""
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        or_(User.username == payload.username.strip(), User.email == payload.email.strip().lower())
    ).first()

    if existing_user:
        if existing_user.username == payload.username.strip():
            raise HTTPException(status_code=400, detail="Username is already taken.")
        else:
            raise HTTPException(status_code=400, detail="Email is already registered.")

    # Create user
    new_user = User(
        username=payload.username.strip(),
        email=payload.email.strip().lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip() if payload.full_name else payload.username.strip()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate session token (valid for 7 days)
    token = secrets.token_urlsafe(32)
    session = UserSession(
        token=token,
        user_id=new_user.id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**new_user.to_dict())
    )


@app.post("/api/auth/login", response_model=AuthResponse, tags=["Authentication"])
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with username/email and password, returning a session token."""
    login_id = payload.username.strip()
    user = db.query(User).filter(
        or_(User.username == login_id, User.email == login_id.lower())
    ).first()

    if not user or not verify_password(user.hashed_password, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Generate session token (valid for 7 days)
    token = secrets.token_urlsafe(32)
    session = UserSession(
        token=token,
        user_id=user.id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user.to_dict())
    )


@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_current_user_profile(
    current_user: Optional[User] = Depends(get_current_user)
):
    """Retrieve profile of the currently logged-in user."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated or session expired."
        )
    return UserResponse(**current_user.to_dict())


@app.post("/api/auth/logout", tags=["Authentication"])
def logout_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Invalidate current user session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        session = db.query(UserSession).filter(UserSession.token == token).first()
        if session:
            db.delete(session)
            db.commit()
    return {"status": "success", "message": "Successfully logged out."}


# ---------------------------------------------------------------------------
# Movement & Vision Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Returns server operational status, active model information, and database status."""
    return HealthResponse(
        status="operational",
        app_name="SignVision AI – Move. Express. Connect.",
        version="1.0.0",
        model_architecture="Modular BiLSTM / Kinematic Spatial-Temporal Engine",
        database_status="connected (SQLite)",
        active_gestures_count=len(SUPPORTED_GESTURES)
    )


@app.post("/api/predict", response_model=PredictResponse, tags=["Inference"])
def predict_movement(
    payload: PredictRequest,
    db: Session = Depends(get_db)
):
    """
    Receives current MediaPipe pose landmarks (and optional rolling temporal frames).
    Returns classified movement, confidence score, emoji, generated assistive message, and TTS text.
    If payload.auto_save is True and gesture is actionable, saves entry to SQLite.
    """
    result = classify_pose_request(
        landmarks=payload.landmarks,
        history=payload.history,
        source=payload.source or "live_camera"
    )

    # Automatically save actionable gestures if requested
    if payload.auto_save and result.is_actionable:
        try:
            history_record = RecognitionHistory(
                detected_movement=result.detected_movement,
                confidence=result.confidence,
                emoji=result.emoji,
                generated_message=result.generated_message,
                source=payload.source or "live_camera"
            )
            db.add(history_record)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Error saving history]: {e}")

    return result


@app.get("/api/gestures", response_model=List[GestureItem], tags=["Gestures"])
def get_supported_gestures():
    """Returns the full catalog of supported gestures with their emojis and assistive messages."""
    return [GestureItem(**gesture) for gesture in SUPPORTED_GESTURES.values()]


@app.get("/api/history", response_model=List[HistoryItem], tags=["History"])
def get_recognition_history(
    limit: int = Query(50, ge=1, le=500, description="Max number of records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    source: Optional[str] = Query(None, description="Filter by source: live_camera or simulation"),
    db: Session = Depends(get_db)
):
    """Retrieves recent recognition history records ordered by timestamp descending."""
    query = db.query(RecognitionHistory)
    if source:
        query = query.filter(RecognitionHistory.source == source)
    
    records = query.order_by(desc(RecognitionHistory.timestamp)).offset(offset).limit(limit).all()
    return [HistoryItem(**r.to_dict()) for r in records]


@app.post("/api/history", response_model=HistoryItem, status_code=status.HTTP_201_CREATED, tags=["History"])
def add_history_entry(
    payload: HistoryCreateRequest,
    db: Session = Depends(get_db)
):
    """Manually append a recognition event or phrase to the history log."""
    record = RecognitionHistory(
        detected_movement=payload.detected_movement,
        confidence=payload.confidence,
        emoji=payload.emoji,
        generated_message=payload.generated_message,
        source=payload.source or "live_camera"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return HistoryItem(**record.to_dict())


@app.delete("/api/history/clear", tags=["History"])
def clear_history(db: Session = Depends(get_db)):
    """Clears all stored recognition history from the SQLite database."""
    try:
        deleted_count = db.query(RecognitionHistory).delete()
        db.commit()
        return {
            "status": "success",
            "message": f"Cleared {deleted_count} recognition history records.",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")


@app.get("/api/statistics", tags=["Analytics"])
def get_statistics(db: Session = Depends(get_db)):
    """Returns aggregated stats: total recognition count, gesture frequencies, and session overview."""
    total_records = db.query(RecognitionHistory).count()
    records = db.query(RecognitionHistory).all()

    freq = {}
    for r in records:
        freq[r.detected_movement] = freq.get(r.detected_movement, 0) + 1

    top_gestures = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "total_recognitions": total_records,
        "top_gestures": [{"gesture": g, "count": c} for g, c in top_gestures],
        "uptime_seconds": round(time.time() - START_TIME, 1)
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Starting SignVision AI Backend on http://127.0.0.1:8000")
    print("Swagger Docs available at: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
