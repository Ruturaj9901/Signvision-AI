"""
SignVision AI - Backend Recognition Service
Integrates modular classifiers with assistive emoji mappings and TTS payload generation.
"""

import time
import os
import sys
from typing import List, Dict, Any, Optional

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from models.lstm_classifier import LSTMActionClassifier
from backend.gestures_data import SUPPORTED_GESTURES
from backend.schemas import PredictResponse

# Singleton instance of the modular classifier
weights_file = os.path.join(PROJECT_DIR, "models", "gesture_weights.json")
classifier_instance = LSTMActionClassifier(weights_path=weights_file)


def classify_pose_request(
    landmarks: Optional[List[Dict[str, float]]],
    history: Optional[List[List[Dict[str, float]]]] = None,
    source: str = "live_camera"
) -> PredictResponse:
    """
    Classify human movement from MediaPipe pose landmarks and generate
    the assistive communication package (emoji, message, TTS, category).
    """
    start_time = time.time()

    # Predict gesture using the modular engine
    detected_id, confidence = classifier_instance.predict(landmarks, history)

    # Retrieve gesture metadata
    gesture_meta = SUPPORTED_GESTURES.get(detected_id, SUPPORTED_GESTURES["resting"])

    elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
    is_actionable = (detected_id != "resting" and confidence >= 0.70)

    return PredictResponse(
        detected_movement=gesture_meta["name"],
        confidence=confidence,
        emoji=gesture_meta["emoji"],
        generated_message=gesture_meta["message"],
        tts_text=gesture_meta["tts_text"],
        category=gesture_meta["category"],
        is_actionable=is_actionable,
        execution_time_ms=elapsed_ms,
        model_type=classifier_instance.get_model_info().get("name", "SignVision-BiLSTM-Kinematic")
    )


def get_classifier_info() -> Dict[str, Any]:
    """Retrieve metadata about the currently active recognition model."""
    return classifier_instance.get_model_info()
