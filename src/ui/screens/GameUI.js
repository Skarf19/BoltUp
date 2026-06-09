/**
 * GameUI - In-game HUD (timer, progress, sleepiness, etc.)
 */

import { GAME_CONSTANTS } from '../../core/Constants.js';

export class GameUI {
    constructor() {
        this.container = null;
        this.timerElement = null;
        this.progressBar = null;
        this.sleepinessBar = null;
        this.balanceIndicator = null;
        this.fallCounter = null;
        this.zoneIndicator = null;
        this.buffIndicators = null;

        this.createElement();
    }

    createElement() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'game-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            font-family: 'Noto Sans KR', sans-serif;
        `;

        // Top bar (timer and zone)
        const topBar = document.createElement('div');
        topBar.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 30px;
        `;

        // Timer
        this.timerElement = document.createElement('div');
        this.timerElement.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            font-family: monospace;
        `;
        topBar.appendChild(this.timerElement);

        this.container.appendChild(topBar);

        // Left side panel (progress and sleepiness)
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            position: absolute;
            top: 100px;
            left: 20px;
            width: 200px;
        `;

        // Progress section
        const progressSection = this.createBarSection('진행도', '#00b894');
        this.progressBar = progressSection.querySelector('.bar-fill');
        this.zoneIndicator = document.createElement('span');
        this.zoneIndicator.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            font-size: 12px;
            color: #81ecec;
        `;
        progressSection.querySelector('.bar-label').appendChild(this.zoneIndicator);
        leftPanel.appendChild(progressSection);

        // Sleepiness section
        const sleepinessSection = this.createBarSection('졸림', '#a29bfe');
        this.sleepinessBar = sleepinessSection.querySelector('.bar-fill');
        leftPanel.appendChild(sleepinessSection);

        // Balance indicator
        const balanceSection = document.createElement('div');
        balanceSection.style.cssText = `
            margin-top: 15px;
        `;
        balanceSection.innerHTML = `
            <div class="bar-label" style="color: #74b9ff; font-size: 14px; margin-bottom: 5px;">균형</div>
            <div style="background: rgba(0,0,0,0.5); border-radius: 10px; height: 12px; position: relative; overflow: hidden;">
                <div style="position: absolute; left: 50%; top: 0; width: 2px; height: 100%; background: #636e72;"></div>
                <div class="balance-indicator" style="
                    position: absolute;
                    width: 16px;
                    height: 12px;
                    background: #74b9ff;
                    border-radius: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                    transition: left 0.05s ease;
                "></div>
            </div>
        `;
        this.balanceIndicator = balanceSection.querySelector('.balance-indicator');
        leftPanel.appendChild(balanceSection);

        this.container.appendChild(leftPanel);

        // Right side panel (falls and buffs)
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            text-align: right;
        `;

        // Fall counter
        this.fallCounter = document.createElement('div');
        this.fallCounter.style.cssText = `
            font-size: 18px;
            color: #fff;
            margin-bottom: 10px;
        `;
        rightPanel.appendChild(this.fallCounter);

        // Buff indicators
        this.buffIndicators = document.createElement('div');
        this.buffIndicators.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        `;
        rightPanel.appendChild(this.buffIndicators);

        this.container.appendChild(rightPanel);

        document.body.appendChild(this.container);
    }

    createBarSection(label, color) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 15px;
        `;
        section.innerHTML = `
            <div class="bar-label" style="color: ${color}; font-size: 14px; margin-bottom: 5px; position: relative;">${label}</div>
            <div style="background: rgba(0,0,0,0.5); border-radius: 8px; height: 10px; overflow: hidden;">
                <div class="bar-fill" style="
                    background: linear-gradient(90deg, ${color}, ${this.lightenColor(color)});
                    height: 100%;
                    width: 0%;
                    border-radius: 8px;
                    transition: width 0.2s ease;
                "></div>
            </div>
        `;
        return section;
    }

    lightenColor(color) {
        // Simple color lightening
        const colors = {
            '#00b894': '#00cec9',
            '#a29bfe': '#c8b6ff',
            '#74b9ff': '#a1c9ff',
            '#e17055': '#ff8a5b'
        };
        return colors[color] || color;
    }

    update(data) {
        const { timer, progress, sleepiness, balance, fallCount, zone, buffs } = data;

        // Timer
        const minutes = Math.floor(timer / 60);
        const seconds = Math.ceil(timer % 60);
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Timer color based on remaining time
        if (timer < 20) {
            this.timerElement.style.color = '#e17055';
            this.timerElement.style.animation = 'pulse 0.5s ease-in-out infinite';
        } else if (timer < 40) {
            this.timerElement.style.color = '#fdcb6e';
            this.timerElement.style.animation = 'none';
        } else {
            this.timerElement.style.color = '#fff';
            this.timerElement.style.animation = 'none';
        }

        // Progress bar
        this.progressBar.style.width = `${progress * 100}%`;
        this.zoneIndicator.textContent = `Zone ${zone}`;

        // Sleepiness bar
        this.sleepinessBar.style.width = `${sleepiness}%`;
        if (sleepiness > 80) {
            this.sleepinessBar.style.background = 'linear-gradient(90deg, #e17055, #ff7675)';
        } else if (sleepiness > 50) {
            this.sleepinessBar.style.background = 'linear-gradient(90deg, #fdcb6e, #ffeaa7)';
        } else {
            this.sleepinessBar.style.background = 'linear-gradient(90deg, #a29bfe, #c8b6ff)';
        }

        // Balance indicator (range: -30 to +30)
        const balancePosition = 50 + (balance / GAME_CONSTANTS.BALANCE_MAX) * 45;
        this.balanceIndicator.style.left = `${balancePosition}%`;

        if (Math.abs(balance) > 20) {
            this.balanceIndicator.style.background = '#fdcb6e';
        } else {
            this.balanceIndicator.style.background = '#74b9ff';
        }

        // Stumble counter (renamed from fall)
        this.fallCounter.innerHTML = `
            <span style="color: #fdcb6e;">😵</span>
            <span style="color: #fff;">비틀거림: ${fallCount}</span>
        `;

        // Buffs
        this.updateBuffs(buffs);
    }

    updateBuffs(buffs) {
        this.buffIndicators.innerHTML = '';

        if (buffs.stabilized) {
            const buff = document.createElement('div');
            buff.style.cssText = `
                background: rgba(116, 185, 255, 0.8);
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                color: #fff;
            `;
            buff.textContent = `🛡️ 균형 안정 ${buffs.stabilizedTime.toFixed(1)}s`;
            this.buffIndicators.appendChild(buff);
        }

        if (buffs.caffeine) {
            const buff = document.createElement('div');
            buff.style.cssText = `
                background: rgba(253, 203, 110, 0.8);
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                color: #2d3436;
            `;
            buff.textContent = `☕ 카페인 ${buffs.caffeineTime.toFixed(1)}s`;
            this.buffIndicators.appendChild(buff);
        }
    }

    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

    destroy() {
        this.container?.remove();
    }
}

// Add pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);
