/**
 * Web Audio API Retro Sound Effects Engine
 * Generates classic 8-bit chiptune sounds without any external audio files.
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('dino_sound_muted') === 'true';
        this.initialized = false;
    }

    init() {
        if (this.initialized && this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked in this browser.', e);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('dino_sound_muted', this.muted);
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // Classic 8-bit jump sound: square wave with rapid upward pitch sweep
    playJump() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.14);
        } catch (e) {
            // Audio error safeguard
        }
    }

    // 100-point milestone chime: two-tone upbeat bell
    playScore() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;

            // First note
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(659.25, now); // E5
            gain1.gain.setValueAtTime(0.14, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.1);

            // Second note (higher pitch)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(880.00, now + 0.11); // A5
            gain2.gain.setValueAtTime(0.16, now + 0.11);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(now + 0.11);
            osc2.stop(now + 0.28);
        } catch (e) {}
    }

    // Game over crash sound: low punch crunch with noise simulation
    playHit() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.25);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    // Subtle UI button click sound
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }
}

// Global instance
window.sound = new SoundEffects();
