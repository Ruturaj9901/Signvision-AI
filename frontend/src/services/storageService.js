/**
 * SignVision AI - Browser LocalStorage Persistence & Authentication Service
 * 100% Client-Side Storage for GitHub Pages Deployment
 */

const STORAGE_KEYS = {
  USERS: 'signvision_users',
  CURRENT_USER: 'signvision_current_user',
  TOKEN: 'signvision_auth_token',
  HISTORY: 'signvision_history',
};

class StorageService {
  constructor() {
    this.initDefaultUsers();
  }

  // -------------------------------------------------------------------------
  // User Management & Authentication (localStorage)
  // -------------------------------------------------------------------------

  initDefaultUsers() {
    if (typeof window === 'undefined') return;
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!existing) {
        // Pre-seed demo user account for instant testing
        const defaultUsers = [
          {
            id: 1,
            username: 'demo',
            email: 'demo@signvision.ai',
            password: 'demo123',
            full_name: 'Demo User',
            role: 'user',
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }

  getUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  registerUser(username, email, password, fullName = '') {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) throw new Error('Username is required.');
    if (!cleanEmail) throw new Error('Email is required.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('Username is already taken.');
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email is already registered.');
    }

    const newUser = {
      id: Date.now(),
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      full_name: fullName.trim() || cleanUsername,
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Auto-login user
    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now();
    const userSafe = { ...newUser };
    delete userSafe.password;

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userSafe));

    return {
      access_token: token,
      token_type: 'bearer',
      user: userSafe
    };
  }

  loginUser(usernameOrEmail, password) {
    const cleanLogin = usernameOrEmail.trim().toLowerCase();
    const users = this.getUsers();

    const user = users.find(u => 
      (u.username.toLowerCase() === cleanLogin || u.email.toLowerCase() === cleanLogin) &&
      u.password === password
    );

    if (!user) {
      throw new Error('Invalid username/email or password.');
    }

    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now();
    const userSafe = { ...user };
    delete userSafe.password;

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userSafe));

    return {
      access_token: token,
      token_type: 'bearer',
      user: userSafe
    };
  }

  getCurrentUser() {
    try {
      const rawUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (rawUser && token) {
        return JSON.parse(rawUser);
      }
    } catch (e) {
      // parse error
    }
    return null;
  }

  logoutUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      // ignore
    }
    return { status: 'success' };
  }

  // -------------------------------------------------------------------------
  // Recognition History Management (localStorage)
  // -------------------------------------------------------------------------

  getHistory(limit = 50, offset = 0, source = null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      let list = raw ? JSON.parse(raw) : [];

      if (source && source !== 'all') {
        list = list.filter(item => item.source === source);
      }

      // Sort by timestamp descending
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return list.slice(offset, offset + limit);
    } catch (e) {
      return [];
    }
  }

  addHistory(record) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const list = raw ? JSON.parse(raw) : [];

      const newEntry = {
        id: record.id || Date.now(),
        timestamp: record.timestamp || new Date().toISOString(),
        detected_movement: record.detected_movement,
        confidence: Number(record.confidence || 0),
        emoji: record.emoji,
        generated_message: record.generated_message,
        source: record.source || 'live_camera'
      };

      list.unshift(newEntry);
      // Keep up to 200 recent events in localStorage
      if (list.length > 200) list.pop();

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
      return newEntry;
    } catch (e) {
      console.warn('Failed to save history in localStorage:', e);
      return null;
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return { status: 'success', message: 'Cleared recognition history from localStorage.' };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }

  getStatistics() {
    const list = this.getHistory(500);
    const freq = {};
    for (const item of list) {
      freq[item.detected_movement] = (freq[item.detected_movement] || 0) + 1;
    }

    const topGestures = Object.entries(freq)
      .map(([gesture, count]) => ({ gesture, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_recognitions: list.length,
      top_gestures: topGestures,
      uptime_seconds: Math.round(performance.now() / 1000)
    };
  }
}

export const storageService = new StorageService();
export default storageService;
