/**
 * ResultScreen - Shows game result (win/lose) with stats and rank
 */

import { GAME_CONSTANTS } from '../../core/Constants.js';

export class ResultScreen {
    constructor() {
        this.container = null;
        this.isVisible = false;

        this.createElement();
    }

    createElement() {
        this.container = document.createElement('div');
        this.container.id = 'result-screen';
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
            z-index: 300;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            font-family: 'Noto Sans KR', sans-serif;
        `;

        // Background overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: -1;
        `;
        this.container.appendChild(overlay);

        document.body.appendChild(this.container);
    }

    show(result) {
        this.isVisible = true;
        this.container.innerHTML = '';

        // Re-add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: -1;
        `;
        this.container.appendChild(overlay);

        const isWin = result.success;

        // Result title
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 64px;
            font-weight: bold;
            color: ${isWin ? '#ffeaa7' : '#74b9ff'};
            margin-bottom: 20px;
            text-shadow: 0 4px 20px rgba(0,0,0,0.5);
            animation: ${isWin ? 'bounceIn' : 'fadeIn'} 0.5s ease;
        `;
        title.textContent = isWin ? '🙏 도착!' : '💤 실패...';
        this.container.appendChild(title);

        // Rank
        const rank = this.calculateRank(result);
        const rankElement = document.createElement('div');
        rankElement.style.cssText = `
            font-size: 28px;
            color: #fff;
            margin-bottom: 30px;
            padding: 10px 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border: 2px solid ${isWin ? '#ffeaa7' : '#74b9ff'};
        `;
        rankElement.textContent = rank;
        this.container.appendChild(rankElement);

        // Stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            text-align: center;
        `;

        const statItems = [
            { label: '소요 시간', value: this.formatTime(result.timeUsed), icon: '⏱️' },
            { label: '남은 시간', value: this.formatTime(result.timeLeft), icon: '⌛' },
            { label: '넘어진 횟수', value: `${result.fallCount}회`, icon: '💥' },
            { label: '진행도', value: `${(result.progress * 100).toFixed(0)}%`, icon: '📍' }
        ];

        statItems.forEach(stat => {
            const item = document.createElement('div');
            item.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 10px;
            `;
            item.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">${stat.icon}</div>
                <div style="font-size: 14px; color: #b2bec3;">${stat.label}</div>
                <div style="font-size: 20px; color: #fff; font-weight: bold;">${stat.value}</div>
            `;
            stats.appendChild(item);
        });

        this.container.appendChild(stats);

        // Message
        const message = document.createElement('div');
        message.style.cssText = `
            font-size: 18px;
            color: #dfe6e9;
            margin-bottom: 40px;
            text-align: center;
            max-width: 400px;
        `;
        message.textContent = this.getMessage(isWin, result);
        this.container.appendChild(message);

        // Restart button
        const restartBtn = document.createElement('button');
        restartBtn.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: #2d3436;
            background: linear-gradient(180deg, #ffeaa7 0%, #fdcb6e 100%);
            border: none;
            border-radius: 15px;
            padding: 15px 50px;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 5px 20px rgba(253, 203, 110, 0.4);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            font-family: 'Noto Sans KR', sans-serif;
        `;
        restartBtn.textContent = '다시 도전!';
        restartBtn.onmouseover = () => {
            restartBtn.style.transform = 'scale(1.05)';
            restartBtn.style.boxShadow = '0 8px 30px rgba(253, 203, 110, 0.6)';
        };
        restartBtn.onmouseout = () => {
            restartBtn.style.transform = 'scale(1)';
            restartBtn.style.boxShadow = '0 5px 20px rgba(253, 203, 110, 0.4)';
        };
        restartBtn.onclick = () => {
            if (this.onRestart) {
                this.onRestart();
            }
        };
        this.container.appendChild(restartBtn);

        // Show
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'auto';

        // Add animations
        this.addAnimations();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    calculateRank(result) {
        if (!result.success) {
            // Failure ranks (friendly)
            if (result.progress < 0.3) return '😴 이불의 유혹 승리';
            if (result.progress < 0.6) return '😪 반쯤 성공!';
            return '😅 거의 다 왔는데...';
        }

        // Success ranks (encouraging)
        const score = this.calculateScore(result);

        if (score >= 90) return '🏆 한동 새벽 레전드!';
        if (score >= 70) return '🥇 벌떡 마스터!';
        if (score >= 50) return '🥈 출석 완료!';
        return '🎉 성공! 수고했어요!';
    }

    calculateScore(result) {
        let score = 0;

        // Time bonus (max 50 points) - more generous
        const timeRatio = result.timeLeft / GAME_CONSTANTS.ROUND_DURATION;
        score += timeRatio * 50;

        // Stumble penalty (small, -3 per stumble)
        const stumblePenalty = result.fallCount * 3;
        score += Math.max(0, 20 - stumblePenalty);

        // Completion bonus (30 points for winning)
        if (result.success) {
            score += 30;
        }

        return Math.min(100, score);
    }

    getMessage(isWin, result) {
        if (!isWin) {
            if (result.reason === 'balance') {
                const balanceMessages = [
                    '서 있다가 그대로 잠들 뻔했습니다.',
                    '몸은 기도회에 가고 싶었지만 무릎은 침대로 돌아갔습니다.',
                    '잠깐 멈춘 사이 졸음이 균형을 가져갔습니다.'
                ];
                return balanceMessages[Math.floor(Math.random() * balanceMessages.length)];
            }

            const messages = [
                '이불의 유혹을 이기지 못했습니다...',
                '내일은 꼭 일어날 수 있을 거예요.',
                '새벽기도의 길은 험난합니다.',
                '조금만 더 빨리 일어났다면...',
                '알람 소리가 너무 달콤했나요?'
            ];
            return messages[Math.floor(Math.random() * messages.length)];
        }

        if (result.fallCount === 0) {
            return '한 번도 넘어지지 않고 도착! 대단해요!';
        } else if (result.timeLeft > 60) {
            return '여유롭게 도착했네요! 시간 관리의 달인!';
        } else if (result.timeLeft < 10) {
            return '아슬아슬하게 성공! 손에 땀을 쥐게 했네요!';
        } else {
            return '오늘도 새벽기도 출석 완료! 수고하셨습니다!';
        }
    }

    addAnimations() {
        if (!document.getElementById('result-animations')) {
            const style = document.createElement('style');
            style.id = 'result-animations';
            style.textContent = `
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(-20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    hide() {
        this.isVisible = false;
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
    }

    setOnRestart(callback) {
        this.onRestart = callback;
    }

    destroy() {
        this.container?.remove();
    }
}
