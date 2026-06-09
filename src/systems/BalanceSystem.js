/**
 * BalanceSystem - Active/inactive ragdoll tension.
 * Input gives the sleepy skeleton muscle. No input quickly removes joint
 * strength, so momentum and gravity-like collapse take over.
 */

import { GAME_CONSTANTS } from '../core/Constants.js';

export class BalanceSystem {
    constructor() {
        this.value = 0;
        this.momentum = 0;
        this.visualWobble = 0;
        this.wobbleTime = 0;
        this.idleTime = 0;
        this.lastLeanDirection = 1;
        this.bodyActivation = 0;
        this.collapseAmount = 0;
        this.jointStrength = GAME_CONSTANTS.BODY_INACTIVE_JOINT_STRENGTH;

        this.isStabilized = false;
        this.stabilizedTimer = 0;
    }

    update(nudgeDirection, sleepiness, deltaTime, stepData = null) {
        this.wobbleTime += deltaTime;

        const sleepinessRatio = sleepiness / 100;
        const hasMovementInput = stepData?.hasMovementInput || false;
        const stepPulse = stepData?.pulse || false;
        const pulseSide = stepData?.pulseSide || nudgeDirection;
        const alternationBoost = stepData?.alternationBoost || 0;
        const wobbleAmplitude = 6 + sleepinessRatio * 10;
        this.visualWobble = Math.sin(this.wobbleTime * GAME_CONSTANTS.WOBBLE_VISUAL_SPEED) * wobbleAmplitude;

        if (this.isStabilized) {
            this.stabilizedTimer -= deltaTime;
            if (this.stabilizedTimer <= 0) {
                this.isStabilized = false;
            }
            this.idleTime = 0;
            this.momentum *= 0.55;
            this.value = this.lerp(this.value, 0, 0.18);
            this.bodyActivation = 1;
            this.collapseAmount = 0;
            this.jointStrength = GAME_CONSTANTS.BODY_ACTIVE_JOINT_STRENGTH;
            return this.getStatus();
        }

        if (Math.abs(this.value) > 1) {
            this.lastLeanDirection = Math.sign(this.value);
        }

        if (hasMovementInput) {
            this.idleTime = 0;
            this.bodyActivation = this.lerp(this.bodyActivation, 1, GAME_CONSTANTS.BODY_ACTIVATION_SPEED * deltaTime);
            this.collapseAmount = this.lerp(this.collapseAmount, 0, GAME_CONSTANTS.BODY_COLLAPSE_RECOVERY * deltaTime);
        } else {
            this.idleTime += deltaTime;
            const inactiveTime = Math.max(0, this.idleTime - GAME_CONSTANTS.BODY_INPUT_GRACE);
            this.bodyActivation = this.lerp(this.bodyActivation, 0, GAME_CONSTANTS.BODY_DEACTIVATION_SPEED * deltaTime);
            this.collapseAmount = this.lerp(
                this.collapseAmount,
                1,
                Math.min(1, (GAME_CONSTANTS.BODY_COLLAPSE_SPEED + inactiveTime * 2.5) * deltaTime)
            );
        }

        this.jointStrength = this.lerp(
            GAME_CONSTANTS.BODY_INACTIVE_JOINT_STRENGTH,
            GAME_CONSTANTS.BODY_ACTIVE_JOINT_STRENGTH,
            this.bodyActivation
        );

        const sleepyDrift = GAME_CONSTANTS.BALANCE_DRIFT_RATE * (0.8 + sleepinessRatio * 1.8);
        const swayDrift = Math.sin(this.wobbleTime * 1.25) * sleepyDrift * deltaTime;
        this.momentum += swayDrift * (1.35 - this.bodyActivation * 0.75);

        if (hasMovementInput) {
            const recovery = (
                GAME_CONSTANTS.BALANCE_WALK_RECOVERY +
                GAME_CONSTANTS.BODY_BALANCE_RECOVERY * alternationBoost
            ) * (1 - sleepinessRatio * 0.3);
            this.momentum -= Math.sign(this.value) * recovery * this.bodyActivation * deltaTime;
            this.value = this.lerp(this.value, 0, GAME_CONSTANTS.BODY_STANDUP_FORCE * this.bodyActivation * deltaTime * 0.01);
        } else {
            const graceProgress = Math.max(0, this.idleTime - GAME_CONSTANTS.BALANCE_IDLE_GRACE);
            const fallDirection = this.getFallDirection(nudgeDirection);
            const sleepyCollapse = GAME_CONSTANTS.BALANCE_IDLE_FALL_RATE *
                (1 + sleepinessRatio * 1.35) *
                Math.min(3.5, 0.65 + graceProgress * 2.2);
            this.momentum += fallDirection * sleepyCollapse * deltaTime;
        }

        if (stepPulse && pulseSide !== 0) {
            const supportTowardCenter = -Math.sign(this.value || pulseSide);
            const plantedFootAssist = supportTowardCenter * GAME_CONSTANTS.BALANCE_NUDGE_AMOUNT * (0.55 + alternationBoost);
            this.momentum += plantedFootAssist * deltaTime;
            this.lastLeanDirection = pulseSide;
        } else if (nudgeDirection !== 0) {
            const holdAssist = -Math.sign(this.value || nudgeDirection) * GAME_CONSTANTS.BALANCE_NUDGE_AMOUNT * 0.45;
            this.momentum += holdAssist * this.bodyActivation * deltaTime;
            this.lastLeanDirection = nudgeDirection;
        }

        this.value += this.momentum * deltaTime;
        this.value = this.lerp(
            this.value,
            0,
            GAME_CONSTANTS.BALANCE_DECAY_RATE * deltaTime * 0.012 * this.bodyActivation
        );

        const damping = this.lerp(
            GAME_CONSTANTS.BODY_INACTIVE_DAMPING,
            GAME_CONSTANTS.BODY_ACTIVE_DAMPING,
            this.bodyActivation
        );
        this.momentum *= Math.pow(damping, deltaTime * 60);

        this.value = Math.max(-GAME_CONSTANTS.BALANCE_MAX, Math.min(GAME_CONSTANTS.BALANCE_MAX, this.value));

        return this.getStatus();
    }

