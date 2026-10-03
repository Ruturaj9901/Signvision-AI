# SignVision AI - Python Backend

High-performance Python inference microservice built with **FastAPI** and **MediaPipe**.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

## Endpoints

### 1. `GET /health`
Verifies server health and model readiness.

**Response:**
```json
{
  "status": "ok",
  "model_ready": true,
  "engine": "MediaPipe Pose + LSTM"
}
```

### 2. `POST /predict`
Evaluates 33 body landmarks and outputs classification.

**Request:**
```json
{
  "landmarks": [
    { "x": 0.521, "y": 0.284, "z": -0.012, "visibility": 0.98 },
    { "x": 0.489, "y": 0.201, "z": -0.024, "visibility": 0.98 }
  ],
  "frame_timestamp": 1726050000000
}
```

**Response:**
```json
{
  "movement": "wave",
  "confidence": 0.94,
  "emoji": "👋",
  "message": "Hello! Good to see you.",
  "landmarks_received": 33,
  "inference_time_ms": 2.45
}
```
