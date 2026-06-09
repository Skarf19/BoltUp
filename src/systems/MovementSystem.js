/**
 * MovementSystem - Converts rhythm-based input to player movement
 */

import { GAME_CONSTANTS } from '../core/Constants.js';

export class MovementSystem {
    constructor() {
        // Movement state
        this.currentSpeed = 0;
        this.targetSpeed = 0;

        // Step tracking for walking animation
        this.stepCount = 0;
        this.lastStepSide = 'left';

        // Boost for good rhythm streaks
        this.rhythmBoostMultiplier = 1.0;

        // Speed smoothing
        this.speedLerpFactor = 0.1;
    }

    update(rhythmData, deltaTime) {
        const { quality, isMoving, currentSide, consecutiveGood, timeSinceSwitch } = rhythmData;

        // Calculate target speed based on rhythm quality
        if (isMoving && timeSinceSwitch < GAME_CONSTANTS.RHYTHM_WINDOW * 2.5) {
            // Base speed
            const baseSpeed = GAME_CONSTANTS.BASE_SPEED;

            // Speed multiplier based on rhythm quality (0.5 to 1.5)
            const qualityMultiplier = GAME_CONSTANTS.MIN_SPEED +
                (GAME_CONSTANTS.MAX_SPEED_BONUS - GAME_CONSTANTS.MIN_SPEED) * quality;

            // Bonus for consecutive good rhythms
            this.rhythmBoostMultiplier = 1.0 + Math.min(consecutiveGood * 0.05, 0.3);

            this.targetSpeed = baseSpeed * qualityMultiplier * this.rhythmBoostMultiplier;

            // Count steps for animation
            if (currentSide !== this.lastStepSide && currentSide !== 'center') {
                this.stepCount++;
                this.lastStepSide = currentSide;
            }
        } else {
            // Not moving or rhythm stopped
            this.targetSpeed = 0;
            this.rhythmBoostMultiplier = Math.max(1.0, this.rhythmBoostMultiplier - deltaTime);
        }

        // Smooth speed transition
        this.currentSpeed = this.lerp(this.currentSpeed, this.targetSpeed, this.speedLerpFactor);

        // Calculate movement for this frame
        const movement = this.currentSpeed * deltaTime;

        return {
            movement,
            speed: this.currentSpeed,
            targetSpeed: this.targetSpeed,
            stepCount: this.stepCount,
            boostMultiplier: this.rhythmBoostMultiplier
        };
    }

    // Get current step for animation sync
    getCurrentStep() {
        return this.lastStepSide;
    }

    // Check if player is effectively moving
    isEffectivelyMoving() {
        return this.currentSpeed > 0.1;
    }

    // Get speed as percentage of max speed
    getSpeedPercentage() {
        const maxSpeed = GAME_CONSTANTS.BASE_SPEED * GAME_CONSTANTS.MAX_SPEED_BONUS * 1.3;
        return Math.min(1, this.currentSpeed / maxSpeed);
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    reset() {
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.stepCount = 0;
        this.lastStepSide = 'left';
        this.rhythmBoostMultiplier = 1.0;
    }
}
