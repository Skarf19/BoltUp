/**
 * 새벽에 벌떡 (Suddenly Awake at Dawn)
 * Main entry point
 */

import { Game } from './Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Create and start the game
    const game = new Game();

    // Expose game to window for debugging (remove in production)
    window.game = game;

    console.log('%c새벽에 벌떡', 'color: #ffeaa7; font-size: 28px; font-weight: bold;');
    console.log('%cSuddenly Awake at Dawn', 'color: #74b9ff; font-size: 16px;');
    console.log('');
    console.log('%cMVP - Simplified & Easy Version', 'color: #00b894; font-size: 14px;');
    console.log('');
    console.log('🎮 Controls:');
    console.log('  Character walks automatically!');
    console.log('  A / D - Adjust balance (optional)');
    console.log('  Space - Wake up when dozing');
    console.log('  R - Reset | M - Mute');
    console.log('');
    console.log('☕ Collect coffee to move faster!');
    console.log('💧 Collect water for balance!');
    console.log('🛏️ Avoid pillows (make you sleepy)');
});
