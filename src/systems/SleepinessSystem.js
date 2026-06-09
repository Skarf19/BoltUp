/**
 * SleepinessSystem - Simple sleepiness tracking
 * NO blur effects - just yawning and speed reduction
 */

import { GAME_CONSTANTS } from '../core/Constants.js';

export class SleepinessSystem {
    constructor() {
        this.value = GAME_CONSTANTS.SLEEPINESS_START;

        // Yawn effect (cosmetic)
        this.isYawning = false;
        this.yawnTimer = 0;
        this.yawnCooldown = 0;

        // Caffeine boost
        this.caffeineBoostUntil = 0;
        this.hasCaffeineBoost = false;
        this.speedBoost = 1.0;
    }

    update(deltaTime) {
        // Check caffeine boost
        const now = performance.now();
        this.hasCaffeineBoost = now < this.caffeineBoostUntil;

        if (this.hasCaffeineBoost) {
            this.speedBoost = GAME_CONSTANTS.COFFEE_SPEED_BOOST;
        } else {
            this.speedBoost = 1.0;
        }

        // Increase sleepiness over time (very slow)
        let increaseRate = GAME_CONSTANTS.SLEEPINESS_RATE;

        if (this.hasCaffeineBoost) {
            increaseRate *= 0.2;  // Much slower with caffeine
        }

        this.value += increaseRate * deltaTime;
        this.value = Math.min(GAME_CONSTANTS.SLEEPINESS_MAX, this.value);

        // Update yawn effect
        this.updateYawn(deltaTime);

        return this.getStatus();
    }

    updateYawn(deltaTime) {
        // Yawn when sleepy
        if (this.isYawning) {
            this.yawnTimer += deltaTime;
            if (this.yawnTimer > 1.5) {  // Yawn lasts 1.5 seconds
                this.isYawning = false;
                this.yawnTimer = 0;
                this.yawnCooldown = 8;  // Minimum 8 seconds between yawns
            }
        } else {
            this.yawnCooldown -= deltaTime;

            // Trigger yawn based on sleepiness
            if (this.yawnCooldown <= 0 && this.value >= GAME_CONSTANTS.SLEEPINESS_WARNING) {
                const yawnChance = (this.value - GAME_CONSTANTS.SLEEPINESS_WARNING) / 100;
                if (Math.random() < yawnChance * deltaTime) {
                    this.isYawning = true;
                    this.yawnTimer = 0;
                }
            }
        }
    }

    // Check if should trigger doze (sleepiness maxed out)
    shouldDoze() {
        return this.value >= GAME_CONSTANTS.SLEEPINESS_DOZE;
    }

    // Reset sleepiness after doze recovery
    wakeUp() {
        this.value = Math.max(40, this.value - 30);
    }

    // Add sleepiness (from pillow)
    addSleepiness(amount) {
        if (this.hasCaffeineBoost) {
            amount *= 0.3;
        }
        this.value = Math.min(100, this.value + amount);
    }

    // Reduce sleepiness (from coffee)
    reduceSleepiness(amount) {
        this.value = Math.max(0, this.value - amount);
    }

    // Apply caffeine boost
    applyCaffeineBoost(durationSeconds) {
        this.caffeineBoostUntil = performance.now() + durationSeconds * 1000;
    }

    // Get speed multiplier based on sleepiness
    getSpeedMultiplier() {
        // Base multiplier from sleepiness (100% -> 70%)
        let multiplier = 1.0 - (this.value / 100) * (1 - GAME_CONSTANTS.MIN_SPEED_MULTIPLIER);

        // Apply caffeine boost
        multiplier *= this.speedBoost;

        return multiplier;
    }

    getStatus() {
        return {
            value: this.value,
            percentage: this.value / 100,
            isYawning: this.isYawning,
            yawnProgress: this.yawnTimer / 1.5,
            hasCaffeineBoost: this.hasCaffeineBoost,
            caffeineBoostTimeLeft: Math.max(0, (this.caffeineBoostUntil - performance.now()) / 1000),
            speedMultiplier: this.getSpeedMultiplier(),
            isWarning: this.value >= GAME_CONSTANTS.SLEEPINESS_WARNING,
            isDanger: this.value >= GAME_CONSTANTS.SLEEPINESS_DANGER,
            shouldDoze: this.shouldDoze(),

            // No blur/vignette/darkness - always 0
            blur: 0,
            vignette: 0,
            darkness: 0,
            headDroop: this.isYawning ? Math.sin(this.yawnTimer * 2) * 0.2 : 0
        };
    }

    reset() {
        this.value = GAME_CONSTANTS.SLEEPINESS_START;
        this.isYawning = false;
        this.yawnTimer = 0;
        this.yawnCooldown = 0;
        this.caffeineBoostUntil = 0;
        this.hasCaffeineBoost = false;
        this.speedBoost = 1.0;
    }
}
