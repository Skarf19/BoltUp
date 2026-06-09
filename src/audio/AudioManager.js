/**
 * AudioManager - Handles game audio with Web Audio API
 * Uses procedural audio generation for sound effects
 */

export class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.enabled = true;
        this.initialized = false;

        // Try to initialize on first user interaction
        this.initOnInteraction();
    }

    initOnInteraction() {
        const initAudio = () => {
            if (!this.initialized) {
                this.init();
            }
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.3;
            this.initialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    // Play a simple beep/tone
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.initialized) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    // Footstep sound - soft thud
    playFootstep() {
        if (!this.enabled || !this.initialized) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = 'triangle';
        oscillator.frequency.value = 80 + Math.random() * 20;

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }

    // Good rhythm - pleasant ding
    playRhythmGood() {
        this.playTone(523, 0.15, 'sine', 0.2); // C5
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.15), 50); // E5
    }

    // Perfect rhythm - sparkly sound
    playRhythmPerfect() {
        this.playTone(784, 0.1, 'sine', 0.2); // G5
        setTimeout(() => this.playTone(988, 0.1, 'sine', 0.2), 60); // B5
        setTimeout(() => this.playTone(1175, 0.15, 'sine', 0.15), 120); // D6
    }

    // Item collect - cheerful ascending
    playItemCollect() {
        if (!this.enabled || !this.initialized) return;

        [392, 494, 587, 784].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.25), i * 50);
        });
    }

    // Coffee collect - energetic
    playCoffeeCollect() {
        if (!this.enabled || !this.initialized) return;

        this.playTone(440, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(554, 0.1, 'square', 0.15), 80);
        setTimeout(() => this.playTone(659, 0.15, 'square', 0.2), 160);
    }

    // Alarm collect - wake up!
    playAlarmCollect() {
        if (!this.enabled || !this.initialized) return;

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(880, 0.08, 'square', 0.2);
                setTimeout(() => this.playTone(1100, 0.08, 'square', 0.2), 80);
            }, i * 180);
        }
    }

    // Obstacle hit - thud/bump
    playObstacleHit() {
        if (!this.enabled || !this.initialized) return;

        const noise = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        noise.type = 'sawtooth';
        noise.frequency.value = 100;

        filter.type = 'lowpass';
        filter.frequency.value = 300;

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

        noise.start(this.context.currentTime);
        noise.stop(this.context.currentTime + 0.2);
    }

    // Pillow hit - soft poof
    playPillowHit() {
        if (!this.enabled || !this.initialized) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.3);
    }

    // Fall - crash sound
    playFall() {
        if (!this.enabled || !this.initialized) return;

        // Initial impact
        this.playTone(80, 0.3, 'sawtooth', 0.4);

        // Secondary bounce
        setTimeout(() => this.playTone(60, 0.2, 'triangle', 0.2), 200);
    }

    // Recovery click - click sound
    playRecoveryClick() {
        this.playTone(600, 0.05, 'square', 0.15);
    }

    // Recovery success - triumphant
    playRecoverySuccess() {
        if (!this.enabled || !this.initialized) return;

        [262, 330, 392, 523].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 100);
        });
    }

    // Recovery fail - descending
    playRecoveryFail() {
        if (!this.enabled || !this.initialized) return;

        [392, 330, 262, 196].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.2), i * 100);
        });
    }

    // Win - victory fanfare
    playWin() {
        if (!this.enabled || !this.initialized) return;

        const melody = [523, 523, 523, 698, 880, 784, 698, 880];
        const durations = [0.1, 0.1, 0.1, 0.3, 0.15, 0.15, 0.15, 0.5];
        const delays = [0, 120, 240, 400, 700, 850, 1000, 1150];

        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, durations[i], 'sine', 0.3), delays[i]);
        });
    }

    // Lose - sad melody
    playLose() {
        if (!this.enabled || !this.initialized) return;

        const melody = [392, 370, 330, 294];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.2), i * 400);
        });
    }

    // Timer warning - urgent beep
    playTimerWarning() {
        this.playTone(880, 0.1, 'square', 0.2);
    }

    // Sleepiness warning - drowsy sound
    playSleepinessWarning() {
        if (!this.enabled || !this.initialized) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.context.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, this.context.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 0.5);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.5);
    }

    // Start game - anticipation
    playGameStart() {
        if (!this.enabled || !this.initialized) return;

        const notes = [262, 330, 392, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.25), i * 150);
        });
    }

    // Toggle audio on/off
    toggle() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? 0.3 : 0;
        }
        return this.enabled;
    }

    // Set master volume (0-1)
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}

// Singleton instance
export const audioManager = new AudioManager();
