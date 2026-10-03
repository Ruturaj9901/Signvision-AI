"""
SignVision AI - Gesture Catalog & Emoji Assistive Mapping
Defines supported human movements, emojis, assistive messages, and descriptions.
"""

SUPPORTED_GESTURES = {
    "hand_raise_right": {
        "id": "hand_raise_right",
        "name": "Right Hand Raise",
        "category": "Upper Body",
        "emoji": "🙋‍♂️",
        "message": "I need assistance, please.",
        "description": "Right hand elevated above shoulder level.",
        "tts_text": "I need assistance, please.",
        "priority": "high",
        "intent": "assistance"
    },
    "hand_raise_left": {
        "id": "hand_raise_left",
        "name": "Left Hand Raise",
        "category": "Upper Body",
        "emoji": "🙋",
        "message": "I have a question or need attention.",
        "description": "Left hand elevated above shoulder level.",
        "tts_text": "I have a question or need attention.",
        "priority": "high",
        "intent": "attention"
    },
    "both_hands_raise": {
        "id": "both_hands_raise",
        "name": "Both Hands Raised",
        "category": "Upper Body",
        "emoji": "🙆",
        "message": "Yes! I strongly agree and feel great.",
        "description": "Both hands raised above head / shoulders.",
        "tts_text": "Yes! I strongly agree and feel great.",
        "priority": "high",
        "intent": "agreement"
    },
    "wave_hand": {
        "id": "wave_hand",
        "name": "Waving Hand",
        "category": "Dynamic Gesture",
        "emoji": "👋",
        "message": "Hello! Nice to see you.",
        "description": "Hand raised with side-to-side oscillation over frames.",
        "tts_text": "Hello! Nice to see you.",
        "priority": "normal",
        "intent": "greeting"
    },
    "head_nod": {
        "id": "head_nod",
        "name": "Head Nod (Affirmation)",
        "category": "Head & Neck",
        "emoji": "🙇",
        "message": "Yes, I understand and agree.",
        "description": "Downward and upward head pitch displacement.",
        "tts_text": "Yes, I understand and agree.",
        "priority": "normal",
        "intent": "confirmation"
    },
    "head_tilt_left": {
        "id": "head_tilt_left",
        "name": "Head Tilt Left",
        "category": "Head & Neck",
        "emoji": "🤔",
        "message": "I am thinking / Maybe.",
        "description": "Head tilted towards the left shoulder.",
        "tts_text": "I am thinking, maybe.",
        "priority": "normal",
        "intent": "pondering"
    },
    "head_tilt_right": {
        "id": "head_tilt_right",
        "name": "Head Tilt Right",
        "category": "Head & Neck",
        "emoji": "❓",
        "message": "Could you clarify that for me?",
        "description": "Head tilted towards the right shoulder.",
        "tts_text": "Could you clarify that for me?",
        "priority": "normal",
        "intent": "question"
    },
    "body_lean_left": {
        "id": "body_lean_left",
        "name": "Body Lean Left",
        "category": "Torso Movement",
        "emoji": "👈",
        "message": "No / Navigate Left / Previous item.",
        "description": "Upper torso tilted significantly to the left of the hips.",
        "tts_text": "No, navigate left or previous.",
        "priority": "normal",
        "intent": "navigation_left"
    },
    "body_lean_right": {
        "id": "body_lean_right",
        "name": "Body Lean Right",
        "category": "Torso Movement",
        "emoji": "👉",
        "message": "Yes / Navigate Right / Next item.",
        "description": "Upper torso tilted significantly to the right of the hips.",
        "tts_text": "Yes, navigate right or next.",
        "priority": "normal",
        "intent": "navigation_right"
    },
    "hands_together": {
        "id": "hands_together",
        "name": "Hands Together (Namaste / Thanks)",
        "category": "Upper Body",
        "emoji": "🙏",
        "message": "Thank you so much / Please.",
        "description": "Wrists brought together near chest center.",
        "tts_text": "Thank you so much. Please.",
        "priority": "high",
        "intent": "gratitude"
    },
    "open_arms": {
        "id": "open_arms",
        "name": "Open Arms / Welcome",
        "category": "Upper Body",
        "emoji": "🫂",
        "message": "Welcome! I feel comfortable.",
        "description": "Both arms extended wide outwards from shoulders.",
        "tts_text": "Welcome! I feel comfortable.",
        "priority": "normal",
        "intent": "welcome"
    },
    "salute": {
        "id": "salute",
        "name": "Salute / Ready",
        "category": "Upper Body",
        "emoji": "🫡",
        "message": "Understood! I am ready.",
        "description": "Hand brought up to brow/forehead level.",
        "tts_text": "Understood! I am ready.",
        "priority": "normal",
        "intent": "acknowledgement"
    },
    "resting": {
        "id": "resting",
        "name": "Resting / Neutral Pose",
        "category": "Baseline",
        "emoji": "🧘",
        "message": "Neutral posture. Relaxed.",
        "description": "Body in resting or upright neutral state without active gesture.",
        "tts_text": "",
        "priority": "low",
        "intent": "idle"
    }
}
