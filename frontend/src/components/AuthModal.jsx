import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import apiService from '../services/api';
import ttsService from '../services/tts';

export default function AuthModal({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (isSignUp) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please provide a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    ttsService.playChime('click');

    try {
      if (isSignUp) {
        const res = await apiService.register(username.trim(), email.trim(), password, fullName.trim());
        setSuccessMessage('Account created successfully! Entering SignVision AI...');
        ttsService.playChime('success');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 600);
      } else {
        const res = await apiService.login(username.trim(), password);
        setSuccessMessage('Welcome back! Loading your dashboard...');
        ttsService.playChime('success');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 500);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      ttsService.playChime('alert');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setUsername('demo');
    setPassword('demo123');
    setLoading(true);
    setErrorMessage('');
    ttsService.playChime('click');

    try {
      const res = await apiService.login('demo', 'demo123');
      setSuccessMessage('Demo user authenticated! Loading dashboard...');
      ttsService.playChime('success');
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 500);
    } catch (err) {
      setErrorMessage('Demo login failed. You can also sign up with a new account below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px 32px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-highlight)',
        boxShadow: 'var(--shadow-lg)',
        background: 'rgba(15, 23, 42, 0.92)'
      }}>
        
        {/* Brand Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--gradient-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            fontSize: '2rem',
            marginBottom: '12px'
          }}>
            🤟
          </div>

          <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create SignVision Account' : 'Sign In to SignVision AI'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            {isSignUp 
              ? 'Register to access assistive movement recognition and emoji speech.'
              : 'Move. Express. Connect. Please authenticate to access the dashboard.'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name (Optional)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px'
              }}>
                <User size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="e.g. Alex Taylor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isSignUp ? 'Username' : 'Username or Email'}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px'
            }}>
              <User size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder={isSignUp ? "Choose username" : "Username or email"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px'
              }}>
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px'
            }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account & Proceed' : 'Sign In to Dashboard'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Option for testing */}
        {!isSignUp && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px dashed rgba(99, 102, 241, 0.4)',
                color: 'var(--accent-indigo)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <KeyRound size={15} />
              <span>One-Click Demo Account (username: demo)</span>
            </button>
          </div>
        )}

        {/* Toggle Mode Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Sign Up Now
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
