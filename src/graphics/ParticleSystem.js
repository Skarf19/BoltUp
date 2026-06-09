/**
 * ParticleSystem - Simple CSS-based particle effects
 */

export class ParticleSystem {
    constructor() {
        this.container = null;
        this.particles = [];
        this.createElement();
    }

    createElement() {
        this.container = document.createElement('div');
        this.container.id = 'particle-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 150;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);

        // Add particle animations
        if (!document.getElementById('particle-animations')) {
            const style = document.createElement('style');
            style.id = 'particle-animations';
            style.textContent = `
                @keyframes particleFloat {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(0); opacity: 0; }
                }
                @keyframes particleBurst {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
                }
                @keyframes sparkle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                }
                @keyframes zFloat {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
                    100% { transform: translateY(-50px) rotate(20deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Create floating particles (for items)
    emitFloatingParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 8 + Math.random() * 8;
            const offsetX = (Math.random() - 0.5) * 60;
            const delay = Math.random() * 0.2;

            particle.style.cssText = `
                position: absolute;
                left: ${x + offsetX}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                animation: particleFloat 0.8s ease-out ${delay}s forwards;
                box-shadow: 0 0 10px ${color};
            `;

            this.container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // Create burst particles (for obstacles)
    emitBurstParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 6 + Math.random() * 6;
            const angle = (i / count) * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation: particleBurst 0.5s ease-out forwards;
            `;

            this.container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    }

    // Create sparkle effect (for special items)
    emitSparkles(x, y, count = 10) {
        const colors = ['#ffeaa7', '#fff', '#fdcb6e', '#81ecec'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 8;
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 80;
            const delay = Math.random() * 0.3;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                left: ${x + offsetX}px;
                top: ${y + offsetY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                animation: sparkle 0.6s ease-in-out ${delay}s forwards;
                box-shadow: 0 0 15px ${color};
            `;

            this.container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 900);
        }
    }

    // Create Z particles (for sleepiness)
    emitZParticles(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            const z = document.createElement('div');
            const size = 16 + i * 4;
            const delay = i * 0.3;
            const offsetX = i * 15;

            z.style.cssText = `
                position: absolute;
                left: ${x + offsetX}px;
                top: ${y - i * 10}px;
                font-size: ${size}px;
                color: #a29bfe;
                font-weight: bold;
                animation: zFloat 1.5s ease-out ${delay}s forwards;
                text-shadow: 0 0 10px rgba(162, 155, 254, 0.5);
            `;
            z.textContent = 'Z';

            this.container.appendChild(z);

            setTimeout(() => {
                z.remove();
            }, 2000);
        }
    }

    // Create coffee steam effect
    emitSteam(x, y) {
        for (let i = 0; i < 5; i++) {
            const steam = document.createElement('div');
            const size = 10 + Math.random() * 10;
            const offsetX = (Math.random() - 0.5) * 20;
            const delay = i * 0.1;

            steam.style.cssText = `
                position: absolute;
                left: ${x + offsetX}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                animation: particleFloat 1s ease-out ${delay}s forwards;
                filter: blur(3px);
            `;

            this.container.appendChild(steam);

            setTimeout(() => {
                steam.remove();
            }, 1200);
        }
    }

    // Victory confetti
    emitConfetti(count = 50) {
        const colors = ['#ffeaa7', '#fd79a8', '#74b9ff', '#00b894', '#e17055', '#a29bfe'];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            const size = 8 + Math.random() * 8;
            const x = Math.random() * window.innerWidth;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rotation = Math.random() * 360;

            confetti.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: -20px;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: ${color};
                transform: rotate(${rotation}deg);
                animation: confettiFall ${duration}s ease-in ${delay}s forwards;
            `;

            this.container.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, (duration + delay) * 1000 + 100);
        }

        // Add confetti animation if not exists
        if (!document.getElementById('confetti-animation')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${window.innerHeight + 50}px) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    destroy() {
        this.container?.remove();
    }
}

// Singleton instance
export const particleSystem = new ParticleSystem();
