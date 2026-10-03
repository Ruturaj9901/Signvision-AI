import React, { useState } from 'react';
import { 
  Activity, 
  Camera, 
  Sliders, 
  MessageSquare, 
  History, 
  Info, 
  Volume2, 
  VolumeX, 
  Sun, 
  Type, 
  Menu, 
  X,
  Sparkles,
  Wifi,
  WifiOff,
  User,
  LogOut
} from 'lucide-react';
import ttsService from '../services/tts';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  backendOnline, 
  highContrast, 
  setHighContrast,
  fontSize,
  setFontSize,
  ttsEnabled,
  setTtsEnabled,
  onOpenGestureCatalog,
  currentUser,
  onLogout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Live Camera HUD', icon: Camera },
    { id: 'simulation', label: 'Simulation Lab', icon: Sliders },
    { id: 'communication', label: 'Emoji Board', icon: MessageSquare },
    { id: 'history', label: 'History & Logs', icon: History },
    { id: 'about', label: 'About & Tech', icon: Info },
  ];

  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  const handleLogoutClick = () => {
    ttsService.playChime('alert');
    if (onLogout) onLogout();
  };

  return (
    <header className="navbar-root glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      margin: '12px 16px 0 16px',
      borderRadius: 'var(--radius-lg)',
      padding: '10px 20px',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand & Tagline */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="SignVision AI Home"
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            fontSize: '1.4rem'
          }}>
            🤟
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontWeight: 800, 
                fontSize: '1.3rem', 
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SignVision AI
              </span>
              <span className="badge badge-live" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                v1.0
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Move. Express. Connect.
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status, Accessibility & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Gesture Catalog Quick Button */}
          <button
            onClick={onOpenGestureCatalog}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
            title="View Supported Gestures Catalog"
          >
            <Sparkles size={14} />
            <span className="hide-sm">Gestures</span>
          </button>

          {/* Backend Health Badge */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              background: backendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
            title={backendOnline ? "FastAPI Server Connected (port 8000)" : "Using Local In-Browser Kinematics Fallback"}
          >
            {backendOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hide-sm">{backendOnline ? 'API Online' : 'Fallback'}</span>
          </div>

          {/* Accessibility Quick Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            
            {/* TTS Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: ttsEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: ttsEnabled ? 'var(--accent-indigo)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
              title={ttsEnabled ? "Text-To-Speech is ON" : "Text-To-Speech is Muted"}
              aria-label="Toggle Text to Speech"
            >
              {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* High Contrast Mode */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: highContrast ? '#ffff00' : 'rgba(255, 255, 255, 0.05)',
                color: highContrast ? '#000000' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              title="Toggle High Contrast Accessibility Mode"
              aria-label="Toggle High Contrast"
            >
              <Sun size={15} />
            </button>

            {/* Font Size Adjuster */}
            <button
              onClick={cycleFontSize}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: fontSize !== 'normal' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: fontSize !== 'normal' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
              title={`Current Font Scale: ${fontSize}. Click to adjust.`}
              aria-label="Adjust font size scale"
            >
              <Type size={15} />
            </button>
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}>
                  {(currentUser.username || 'U')[0].toUpperCase()}
                </div>
                <span className="hide-sm" style={{ fontWeight: 600 }}>
                  {currentUser.full_name || currentUser.username}
                </span>
              </div>

              <button
                onClick={handleLogoutClick}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Sign Out"
                aria-label="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: '6px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-primary)'
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-secondary)',
                  textAlign: 'left',
                  fontSize: '0.95rem'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
