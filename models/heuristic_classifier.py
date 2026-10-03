"""
SignVision AI - Geometric & Kinematic Movement Classifier
Implements real-time spatial and temporal gesture classification on MediaPipe Pose landmarks.
"""

import math
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from .base_classifier import BaseMovementClassifier

# MediaPipe Pose Landmark Indices
NOSE = 0
LEFT_EYE = 2
RIGHT_EYE = 5
LEFT_EAR = 7
RIGHT_EAR = 8
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24


def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """Calculate 2D interior angle at vertex b between segments ba and bc in degrees."""
    v1 = np.array([a[0] - b[0], a[1] - b[1]])
    v2 = np.array([c[0] - b[0], c[1] - b[1]])
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 < 1e-6 or norm2 < 1e-6:
        return 0.0
    cosine = np.dot(v1, v2) / (norm1 * norm2)
    cosine = np.clip(cosine, -1.0, 1.0)
    return math.degrees(math.acos(cosine))


def euclidean_dist(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate 2D Euclidean distance between two points."""
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


class HeuristicMovementClassifier(BaseMovementClassifier):
    """
    Kinematic rules engine computing joint angles, anatomical distances,
    and velocity trajectories across temporal frames.
    """

    def __init__(self):
        self.version = "1.2.0"

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": "SignVision Kinematic-Temporal Engine",
            "version": self.version,
            "type": "Heuristic Geometric & Temporal Rules Engine",
            "is_trainable": False,
            "latency": "< 2ms",
            "supported_categories": ["Upper Body", "Head & Neck", "Torso Movement", "Dynamic Gesture"]
        }

    def predict(
        self,
        current_landmarks: Optional[List[Dict[str, float]]],
        history_frames: Optional[List[List[Dict[str, float]]]] = None
    ) -> Tuple[str, float]:
        if not current_landmarks or len(current_landmarks) < 25:
            return "resting", 0.90

        # Helper to extract (x, y) safely
        def pt(idx: int) -> Tuple[float, float]:
            if idx < len(current_landmarks):
                lm = current_landmarks[idx]
                return (float(lm.get("x", 0.0)), float(lm.get("y", 0.0)))
            return (0.0, 0.0)

        # Key Landmarks
        nose = pt(NOSE)
        l_sh = pt(LEFT_SHOULDER)
        r_sh = pt(RIGHT_SHOULDER)
        l_el = pt(LEFT_ELBOW)
        r_el = pt(RIGHT_ELBOW)
        l_wr = pt(LEFT_WRIST)
        r_wr = pt(RIGHT_WRIST)
        l_hip = pt(LEFT_HIP)
        r_hip = pt(RIGHT_HIP)

        # Baseline body metrics for scale invariance
        shoulder_width = euclidean_dist(l_sh, r_sh)
        if shoulder_width < 0.01:
            shoulder_width = 0.2  # Fallback scale

        mid_shoulder = ((l_sh[0] + r_sh[0]) / 2.0, (l_sh[1] + r_sh[1]) / 2.0)
        mid_hip = ((l_hip[0] + r_hip[0]) / 2.0, (l_hip[1] + r_hip[1]) / 2.0)

        # -------------------------------------------------------------
        # 1. Temporal Dynamic Analysis: Hand Wave & Head Nod
        # -------------------------------------------------------------
        if history_frames and len(history_frames) >= 5:
            # Check for Hand Wave: wrist oscillating horizontally while elevated
            wave_detected, wave_conf = self._detect_wave(history_frames, shoulder_width)
            if wave_detected:
                return "wave_hand", wave_conf

            # Check for Head Nod: cyclic vertical displacement of nose relative to shoulders
            nod_detected, nod_conf = self._detect_nod(history_frames, shoulder_width)
            if nod_detected:
                return "head_nod", nod_conf

        # -------------------------------------------------------------
        # 2. Upper Body Raised Gestures (MediaPipe y=0 is top, y=1 is bottom)
        # -------------------------------------------------------------
        # Note: Elevated hands means wrist.y < shoulder.y
        l_hand_raised = l_wr[1] < (l_sh[1] - 0.03)
        r_hand_raised = r_wr[1] < (r_sh[1] - 0.03)

        # Both Hands Raised
        if l_hand_raised and r_hand_raised:
            # Check elevation height above shoulders
            elevation = ((l_sh[1] - l_wr[1]) + (r_sh[1] - r_wr[1])) / 2.0
            conf = min(0.99, max(0.80, 0.80 + (elevation / shoulder_width) * 0.15))
            return "both_hands_raise", round(conf, 2)

        # Left Hand Raised (Note: User's left side)
        if l_hand_raised and not r_hand_raised:
            elevation = l_sh[1] - l_wr[1]
            conf = min(0.98, max(0.78, 0.78 + (elevation / shoulder_width) * 0.18))
            return "hand_raise_left", round(conf, 2)

        # Right Hand Raised
        if r_hand_raised and not l_hand_raised:
            elevation = r_sh[1] - r_wr[1]
            conf = min(0.98, max(0.78, 0.78 + (elevation / shoulder_width) * 0.18))
            return "hand_raise_right", round(conf, 2)

        # -------------------------------------------------------------
        # 3. Salute Gesture: Hand elevated near temple/forehead with bent elbow
        # -------------------------------------------------------------
        r_wrist_to_nose = euclidean_dist(r_wr, nose)
        l_wrist_to_nose = euclidean_dist(l_wr, nose)
        r_elbow_angle = calculate_angle(r_sh, r_el, r_wr)
        l_elbow_angle = calculate_angle(l_sh, l_el, l_wr)

        if (r_wrist_to_nose < 0.7 * shoulder_width and r_wr[1] <= nose[1] + 0.05 and 40 < r_elbow_angle < 120):
            return "salute", 0.91
        if (l_wrist_to_nose < 0.7 * shoulder_width and l_wr[1] <= nose[1] + 0.05 and 40 < l_elbow_angle < 120):
            return "salute", 0.91

        # -------------------------------------------------------------
        # 4. Hands Together (Namaste / Prayer / Gratitude)
        # -------------------------------------------------------------
        wrist_dist = euclidean_dist(l_wr, r_wr)
        wrists_chest_height = (l_wr[1] > l_sh[1]) and (l_wr[1] < l_hip[1]) and (r_wr[1] > r_sh[1]) and (r_wr[1] < r_hip[1])
        if wrist_dist < (0.45 * shoulder_width) and wrists_chest_height:
            conf = min(0.96, max(0.80, 1.0 - (wrist_dist / (0.45 * shoulder_width)) * 0.2))
            return "hands_together", round(conf, 2)

        # -------------------------------------------------------------
        # 5. Open Arms Gesture: Both arms extended outwards
        # -------------------------------------------------------------
        if l_elbow_angle > 135 and r_elbow_angle > 135:
            arm_span = abs(l_wr[0] - r_wr[0])
            if arm_span > (1.8 * shoulder_width) and l_wr[1] > (l_sh[1] - 0.1) and l_wr[1] < (l_hip[1] + 0.1):
                return "open_arms", 0.89

        # -------------------------------------------------------------
        # 6. Torso Lateral Movement (Body Lean Left / Right)
        # -------------------------------------------------------------
        # Calculate horizontal lean of mid_shoulder relative to mid_hip
        torso_dx = mid_shoulder[0] - mid_hip[0]
        torso_dy = mid_hip[1] - mid_shoulder[1]  # vertical distance
        if torso_dy > 0.05:
            lean_ratio = torso_dx / torso_dy
            # Significant lean threshold
            if lean_ratio < -0.22:
                conf = min(0.95, max(0.78, 0.75 + abs(lean_ratio) * 0.3))
                return "body_lean_left", round(conf, 2)
            elif lean_ratio > 0.22:
                conf = min(0.95, max(0.78, 0.75 + abs(lean_ratio) * 0.3))
                return "body_lean_right", round(conf, 2)

        # -------------------------------------------------------------
        # 7. Head & Neck Lateral Movement (Head Tilt Left / Right)
        # -------------------------------------------------------------
        neck_dx = nose[0] - mid_shoulder[0]
        neck_dy = mid_shoulder[1] - nose[1]
        if neck_dy > 0.03:
            neck_ratio = neck_dx / neck_dy
            # Head tilt thresholds
            if neck_ratio < -0.30:
                conf = min(0.93, max(0.75, 0.72 + abs(neck_ratio) * 0.3))
                return "head_tilt_left", round(conf, 2)
            elif neck_ratio > 0.30:
                conf = min(0.93, max(0.75, 0.72 + abs(neck_ratio) * 0.3))
                return "head_tilt_right", round(conf, 2)

        # Default Neutral Baseline
        return "resting", 0.92

    def _detect_wave(self, history: List[List[Dict[str, float]]], shoulder_width: float) -> Tuple[bool, float]:
        """Detect side-to-side oscillation of elevated wrist over temporal window."""
        try:
            # Look at right and left wrist x-positions over frames
            rw_xs = []
            rw_ys = []
            lw_xs = []
            lw_ys = []
            rsh_ys = []
            lsh_ys = []

            for frame in history[-15:]:
                if len(frame) > 16:
                    rw_xs.append(frame[RIGHT_WRIST].get("x", 0.0))
                    rw_ys.append(frame[RIGHT_WRIST].get("y", 1.0))
                    lw_xs.append(frame[LEFT_WRIST].get("x", 0.0))
                    lw_ys.append(frame[LEFT_WRIST].get("y", 1.0))
                    rsh_ys.append(frame[RIGHT_SHOULDER].get("y", 1.0))
                    lsh_ys.append(frame[LEFT_SHOULDER].get("y", 1.0))

            # Check right hand wave
            if len(rw_xs) >= 6:
                avg_rw_y = sum(rw_ys) / len(rw_ys)
                avg_rsh_y = sum(rsh_ys) / len(rsh_ys)
                if avg_rw_y < (avg_rsh_y + 0.05):  # Hand near or above shoulder
                    x_span = max(rw_xs) - min(rw_xs)
                    # Check for horizontal direction changes (oscillation)
                    diffs = [rw_xs[i] - rw_xs[i-1] for i in range(1, len(rw_xs))]
                    sign_changes = sum(1 for i in range(1, len(diffs)) if (diffs[i] * diffs[i-1] < 0 and abs(diffs[i]) > 0.01))
                    if x_span > (0.28 * shoulder_width) and sign_changes >= 2:
                        return True, 0.92

            # Check left hand wave
            if len(lw_xs) >= 6:
                avg_lw_y = sum(lw_ys) / len(lw_ys)
                avg_lsh_y = sum(lsh_ys) / len(lsh_ys)
                if avg_lw_y < (avg_lsh_y + 0.05):
                    x_span = max(lw_xs) - min(lw_xs)
                    diffs = [lw_xs[i] - lw_xs[i-1] for i in range(1, len(lw_xs))]
                    sign_changes = sum(1 for i in range(1, len(diffs)) if (diffs[i] * diffs[i-1] < 0 and abs(diffs[i]) > 0.01))
                    if x_span > (0.28 * shoulder_width) and sign_changes >= 2:
                        return True, 0.92
        except Exception:
            pass

        return False, 0.0

    def _detect_nod(self, history: List[List[Dict[str, float]]], shoulder_width: float) -> Tuple[bool, float]:
        """Detect vertical cyclic displacement of nose relative to neck/shoulders."""
        try:
            nose_ys = []
            sh_ys = []
            for frame in history[-15:]:
                if len(frame) > 12:
                    nose_ys.append(frame[NOSE].get("y", 0.0))
                    sh_y = (frame[LEFT_SHOULDER].get("y", 0.0) + frame[RIGHT_SHOULDER].get("y", 0.0)) / 2.0
                    sh_ys.append(sh_y)

            if len(nose_ys) >= 8:
                # Relative nose distance from shoulders
                rel_ys = [sh_ys[i] - nose_ys[i] for i in range(len(nose_ys))]
                y_span = max(rel_ys) - min(rel_ys)
                diffs = [rel_ys[i] - rel_ys[i-1] for i in range(1, len(rel_ys))]
                sign_changes = sum(1 for i in range(1, len(diffs)) if (diffs[i] * diffs[i-1] < 0 and abs(diffs[i]) > 0.005))
                if y_span > (0.12 * shoulder_width) and sign_changes >= 2:
                    return True, 0.88
        except Exception:
            pass

        return False, 0.0
