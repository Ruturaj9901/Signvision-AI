# SignVision AI – Move. Express. Connect.
> **AI-Based Human Movement Recognition and Emoji-Based Communication for People with Mobility Disabilities**
> *Final-Year Engineering AI/ML Capstone Project*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![MediaPipe](https://img.shields.io/badge/Google-MediaPipe%20Pose-4285F4.svg)](https://developers.google.com/mediapipe)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://sqlite.org)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.1%20Compliant-success.svg)](#accessibility)

---

## 📌 Problem Statement & Overview

Individuals affected by severe motor impairments—such as **Amyotrophic Lateral Sclerosis (ALS)**, **cerebral palsy**, **quadriplegia/paraplegia**, or **post-stroke motor deficits**—frequently face significant barriers to spoken and written communication. Traditional Assistive and Augmentative Communication (AAC) systems are often prohibitively expensive, require invasive brain-computer interfaces, or demand fine-motor finger dexterity that many individuals do not possess.

**SignVision AI** solves this problem by using standard consumer webcams and browser-native AI to detect intentional upper-body and head movements. It translates these physical movements into:
1. **Expressive High-Contrast Emojis** (instantly understood across cultural and language barriers).
2. **Audible Text-to-Speech (TTS) Voice Messages** (allowing users to verbally address caregivers and family members).
3. **Persistent Communication Audits** (stored securely in a local SQLite database).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        Cam[Webcam Input @ 30 FPS] --> MP[MediaPipe Pose Estimator]
        MP --> Skele[33 3D Keypoint Extraction]
        Skele --> Canvas[Real-Time Skeleton Canvas Overlay]
        Skele --> Buffer[Rolling Temporal Frame Buffer (16 Frames)]
        Buffer --> APIReq[REST API /api/predict]
        Sim[Simulation Mode / Virtual Avatar] -.-> APIReq
    end

    subgraph Server["Backend Server (FastAPI + Python 3.11)"]
        APIReq --> Router[FastAPI Inference Router]
        Router --> Norm[Geometric Normalization Engine]
        Norm --> Angles[Joint Angles & Velocity Analyzer]
        Angles --> Classifier{Modular Classifier}
        Classifier --> Heuristic[Spatial Kinematics Engine]
        Classifier --> BiLSTM[Temporal BiLSTM Neural Model]
        Heuristic --> Decision[Movement & Confidence Scoring]
        BiLSTM --> Decision
        Decision --> Catalog[Emoji & Assistive Catalog Mapping]
    end

    subgraph Storage["Persistence & Audio"]
        Decision --> DB[(SQLite Database: signvision.db)]
        Decision --> TTS[Browser Web Speech API Synthesis]
        Catalog --> Comm[Augmentative Communication Board]
    end
```

---

## 🌟 Key Features

### 1. Vision & Gesture Recognition
- **Google MediaPipe Pose**: 33 anatomical 3D landmark points tracked at up to 30 FPS with sub-millisecond inference.
- **Biomechanical Scale Invariance**: Normalizes joint positions against inter-shoulder distance and hip center, rendering recognition immune to user distance from the camera.
- **Dynamic Temporal Analysis**: Rolling temporal buffer detects oscillating movements like hand waving and head nodding without false positives.

### 2. Supported Gestures & Assistive Emojis

| Gesture Name | Emoji | Assistive Spoken Expression | Anatomical Cue |
| :--- | :---: | :--- | :--- |
| **Right Hand Raise** | 🙋‍♂️ | *"I need assistance, please."* | Right wrist elevated above right shoulder |
| **Left Hand Raise** | 🙋 | *"I have a question or need attention."* | Left wrist elevated above left shoulder |
| **Both Hands Raised** | 🙆 | *"Yes! I strongly agree and feel great."* | Both wrists elevated above shoulders |
| **Waving Hand** | 👋 | *"Hello! Nice to see you."* | Wrist elevated with horizontal oscillation |
| **Head Nod** | 🙇 | *"Yes, I understand and agree."* | Cyclic vertical displacement of head/neck |
| **Head Tilt Left** | 🤔 | *"I am thinking / Maybe."* | Neck lateral flexion toward left shoulder |
| **Head Tilt Right** | ❓ | *"Could you clarify that for me?"* | Neck lateral flexion toward right shoulder |
| **Body Lean Left** | 👈 | *"No / Navigate Left / Previous item."* | Torso lateral tilt relative to hips (> 14°) |
| **Body Lean Right** | 👉 | *"Yes / Navigate Right / Next item."* | Torso lateral tilt relative to hips (> 14°) |
| **Hands Together** | 🙏 | *"Thank you so much / Please."* | Wrists centered together at chest level |
| **Open Arms** | 🫂 | *"Welcome! I feel comfortable."* | Both arms extended outwards (> 140°) |
| **Salute** | 🫡 | *"Understood! I am ready."* | Wrist positioned at temple / brow level |
| **Resting / Neutral** | 🧘 | *"Neutral posture. Relaxed."* | Baseline resting posture |

### 3. Simulation Testing Lab (Zero-Webcam Required)
- Built-in **2D Virtual Skeleton Avatar** simulating pre-recorded landmark sequences for all 12+ movements.
- Frame-by-frame stepper, speed controls (0.5x, 1x, 2x), and direct REST API execution for presentation or offline testing.

### 4. Assistive Emoji Communication Board (AAC)
- Categorized touch tiles for **Urgent Needs**, **Social Greetings**, **Responses**, and **Daily Comfort**.
- Real-time sentence strip builder to compose multi-word phrases and speak them with one click.

### 5. Accessibility & Inclusivity (WCAG 2.1)
- **High Contrast Theme**: Pure black background with high-visibility neon accents for low-vision users.
- **Multi-scale Typography**: Dynamic font size scaling without layout clipping.
- **Text-to-Speech Engine**: Web Speech API with customizable rates and automatic audio debounce.

---

## 📁 Project Structure

```text
signvision-ai/
├── backend/                  # FastAPI Backend
│   ├── classifier.py         # Recognition service & modular model connector
│   ├── database.py           # SQLite database engine & SQLAlchemy models
│   ├── gestures_data.py      # Gestures catalog, emojis & assistive phrases
│   ├── main.py               # FastAPI application with REST endpoints
│   └── schemas.py            # Pydantic validation models
├── database/                 # SQLite storage directory
│   └── signvision.db         # Persistent SQLite database file
├── frontend/                 # React 18 + Vite Frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AboutTech.jsx             # Project architecture & tech specs
│   │   │   ├── Dashboard.jsx             # Live HUD, camera view & speech cards
│   │   │   ├── EmojiCommunicator.jsx     # AAC board with sentence strip
│   │   │   ├── GestureReferenceModal.jsx # Visual gesture catalog
│   │   │   ├── Navbar.jsx                # Navigation & accessibility controls
│   │   │   ├── PoseCamera.jsx            # MediaPipe canvas overlay & video
│   │   │   ├── RecognitionHistory.jsx    # SQLite history table & export tools
│   │   │   └── SimulationMode.jsx        # Virtual skeleton sandbox
│   │   ├── services/
│   │   │   ├── api.js                    # REST API client with offline fallback
│   │   │   ├── simulationData.js         # Synthetic landmark generator
│   │   │   └── tts.js                    # Web Speech API & audio chimes
│   │   ├── App.jsx                       # Root routing & state coordinator
│   │   ├── index.css                     # Design system & high-contrast theme
│   │   └── main.jsx                      # React entrypoint
│   ├── index.html            # Web page with MediaPipe CDN fallbacks
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite config with backend proxy
├── models/                   # Modular AI/ML Model Layer
│   ├── base_classifier.py    # Abstract base class for recognition models
│   ├── heuristic_classifier.py# Spatial kinematics & temporal oscillation engine
│   ├── lstm_classifier.py    # Temporal BiLSTM neural network scaffold
│   ├── train_lstm.py         # Synthetic dataset generator & training script
│   └── gesture_weights.json  # Exported model weights & metadata
├── .env.example              # Environment variables template
├── package.json              # Root project scripts
├── requirements.txt          # Python dependencies
├── start.bat                 # One-click Windows master launcher
├── start_backend.bat         # Windows launcher for FastAPI
└── start_frontend.bat        # Windows launcher for React
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** and **npm**

---

### Option A: One-Click Startup (Windows)
Double-click:
```bat
start.bat
```
This automatically launches the FastAPI server on port 8000, the React frontend on port 3000, and opens your default browser to `http://localhost:3000`!

---

### Option B: Manual Setup

#### 1. Backend Setup (FastAPI)
```bash
# In project root:
# Install dependencies
python -m pip install -r requirements.txt

# (Optional) Run the training pipeline to generate sample weights
python models/train_lstm.py

# Launch FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health: `http://127.0.0.1:8000/api/health`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup (React + Vite)
```bash
# In frontend directory:
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 📡 REST API Documentation

### 1. `GET /api/health`
Checks server status, database connectivity, and active ML model.
```json
{
  "status": "operational",
  "app_name": "SignVision AI – Move. Express. Connect.",
  "version": "1.0.0",
  "model_architecture": "Modular BiLSTM / Kinematic Spatial-Temporal Engine",
  "database_status": "connected (SQLite)",
  "active_gestures_count": 13
}
```

### 2. `POST /api/predict`
Ingests 33 MediaPipe pose landmarks and optional rolling history frames; returns classification result.
**Payload:**
```json
{
  "landmarks": [ { "x": 0.5, "y": 0.2, "z": 0.0, "visibility": 0.99 } ],
  "history": [],
  "source": "live_camera",
  "auto_save": true
}
```
**Response:**
```json
{
  "detected_movement": "Right Hand Raise",
  "confidence": 0.94,
  "emoji": "🙋‍♂️",
  "generated_message": "I need assistance, please.",
  "tts_text": "I need assistance, please.",
  "category": "Upper Body",
  "is_actionable": true,
  "execution_time_ms": 1.2,
  "model_type": "SignVision-BiLSTM-Kinematic"
}
```

### 3. `GET /api/history`
Retrieves paginated recognition events from SQLite. Query parameters: `limit`, `offset`, `source`.

### 4. `DELETE /api/history/clear`
Clears all saved records from the SQLite database.

---

## 🧠 Machine Learning & Modular Design

The recognition pipeline is architected around the `BaseMovementClassifier` interface. Developers or researchers can plug in any custom PyTorch, TensorFlow, or ONNX model:

```python
from models.base_classifier import BaseMovementClassifier

class CustomTransformerClassifier(BaseMovementClassifier):
    def predict(self, current_landmarks, history_frames=None):
        # 1. Preprocess landmarks
        # 2. Forward pass through neural network
        # 3. Return (gesture_name, confidence)
        return "wave_hand", 0.98
```

To retrain the model on synthetic landmark sequences:
```bash
python models/train_lstm.py --output models/gesture_weights.json
```

---

## 🎓 Academic / Viva Evaluation Points

1. **Why MediaPipe Pose over raw CNN pixel video?**
   - Traditional 2D/3D CNNs (e.g. C3D, I3D) require GPU compute and fail on standard low-power laptops. MediaPipe performs edge-level landmark extraction (33 keypoints), reducing input dimensionality by over 99.8% while preserving biomechanical movement fidelity.
2. **How is distance from the camera handled?**
   - The spatial normalizer calculates the Euclidean distance between left and right shoulders (`shoulder_width`). All joint displacements and angles are evaluated relative to this dynamically calculated baseline.
3. **How are static vs dynamic movements differentiated?**
   - Static movements (e.g. Hand Raise, Open Arms) evaluate instantaneous joint angles in single frames. Dynamic movements (Hand Wave, Head Nod) inspect variance and direction zero-crossings across a 16-frame sliding temporal window.

---

## 📄 License
Released under the MIT License for educational and assistive technology development.
