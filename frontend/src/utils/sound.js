// Web Audio API Sound Generator & Controller for PakadYaar

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('pakadyaar_muted') === 'true';
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('pakadyaar_muted', this.muted);
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, startVolume = 0.3, endVolume = 0.01) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(startVolume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(endVolume, 0.0001), this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Ignore audio initialization constraints
    }
  }

  // 1. Button Click / Tap
  click() {
    this.playTone(600, 'sine', 0.05, 0.25);
  }

  // 2. Card Flip Sound Effect (Realistic pitch-sweep + chime sparkle)
  cardFlip() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.14);

      setTimeout(() => this.playTone(1050, 'triangle', 0.15, 0.25), 70);
    } catch (e) {
      // Ignore
    }
  }

  // 3. Card Select / Tap Effect
  cardSelect() {
    if (this.muted) return;
    this.playTone(720, 'sine', 0.06, 0.3);
  }

  // 4. Secret Word Reveal (Chime)
  reveal() {
    if (this.muted) return;
    this.cardFlip();
    [400, 550, 700, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.18, 0.25), i * 70);
    });
  }

  // 5. Hint Unlock
  hint() {
    if (this.muted) return;
    [520, 650, 780].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.12, 0.2), i * 50);
    });
  }

  // 6. Game Start / Phase Transition
  start() {
    if (this.muted) return;
    [300, 450, 600].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.25), i * 80);
    });
  }

  // 7. Urgent Timer Tik-Tok (Last 15 seconds) - Clear, loud alternating clock tick
  tick(remainingSeconds = 15) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      // Alternate between Tik (1200Hz) and Tok (900Hz)
      const freq = (remainingSeconds % 2 === 0) ? 1200 : 900;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      // Ignore
    }
  }

  // 8. Vote Cast
  vote() {
    this.playTone(480, 'sine', 0.08, 0.3);
  }

  // 9. Victory / Players Win Fanfare
  victory() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.35), i * 110);
    });
  }

  // 10. Imposter Win / Defeat Sound
  defeat() {
    if (this.muted) return;
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.22, 0.3), i * 120);
    });
  }

  // 11. Tie / Draw
  draw() {
    if (this.muted) return;
    [440, 440].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.25), i * 150);
    });
  }
}

const sound = new SoundManager();
export default sound;
