"""
SignVision AI - Modular Base Classifier
Abstract Base Class for plug-and-play movement classification algorithms.
Supports heuristic, geometric, random forest, and deep learning (CNN/LSTM) backends.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple


class BaseMovementClassifier(ABC):
    """
    Abstract interface for all SignVision movement recognition models.
    Enables hot-swapping between rule-based kinematic reasoning,
    SVM/RandomForest, and PyTorch/TensorFlow temporal neural networks.
    """

    @abstractmethod
    def predict(
        self,
        current_landmarks: Optional[List[Dict[str, float]]],
        history_frames: Optional[List[List[Dict[str, float]]]] = None
    ) -> Tuple[str, float]:
        """
        Classify movement from current landmark frame and optional historical buffer.
        
        Args:
            current_landmarks: List of 33 MediaPipe pose landmarks for current frame.
            history_frames: Optional list of past N landmark frames for temporal gestures.
            
        Returns:
            Tuple[gesture_id, confidence_score]
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Return metadata about model architecture, version, and training status."""
        pass
