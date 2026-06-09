import * as THREE from 'three';
import { GAME_CONSTANTS, GAME_STATES, PLAYER_STATES } from './core/Constants.js';
import { CameraController } from './camera/CameraController.js';
import { InputManager } from './core/InputManager.js';
import { BalanceSystem } from './systems/BalanceSystem.js';
import { SleepinessSystem } from './systems/SleepinessSystem.js';
import { RecoverySystem } from './systems/RecoverySystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { EffectsManager } from './graphics/EffectsManager.js';
import { RecoveryUI } from './ui/screens/RecoveryUI.js';
import { MessagePopup } from './ui/components/MessagePopup.js';
import { StageBuilder } from './world/StageBuilder.js';
import { Environment } from './world/Environment.js';
import { GameUI } from './ui/screens/GameUI.js';
import { ResultScreen } from './ui/screens/ResultScreen.js';
import { StartScreen } from './ui/screens/StartScreen.js';
import { Player } from './entities/Player.js';
import { audioManager } from './audio/AudioManager.js';
import { particleSystem } from './graphics/ParticleSystem.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cameraController = null;
        this.player = null;

        // Core systems (simplified)
        this.inputManager = null;
        this.balanceSystem = null;
        this.sleepinessSystem = null;
        this.recoverySystem = null;
        this.collisionSystem = null;
        this.effectsManager = null;
        this.recoveryUI = null;
        this.messagePopup = null;
        this.stageBuilder = null;
        this.environment = null;
        this.gameUI = null;
        this.resultScreen = null;
        this.startScreen = null;

        this.gameTime = 0;
        this.lastFootstepTime = 0;
        this.currentMoveSpeed = 0;

        // Character rotation (for floppy feel)
        this.characterRotation = 0;
        this.targetCharacterRotation = 0;
        this.rotationVelocity = 0;

        // Movement velocity for momentum
        this.movementVelocity = new THREE.Vector3(0, 0, 0);

        this.state = GAME_STATES.MENU;
        this.clock = new THREE.Clock();

        // Game stats
        this.timer = GAME_CONSTANTS.ROUND_DURATION;
        this.stumbleCount = 0;

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLighting();
        this.createGround();
        this.createPlayer();

        // Create environment
        this.environment = new Environment(this.scene);
        this.environment.build();

        // Initialize simplified systems
        this.inputManager = new InputManager();
        this.balanceSystem = new BalanceSystem();
        this.sleepinessSystem = new SleepinessSystem();
        this.recoverySystem = new RecoverySystem();
        this.collisionSystem = new CollisionSystem();
        this.effectsManager = new EffectsManager();
        this.recoveryUI = new RecoveryUI();
        this.messagePopup = new MessagePopup();

        // Build stage
        this.stageBuilder = new StageBuilder(this.scene, this.collisionSystem);
        this.stageBuilder.buildStage();

        // Create UI
        this.gameUI = new GameUI();
        this.gameUI.hide();

        this.resultScreen = new ResultScreen();
        this.resultScreen.setOnRestart(() => this.resetGame());

        this.startScreen = new StartScreen();
        this.startScreen.setOnStart(() => this.startGame());

        this.setupEventListeners();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(GAME_CONSTANTS.COLORS.SKY_BOTTOM, 50, 200);
        this.scene.background = new THREE.Color(GAME_CONSTANTS.COLORS.SKY_TOP);
    }

    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
        this.cameraController = new CameraController(this.camera);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }

    createLighting() {
        // Ambient light - slightly brighter for better visibility
        const ambientLight = new THREE.AmbientLight(GAME_CONSTANTS.COLORS.AMBIENT_LIGHT, 0.7);
        this.scene.add(ambientLight);

        // Main directional light (moonlight from above/behind)
        const directionalLight = new THREE.DirectionalLight(GAME_CONSTANTS.COLORS.DIRECTIONAL_LIGHT, 0.7);
        directionalLight.position.set(0, 30, GAME_CONSTANTS.STAGE_LENGTH);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Hemisphere light for natural sky/ground gradient
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2d3436, 0.5);
        this.scene.add(hemiLight);

        // FRONT FILL LIGHT - Illuminates the character's face and front
        // This follows the camera to always light the character from the front
        this.frontLight = new THREE.DirectionalLight(0xffeedd, 0.6);
        this.frontLight.position.set(0, 5, -10); // In front of character
        this.scene.add(this.frontLight);

        // Soft point light near character for better face visibility
        this.characterLight = new THREE.PointLight(0xffffee, 0.5, 15);
        this.characterLight.position.set(0, 2, 0);
        this.scene.add(this.characterLight);
    }

    createGround() {
        const pathLength = GAME_CONSTANTS.STAGE_LENGTH + 50;

        // Main path
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(6, pathLength),
            new THREE.MeshLambertMaterial({ color: GAME_CONSTANTS.COLORS.GROUND, side: THREE.DoubleSide })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0, pathLength / 2 - 10);
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Side grounds
        const sideMaterial = new THREE.MeshLambertMaterial({ color: 0x1e3d2f, side: THREE.DoubleSide });
        [-28, 28].forEach(x => {
            const sideGround = new THREE.Mesh(new THREE.PlaneGeometry(50, pathLength), sideMaterial);
            sideGround.rotation.x = -Math.PI / 2;
            sideGround.position.set(x, -0.01, pathLength / 2 - 10);
            this.scene.add(sideGround);
        });

        // Goal marker
        const goalMarker = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 2),
            new THREE.MeshBasicMaterial({ color: 0xffeaa7, transparent: true, opacity: 0.5 })
        );
        goalMarker.rotation.x = -Math.PI / 2;
        goalMarker.position.set(0, 0.01, GAME_CONSTANTS.STAGE_LENGTH);
        this.scene.add(goalMarker);
    }

    createPlayer() {
        this.player = new Player();
        this.player.mesh.position.set(0, 0, 0);
        this.scene.add(this.player.getMesh());
        this.cameraController.setTarget(this.player.mesh);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Recovery button click
        this.recoveryUI.getButton().addEventListener('click', () => this.handleRecoveryInput());
        this.recoveryUI.getButton().addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleRecoveryInput();
        });

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.state === GAME_STATES.DOZING || this.state === GAME_STATES.STUMBLE) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    this.handleRecoveryInput();
                }
            }
            if (e.code === 'KeyR') this.resetGame();
            if (e.code === 'KeyM') audioManager.toggle();
        });
    }

    handleRecoveryInput() {
        if (this.state === GAME_STATES.DOZING || this.state === GAME_STATES.STUMBLE) {
            this.recoverySystem.attemptRecovery();
        }
    }

    startGame() {
        this.state = GAME_STATES.PLAYING;
        this.gameUI.show();
        this.startScreen.hide();
        audioManager.playGameStart();
    }

    resetGame() {
        this.player.mesh.position.set(0, 0, 0);
        this.player.mesh.rotation.y = 0;
        this.characterRotation = 0;
        this.targetCharacterRotation = 0;
        this.rotationVelocity = 0;
        this.movementVelocity.set(0, 0, 0);

        this.state = GAME_STATES.PLAYING;
        this.timer = GAME_CONSTANTS.ROUND_DURATION;
        this.stumbleCount = 0;
        this.gameTime = 0;
        this.currentMoveSpeed = 0;

        this.inputManager.reset();
        this.balanceSystem.reset();
        this.sleepinessSystem.reset();
        this.recoverySystem.reset();
        this.collisionSystem.reset();
        this.effectsManager.reset();
        this.cameraController.reset();
        this.recoveryUI.hide();
        this.resultScreen.hide();
        this.startScreen.hide();
        this.stageBuilder.reset();
        this.gameUI.show();
    }

    update(deltaTime) {
        if (this.state === GAME_STATES.MENU) return;
        if (this.state === GAME_STATES.DOZING || this.state === GAME_STATES.STUMBLE) return;
        if (this.state !== GAME_STATES.PLAYING) return;

        this.gameTime += deltaTime;
        this.timer -= deltaTime;

        if (this.timer <= 0) {
            this.timer = 0;
            this.triggerLose('time');
            return;
        }

        // Get camera yaw for camera-relative movement
        const cameraYaw = this.cameraController.getYaw();

        // Get movement data with camera-relative direction
        const movementData = this.inputManager.getMovementData(cameraYaw, deltaTime);
        const hasMovementInput = movementData.hasMovementInput;

        // Also get legacy step data for balance system
        const stepData = {
            currentSide: movementData.currentSide,
            pulse: movementData.pulse,
            pulseSide: movementData.pulseSide,
            hasFootInput: movementData.hasFootInput,
            hasMovementInput: movementData.hasMovementInput,
            alternationBoost: movementData.alternationBoost,
            standIntent: movementData.standIntent,
            movementAmount: movementData.movementAmount
        };

        // Update sleepiness
        const sleepStatus = this.sleepinessSystem.update(deltaTime);

        // Check for doze
        if (sleepStatus.shouldDoze) {
            this.triggerDoze();
            return;
        }

        // Input gives the sleepy skeleton muscle; no input removes body tension fast.
        const nudgeDir = movementData.nudgeDirection;
        const balanceStatus = this.balanceSystem.update(nudgeDir, sleepStatus.value, deltaTime, stepData);

        if (balanceStatus.isFalling) {
            this.triggerLose('balance');
            return;
        }

        // Calculate movement speed
        const speedMultiplier = sleepStatus.speedMultiplier;
        const stepMovement = Math.max(stepData.movementAmount, movementData.forwardBackward !== 0 ? 0.7 : 0);
        const bodyPower = THREE.MathUtils.clamp(balanceStatus.bodyActivation + stepData.alternationBoost * 0.25, 0, 1);
        const targetSpeed = GAME_CONSTANTS.BASE_SPEED * speedMultiplier * stepMovement * bodyPower;

        // Acceleration/deceleration
        const speedChange = targetSpeed > this.currentMoveSpeed
            ? GAME_CONSTANTS.HEAVY_ACCELERATION
            : GAME_CONSTANTS.HEAVY_DECELERATION;
        this.currentMoveSpeed = THREE.MathUtils.lerp(
            this.currentMoveSpeed,
            targetSpeed,
            Math.min(1, speedChange * deltaTime)
        );

        // Calculate camera-relative movement
        const movement = this.currentMoveSpeed * deltaTime;

        // Get movement direction (camera-relative)
        let moveDirection = movementData.direction.clone();

        // If no direction input but we have speed (momentum), keep last direction
        if (moveDirection.length() < 0.1 && this.movementVelocity.length() > 0.1) {
            moveDirection = this.movementVelocity.clone().normalize();
        }

        // Apply movement with momentum and floppy lag
        if (hasMovementInput && moveDirection.length() > 0.1) {
            // Target velocity based on input direction
            const targetVelocity = moveDirection.clone().multiplyScalar(movement);

            // Smoothly interpolate velocity (creates momentum/lag feel)
            const velocityLerp = 0.12; // Lower = more sluggish/floppy
            this.movementVelocity.lerp(targetVelocity, velocityLerp);
        } else {
            // Decay velocity when no input (creates stumbling stop)
            this.movementVelocity.multiplyScalar(0.92);
        }

        // Apply movement to player position
        this.player.mesh.position.x += this.movementVelocity.x;
        this.player.mesh.position.z += this.movementVelocity.z;

        // Clamp to path bounds (prevent falling off)
        this.player.mesh.position.x = THREE.MathUtils.clamp(this.player.mesh.position.x, -2.5, 2.5);

        // Update character rotation (facing direction) with floppy lag
        if (hasMovementInput && moveDirection.length() > 0.1) {
            this.targetCharacterRotation = Math.atan2(moveDirection.x, moveDirection.z);
        }

        // Calculate rotation with spring-like behavior for floppy feel
        let rotationDiff = this.targetCharacterRotation - this.characterRotation;

        // Normalize rotation difference to [-PI, PI]
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

        // Spring physics for rotation (creates overshoot and wobble)
        const rotationStiffness = GAME_CONSTANTS.CHARACTER_ROTATION_SPEED * deltaTime;
        const rotationDamping = 0.85;
        const collapseEffect = balanceStatus.collapseAmount * 0.5;

        // Add some rotation velocity for springy feel
        this.rotationVelocity += rotationDiff * rotationStiffness;
        this.rotationVelocity *= rotationDamping;

        // Apply velocity to rotation (reduced when collapsing)
        this.characterRotation += this.rotationVelocity * (1 - collapseEffect);

        // Add slight wobble when off-balance
        const balanceWobble = Math.sin(this.gameTime * 3) * balanceStatus.value * 0.003;
        const sleepyWobble = Math.sin(this.gameTime * 1.5) * sleepStatus.value * 0.002;

        // Apply rotation to player mesh
        this.player.mesh.rotation.y = this.characterRotation + balanceWobble + sleepyWobble;

        // Footstep sound
        if (this.currentMoveSpeed > 0.4 && this.gameTime - this.lastFootstepTime > 0.35) {
            this.lastFootstepTime = this.gameTime;
            audioManager.playFootstep();
        }

        // Win check
        if (this.player.mesh.position.z >= GAME_CONSTANTS.STAGE_LENGTH) {
            this.player.mesh.position.z = GAME_CONSTANTS.STAGE_LENGTH;
            this.triggerWin();
            return;
        }

        // Check collisions
        this.checkCollisions(balanceStatus);

        // Update visuals
        this.stageBuilder.updateItems(this.gameTime);
        this.stageBuilder.removeCollectedItems();

        // Update player animation
        this.player.externalHeadDroop = sleepStatus.headDroop;
        this.player.update(
            deltaTime,
            balanceStatus.value,
            sleepStatus.value,
            this.currentMoveSpeed,
            hasMovementInput,
            {
                bodyActivation: balanceStatus.bodyActivation,
                collapseAmount: balanceStatus.collapseAmount,
                jointStrength: balanceStatus.jointStrength,
                stepSide: stepData.currentSide || stepData.pulseSide,
                stepPulse: stepData.pulse,
                alternationBoost: stepData.alternationBoost
            }
        );

        // Update camera and effects
        this.cameraController.update(balanceStatus.value, deltaTime);
        this.effectsManager.update(sleepStatus, balanceStatus);
        this.environment.update(this.gameTime, this.player.mesh.position.z);

        // Update character lights to follow player
        if (this.frontLight && this.characterLight) {
            const playerPos = this.player.mesh.position;
            // Front light positioned in front of character based on camera angle
            const frontOffset = this.cameraController.getForwardDirection().multiplyScalar(-8);
            this.frontLight.position.set(
                playerPos.x + frontOffset.x,
                playerPos.y + 4,
                playerPos.z + frontOffset.z
            );
            this.frontLight.target.position.copy(playerPos);

            // Character light follows player
            this.characterLight.position.set(playerPos.x, playerPos.y + 2, playerPos.z);
        }

        // Update UI
        this.gameUI.update({
            timer: this.timer,
            progress: this.player.mesh.position.z / GAME_CONSTANTS.STAGE_LENGTH,
            sleepiness: sleepStatus.value,
            balance: balanceStatus.value,
            fallCount: this.stumbleCount,
            zone: this.getCurrentZone(),
            buffs: {
                stabilized: balanceStatus.isStabilized,
                stabilizedTime: balanceStatus.stabilizedTimeLeft || 0,
                caffeine: sleepStatus.hasCaffeineBoost,
                caffeineTime: sleepStatus.caffeineBoostTimeLeft || 0
            }
        });

        // Clear single-press inputs
        this.inputManager.clearJustPressed();
    }

    checkCollisions(balanceStatus) {
        this.collisionSystem.checkCollisions(
            this.player.mesh.position,
            {
                onObstacleHit: (obstacle) => this.handleObstacleHit(obstacle, balanceStatus),
                onItemCollect: (item) => this.handleItemCollect(item)
            }
        );
    }

    handleObstacleHit(obstacle, balanceStatus) {
        const effects = obstacle.getEffects();

        // Apply gentle effects
        if (effects.balance) {
            this.balanceSystem.disturb(effects.balance * 0.5);  // Reduced effect
        }
        if (effects.sleepiness) {
            this.sleepinessSystem.addSleepiness(effects.sleepiness);
        }
        if (effects.timeLoss) {
            this.timer -= effects.timeLoss;
        }

        // Check for stumble (only if very off-balance)
        if (this.balanceSystem.wouldStumble() && Math.random() < 0.3) {
            this.triggerStumble();
            return;
        }

        // Visual/audio feedback
        this.messagePopup.showObstacleMessage(obstacle.type);
        this.effectsManager.flash('rgba(255, 150, 100, 0.15)', 0.15);
        this.cameraController.shake(0.15);

        if (obstacle.type === 'pillow') {
            audioManager.playPillowHit();
        } else {
            audioManager.playObstacleHit();
        }
    }

    handleItemCollect(item) {
        const effects = item.getEffects();

        if (effects.sleepiness) {
            this.sleepinessSystem.reduceSleepiness(Math.abs(effects.sleepiness));
        }
        if (effects.caffeineBoost) {
            this.sleepinessSystem.applyCaffeineBoost(effects.caffeineBoost);
        }
        if (effects.stabilize) {
            this.balanceSystem.stabilize(effects.stabilize);
        }

        this.messagePopup.showItemMessage(item.type);
        this.effectsManager.flash('rgba(100, 255, 150, 0.15)', 0.15);

        const screenPos = this.worldToScreen(item.mesh.position);

        if (item.type === 'coffee') {
            audioManager.playCoffeeCollect();
            particleSystem.emitFloatingParticles(screenPos.x, screenPos.y, '#fdcb6e', 5);
        } else {
            audioManager.playItemCollect();
            particleSystem.emitFloatingParticles(screenPos.x, screenPos.y, '#74b9ff', 4);
        }
    }

    triggerStumble() {
        this.state = GAME_STATES.STUMBLE;
        this.stumbleCount++;
        this.cameraController.shake(0.4);
        audioManager.playFall();

        // Brief pause, then show recovery
        setTimeout(() => {
            this.recoveryUI.show('stumble');
            this.recoverySystem.startRecovery('stumble', () => {
                this.recoveryUI.showSuccess();
                this.balanceSystem.recoverFromStumble();
                setTimeout(() => {
                    this.state = GAME_STATES.PLAYING;
                }, 400);
            });
        }, 300);
    }

    triggerDoze() {
        this.state = GAME_STATES.DOZING;
        audioManager.playSleepinessWarning();

        setTimeout(() => {
            this.recoveryUI.show('doze');
            this.recoverySystem.startRecovery('doze', () => {
                this.recoveryUI.showSuccess();
                this.sleepinessSystem.wakeUp();
                setTimeout(() => {
                    this.state = GAME_STATES.PLAYING;
                }, 400);
            });
        }, 500);
    }

    triggerWin() {
        this.state = GAME_STATES.WIN;
        this.gameUI.hide();
        audioManager.playWin();
        particleSystem.emitConfetti(50);
        this.effectsManager.flash('rgba(255, 234, 167, 0.4)', 0.4);

        setTimeout(() => {
            this.resultScreen.show({
                success: true,
                timeUsed: GAME_CONSTANTS.ROUND_DURATION - this.timer,
                timeLeft: this.timer,
                fallCount: this.stumbleCount,
                progress: 1.0
            });
        }, 1000);
    }

    triggerLose(reason) {
        this.state = GAME_STATES.LOSE;
        this.gameUI.hide();
        audioManager.playLose();

        setTimeout(() => {
            this.resultScreen.show({
                success: false,
                reason: reason,
                timeUsed: GAME_CONSTANTS.ROUND_DURATION - this.timer,
                timeLeft: this.timer,
                fallCount: this.stumbleCount,
                progress: this.player.mesh.position.z / GAME_CONSTANTS.STAGE_LENGTH
            });
        }, 800);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    getCurrentZone() {
        const z = this.player.mesh.position.z;
        if (z < GAME_CONSTANTS.ZONE_1_END) return 1;
        if (z < GAME_CONSTANTS.ZONE_2_END) return 2;
        return 3;
    }

    worldToScreen(position) {
        const vector = position.clone();
        vector.project(this.camera);
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }
}
