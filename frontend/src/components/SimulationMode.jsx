import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sliders, 
  Sparkles, 
  CheckCircle, 
  Cpu, 
  Layers, 
  ChevronRight,
  Send
} from 'lucide-react';
import { getSimulatedGestureSequence, SIMULATION_GESTURES_LIST } from '../services/simulationData';
import apiService from '../services/api';
import ttsService from '../services/tts';

// Anatomical skeleton connections for simulation renderer
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [12, 14], [14, 16],
  [11, 13], [13, 15],
  [23, 25], [24, 26], [25, 27], [26, 28]
];

export default function SimulationMode({ onGestureRecognized, ttsEnabled }) {
  const [selectedGestureId, setSelectedGestureId] = useState('wave_hand');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5x, 1x, 2x
  const [autoSpeakSim, setAutoSpeakSim] = useState(true);

  const [simPrediction, setSimPrediction] = useState({
    detected_movement: 'Waving Hand',
    confidence: 0.94,
    emoji: '👋',
    generated_message: 'Hello! Nice to see you.',
    tts_text: 'Hello! Nice to see you.',
    category: 'Dynamic Gesture',
    is_actionable: true,
    execution_time_ms: 1.1,
    model_type: 'BiLSTM / Kinematic'
  });

  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const animIntervalRef = useRef(null);

  // Load frames when selected gesture changes
  useEffect(() => {
    const frames = getSimulatedGestureSequence(selectedGestureId);
    framesRef.current = frames;
    setCurrentFrameIdx(0);
    evaluateSimulation(frames[0], frames);
  }, [selectedGestureId]);

  // Animation playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(180 / playbackSpeed);
      animIntervalRef.current = setInterval(() => {
        setCurrentFrameIdx(prev => {
          const next = (prev + 1) % framesRef.current.length;
          evaluateSimulation(framesRef.current[next], framesRef.current);
          return next;
        });
      }, intervalMs);
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    }

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedGestureId]);

  // Draw 2D Avatar Skeleton on Canvas whenever frame changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !framesRef.current[currentFrameIdx]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const landmarks = framesRef.current[currentFrameIdx];

    // 1. Draw Bones
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const [i1, i2] of CONNECTIONS) {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2) {
        const x1 = p1.x * width;
        const y1 = p1.y * height;
        const x2 = p2.x * width;
        const y2 = p2.y * height;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#a855f7');
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // 2. Draw Landmark Joints
    for (let i = 0; i < landmarks.length; i++) {
      if (i > 28) continue;
      const lm = landmarks[i];
      const x = lm.x * width;
      const y = lm.y * height;

      // Glow circle
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Core bead
      ctx.fillStyle = (i === 15 || i === 16) ? '#f43f5e' : (i === 0 ? '#10b981' : '#ffffff');
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [currentFrameIdx]);

  /**
   * Send frame to API prediction pipeline
   */
  const evaluateSimulation = async (currentFrame, allFrames) => {
    try {
      const res = await apiService.predictPose(
        currentFrame,
        allFrames,
        'simulation',
        false // Don't spam SQLite for every intermediate animation frame
      );

      if (res) {
        setSimPrediction(res);
      }
    } catch (e) {
      console.warn('Simulation predict error:', e);
    }
  };

  /**
   * Manually record and speak the current simulation result
   */
  const handleCommitSimulation = async () => {
    ttsService.playChime('success');

    if (autoSpeakSim && ttsEnabled && simPrediction.tts_text) {
      ttsService.speak(simPrediction.tts_text, true);
    }

    // Post to history
    await apiService.addHistory({
      detected_movement: simPrediction.detected_movement,
      confidence: simPrediction.confidence,
      emoji: simPrediction.emoji,
      generated_message: simPrediction.generated_message,
      source: 'simulation'
    });

    if (onGestureRecognized) {
      onGestureRecognized({
        ...simPrediction,
        source: 'simulation'
      });
    }
  };

  return (
    <div className="simulation-container" style={{
      maxWidth: '1360px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* Simulation Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 41, 59, 0.5) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-amber)'
          }}>
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Gesture Simulation & Testing Lab</h2>
              <span className="badge badge-sim">Synthetic Sandbox</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
              Test and validate pose classification sequences without requiring a physical webcam.
            </p>
          </div>
        </div>

        <button
          onClick={handleCommitSimulation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-brand)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <Send size={16} />
          <span>Save Expression to History</span>
        </button>
      </div>

      {/* Main Grid: Avatar Canvas + Controls (Left) and Results / Gesture Selector (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Synthetic 2D Skeleton Viewport */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-sim">Virtual Pose Avatar</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Frame {currentFrameIdx + 1} of {framesRef.current.length}
              </span>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isPlaying ? '#ef4444' : 'var(--accent-emerald)',
                  border: `1px solid ${isPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentFrameIdx(0);
                  ttsService.playChime('click');
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Restart Sequence"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div style={{
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#090e17',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <canvas
              ref={canvasRef}
              width={560}
              height={420}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Playback Speed Slider & Progress */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Speed:</span>
              {[0.5, 1.0, 2.0].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: playbackSpeed === s ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
                    color: playbackSpeed === s ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.78rem'
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Temporal Window: 16 Frames (BiLSTM Sequence Buffer)
            </div>
          </div>
        </div>

        {/* Right Column: AI Recognition Output & Gesture Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Sim Output Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="badge badge-sim">{simPrediction.category}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Response Latency: {simPrediction.execution_time_ms} ms
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
              <div style={{
                fontSize: '4.2rem',
                minWidth: '85px',
                height: '85px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                {simPrediction.emoji}
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Simulated Classification
                </div>
                <h2 style={{ fontSize: '1.6rem', margin: '2px 0 6px 0' }}>
                  {simPrediction.detected_movement}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {Math.round(simPrediction.confidence * 100)}% Confidence
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    • Model: {simPrediction.model_type}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Associated Assistive Output:
                </span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '1.05rem' }}>
                  "{simPrediction.generated_message}"
                </p>
              </div>

              <button
                onClick={() => ttsService.speak(simPrediction.generated_message, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-indigo)',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
              >
                <Volume2 size={16} />
                <span>Speak</span>
              </button>
            </div>
          </div>

          {/* Gesture Sequence Selector Grid */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Choose Gesture To Simulate</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Select any movement below to stream its synthetic MediaPipe landmark sequence into the recognition pipeline:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
              gap: '8px',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {SIMULATION_GESTURES_LIST.map((g) => {
                const isSelected = selectedGestureId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGestureId(g.id);
                      ttsService.playChime('click');
                    }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                      color: isSelected ? '#fbbf24' : 'var(--text-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{g.emoji}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, lineHeight: 1.2 }}>
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
