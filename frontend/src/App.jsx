import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import SimulationMode from './components/SimulationMode';
import EmojiCommunicator from './components/EmojiCommunicator';
import RecognitionHistory from './components/RecognitionHistory';
import AboutTech from './components/AboutTech';
import GestureReferenceModal from './components/GestureReferenceModal';
import AuthModal from './components/AuthModal';
import apiService from './services/api';
import ttsService from './services/tts';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendOnline, setBackendOnline] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'normal', 'large', 'xlarge'
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [historyList, setHistoryList] = useState([]);
  const [gesturesCatalog, setGesturesCatalog] = useState([]);
  const [isGestureModalOpen, setIsGestureModalOpen] = useState(false);

  // Sync high contrast and font size with document body
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') document.body.classList.add('font-large');
    if (fontSize === 'xlarge') document.body.classList.add('font-xlarge');
  }, [fontSize]);

  // Sync TTS enabled state
  useEffect(() => {
    ttsService.setEnabled(ttsEnabled);
  }, [ttsEnabled]);

  // Probe backend health periodically
  const checkHealth = useCallback(async () => {
    const health = await apiService.checkHealth();
    setBackendOnline(health && health.status === 'operational');
  }, []);

  // Check existing session token on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.warn('Session restoration failed:', e);
      } finally {
        setAuthChecking(false);
      }
    };
    initAuth();
  }, []);

  // Fetch initial history and gesture catalog
  const loadData = useCallback(async () => {
    await checkHealth();

    const history = await apiService.getHistory(50);
    if (history && Array.isArray(history)) {
      setHistoryList(history);
    }

    const gestures = await apiService.getSupportedGestures();
    if (gestures && Array.isArray(gestures) && gestures.length > 0) {
      setGesturesCatalog(gestures);
    } else {
      // Fallback default list if backend offline initially
      setGesturesCatalog([
        { id: 'hand_raise_right', name: 'Right Hand Raise', emoji: '🙋‍♂️', category: 'Upper Body', message: 'I need assistance, please.', description: 'Right hand raised above shoulder.' },
        { id: 'hand_raise_left', name: 'Left Hand Raise', emoji: '🙋', category: 'Upper Body', message: 'I have a question or need attention.', description: 'Left hand raised above shoulder.' },
        { id: 'both_hands_raise', name: 'Both Hands Raised', emoji: '🙆', category: 'Upper Body', message: 'Yes! I strongly agree and feel great.', description: 'Both hands elevated above shoulders.' },
        { id: 'wave_hand', name: 'Waving Hand', emoji: '👋', category: 'Dynamic Gesture', message: 'Hello! Nice to see you.', description: 'Hand raised with side-to-side waving.' },
        { id: 'head_nod', name: 'Head Nod (Affirmation)', emoji: '🙇', category: 'Head & Neck', message: 'Yes, I understand and agree.', description: 'Cyclic upward and downward head movement.' },
        { id: 'head_tilt_left', name: 'Head Tilt Left', emoji: '🤔', category: 'Head & Neck', message: 'I am thinking / Maybe.', description: 'Head tilted towards the left shoulder.' },
        { id: 'head_tilt_right', name: 'Head Tilt Right', emoji: '❓', category: 'Head & Neck', message: 'Could you clarify that for me?', description: 'Head tilted towards the right shoulder.' },
        { id: 'body_lean_left', name: 'Body Lean Left', emoji: '👈', category: 'Torso', message: 'No / Navigate Left / Previous item.', description: 'Torso leaned to the left.' },
        { id: 'body_lean_right', name: 'Body Lean Right', emoji: '👉', category: 'Torso', message: 'Yes / Navigate Right / Next item.', description: 'Torso leaned to the right.' },
        { id: 'hands_together', name: 'Hands Together (Namaste)', emoji: '🙏', category: 'Upper Body', message: 'Thank you so much / Please.', description: 'Both wrists centered at chest.' },
        { id: 'open_arms', name: 'Open Arms / Welcome', emoji: '🫂', category: 'Upper Body', message: 'Welcome! I feel comfortable.', description: 'Both arms extended wide.' },
        { id: 'salute', name: 'Salute / Ready', emoji: '🫡', category: 'Upper Body', message: 'Understood! I am ready.', description: 'Hand at temple level.' },
        { id: 'resting', name: 'Resting / Neutral', emoji: '🧘', category: 'Baseline', message: 'Neutral posture. Relaxed.', description: 'Natural baseline state.' },
      ]);
    }
  }, [checkHealth]);

  useEffect(() => {
    if (currentUser) {
      loadData();
      const interval = setInterval(checkHealth, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser, loadData, checkHealth]);

  // Handler for newly detected gesture
  const handleGestureRecognized = (result) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      detected_movement: result.detected_movement,
      confidence: result.confidence,
      emoji: result.emoji,
      generated_message: result.generated_message,
      source: result.source || 'live_camera'
    };

    setHistoryList(prev => [newEntry, ...prev.slice(0, 99)]);
  };

  const handleHistoryCleared = () => {
    setHistoryList([]);
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // While checking initial token, render subtle loader
  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤟</div>
          <div>Loading SignVision AI...</div>
        </div>
      </div>
    );
  }

  // If not authenticated, protect all routes and show accessible Login / Sign Up Page
  if (!currentUser) {
    return (
      <div className="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤟</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>
              SignVision AI
            </span>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: highContrast ? '#ffff00' : 'rgba(255, 255, 255, 0.08)',
              color: highContrast ? '#000000' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {highContrast ? 'High Contrast: ON' : 'High Contrast Mode'}
          </button>
        </header>

        <main style={{ flex: 1 }}>
          <AuthModal onAuthSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }} />
        </main>

        <footer style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)'
        }}>
          SignVision AI – Move. Express. Connect. • AI-Based Human Movement Recognition & Assistive Communication
        </footer>
      </div>
    );
  }

  // Authenticated Application Flow
  return (
    <div className="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Accessible Navbar with User Profile & Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontSize={fontSize}
        setFontSize={setFontSize}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        onOpenGestureCatalog={() => setIsGestureModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Protected View Area */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            onGestureRecognized={handleGestureRecognized}
            ttsEnabled={ttsEnabled}
            backendOnline={backendOnline}
            onOpenGestureCatalog={() => setIsGestureModalOpen(true)}
            onNavigateToSim={() => setActiveTab('simulation')}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationMode
            onGestureRecognized={handleGestureRecognized}
            ttsEnabled={ttsEnabled}
          />
        )}

        {activeTab === 'communication' && (
          <EmojiCommunicator
            onGestureRecognized={handleGestureRecognized}
            ttsEnabled={ttsEnabled}
          />
        )}

        {activeTab === 'history' && (
          <RecognitionHistory
            historyList={historyList}
            onHistoryCleared={handleHistoryCleared}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'about' && (
          <AboutTech
            onOpenGestureCatalog={() => setIsGestureModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        background: 'rgba(10, 14, 23, 0.7)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong>SignVision AI</strong> – Move. Express. Connect.
          </div>
          <div>
            Logged in as <strong>{currentUser.username}</strong> ({currentUser.email})
          </div>
          <div>
            Final Year Engineering Capstone
          </div>
        </div>
      </footer>

      {/* Gestures Catalog Modal */}
      <GestureReferenceModal
        isOpen={isGestureModalOpen}
        onClose={() => setIsGestureModalOpen(false)}
        gesturesList={gesturesCatalog}
      />
    </div>
  );
}