    getFallDirection(nudgeDirection) {
        if (Math.abs(this.value) > 4) return Math.sign(this.value);
        if (Math.abs(this.momentum) > 1) return Math.sign(this.momentum);
        if (nudgeDirection !== 0) return nudgeDirection;
        return this.lastLeanDirection;
    }

    // Apply disturbance from obstacle
    disturb(amount) {
        if (this.isStabilized) {
            amount *= 0.2;  // Much reduced when stabilized
        }
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.value += amount * direction;
        this.momentum += amount * direction * 0.8;
        this.value = Math.max(-GAME_CONSTANTS.BALANCE_MAX, Math.min(GAME_CONSTANTS.BALANCE_MAX, this.value));
    }

    // Check if player would stumble (only when hit obstacle while off-balance)
    wouldStumble() {
        return Math.abs(this.value) > GAME_CONSTANTS.STUMBLE_THRESHOLD;
    }

    // Stabilize balance (from water item)
    stabilize(duration) {
        this.isStabilized = true;
        this.stabilizedTimer = duration;
        this.value = this.value * 0.5;  // Immediately reduce imbalance
    }

    // Reset after stumble
    recoverFromStumble() {
        this.value = 0;
        this.momentum = 0;
        this.idleTime = 0;
        this.bodyActivation = 0.8;
        this.collapseAmount = 0.1;
        this.jointStrength = GAME_CONSTANTS.BODY_ACTIVE_JOINT_STRENGTH;
    }

    getStatus() {
        return {
            value: this.value,
            momentum: this.momentum,
            visualWobble: this.visualWobble,
            normalized: this.value / GAME_CONSTANTS.BALANCE_MAX,  // -1 to 1
            isStabilized: this.isStabilized,
            stabilizedTimeLeft: this.stabilizedTimer,
            idleTime: this.idleTime,
            bodyActivation: this.bodyActivation,
            collapseAmount: this.collapseAmount,
            jointStrength: this.jointStrength,
            isBodyActive: this.bodyActivation > 0.35,
            isFalling: Math.abs(this.value) >= GAME_CONSTANTS.BALANCE_FALL &&
                this.collapseAmount > 0.82 &&
                this.idleTime > 2.2,
            isDanger: Math.abs(this.value) >= GAME_CONSTANTS.BALANCE_DANGER,
            absValue: Math.abs(this.value)
        };
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    reset() {
        this.value = 0;
        this.momentum = 0;
        this.visualWobble = 0;
        this.wobbleTime = 0;
        this.idleTime = 0;
        this.lastLeanDirection = 1;
        this.bodyActivation = 0;
        this.collapseAmount = 0;
        this.jointStrength = GAME_CONSTANTS.BODY_INACTIVE_JOINT_STRENGTH;
        this.isStabilized = false;
        this.stabilizedTimer = 0;
    }
}
