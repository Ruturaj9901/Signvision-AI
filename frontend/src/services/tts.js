/**
 * SignVision AI - Text-to-Speech & Sound Effects Service
 * Utilizes the Web Speech API (SpeechSynthesis) and Web Audio API for assistive audio feedback.
 */

class TTSService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    this.enabled = true;
    this.soundEffectsEnabled = true;
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
    this.audioCtx = null;

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getVoices() {
    return this.voices;
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  setPitch(pitch) {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  setSoundEffects(val) {
    this.soundEffectsEnabled = Boolean(val);
  }

  /**
   * Speak a phrase with throttling to avoid rapid repetitive stuttering.
   */
  speak(text, force = false) {
    if (!this.synth || !this.enabled || !text) return;

    const now = Date.now();
    // Prevent repeating the exact same phrase within 2.5 seconds unless forced
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 2500) {
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      // Select natural English voice if available
      const naturalVoice = this.voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')) && !v.name.includes('eSpeak')
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      this.synth.speak(utterance);
      this.lastSpokenText = text;
      this.lastSpokenTime = now;
    } catch (err) {
      console.warn('TTS error:', err);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Web Audio API synthesized sound effects (chimes, clicks, alerts).
   */
  playChime(type = 'success') {
    if (!this.soundEffectsEnabled || typeof window === 'undefined') return;

    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }

      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'success') {
        // High gentle two-tone chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        // Subtle UI tap
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'alert') {
        // Distinct alert chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.1); // C5
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // AudioContext policy or unsupported
    }
  }
}

export const ttsService = new TTSService();
export default ttsService;
