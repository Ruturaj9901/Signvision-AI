"""
SignVision AI - Pydantic Schemas & DTOs
Validation models for API endpoints including user authentication.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Authentication Schemas
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, description="Unique username")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    full_name: Optional[str] = Field(None, max_length=128, description="User display name")


class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Account password")


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Movement & Vision Schemas
# ---------------------------------------------------------------------------

class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0 - 1.0]")
    y: float = Field(..., description="Normalized Y coordinate [0.0 - 1.0]")
    z: Optional[float] = Field(0.0, description="Normalized Z coordinate")
    visibility: Optional[float] = Field(1.0, description="Confidence visibility score")


class PredictRequest(BaseModel):
    landmarks: Optional[List[Dict[str, Any]]] = Field(
        None, 
        description="Current frame 33 MediaPipe pose landmarks"
    )
    history: Optional[List[List[Dict[str, Any]]]] = Field(
        None, 
        description="Temporal buffer of last N frames for dynamic gesture analysis (waving, nodding)"
    )
    source: Optional[str] = Field("live_camera", description="'live_camera' or 'simulation'")
    auto_save: Optional[bool] = Field(False, description="Whether to automatically store in SQLite history")


class PredictResponse(BaseModel):
    detected_movement: str
    confidence: float
    emoji: str
    generated_message: str
    tts_text: str
    category: str
    is_actionable: bool
    execution_time_ms: float
    model_type: str = "Heuristic-Kinematic"


class HistoryItem(BaseModel):
    id: int
    timestamp: str
    detected_movement: str
    confidence: float
    emoji: str
    generated_message: str
    source: str


class HistoryCreateRequest(BaseModel):
    detected_movement: str
    confidence: float
    emoji: str
    generated_message: str
    source: Optional[str] = "live_camera"


class GestureItem(BaseModel):
    id: str
    name: str
    category: str
    emoji: str
    message: str
    description: str
    tts_text: str
    priority: str
    intent: str


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    model_architecture: str
    database_status: str
    active_gestures_count: int
