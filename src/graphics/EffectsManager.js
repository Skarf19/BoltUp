/**
 * EffectsManager - Simple visual effects (NO blur, NO darkness)
 * Only uses: flash, warning border, Z particles
 */

export class EffectsManager {
    constructor() {
        // Warning overlay (gentle orange glow when sleepy)
        this.warningOverlay = null;

        // Z particles for dozing effect
        this.zParticles = [];
        this.zContainer = null;

        this.createOverlays();
    }

    createOverlays() {
        // Warning overlay (edge glow, not blocking)
        this.warningOverlay = document.createElement('div');
        this.warningOverlay.id = 'warning-overlay';
        this.warningOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            opacity: 0;
            transition: opacity 0.5s ease;
            box-shadow: inset 0 0 100px rgba(255, 150, 50, 0.3);
        `;
        document.body.appendChild(this.warningOverlay);

        // Z particles container
        this.zContainer = document.createElement('div');
        this.zContainer.id = 'z-particles';
        this.zContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 53;
            overflow: hidden;
        `;
        document.body.appendChild(this.zContainer);

        // Add Z animation style
        const style = document.createElement('style');
        style.id = 'z-animation-style';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    transform: translateY(0) rotate(0deg) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(-120px) rotate(20deg) scale(1.3);
                    opacity: 0;
                }
            }
            @keyframes flashFade {
                0% { opacity: 0.4; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    update(sleepinessStatus, balanceStatus) {
        // Show warning glow when sleepiness is high
        if (sleepinessStatus.isDanger) {
            this.warningOverlay.style.opacity = '1';
        } else if (sleepinessStatus.isWarning) {
            this.warningOverlay.style.opacity = '0.5';
        } else {
            this.warningOverlay.style.opacity = '0';
        }

        // Spawn Z particles when yawning
        if (sleepinessStatus.isYawning) {
            this.maybeSpawnZParticle();
        }

        this.updateZParticles();
    }

    maybeSpawnZParticle() {
        // Limit particle count
        if (this.zParticles.length > 5) return;

        // Only spawn occasionally
        if (Math.random() > 0.03) return;

        const z = document.createElement('div');
        z.textContent = 'Z';
        z.style.cssText = `
            position: absolute;
            left: ${48 + Math.random() * 4}%;
            bottom: 35%;
            font-size: ${18 + Math.random() * 12}px;
            color: rgba(162, 155, 254, 0.8);
            font-weight: bold;
            text-shadow: 0 0 8px rgba(162, 155, 254, 0.5);
            animation: floatUp ${2.5 + Math.random() * 1.5}s ease-out forwards;
            pointer-events: none;
        `;

        this.zContainer.appendChild(z);
        this.zParticles.push({
            element: z,
            spawnTime: performance.now(),
            lifetime: 2500 + Math.random() * 1500
        });
    }

    updateZParticles() {
        const now = performance.now();

        this.zParticles = this.zParticles.filter(particle => {
            if (now - particle.spawnTime > particle.lifetime) {
                particle.element.remove();
                return false;
            }
            return true;
        });
    }

    // Flash effect for item pickup or events
    flash(color = 'rgba(255, 255, 255, 0.3)', duration = 0.2) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            pointer-events: none;
            z-index: 60;
            animation: flashFade ${duration}s ease-out forwards;
        `;
        document.body.appendChild(flash);

        setTimeout(() => flash.remove(), duration * 1000);
    }

    // Cleanup
    destroy() {
        this.warningOverlay?.remove();
        this.zContainer?.remove();
    }

    reset() {
        this.warningOverlay.style.opacity = '0';

        // Clear Z particles
        this.zParticles.forEach(p => p.element.remove());
        this.zParticles = [];
    }
}
