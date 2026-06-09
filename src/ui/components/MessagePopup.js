/**
 * MessagePopup - Shows funny feedback messages during gameplay
 */

export class MessagePopup {
    constructor() {
        this.container = null;
        this.messageQueue = [];
        this.isShowing = false;
        this.currentTimeout = null;

        this.createElement();
    }

    createElement() {
        this.container = document.createElement('div');
        this.container.id = 'message-popup';
        this.container.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 15px 30px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 15px;
            z-index: 150;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            font-family: 'Noto Sans KR', sans-serif;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            max-width: 80%;
            white-space: nowrap;
        `;
        document.body.appendChild(this.container);

        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes messageSlideIn {
                0% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
                100% { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            @keyframes messageSlideOut {
                0% { transform: translateX(-50%) translateY(0); opacity: 1; }
                100% { transform: translateX(-50%) translateY(20px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = 2000) {
        // Add to queue
        this.messageQueue.push({ message, type, duration });

        // Process queue if not already showing
        if (!this.isShowing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.messageQueue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const { message, type, duration } = this.messageQueue.shift();

        // Set style based on type
        this.setStyle(type);

        // Show message
        this.container.textContent = message;
        this.container.style.animation = 'messageSlideIn 0.3s ease forwards';

        // Clear any existing timeout
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        // Hide after duration
        this.currentTimeout = setTimeout(() => {
            this.container.style.animation = 'messageSlideOut 0.3s ease forwards';

            setTimeout(() => {
                this.processQueue();
            }, 300);
        }, duration);
    }

    setStyle(type) {
        switch (type) {
            case 'obstacle':
                this.container.style.background = 'rgba(225, 112, 85, 0.9)';
                this.container.style.borderLeft = '5px solid #d63031';
                break;
            case 'item':
                this.container.style.background = 'rgba(0, 184, 148, 0.9)';
                this.container.style.borderLeft = '5px solid #00cec9';
                break;
            case 'warning':
                this.container.style.background = 'rgba(253, 203, 110, 0.9)';
                this.container.style.color = '#2d3436';
                this.container.style.borderLeft = '5px solid #fdcb6e';
                break;
            case 'info':
            default:
                this.container.style.background = 'rgba(116, 185, 255, 0.9)';
                this.container.style.borderLeft = '5px solid #0984e3';
                this.container.style.color = '#fff';
                break;
        }
    }

    // Predefined funny messages
    showObstacleMessage(obstacleType) {
        const messages = {
            pillow: [
                '푹신한 베개의 유혹...',
                '이불의 부름이 들립니다...',
                '잠깐만... 5분만...',
                '베개가 손짓합니다...'
            ],
            threshold: [
                '문턱에 걸렸습니다!',
                '발이 아직 자고 있습니다.',
                '왼발이 반란을 일으켰습니다.',
                '오른발이 독립을 선언했습니다.'
            ],
            cable: [
                '충전기 선이 발목을 잡았습니다!',
                '케이블의 습격!',
                '누가 충전기를 여기에...',
                '발이 케이블에 감겼습니다!'
            ],
            bench: [
                '벤치에 부딪혔습니다!',
                '앉고 싶은 유혹...',
                '잠깐 앉아볼까... 아니!',
                '벤치가 갑자기 나타났습니다!'
            ],
            puddle: [
                '물웅덩이에 미끄러졌습니다!',
                '새벽 이슬이 위험합니다...',
                '발이 젖었습니다!',
                '미끄러운 새벽길...'
            ]
        };

        const typeMessages = messages[obstacleType] || ['앗!'];
        const message = typeMessages[Math.floor(Math.random() * typeMessages.length)];
        this.show(message, 'obstacle', 1500);
    }

    showItemMessage(itemType) {
        const messages = {
            coffee: [
                '☕ 커피를 마셨습니다!',
                '☕ 카페인 충전!',
                '☕ 눈이 번쩍 떠집니다!',
                '☕ 아메리카노의 힘!'
            ],
            water: [
                '💧 차가운 물로 정신이 맑아집니다!',
                '💧 시원한 물 한 모금!',
                '💧 균형감각이 돌아옵니다!',
                '💧 청량한 기운!'
            ],
            alarm: [
                '⏰ 알람이 울립니다! 정신이 번쩍!',
                '⏰ 따르르릉! 기상!',
                '⏰ 알람의 힘으로 각성!',
                '⏰ 더 이상 졸 수 없습니다!'
            ]
        };

        const typeMessages = messages[itemType] || ['아이템 획득!'];
        const message = typeMessages[Math.floor(Math.random() * typeMessages.length)];
        this.show(message, 'item', 2000);
    }

    showRandomTip() {
        const tips = [
            '눈은 감겼지만 방향은 맞습니다.',
            '몸은 자고 있지만 의지는 깨어 있습니다.',
            '새벽 공기가 현실을 알려줍니다.',
            '거의 도착했습니다. 이제 졸지 마세요.',
            '졸음과의 싸움, 포기하지 마세요!',
            '한동 새벽기도, 파이팅!'
        ];

        const tip = tips[Math.floor(Math.random() * tips.length)];
        this.show(tip, 'info', 2500);
    }

    destroy() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }
        this.container?.remove();
    }
}
