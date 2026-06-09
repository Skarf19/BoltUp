/**
 * StartScreen - Title screen with game intro and start button
 */

import { audioManager } from '../../audio/AudioManager.js';

export class StartScreen {
    constructor() {
        this.container = null;
        this.isVisible = true;
        this.onStart = null;

        this.createElement();
    }

    createElement() {
        this.container = document.createElement('div');
        this.container.id = 'start-screen';
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
            gap: clamp(10px, 1.6vh, 22px);
            z-index: 400;
            background: linear-gradient(180deg, #0c1445 0%, #1a1a2e 50%, #16213e 100%);
            font-family: 'Noto Sans KR', sans-serif;
            overflow: hidden;
        `;

        // Animated stars background
        this.createStars();

        // Moon
        const moon = document.createElement('div');
        moon.style.cssText = `
            position: absolute;
            top: 60px;
            right: 100px;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle at 30% 30%, #ffeaa7, #fdcb6e);
            border-radius: 50%;
            box-shadow: 0 0 60px rgba(255, 234, 167, 0.5);
        `;
        this.container.appendChild(moon);

        // Title container
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            text-align: center;
            margin-bottom: 0;
            z-index: 1;
        `;

        // Korean title
        const titleKo = document.createElement('div');
        titleKo.style.cssText = `
            font-size: clamp(46px, 7vw, 72px);
            font-weight: bold;
            color: #ffeaa7;
            text-shadow: 0 4px 30px rgba(255, 234, 167, 0.6);
            margin-bottom: 10px;
            animation: titleFloat 3s ease-in-out infinite;
        `;
        titleKo.textContent = '새벽에 벌떡';
        titleContainer.appendChild(titleKo);

        // English subtitle
        const titleEn = document.createElement('div');
        titleEn.style.cssText = `
            font-size: clamp(16px, 2.4vw, 24px);
            color: #74b9ff;
            text-shadow: 0 2px 15px rgba(116, 185, 255, 0.5);
            letter-spacing: 3px;
        `;
        titleEn.textContent = 'Suddenly Awake at Dawn';
        titleContainer.appendChild(titleEn);

        this.container.appendChild(titleContainer);

        // Character preview (sleeping emoji)
        const characterPreview = document.createElement('div');
        characterPreview.style.cssText = `
            font-size: clamp(64px, 8vw, 96px);
            margin-bottom: 0;
            animation: sleepyBounce 2s ease-in-out infinite;
            z-index: 1;
        `;
        characterPreview.textContent = '😴';
        this.container.appendChild(characterPreview);

        // Story text
        const story = document.createElement('div');
        story.style.cssText = `
            font-size: clamp(14px, 2vw, 18px);
            color: #dfe6e9;
            text-align: center;
            max-width: 500px;
            line-height: 1.6;
            margin-bottom: 0;
            z-index: 1;
        `;
        story.innerHTML = `
            <div style="margin-bottom: 15px;">새벽 5시, 알람이 울린다.</div>
            <div style="margin-bottom: 15px;">졸린 눈을 비비며 기도회까지...</div>
            <div style="color: #fdcb6e;">과연 제 시간에 도착할 수 있을까?</div>
        `;
        this.container.appendChild(story);

        // How to play
        const howToPlay = document.createElement('div');
        howToPlay.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: clamp(12px, 1.8vh, 20px) 30px;
            margin-bottom: 0;
            z-index: 1;
        `;
        howToPlay.innerHTML = `
            <div style="color: #81ecec; font-size: 16px; margin-bottom: 15px; font-weight: bold;">🎮 조작법</div>
            <div style="color: #fff; font-size: 14px; line-height: 2;">
                <div>🚶 <span style="color: #ffeaa7;">A/D</span>를 번갈아 밟아 몸을 세웁니다</div>
                <div>⌨️ 움직이는 동안만 졸린 뼈대에 힘이 들어갑니다</div>
                <div>😵 멈추면 바로 힘이 빠져 바닥으로 무너집니다</div>
                <div>☕ 커피를 마시면 <span style="color: #fdcb6e;">더 빨리</span> 갑니다!</div>
                <div>😴 졸리면 <span style="color: #ffeaa7;">Space</span>를 눌러 깨어나세요</div>
            </div>
        `;
        this.container.appendChild(howToPlay);

        // Start button
        const startBtn = document.createElement('button');
        startBtn.style.cssText = `
            font-size: clamp(20px, 3vw, 28px);
            font-weight: bold;
            color: #2d3436;
            background: linear-gradient(180deg, #ffeaa7 0%, #fdcb6e 100%);
            border: none;
            border-radius: 20px;
            padding: clamp(12px, 2vh, 20px) 60px;
            cursor: pointer;
            box-shadow: 0 5px 30px rgba(253, 203, 110, 0.5);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            font-family: 'Noto Sans KR', sans-serif;
            z-index: 1;
            animation: buttonPulse 2s ease-in-out infinite;
        `;
        startBtn.textContent = '🛏️ 일어나기';
        startBtn.onmouseover = () => {
            startBtn.style.transform = 'scale(1.08)';
            startBtn.style.boxShadow = '0 8px 40px rgba(253, 203, 110, 0.7)';
        };
        startBtn.onmouseout = () => {
            startBtn.style.transform = 'scale(1)';
            startBtn.style.boxShadow = '0 5px 30px rgba(253, 203, 110, 0.5)';
        };
        startBtn.onclick = () => {
            this.hide();
            if (this.onStart) {
                this.onStart();
            }
        };
        this.container.appendChild(startBtn);

        // Sound toggle button
        const soundBtn = document.createElement('button');
        soundBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            z-index: 1;
            transition: background 0.2s ease;
        `;
        soundBtn.textContent = '🔊';
        soundBtn.onclick = () => {
            const enabled = audioManager.toggle();
            soundBtn.textContent = enabled ? '🔊' : '🔇';
            soundBtn.style.background = enabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 100, 100, 0.2)';
        };
        soundBtn.onmouseover = () => {
            soundBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        };
        soundBtn.onmouseout = () => {
            soundBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        this.container.appendChild(soundBtn);

        // Credits
        const credits = document.createElement('div');
        credits.style.cssText = `
            position: absolute;
            bottom: 8px;
            font-size: 12px;
            color: #636e72;
            z-index: 0;
        `;
        credits.textContent = 'Computer Graphics 2025 - Handong Global University';
        this.container.appendChild(credits);

        // Add animations
        this.addAnimations();

        document.body.appendChild(this.container);
    }

    createStars() {
        const starsContainer = document.createElement('div');
        starsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
        `;

        // Create random stars
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            const size = Math.random() * 3 + 1;
            star.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: #fff;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.7 + 0.3};
                animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            starsContainer.appendChild(star);
        }

        this.container.appendChild(starsContainer);
    }

    addAnimations() {
        if (!document.getElementById('start-screen-animations')) {
            const style = document.createElement('style');
            style.id = 'start-screen-animations';
            style.textContent = `
                @keyframes titleFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes sleepyBounce {
                    0%, 100% { transform: translateY(0) rotate(-5deg); }
                    50% { transform: translateY(-15px) rotate(5deg); }
                }
                @keyframes buttonPulse {
                    0%, 100% { box-shadow: 0 5px 30px rgba(253, 203, 110, 0.5); }
                    50% { box-shadow: 0 5px 40px rgba(253, 203, 110, 0.8); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    setOnStart(callback) {
        this.onStart = callback;
    }

    destroy() {
        this.container?.remove();
    }
}
