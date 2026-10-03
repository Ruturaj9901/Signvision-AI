/**
 * SignVision AI - Browser-Native Service Client
 * 100% Client-Side In-Browser AI & LocalStorage Service for GitHub Pages
 * Completely standalone: requires NO backend, NO Python, NO FastAPI, and NO localhost.
 */

import movementClassifier from './movementClassifier';
import { SUPPORTED_GESTURES, GESTURES_ARRAY } from './gesturesData';
import storageService from './storageService';

class ApiService {
  constructor() {
    this.isBackendOnline = true; // Always online since it runs natively in the browser
  }

  // -------------------------------------------------------------------------
  // Authentication Services (Browser LocalStorage)
  // -------------------------------------------------------------------------

  async register(username, email, password, fullName = '') {
    return storageService.registerUser(username, email, password, fullName);
  }

  async login(username, password) {
    return storageService.loginUser(username, password);
  }

  async getCurrentUser() {
    return storageService.getCurrentUser();
  }

  async logout() {
    return storageService.logoutUser();
  }

  // -------------------------------------------------------------------------
  // Vision & Gesture Inference (Browser Kinematic & Temporal Engine)
  // -------------------------------------------------------------------------

  async checkHealth() {
    return {
      status: 'operational',
      app_name: 'SignVision AI – Move. Express. Connect.',
      version: '2.0.0-Static',
      model_architecture: 'In-Browser Kinematic Spatial-Temporal Engine',
      database_status: 'Browser LocalStorage Active',
      active_gestures_count: GESTURES_ARRAY.length
    };
  }

  async predictPose(landmarks, history = [], source = 'live_camera', autoSave = false) {
    const startTime = performance.now();

    // Run in-browser movement classifier
    const { gestureId, confidence } = movementClassifier.predict(landmarks, history);
    const gesture = SUPPORTED_GESTURES[gestureId] || SUPPORTED_GESTURES.resting;

    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    const isActionable = (gestureId !== 'resting' && confidence >= 0.70);

    const result = {
      detected_movement: gesture.name,
      confidence: confidence,
      emoji: gesture.emoji,
      generated_message: gesture.message,
      tts_text: gesture.tts_text,
      category: gesture.category,
      is_actionable: isActionable,
      execution_time_ms: Math.max(0.1, elapsed),
      model_type: 'Browser Kinematic Engine'
    };

    if (autoSave && isActionable) {
      storageService.addHistory({
        detected_movement: result.detected_movement,
        confidence: result.confidence,
        emoji: result.emoji,
        generated_message: result.generated_message,
        source: source || 'live_camera'
      });
    }

    return result;
  }

  async getSupportedGestures() {
    return GESTURES_ARRAY;
  }

  // -------------------------------------------------------------------------
  // Recognition History Services (Browser LocalStorage)
  // -------------------------------------------------------------------------

  async getHistory(limit = 50, offset = 0, source = null) {
    return storageService.getHistory(limit, offset, source);
  }

  async addHistory(record) {
    return storageService.addHistory(record);
  }

  async clearHistory() {
    return storageService.clearHistory();
  }

  async getStatistics() {
    return storageService.getStatistics();
  }
}

export const apiService = new ApiService();
export default apiService;
