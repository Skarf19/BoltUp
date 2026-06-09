/**
 * InputManager - Sleepy foot controls with camera-relative movement.
 * A/Left and D/Right are the main "muscle" inputs: alternating them keeps the
 * loose skeleton upright and makes it shuffle forward.
 *
 * Now supports:
 * - Camera-relative movement direction
 * - Mouse movement for camera rotation (handled by CameraController)
 * - Mouse scroll for zoom (handled by CameraController)
 */

import * as THREE from 'three';
import { GAME_CONSTANTS } from './Constants.js';

export class InputManager {
    constructor() {
        // Keyboard state
        this.keys = {};
        this.justPressed = {};  // For single-press detection

        // Step tracking for walking animation
        this.lastStepSide = null;
        this.lastStepTime = 0;
        this.stepPulse = false;
        this.stepPulseSide = 0;
        this.alternationBoost = 0;

        // Movement direction (camera-relative)
        this.movementDirection = new THREE.Vector3(0, 0, 0);
        this.targetMovementDirection = new THREE.Vector3(0, 0, 0);

        // Character facing direction (smoothed)
        // Initial facing = PI (facing -Z, away from camera at +Z)
        this.facingAngle = Math.PI;
        this.targetFacingAngle = Math.PI;

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        if (!this.keys[event.code]) {
            this.justPressed[event.code] = true;
            this.registerStepPress(event.code);
        }
        this.keys[event.code] = true;
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    // Check if key is currently held
    isKeyHeld(code) {
        return this.keys[code] === true;
    }

    // Check if key was just pressed this frame (for single actions)
    wasJustPressed(code) {
        return this.justPressed[code] === true;
    }

    // Get raw nudge direction: -1 (left), 0 (none), 1 (right)
    getNudgeDirection() {
        const left = this.isKeyHeld('KeyA') || this.isKeyHeld('ArrowLeft');
        const right = this.isKeyHeld('KeyD') || this.isKeyHeld('ArrowRight');

        if (left && !right) return -1;
        if (right && !left) return 1;
        return 0;
    }

    // Get raw forward/backward input: 1 (forward), -1 (backward), 0 (none)
    getForwardBackward() {
        const forward = this.isKeyHeld('KeyW') || this.isKeyHeld('ArrowUp');
        const backward = this.isKeyHeld('KeyS') || this.isKeyHeld('ArrowDown');

        if (forward && !backward) return 1;
        if (backward && !forward) return -1;
        return 0;
    }

    registerStepPress(code) {
        let side = 0;
        if (code === 'KeyA' || code === 'ArrowLeft') side = -1;
        if (code === 'KeyD' || code === 'ArrowRight') side = 1;
        if (side === 0) return;

        const now = performance.now() / 1000;
        const alternated = this.lastStepSide !== null &&
            side !== this.lastStepSide &&
            now - this.lastStepTime <= GAME_CONSTANTS.STEP_ALTERNATION_WINDOW;

        this.stepPulse = true;
        this.stepPulseSide = side;
        this.alternationBoost = alternated ? 1 : Math.max(this.alternationBoost, 0.35);
        this.lastStepSide = side;
        this.lastStepTime = now;
    }

    /**
     * Calculate camera-relative movement direction
     * @param {number} cameraYaw - Current camera yaw angle in radians
     * @param {number} deltaTime - Time since last frame
     * @returns {object} Movement data including direction and step info
     */
    getMovementData(cameraYaw, deltaTime = 0.016) {
        // Decay alternation boost
        this.alternationBoost = Math.max(0, this.alternationBoost - GAME_CONSTANTS.STEP_BOOST_DECAY * deltaTime);

        // Get raw input
        const nudgeDir = this.getNudgeDirection();
        const forwardBack = this.getForwardBackward();

        // Calculate camera-relative directions
        // Forward is opposite to camera position (where player should walk to)
        const forward = new THREE.Vector3(
            -Math.sin(cameraYaw),
            0,
            -Math.cos(cameraYaw)
        );
        // Right is perpendicular to forward
        const right = new THREE.Vector3(
            -Math.sin(cameraYaw - Math.PI / 2),
            0,
            -Math.cos(cameraYaw - Math.PI / 2)
        );

        // Build target movement direction from input
        this.targetMovementDirection.set(0, 0, 0);

        // Forward/backward movement (W/S keys)
        if (forwardBack !== 0) {
            this.targetMovementDirection.addScaledVector(forward, forwardBack);
        }

        // Left/right movement (A/D keys) - adds to forward direction
        if (nudgeDir !== 0) {
            this.targetMovementDirection.addScaledVector(right, nudgeDir);
        }

        // Normalize if we have input
        const hasInput = nudgeDir !== 0 || forwardBack !== 0;
        if (hasInput && this.targetMovementDirection.length() > 0) {
            this.targetMovementDirection.normalize();
        }

        // Smoothly interpolate movement direction for floppy feel
        const lerpFactor = hasInput ? 0.15 : 0.08;
        this.movementDirection.lerp(this.targetMovementDirection, lerpFactor);

        // Calculate target facing angle from movement direction
        if (this.movementDirection.length() > 0.1) {
            this.targetFacingAngle = Math.atan2(
                this.movementDirection.x,
                this.movementDirection.z
            );
        }

        // Smooth character rotation with lag for floppy feel
        let angleDiff = this.targetFacingAngle - this.facingAngle;
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const rotationSpeed = GAME_CONSTANTS.CHARACTER_ROTATION_SPEED * deltaTime;
        const rotationLag = GAME_CONSTANTS.CHARACTER_ROTATION_LAG;
        this.facingAngle += angleDiff * rotationSpeed * (1 - rotationLag);

        // Build step data
        const hasFootInput = nudgeDir !== 0;
        const hasForwardInput = forwardBack !== 0;
        const hasMovementInput = hasFootInput || hasForwardInput || this.stepPulse;

        // Calculate movement amount
        const movementAmount = hasMovementInput
            ? Math.max(
                hasForwardInput ? 0.7 : 0,
                hasFootInput ? GAME_CONSTANTS.STEP_HOLD_SPEED : 0,
                this.alternationBoost
              )
            : 0;

        return {
            // Raw input
            nudgeDirection: nudgeDir,
            forwardBackward: forwardBack,

            // Step data for balance system
            currentSide: nudgeDir,
            pulse: this.stepPulse,
            pulseSide: this.stepPulseSide,
            hasFootInput,
            hasMovementInput,
            alternationBoost: this.alternationBoost,
            standIntent: hasMovementInput ? 1 : 0,
            movementAmount,

            // Camera-relative movement
            direction: this.movementDirection.clone(),
            facingAngle: this.facingAngle,
            targetFacingAngle: this.targetFacingAngle,

            // For movement calculation
            magnitude: hasMovementInput ? this.movementDirection.length() : 0
        };
    }

    /**
     * Legacy method for backward compatibility
     */
    getStepData(deltaTime = 0) {
        // This is called without camera info, so just return basic step data
        this.alternationBoost = Math.max(0, this.alternationBoost - GAME_CONSTANTS.STEP_BOOST_DECAY * deltaTime);

        const currentSide = this.getNudgeDirection();
        const forwardHeld = this.getForwardAmount() > 0;
        const hasFootInput = currentSide !== 0;
        const hasMovementInput = hasFootInput || forwardHeld || this.stepPulse;

        return {
            currentSide,
            pulse: this.stepPulse,
            pulseSide: this.stepPulseSide,
            hasFootInput,
            hasMovementInput,
            alternationBoost: this.alternationBoost,
            standIntent: hasMovementInput ? 1 : 0,
            movementAmount: hasMovementInput
                ? Math.max(forwardHeld ? 0.7 : 0, hasFootInput ? GAME_CONSTANTS.STEP_HOLD_SPEED : 0, this.alternationBoost)
                : 0
        };
    }

    getForwardAmount() {
        return (this.isKeyHeld('KeyW') || this.isKeyHeld('ArrowUp')) ? 1 : 0;
    }

    hasMovementInput() {
        return this.getForwardAmount() > 0 ||
               this.getNudgeDirection() !== 0 ||
               (this.isKeyHeld('KeyS') || this.isKeyHeld('ArrowDown'));
    }

    // Check if recovery key pressed
    isRecoveryPressed() {
        return this.wasJustPressed('Space') ||
               this.wasJustPressed('Enter');
    }

    // Clear just-pressed states (call at end of frame)
    clearJustPressed() {
        this.justPressed = {};
        this.stepPulse = false;
        this.stepPulseSide = 0;
    }

    /**
     * Get the current facing angle
     */
    getFacingAngle() {
        return this.facingAngle;
    }

    /**
     * Set facing angle (used when resetting)
     */
    setFacingAngle(angle) {
        this.facingAngle = angle;
        this.targetFacingAngle = angle;
    }

    reset() {
        this.keys = {};
        this.justPressed = {};
        this.lastStepSide = null;
        this.lastStepTime = 0;
        this.stepPulse = false;
        this.stepPulseSide = 0;
        this.alternationBoost = 0;
        this.movementDirection.set(0, 0, 0);
        this.targetMovementDirection.set(0, 0, 0);
        this.facingAngle = Math.PI;
        this.targetFacingAngle = Math.PI;
    }
}
