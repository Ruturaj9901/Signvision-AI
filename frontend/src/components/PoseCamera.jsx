import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import ttsService from '../services/tts';

// MediaPipe Pose Skeleton Connections (Key anatomical joints)
const POSE_CONNECTIONS = [
  // Face & Neck
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Shoulders & Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Right Arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left Arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Legs (Upper)
  [23, 25], [24, 26]
];

export default function PoseCamera({ onPoseFrame, isRecognizing, confidenceThreshold = 0.70 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [mirrorMode, setMirrorMode] = useState(true);
  const [fps, setFps] = useState(0);
  const [poseDetected, setPoseDetected] = useState(false);

  // References for processing loop
  const poseInstanceRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const historyBufferRef = useRef([]);
  const lastInferenceTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());

  /**
   * Initialize MediaPipe Pose Instance
   */
  const initMediaPipe = useCallback(async () => {
    try {
      if (typeof window.Pose === 'undefined') {
        // Wait briefly for CDN script if still downloading
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      if (typeof window.Pose !== 'undefined') {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55
        });

        pose.onResults(onPoseResults);
        poseInstanceRef.current = pose;
        return true;
      } else {
        console.warn('MediaPipe Pose script not loaded yet.');
        return false;
      }
    } catch (e) {
      console.error('Failed to initialize MediaPipe Pose:', e);
      return false;
    }
  }, []);

  /**
   * Handle MediaPipe Pose Results & Draw Canvas
   */
  const onPoseResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      setPoseDetected(true);
      const landmarks = results.poseLandmarks;

      // Maintain rolling history of landmark frames (up to 16 frames)
      const simplifiedFrame = landmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility
      }));

      historyBufferRef.current.push(simplifiedFrame);
      if (historyBufferRef.current.length > 16) {
        historyBufferRef.current.shift();
      }

      // Draw futuristic visual skeleton overlay
      if (showSkeleton) {
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
      }

      // Throttle backend prediction to ~120ms (8 FPS inference is optimal for zero lag + server responsiveness)
      const now = performance.now();
      if (now - lastInferenceTimeRef.current > 120) {
        lastInferenceTimeRef.current = now;
        if (onPoseFrame) {
          onPoseFrame(simplifiedFrame, historyBufferRef.current);
        }
      }
    } else {
      setPoseDetected(false);
    }

    // FPS Counter
    frameCountRef.current++;
    const elapsed = Date.now() - lastFpsCalcRef.current;
    if (elapsed >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / elapsed));
      frameCountRef.current = 0;
      lastFpsCalcRef.current = Date.now();
    }
  }, [showSkeleton, onPoseFrame]);

  /**
   * Draw glowing skeleton connections and joints
   */
  const drawSkeleton = (ctx, landmarks, width, height) => {
    // 1. Draw Bones / Connections
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    for (const [i1, i2] of POSE_CONNECTIONS) {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2 && (p1.visibility || 1) > 0.4 && (p2.visibility || 1) > 0.4) {
        const x1 = p1.x * width;
        const y1 = p1.y * height;
        const x2 = p2.x * width;
        const y2 = p2.y * height;

        // Gradient line for futuristic aesthetic
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        if (i1 === 11 || i1 === 12 || i1 === 13 || i1 === 14) {
          gradient.addColorStop(0, '#06b6d4'); // Cyan for upper body
          gradient.addColorStop(1, '#6366f1'); // Indigo
        } else {
          gradient.addColorStop(0, '#818cf8');
          gradient.addColorStop(1, '#a855f7');
        }

        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // 2. Draw Landmark Keypoints
    for (let i = 0; i < landmarks.length; i++) {
      // Focus on upper body joints: nose (0), shoulders (11,12), elbows (13,14), wrists (15,16), hands (17-22), hips (23,24)
      if (i > 24) continue;
      const lm = landmarks[i];
      if (lm && (lm.visibility || 1) > 0.4) {
        const x = lm.x * width;
        const y = lm.y * height;

        // Outer glow circle
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fill();

        // Inner solid bead
        ctx.fillStyle = (i === 15 || i === 16) ? '#f43f5e' : (i === 0 ? '#10b981' : '#06b6d4');
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  /**
   * Continuous processing frame pump
   */
  const processFrame = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    if (poseInstanceRef.current && videoRef.current.readyState >= 2) {
      try {
        await poseInstanceRef.current.send({ image: videoRef.current });
      } catch (err) {
        // Frame send error
      }
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  /**
   * Start Webcam Stream
   */
  const startCamera = async () => {
    setCameraLoading(true);
    setErrorMessage(null);
    ttsService.playChime('click');

    try {
      // Ensure MediaPipe is loaded
      if (!poseInstanceRef.current) {
        await initMediaPipe();
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraActive(true);
          setCameraLoading(false);
          animFrameIdRef.current = requestAnimationFrame(processFrame);
          ttsService.playChime('success');
        };
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser permissions.'
          : `Failed to access webcam (${err.message}). You can use Simulation Mode to test gestures!`
      );
      setCameraLoading(false);
      setIsCameraActive(false);
    }
  };

  /**
   * Stop Webcam Stream
   */
  const stopCamera = () => {
    ttsService.playChime('click');
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsCameraActive(false);
    setPoseDetected(false);
    setFps(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    initMediaPipe();
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [initMediaPipe]);

  return (
    <div className="pose-camera-container glass-panel" style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      background: '#0d131f',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      
      {/* Camera Video / Canvas Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 3',
        background: '#070b12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        
        {/* Hidden / Visible Video Source */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrorMode ? 'scaleX(-1)' : 'none',
            display: isCameraActive ? 'block' : 'none'
          }}
        />

        {/* Overlay Canvas for Pose Skeleton */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrorMode ? 'scaleX(-1)' : 'none',
            pointerEvents: 'none',
            display: isCameraActive ? 'block' : 'none'
          }}
        />

        {/* Inactive Camera Placeholder Screen */}
        {!isCameraActive && (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            maxWidth: '440px',
            zIndex: 2
          }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--accent-indigo)',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
            }}>
              <Camera size={36} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Camera Offline</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Click <strong>Start Camera</strong> below to enable AI pose tracking. For best accuracy, position your upper body and hands clearly in view.
            </p>

            <button
              onClick={startCamera}
              disabled={cameraLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--gradient-brand)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              {cameraLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Initializing Vision Engine...</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span>Start Camera Feed</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Live HUD Overlays (when camera is on) */}
        {isCameraActive && (
          <>
            {/* Top-Left Status Bar */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10
            }}>
              <div className="badge badge-live">
                <span className="badge-pulse" />
                <span>LIVE FEED</span>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {fps} FPS
              </div>

              <div style={{
                background: poseDetected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: poseDetected ? 'var(--accent-emerald)' : '#ef4444',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: `1px solid ${poseDetected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {poseDetected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                <span>{poseDetected ? 'Pose Locked' : 'Searching Body'}</span>
              </div>
            </div>

            {/* Top-Right Quick Toggles */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '6px',
              zIndex: 10
            }}>
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: showSkeleton ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showSkeleton ? "Hide Skeleton Overlay" : "Show Skeleton Overlay"}
              >
                {showSkeleton ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>

              <button
                onClick={() => setMirrorMode(!mirrorMode)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: mirrorMode ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Toggle Mirror Mode"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(239, 68, 68, 0.12)',
          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Camera Action Control Footer */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(17, 24, 39, 0.6)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <CameraOff size={16} />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={cameraLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-indigo)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <Camera size={16} />
              <span>Start Camera</span>
            </button>
          )}

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isCameraActive ? 'MediaPipe Pose: Active' : 'Camera Ready'}
          </span>
        </div>

        {/* Model Spec Badge */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Framework: <strong>MediaPipe Pose 33-Keypoint</strong>
        </div>
      </div>
    </div>
  );
}
