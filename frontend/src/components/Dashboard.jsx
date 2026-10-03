import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Sparkles, 
  Clock, 
  Zap, 
  HelpCircle, 
  Check, 
  Heart, 
  Droplet, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PoseCamera from './PoseCamera';
import apiService from '../services/api';
import ttsService from '../services/tts';

export default function Dashboard({ 
  onGestureRecognized, 
  ttsEnabled, 
  backendOnline,
  onOpenGestureCatalog,
  onNavigateToSim 
}) {
  const [currentPrediction, setCurrentPrediction] = useState({
    detected_movement: 'Resting / Neutral Pose',
    confidence: 0.92,
    emoji: '🧘',
    generated_message: 'Neutral posture. Move your hand or head to communicate.',
    tts_text: '',
    category: 'Baseline',
    is_actionable: false,
    execution_time_ms: 1.0,
    model_type: 'BiLSTM / Kinematic'
  });

  const [autoSpeak, setAutoSpeak] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastActionableGestureRef = useRef('');
  const lastActionTimeRef = useRef(0);

  /**
   * Handle incoming pose frame from PoseCamera
   */
  const handlePoseFrame = async (landmarks, history) => {
    try {
      const result = await apiService.predictPose(
        landmarks, 
        history, 
        'live_camera', 
        true // Auto-save to SQLite when actionable
      );

      if (result) {
        setCurrentPrediction(result);

        // If actionable movement detected with good confidence (> 75%)
        if (result.is_actionable && result.confidence >= 0.75) {
          const now = Date.now();
          // Debounce same gesture within 3 seconds to avoid spamming TTS
          if (result.detected_movement !== lastActionableGestureRef.current || (now - lastActionTimeRef.current > 3000)) {
            lastActionableGestureRef.current = result.detected_movement;
            lastActionTimeRef.current = now;
            setSessionCount(prev => prev + 1);

            // Notify parent for history updates
            if (onGestureRecognized) {
              onGestureRecognized(result);
            }

            // Text to speech
            if (autoSpeak && ttsEnabled && result.tts_text) {
              triggerSpeech(result.tts_text);
            }

            // Celebratory micro-haptic visual effect
            if (result.confidence > 0.90) {
              confetti({
                particleCount: 24,
                spread: 45,
                origin: { y: 0.8 },
                colors: ['#06b6d4', '#6366f1', '#a855f7']
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Inference error:', e);
    }
  };

  const triggerSpeech = (text) => {
    if (!text) return;
    setIsSpeaking(true);
    ttsService.speak(text, true);
    setTimeout(() => setIsSpeaking(false), 2200);
  };

  const handleQuickTileClick = (item) => {
    ttsService.playChime('click');
    const customResult = {
      detected_movement: item.name,
      confidence: 1.0,
      emoji: item.emoji,
      generated_message: item.message,
      tts_text: item.message,
      category: 'Quick Tile',
      is_actionable: true,
      execution_time_ms: 0.5,
      model_type: 'Direct Assistive Touch'
    };

    setCurrentPrediction(customResult);
    triggerSpeech(item.message);

    // Save to SQLite
    apiService.addHistory({
      detected_movement: item.name,
      confidence: 1.0,
      emoji: item.emoji,
      generated_message: item.message,
      source: 'live_camera'
    });

    if (onGestureRecognized) {
      onGestureRecognized(customResult);
    }
  };

  const quickTiles = [
    { name: 'Need Assistance', emoji: '🙋‍♂️', message: 'I need assistance, please.', color: '#6366f1' },
    { name: 'Need Water', emoji: '💧', message: 'Could I please have a glass of water?', color: '#06b6d4' },
    { name: 'Yes / Agree', emoji: '🙆', message: 'Yes, I agree!', color: '#10b981' },
    { name: 'No / Decline', emoji: '👈', message: 'No, thank you.', color: '#f59e0b' },
    { name: 'Thank You', emoji: '🙏', message: 'Thank you very much.', color: '#ec4899' },
    { name: 'Emergency Help', emoji: '🚨', message: 'Attention! I need urgent caregiver help.', color: '#ef4444' },
  ];

  const confidencePct = Math.round((currentPrediction.confidence || 0) * 100);

  return (
    <div className="dashboard-container" style={{
      maxWidth: '1360px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>

      {/* Top Banner / Problem Statement Context */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 27, 75, 0.4) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-indigo)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
                Assistive Movement Recognition & Communication
              </h2>
              <span className="badge badge-live">Active HUD</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
              Designed for people with mobility challenges to express daily needs via physical gestures and emoji speech.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNavigateToSim}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-amber)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <Sparkles size={15} />
            <span>No Webcam? Try Simulation Lab</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Camera (Left) + Recognition Results (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Live Camera & Pose Tracking */}
        <div>
          <PoseCamera onPoseFrame={handlePoseFrame} />

          {/* Quick HUD Metrics Bar */}
          <div className="glass-panel" style={{
            marginTop: '16px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--accent-cyan)" />
              <span>Inference Latency: <strong>{currentPrediction.execution_time_ms} ms</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--accent-indigo)" />
              <span>Gestures Recognized: <strong>{sessionCount}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} color="var(--accent-purple)" />
              <span>Engine: <strong>Browser Kinematic AI</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Detection Card & Communication Suite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Recognition Hero Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            border: currentPrediction.is_actionable 
              ? '2px solid rgba(99, 102, 241, 0.6)' 
              : '1px solid var(--border-color)',
            boxShadow: currentPrediction.is_actionable 
              ? '0 0 35px rgba(99, 102, 241, 0.25)' 
              : 'var(--shadow-md)',
            transition: 'all 0.3s ease'
          }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{
                  background: currentPrediction.is_actionable ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: currentPrediction.is_actionable ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  border: `1px solid ${currentPrediction.is_actionable ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`
                }}>
                  {currentPrediction.category || 'Movement'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {currentPrediction.model_type}
                </span>
              </div>

              {/* TTS Status Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  style={{ accentColor: 'var(--accent-indigo)', cursor: 'pointer' }}
                />
                <span>Auto-Speak</span>
              </label>
            </div>

            {/* Giant Emoji & Movement Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{
                fontSize: '4.5rem',
                minWidth: '95px',
                height: '95px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: currentPrediction.is_actionable ? 'pulse-emoji 1s infinite alternate' : 'none'
              }}>
                {currentPrediction.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Detected Movement
                </div>
                <h1 style={{ fontSize: '1.8rem', margin: '2px 0 6px 0', lineHeight: 1.2 }}>
                  {currentPrediction.detected_movement}
                </h1>
                
                {/* Confidence Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Confidence Score</span>
                    <strong style={{ color: confidencePct > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {confidencePct}%
                    </strong>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${confidencePct}%`,
                      height: '100%',
                      background: confidencePct > 80 
                        ? 'linear-gradient(90deg, #10b981, #06b6d4)' 
                        : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                      borderRadius: '4px',
                      transition: 'width 0.25s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Assistive Message Bubble */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Spoken Assistive Expression:
                </div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px'
                }}>
                  "{currentPrediction.generated_message}"
                </div>
              </div>

              {/* Speak Audio Button */}
              <button
                onClick={() => triggerSpeech(currentPrediction.generated_message)}
                disabled={!currentPrediction.generated_message}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: isSpeaking ? 'var(--accent-emerald)' : 'var(--accent-indigo)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="Play Audio Speech"
              >
                <Volume2 size={18} />
                <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
              </button>
            </div>
          </div>

          {/* Assistive Quick Response Touch Board */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Quick Assistive Tiles</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  One-tap emergency & everyday assistive expressions
                </span>
              </div>
              <button
                onClick={onOpenGestureCatalog}
                style={{
                  background: 'transparent',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>All Gestures</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              {quickTiles.map((tile, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickTileClick(tile)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tile.color;
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{tile.emoji}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tile.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse-emoji {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.6)); }
        }
      `}</style>
    </div>
  );
}
