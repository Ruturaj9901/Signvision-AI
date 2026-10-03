import React, { useState } from 'react';
import { 
  Volume2, 
  Trash2, 
  Send, 
  Sparkles, 
  Heart, 
  AlertTriangle, 
  Smile, 
  Coffee, 
  Check, 
  X, 
  Plus
} from 'lucide-react';
import ttsService from '../services/tts';
import apiService from '../services/api';

const AAC_CATEGORIES = [
  {
    id: 'urgent',
    title: 'Urgent & Caregiver Needs',
    icon: AlertTriangle,
    color: '#ef4444',
    items: [
      { emoji: '🚨', word: 'Emergency', phrase: 'Attention please, I need urgent assistance!' },
      { emoji: '💧', word: 'Water', phrase: 'Could I please have a glass of water?' },
      { emoji: '💊', word: 'Medication', phrase: 'It is time for my medication.' },
      { emoji: '🚻', word: 'Restroom', phrase: 'I need assistance going to the restroom.' },
      { emoji: '⚡', word: 'Pain', phrase: 'I am experiencing physical pain right now.' },
      { emoji: '🛏️', word: 'Rest', phrase: 'I feel exhausted and need to lie down and rest.' },
    ]
  },
  {
    id: 'social',
    title: 'Social & Expressions',
    icon: Smile,
    color: '#6366f1',
    items: [
      { emoji: '👋', word: 'Hello', phrase: 'Hello! It is wonderful to see you.' },
      { emoji: '🙏', word: 'Thank You', phrase: 'Thank you very much for your help.' },
      { emoji: '🙋', word: 'Attention', phrase: 'Excuse me, I have a question.' },
      { emoji: '🤝', word: 'Goodbye', phrase: 'Goodbye, have a safe and wonderful day.' },
      { emoji: '🫂', word: 'Comfort', phrase: 'I appreciate your presence and care.' },
      { emoji: '✨', word: 'Great Job', phrase: 'That was excellent, thank you!' },
    ]
  },
  {
    id: 'answers',
    title: 'Responses & Choices',
    icon: Check,
    color: '#10b981',
    items: [
      { emoji: '🙆', word: 'Yes', phrase: 'Yes, that sounds perfect.' },
      { emoji: '👈', word: 'No', phrase: 'No, thank you.' },
      { emoji: '🤔', word: 'Maybe', phrase: 'Maybe, let me think about it.' },
      { emoji: '❓', word: 'Repeat', phrase: 'Could you please repeat that for me?' },
      { emoji: '⏳', word: 'Wait', phrase: 'Please wait one moment.' },
      { emoji: '👌', word: 'Okay', phrase: 'Everything is okay.' },
    ]
  },
  {
    id: 'comfort',
    title: 'Daily Comfort & Diet',
    icon: Coffee,
    color: '#f59e0b',
    items: [
      { emoji: '🍲', word: 'Hungry', phrase: 'I am hungry, is food available?' },
      { emoji: '🥶', word: 'Cold', phrase: 'I feel cold, could you please adjust the blanket or temperature?' },
      { emoji: '🥵', word: 'Hot', phrase: 'I feel warm, could we turn on the fan or AC?' },
      { emoji: '🪟', word: 'Window', phrase: 'Could you open or close the window?' },
      { emoji: '🎵', word: 'Music', phrase: 'Could we play some relaxing music?' },
      { emoji: '📖', word: 'Read', phrase: 'I would like to read or listen to something.' },
    ]
  }
];

export default function EmojiCommunicator({ onGestureRecognized, ttsEnabled }) {
  const [activeCategory, setActiveCategory] = useState('urgent');
  const [composedSentence, setComposedSentence] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const addPhrase = (item) => {
    ttsService.playChime('click');
    setComposedSentence(prev => [...prev, item]);

    // Instantly speak the single item
    if (ttsEnabled) {
      ttsService.speak(item.phrase);
    }
  };

  const removeLast = () => {
    ttsService.playChime('click');
    setComposedSentence(prev => prev.slice(0, -1));
  };

  const clearAll = () => {
    ttsService.playChime('click');
    setComposedSentence([]);
  };

  const speakSentence = async () => {
    if (composedSentence.length === 0) return;

    const fullText = composedSentence.map(item => item.phrase).join(' ');
    setIsSpeaking(true);
    ttsService.speak(fullText, true);

    // Save compound sentence to SQLite history
    const combinedEmoji = composedSentence.map(i => i.emoji).join(' ');
    await apiService.addHistory({
      detected_movement: 'Composed Expression',
      confidence: 1.0,
      emoji: combinedEmoji,
      generated_message: fullText,
      source: 'live_camera'
    });

    if (onGestureRecognized) {
      onGestureRecognized({
        detected_movement: 'Composed Expression',
        confidence: 1.0,
        emoji: combinedEmoji,
        generated_message: fullText,
        source: 'live_camera'
      });
    }

    setTimeout(() => setIsSpeaking(false), 2500);
  };

  const currentCategoryObj = AAC_CATEGORIES.find(c => c.id === activeCategory) || AAC_CATEGORIES[0];

  return (
    <div className="communicator-container" style={{
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
            Augmentative Emoji Communication Board
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '3px 0 0 0' }}>
            High-contrast touch and gesture communication tiles with instant speech synthesis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {AAC_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  ttsService.playChime('click');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500
                }}
              >
                <Icon size={15} color={cat.color} />
                <span>{cat.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sentence Strip Composer */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        border: '1px solid var(--border-highlight)',
        background: 'rgba(15, 23, 42, 0.8)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Composed Message Strip:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {composedSentence.length > 0 && (
              <>
                <button
                  onClick={removeLast}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem'
                  }}
                >
                  Backspace
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    fontSize: '0.78rem'
                  }}
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{
          minHeight: '64px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          border: '1px dashed var(--border-color)'
        }}>
          {composedSentence.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Tap any tile below or make recognized camera gestures to build a sentence...
            </span>
          ) : (
            composedSentence.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                <span>{item.word}</span>
              </div>
            ))
          )}
        </div>

        {composedSentence.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={speakSentence}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: 'var(--radius-full)',
                background: isSpeaking ? 'var(--accent-emerald)' : 'var(--gradient-brand)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Volume2 size={18} />
              <span>{isSpeaking ? 'Speaking Sentence...' : 'Speak Full Sentence'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of AAC Tiles for Active Category */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {currentCategoryObj.items.map((item, index) => (
          <button
            key={index}
            onClick={() => addPhrase(item)}
            className="glass-panel"
            style={{
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textAlign: 'center',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              transition: 'all 0.2s ease',
              minHeight: '140px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = currentCategoryObj.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <span style={{ fontSize: '2.8rem' }}>{item.emoji}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.word}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
              "{item.phrase}"
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
