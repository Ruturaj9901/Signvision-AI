import React from 'react';
import { 
  Cpu, 
  Layers, 
  Database, 
  Activity, 
  ShieldCheck, 
  Code, 
  BrainCircuit, 
  Zap, 
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function AboutTech({ onOpenGestureCatalog }) {
  return (
    <div className="about-container" style={{
      maxWidth: '1240px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px'
    }}>
      
      {/* Hero Problem Statement */}
      <div className="glass-panel" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(30, 27, 75, 0.6) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="badge badge-live">Final Year AI/ML Capstone Project</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Research & Assistive Tech</span>
        </div>

        <h1 style={{ fontSize: '2.2rem', marginBottom: '12px', lineHeight: 1.2 }}>
          SignVision AI – Move. Express. Connect.
        </h1>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-accent)', fontWeight: 600, marginBottom: '16px' }}>
          AI-Based Human Movement Recognition and Emoji-Based Communication for People with Mobility Disabilities
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '960px' }}>
          Individuals living with motor neuron diseases (ALS), post-stroke paralysis, cerebral palsy, or severe spinal cord injuries frequently experience non-verbal communication impairments. <strong>SignVision AI</strong> introduces an accessible, zero-cost, vision-based assistive solution that operates in any standard browser. By combining real-time human pose estimation with kinematic and temporal action recognition, subtle intentional body and head movements are dynamically transformed into intuitive emoji symbols, audible synthesized speech, and caregiver communication logs.
        </p>
      </div>

      {/* Architecture Pipeline Flow */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <BrainCircuit size={24} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.35rem', margin: 0 }}>End-to-End System Architecture</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
          A dual-tier distributed pipeline bridging client-side computer vision with server-side temporal classification:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            {
              step: '01',
              title: 'Vision Ingestion',
              tech: 'Webcam @ 30 FPS',
              desc: 'High-throughput browser video stream captured with zero external hardware or wearable sensors.'
            },
            {
              step: '02',
              title: 'Pose Estimation',
              tech: 'Google MediaPipe Pose',
              desc: 'Extracts 33 anatomical 3D landmark coordinates (x, y, z, visibility) in real-time under variable lighting.'
            },
            {
              step: '03',
              title: 'Scale Invariance',
              tech: 'Biomechanical Normalization',
              desc: 'Normalizes skeleton geometry against inter-shoulder distance and hip baseline for robust user-to-camera distance invariance.'
            },
            {
              step: '04',
              title: 'Action Classifier',
              tech: 'FastAPI + BiLSTM / Kinematics',
              desc: 'Evaluates joint angles, lateral torso shifts, and rolling temporal buffers (16 frames) to classify movements with confidence scores.'
            },
            {
              step: '05',
              title: 'Assistive Output',
              tech: 'Web Speech & SQLite',
              desc: 'Renders high-contrast emojis, triggers automated Text-to-Speech audio, and persists records in SQLite.'
            }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--accent-indigo)',
                marginBottom: '8px'
              }}>
                STAGE {item.step}
              </div>
              <h4 style={{ fontSize: '1.05rem', margin: '0 0 4px 0' }}>{item.title}</h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '8px' }}>
                {item.tech}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Specifications Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        
        {/* ML & Classification Engine */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={22} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Modular Recognition Engine</h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            The classification engine implements an Abstract Base Class (<code>BaseMovementClassifier</code>), allowing seamless transitions between:
          </p>

          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Heuristic Kinematic Engine:</strong> Computes analytical interior joint angles (shoulder abduction, elbow flexion via vector dot products) and detects cyclic zero-crossings for waving and nodding.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Bi-Directional LSTM (BiLSTM):</strong> Sequence-to-one recurrent network trained on 16 consecutive frames (99 input features) with temporal self-attention.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Synthetic Training Suite:</strong> Built-in <code style={{ color: 'var(--accent-cyan)' }}>models/train_lstm.py</code> generates Gaussian-jittered landmark datasets to demonstrate convergence and export weights.
            </li>
          </ul>
        </div>

        {/* REST API & Data Schema */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database size={22} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Backend REST API & SQLite</h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            Powered by Python <strong>FastAPI</strong> with automatic OpenAPI Swagger documentation at <code style={{ color: 'var(--accent-cyan)' }}>/docs</code>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>GET</span> <code>/api/health</code> – System uptime, active model & DB health
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>POST</span> <code>/api/predict</code> – Live landmark inference & emoji mapping
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>GET</span> <code>/api/gestures</code> – Full catalog of supported gestures
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>GET</span> <code>/api/history</code> – Paginated SQLite event history
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>DELETE</span> <code>/api/history/clear</code> – Safe history purge
            </div>
          </div>
        </div>

        {/* Accessibility & Inclusive Design */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={22} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Accessibility Compliance (WCAG 2.1)</h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Engineered from the ground up for individuals with physical limitations:
          </p>

          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li><strong>High-Contrast Mode:</strong> Pure black backgrounds with bright primary contrast (#ffff00, #00ffff) for low-vision users.</li>
            <li><strong>Multi-Scale Typography:</strong> User-customizable font scale without breaking viewport layouts.</li>
            <li><strong>Text-to-Speech Engine:</strong> Web Speech API with customizable pitch, speed, and audio debounce preventing repeated spam.</li>
            <li><strong>Zero-Hardware Simulation:</strong> Synthetic sandbox ensures testing and evaluation are 100% functional without a camera.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
