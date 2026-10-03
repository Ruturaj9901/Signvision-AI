/**
 * SignVision AI - Unified API Client & Fallback Inference Service
 * Connects to the FastAPI backend and provides authentication + graceful offline fallback.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiService {
  constructor() {
    this.isBackendOnline = false;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('signvision_token') : null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('signvision_token', token);
    } else {
      localStorage.removeItem('signvision_token');
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('signvision_token');
    }
    return this.token;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // -------------------------------------------------------------------------
  // Authentication APIs
  // -------------------------------------------------------------------------

  async register(username, email, password, fullName = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      if (data.access_token) {
        this.setToken(data.access_token);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid credentials.');
      }

      if (data.access_token) {
        this.setToken(data.access_token);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getHeaders()
      });

      if (res.ok) {
        return await res.json();
      } else {
        // Token expired or invalid
        this.setToken(null);
      }
    } catch (e) {
      console.warn('Auth verification fallback:', e);
    }
    return null;
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }

  // -------------------------------------------------------------------------
  // Vision, History & Utility APIs
  // -------------------------------------------------------------------------

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      }
    } catch (e) {
      this.isBackendOnline = false;
    }
    return {
      status: 'offline',
      app_name: 'SignVision AI (Client Mode)',
      version: '1.0.0',
      model_architecture: 'Client-side Kinematics Fallback',
      database_status: 'Local memory session'
    };
  }

  async predictPose(landmarks, history = [], source = 'live_camera', autoSave = false) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          landmarks,
          history,
          source,
          auto_save: autoSave
        })
      });

      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      }
    } catch (e) {
      this.isBackendOnline = false;
    }

    // Graceful Client-side Fallback Inference if backend is offline or starting
    return this.clientFallbackPredict(landmarks, history);
  }

  async getSupportedGestures() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/gestures`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Using default gesture catalog');
    }
    return [];
  }

  async getHistory(limit = 50, offset = 0, source = null) {
    try {
      let url = `${API_BASE_URL}/api/history?limit=${limit}&offset=${offset}`;
      if (source) url += `&source=${source}`;
      const res = await fetch(url, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('History fetch fallback');
    }
    return [];
  }

  async addHistory(record) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(record)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to post history to backend:', e);
    }
    return null;
  }

  async clearHistory() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history/clear`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to clear backend history:', e);
    }
    return { status: 'cleared_locally' };
  }

  async getStatistics() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/statistics`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // offline
    }
    return { total_recognitions: 0, top_gestures: [], uptime_seconds: 0 };
  }

  /**
   * Client-side kinematic fallback predictor.
   */
  clientFallbackPredict(landmarks, history = []) {
    if (!landmarks || landmarks.length < 25) {
      return {
        detected_movement: 'Resting / Neutral Pose',
        confidence: 0.90,
        emoji: '🧘',
        generated_message: 'Neutral posture. Relaxed.',
        tts_text: '',
        category: 'Baseline',
        is_actionable: false,
        execution_time_ms: 1.0,
        model_type: 'Client-Kinematic-Fallback'
      };
    }

    const l_sh = landmarks[11];
    const r_sh = landmarks[12];
    const l_wr = landmarks[15];
    const r_wr = landmarks[16];

    const l_raised = l_wr && l_sh && l_wr.y < (l_sh.y - 0.05);
    const r_raised = r_wr && r_sh && r_wr.y < (r_sh.y - 0.05);

    if (l_raised && r_raised) {
      return {
        detected_movement: 'Both Hands Raised',
        confidence: 0.95,
        emoji: '🙆',
        generated_message: 'Yes! I strongly agree and feel great.',
        tts_text: 'Yes! I strongly agree and feel great.',
        category: 'Upper Body',
        is_actionable: true,
        execution_time_ms: 1.2,
        model_type: 'Client-Kinematic-Fallback'
      };
    }

    if (r_raised) {
      return {
        detected_movement: 'Right Hand Raise',
        confidence: 0.94,
        emoji: '🙋‍♂️',
        generated_message: 'I need assistance, please.',
        tts_text: 'I need assistance, please.',
        category: 'Upper Body',
        is_actionable: true,
        execution_time_ms: 1.1,
        model_type: 'Client-Kinematic-Fallback'
      };
    }

    if (l_raised) {
      return {
        detected_movement: 'Left Hand Raise',
        confidence: 0.94,
        emoji: '🙋',
        generated_message: 'I have a question or need attention.',
        tts_text: 'I have a question or need attention.',
        category: 'Upper Body',
        is_actionable: true,
        execution_time_ms: 1.1,
        model_type: 'Client-Kinematic-Fallback'
      };
    }

    // Default neutral
    return {
      detected_movement: 'Resting / Neutral Pose',
      confidence: 0.91,
      emoji: '🧘',
      generated_message: 'Neutral posture. Relaxed.',
      tts_text: '',
      category: 'Baseline',
      is_actionable: false,
      execution_time_ms: 0.8,
      model_type: 'Client-Kinematic-Fallback'
    };
  }
}

export const apiService = new ApiService();
export default apiService;
