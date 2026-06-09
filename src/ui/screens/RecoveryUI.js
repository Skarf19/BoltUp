/**
 * RecoveryUI - Simple "벌떡!" button
 * Just one click to recover!
 */

export class RecoveryUI {
    constructor() {
        this.container = null;
        this.button = null;
        this.message = null;
        this.isVisible = false;

        this.createElement();
    }

    createElement() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'recovery-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 200;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Background overlay (lighter)
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: -1;
        `;
        this.container.appendChild(overlay);

        // Message
        this.message = document.createElement('div');
        this.message.style.cssText = `
            font-size: 32px;
            color: #fff;
            margin-bottom: 30px;
            text-shadow: 0 3px 15px rgba(0,0,0,0.5);
            font-family: 'Noto Sans KR', sans-serif;
        `;
        this.container.appendChild(this.message);

        // Big "벌떡!" button
        this.button = document.createElement('button');
        this.button.id = 'recovery-button';
        this.button.innerHTML = '벌떡!';
        this.button.style.cssText = `
            font-size: 80px;
            font-weight: bold;
            color: #fff;
            background: linear-gradient(180deg, #ffeaa7 0%, #fdcb6e 100%);
            border: 6px solid #fff;
            border-radius: 30px;
            padding: 30px 100px;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 10px 50px rgba(253, 203, 110, 0.6);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            font-family: 'Noto Sans KR', sans-serif;
            user-select: none;
            -webkit-user-select: none;
            outline: none;
            animation: gentlePulse 1s ease-in-out infinite;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        this.container.appendChild(this.button);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gentlePulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 10px 50px rgba(253, 203, 110, 0.6);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 15px 60px rgba(253, 203, 110, 0.8);
                }
            }
            #recovery-button:hover {
                transform: scale(1.1) !important;
                box-shadow: 0 15px 60px rgba(253, 203, 110, 0.9) !important;
            }
            #recovery-button:active {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);

        // Instruction text
        const instruction = document.createElement('div');
        instruction.style.cssText = `
            font-size: 22px;
            color: #dfe6e9;
            margin-top: 25px;
            font-family: 'Noto Sans KR', sans-serif;
        `;
        instruction.innerHTML = '클릭하거나 <span style="color: #ffeaa7; font-weight: bold;">Space</span> 키를 누르세요!';
        this.container.appendChild(instruction);

        document.body.appendChild(this.container);
    }

    show(type) {
        this.isVisible = true;
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'auto';

        // Set message based on type
        if (type === 'stumble') {
            this.message.innerHTML = '😵 비틀거렸습니다!';
        } else {
            this.message.innerHTML = '😴 졸고 있습니다!';
        }
    }

    hide() {
        this.isVisible = false;
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
    }

    // Show success feedback
    showSuccess() {
        this.message.innerHTML = '✨ 벌떡!';
        this.message.style.color = '#00b894';
        this.button.innerHTML = '👍';
        this.button.style.background = 'linear-gradient(180deg, #00b894 0%, #00a085 100%)';
        this.button.style.animation = 'none';
        this.button.style.transform = 'scale(1.2)';

        setTimeout(() => this.hide(), 500);
    }

    // Get button element for click event
    getButton() {
        return this.button;
    }

    // Compatibility methods (not needed but prevent errors)
    update() {}
    showFailure() { this.hide(); }

    destroy() {
        this.container?.remove();
    }
}
