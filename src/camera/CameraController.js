import * as THREE from 'three';
import { GAME_CONSTANTS } from '../core/Constants.js';

/**
 * CameraController - Third-person orbit camera with mouse control
 *
 * Features:
 * - Mouse movement controls camera orbit around character
 * - Mouse scroll controls zoom distance
 * - Smooth interpolation for natural feel
 * - Pitch/yaw limits to prevent flipping
 * - Balance-based sway effect
 * - Camera shake effect
 */
export class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.target = null;

        // Orbit camera parameters
        this.distance = GAME_CONSTANTS.CAMERA_DISTANCE;
        this.targetDistance = GAME_CONSTANTS.CAMERA_DISTANCE;

        // Angles (in radians)
        this.yaw = GAME_CONSTANTS.CAMERA_DEFAULT_YAW;      // Horizontal rotation
        this.pitch = GAME_CONSTANTS.CAMERA_DEFAULT_PITCH;  // Vertical rotation
        this.targetYaw = this.yaw;
        this.targetPitch = this.pitch;

        // Camera settings from constants
        this.lookHeight = GAME_CONSTANTS.CAMERA_LOOK_HEIGHT;
        this.lerpSpeed = GAME_CONSTANTS.CAMERA_LERP;
        this.rotationLerpSpeed = GAME_CONSTANTS.CAMERA_ROTATION_LERP;
        this.zoomLerpSpeed = GAME_CONSTANTS.CAMERA_ZOOM_LERP;

        // Zoom limits
        this.minDistance = GAME_CONSTANTS.CAMERA_MIN_DISTANCE;
        this.maxDistance = GAME_CONSTANTS.CAMERA_MAX_DISTANCE;

        // Pitch limits (prevent flipping)
        this.minPitch = GAME_CONSTANTS.CAMERA_MIN_PITCH;
        this.maxPitch = GAME_CONSTANTS.CAMERA_MAX_PITCH;

        // Shake effect
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // Balance sway
        this.balanceSwayFactor = 0.015;
        this.currentSway = 0;

        // Mouse state
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseSensitivity = GAME_CONSTANTS.CAMERA_ROTATION_SPEED;

        // Smooth position tracking
        this.currentPosition = new THREE.Vector3();
        this.desiredPosition = new THREE.Vector3();
        this.currentLookTarget = new THREE.Vector3();

        // Pointer lock state
        this.isPointerLocked = false;

        // Initialize event listeners
        this.setupEventListeners();
    }

    /**
     * Setup mouse event listeners for camera control
     */
    setupEventListeners() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            // Retry after renderer is created
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }

        // Mouse move for camera rotation
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Mouse down/up for drag rotation
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Mouse wheel for zoom
        canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });

        // Pointer lock for smoother control (optional)
        canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && document.pointerLockElement !== canvas) {
                // canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });

        // Prevent context menu on right-click
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle mouse down event
     */
    onMouseDown(event) {
        if (event.button === 0 || event.button === 2) { // Left or right click
            this.isMouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }

    /**
     * Handle mouse up event
     */
    onMouseUp(event) {
        if (event.button === 0 || event.button === 2) {
            this.isMouseDown = false;
        }
    }

    /**
     * Handle mouse move event for camera rotation
     */
    onMouseMove(event) {
        // Only rotate when mouse is held down (or pointer is locked)
        if (!this.isMouseDown && !this.isPointerLocked) return;

        let deltaX, deltaY;

        if (this.isPointerLocked) {
            deltaX = event.movementX || 0;
            deltaY = event.movementY || 0;
        } else {
            deltaX = event.clientX - this.lastMouseX;
            deltaY = event.clientY - this.lastMouseY;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }

        // Apply rotation with sensitivity
        this.targetYaw -= deltaX * this.mouseSensitivity;
        this.targetPitch -= deltaY * this.mouseSensitivity;

        // Clamp pitch to prevent flipping
        this.targetPitch = THREE.MathUtils.clamp(
            this.targetPitch,
            this.minPitch,
            this.maxPitch
        );

        // Normalize yaw to keep it in reasonable range
        while (this.targetYaw > Math.PI) this.targetYaw -= Math.PI * 2;
        while (this.targetYaw < -Math.PI) this.targetYaw += Math.PI * 2;
    }

    /**
     * Handle mouse wheel event for zoom
     */
    onMouseWheel(event) {
        event.preventDefault();

        // Calculate zoom amount
        const zoomDelta = event.deltaY * GAME_CONSTANTS.CAMERA_ZOOM_SPEED * 0.01;

        // Update target distance
        this.targetDistance += zoomDelta;

        // Clamp to min/max distance
        this.targetDistance = THREE.MathUtils.clamp(
            this.targetDistance,
            this.minDistance,
            this.maxDistance
        );
    }

    /**
     * Set the target object for the camera to follow
     */
    setTarget(target) {
        this.target = target;
        // Initialize camera position immediately
        if (target) {
            this.updateDesiredPosition(0);
            this.camera.position.copy(this.desiredPosition);
            this.currentPosition.copy(this.desiredPosition);
            this.lookAtTarget();
        }
    }

    /**
     * Calculate desired camera position based on orbit parameters
     */
    updateDesiredPosition(balanceValue = 0) {
        if (!this.target) return;

        const targetPos = this.target.position;

        // Calculate camera position using spherical coordinates
        // Yaw rotates around Y axis, pitch tilts up/down
        const horizontalDistance = this.distance * Math.cos(this.pitch);
        const verticalOffset = this.distance * Math.sin(this.pitch);

        this.desiredPosition.set(
            targetPos.x + horizontalDistance * Math.sin(this.yaw),
            targetPos.y + this.lookHeight + verticalOffset,
            targetPos.z + horizontalDistance * Math.cos(this.yaw)
        );

        // Add balance-based sway (subtle camera movement)
        const targetSway = balanceValue * this.balanceSwayFactor;
        this.currentSway = THREE.MathUtils.lerp(this.currentSway, targetSway, 0.1);

        // Apply sway perpendicular to camera direction
        const swayAngle = this.yaw + Math.PI / 2;
        this.desiredPosition.x += this.currentSway * Math.sin(swayAngle);
        this.desiredPosition.z += this.currentSway * Math.cos(swayAngle);
    }

    /**
     * Apply camera shake effect
     */
    applyShake() {
        if (this.shakeIntensity > 0.01) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
            this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity * 0.3;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }
    }

    /**
     * Make camera look at target
     */
    lookAtTarget() {
        if (!this.target) return;

        const targetLookPos = new THREE.Vector3(
            this.target.position.x,
            this.target.position.y + this.lookHeight,
            this.target.position.z
        );

        // Smooth look target
        this.currentLookTarget.lerp(targetLookPos, this.lerpSpeed * 2);
        this.camera.lookAt(this.currentLookTarget);
    }

    /**
     * Trigger camera shake
     */
    shake(intensity = 0.5) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /**
     * Main update function
     */
    update(balanceValue = 0, deltaTime = 0.016) {
        if (!this.target) return;

        // Smoothly interpolate angles
        this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, this.rotationLerpSpeed);
        this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, this.rotationLerpSpeed);

        // Smoothly interpolate zoom distance
        this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, this.zoomLerpSpeed);

        // Calculate desired position
        this.updateDesiredPosition(balanceValue);

        // Smooth lerp to desired position
        this.currentPosition.lerp(this.desiredPosition, this.lerpSpeed);
        this.camera.position.copy(this.currentPosition);

        // Apply shake effect
        this.applyShake();

        // Always look at target
        this.lookAtTarget();
    }

    /**
     * Get current camera yaw angle (for movement direction calculation)
     */
    getYaw() {
        return this.yaw;
    }

    /**
     * Get current camera pitch angle
     */
    getPitch() {
        return this.pitch;
    }

    /**
     * Get the forward direction vector based on camera yaw (horizontal only)
     * This is the direction the character should move when pressing forward
     * (opposite to camera's look direction)
     */
    getForwardDirection() {
        // Forward is opposite to where camera is positioned relative to player
        return new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        ).normalize();
    }

    /**
     * Get the right direction vector based on camera yaw
     */
    getRightDirection() {
        // Right is 90 degrees from forward
        return new THREE.Vector3(
            -Math.sin(this.yaw - Math.PI / 2),
            0,
            -Math.cos(this.yaw - Math.PI / 2)
        ).normalize();
    }

    /**
     * Get camera for scene setup
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Reset camera to default position
     */
    reset() {
        this.yaw = GAME_CONSTANTS.CAMERA_DEFAULT_YAW;
        this.pitch = GAME_CONSTANTS.CAMERA_DEFAULT_PITCH;
        this.targetYaw = this.yaw;
        this.targetPitch = this.pitch;
        this.distance = GAME_CONSTANTS.CAMERA_DISTANCE;
        this.targetDistance = this.distance;
        this.shakeIntensity = 0;
        this.currentSway = 0;
    }
}
