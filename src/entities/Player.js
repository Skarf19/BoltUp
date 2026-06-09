import * as THREE from 'three';
import { GAME_CONSTANTS, PLAYER_STATES } from '../core/Constants.js';

// Color palette for sleepy student character
const PALETTE = {
    // Pajamas
    pajamaBlue: 0x89CFF0,
    pajamaStripe: 0x6BB8E0,
    pajamaDark: 0x5BA3CC,
    pajamaCuff: 0xd9f0ff,
    pajamaCollar: 0xffffff,
    pajamaButton: 0xffffff,
    pajamaJoint: 0xa8d8f0,
    pajamaShadow: 0x4f9ee8,

    // Skin tones
    skin: 0xffd5b8,
    skinLight: 0xffe4cc,
    skinShadow: 0xeec4a0,
    eyebag: 0xc9a0a0,

    // Hair - Dark brown/black
    hair: 0x2a1a0a,           // Dark brown, almost black
    hairHighlight: 0x3d2815,  // Slightly lighter dark brown

    // Face - larger and more visible
    eyeWhite: 0xffffff,
    eyeIris: 0x1a1208,
    eyePupil: 0x000000,
    eyebrow: 0x5a4030,  // Medium brown (lighter than hair, won't look like facial hair)
    mouth: 0xb87070,
    mouthDark: 0x8a5555,
    nose: 0xeec4a0,
    blush: 0xffcccc,

    // Slippers
    slipperPink: 0xffb6c1,
    slipperInner: 0xffd4dc,
    slipperSole: 0xc49090,

    // Debug skeleton
    skeletonJoint: 0xfff2bd,
    skeletonBone: 0xd9f0ff,
    skeletonCore: 0x63d2ff
};

/**
 * SpringJoint - Creates floppy, delayed movement for ragdoll effect
 */
class SpringJoint {
    constructor(options = {}) {
        this.targetRotation = new THREE.Euler();
        this.currentRotation = new THREE.Euler();
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.stiffness = options.stiffness ?? 0.15;
        this.damping = options.damping ?? 0.8;
        this.lag = options.lag ?? 0.1;
        this.maxRotation = options.maxRotation ?? Math.PI / 2;
        this.parentInfluence = options.parentInfluence ?? 0.3;
    }

    update(deltaTime, targetRotation, parentRotation = null, stiffnessMultiplier = 1.0) {
        const effectiveTarget = targetRotation.clone();
        if (parentRotation) {
            effectiveTarget.x += parentRotation.x * this.parentInfluence;
            effectiveTarget.y += parentRotation.y * this.parentInfluence;
            effectiveTarget.z += parentRotation.z * this.parentInfluence;
        }

        const dx = effectiveTarget.x - this.currentRotation.x;
        const dy = effectiveTarget.y - this.currentRotation.y;
        const dz = effectiveTarget.z - this.currentRotation.z;

        const effectiveStiffness = this.stiffness * stiffnessMultiplier * GAME_CONSTANTS.CHARACTER_SPRING_STIFFNESS_BASE * 10;
        const effectiveDamping = this.damping * GAME_CONSTANTS.CHARACTER_SPRING_DAMPING_BASE;

        const ax = effectiveStiffness * dx - effectiveDamping * this.velocity.x;
        const ay = effectiveStiffness * dy - effectiveDamping * this.velocity.y;
        const az = effectiveStiffness * dz - effectiveDamping * this.velocity.z;

        const lagFactor = 1.0 - (this.lag * GAME_CONSTANTS.CHARACTER_LAG_MULTIPLIER);
        this.velocity.x += ax * deltaTime * lagFactor;
        this.velocity.y += ay * deltaTime * lagFactor;
        this.velocity.z += az * deltaTime * lagFactor;

        this.currentRotation.x += this.velocity.x * deltaTime;
        this.currentRotation.y += this.velocity.y * deltaTime;
        this.currentRotation.z += this.velocity.z * deltaTime;

        this.currentRotation.x = THREE.MathUtils.clamp(this.currentRotation.x, -this.maxRotation, this.maxRotation);
        this.currentRotation.y = THREE.MathUtils.clamp(this.currentRotation.y, -this.maxRotation, this.maxRotation);
        this.currentRotation.z = THREE.MathUtils.clamp(this.currentRotation.z, -this.maxRotation, this.maxRotation);

        return this.currentRotation;
    }

    reset() {
        this.currentRotation.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
    }
}

/**
 * Player class - Sleepy student with improved visuals and full floor collapse
 */
export class Player {
    constructor() {
        this.mesh = new THREE.Group();
        this.state = PLAYER_STATES.WALKING;
        this.position = new THREE.Vector3(0, 0, 0);

        // Animation timers
        this.walkCycle = 0;
        this.sleepyTimer = Math.random() * 5;
        this.nextHeadNod = 1.5;
        this.sleepNodAmount = 0;
        this.externalHeadDroop = 0;
        this.breath = 0;
        this.idleSwayPhase = 0;

        // Lean values
        this.rootLean = 0;
        this.torsoLean = 0;
        this.headLean = 0;
        this.armLag = 0;
        this.slump = 0;
        this.lastDroop = 0;

        // Collapse tracking - for full floor collapse
        this.floorCollapseAmount = 0;
        this.collapseDirection = 1; // 1 = forward, -1 = backward

        // Character state
        this.currentState = 'IDLE_UNSTABLE';
        this.collapseProgress = 0;
        this.recoveryProgress = 1;

        // Body part groups - with better spacing
        this.bodyRoot = new THREE.Group();
        this.hipsGroup = new THREE.Group();
        this.spineGroup = new THREE.Group();
        this.torsoGroup = new THREE.Group();
        this.neckGroup = new THREE.Group();
        this.headGroup = new THREE.Group();

        // Arms - offset outward to prevent clipping
        this.leftShoulderGroup = new THREE.Group();
        this.leftUpperArmGroup = new THREE.Group();
        this.leftElbowGroup = new THREE.Group();
        this.leftLowerArmGroup = new THREE.Group();
        this.leftWristGroup = new THREE.Group();
        this.leftHandGroup = new THREE.Group();

        this.rightShoulderGroup = new THREE.Group();
        this.rightUpperArmGroup = new THREE.Group();
        this.rightElbowGroup = new THREE.Group();
        this.rightLowerArmGroup = new THREE.Group();
        this.rightWristGroup = new THREE.Group();
        this.rightHandGroup = new THREE.Group();

        // Legs - with proper spacing
        this.leftHipGroup = new THREE.Group();
        this.leftUpperLegGroup = new THREE.Group();
        this.leftKneeGroup = new THREE.Group();
        this.leftLowerLegGroup = new THREE.Group();
        this.leftAnkleGroup = new THREE.Group();
        this.leftFootGroup = new THREE.Group();

        this.rightHipGroup = new THREE.Group();
        this.rightUpperLegGroup = new THREE.Group();
        this.rightKneeGroup = new THREE.Group();
        this.rightLowerLegGroup = new THREE.Group();
        this.rightAnkleGroup = new THREE.Group();
        this.rightFootGroup = new THREE.Group();

        // Initialize springs
        this.initializeSpringJoints();

        // Mesh references
        this.body = null;
        this.head = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.leftArm = null;
        this.rightArm = null;
        this.skeletonRig = null;
        this.skeletonPose = {};

        this.createMesh();
    }

    initializeSpringJoints() {
        this.springs = {
            hips: new SpringJoint({ stiffness: 0.18, damping: 0.65, lag: 0.05, maxRotation: Math.PI * 0.6 }),
            spine: new SpringJoint({ stiffness: 0.14, damping: 0.7, lag: 0.08, parentInfluence: 0.25, maxRotation: Math.PI * 0.5 }),
            neck: new SpringJoint({ stiffness: 0.1, damping: 0.55, lag: 0.15, parentInfluence: 0.35, maxRotation: Math.PI * 0.4 }),
            head: new SpringJoint({ stiffness: 0.08, damping: 0.45, lag: 0.2, parentInfluence: 0.45, maxRotation: Math.PI * 0.5 }),

            leftShoulder: new SpringJoint({ stiffness: 0.1, damping: 0.55, lag: 0.12, parentInfluence: 0.3, maxRotation: Math.PI * 0.7 }),
            leftElbow: new SpringJoint({ stiffness: 0.06, damping: 0.45, lag: 0.2, parentInfluence: 0.4, maxRotation: Math.PI * 0.8 }),
            leftWrist: new SpringJoint({ stiffness: 0.04, damping: 0.35, lag: 0.28, parentInfluence: 0.55, maxRotation: Math.PI * 0.6 }),

            rightShoulder: new SpringJoint({ stiffness: 0.1, damping: 0.55, lag: 0.12, parentInfluence: 0.3, maxRotation: Math.PI * 0.7 }),
            rightElbow: new SpringJoint({ stiffness: 0.06, damping: 0.45, lag: 0.2, parentInfluence: 0.4, maxRotation: Math.PI * 0.8 }),
            rightWrist: new SpringJoint({ stiffness: 0.04, damping: 0.35, lag: 0.28, parentInfluence: 0.55, maxRotation: Math.PI * 0.6 }),

            leftHip: new SpringJoint({ stiffness: 0.15, damping: 0.6, lag: 0.1, parentInfluence: 0.2, maxRotation: Math.PI * 0.6 }),
            leftKnee: new SpringJoint({ stiffness: 0.08, damping: 0.5, lag: 0.15, parentInfluence: 0.35, maxRotation: Math.PI * 0.7 }),
            leftAnkle: new SpringJoint({ stiffness: 0.06, damping: 0.45, lag: 0.18, parentInfluence: 0.4, maxRotation: Math.PI * 0.5 }),

            rightHip: new SpringJoint({ stiffness: 0.15, damping: 0.6, lag: 0.1, parentInfluence: 0.2, maxRotation: Math.PI * 0.6 }),
            rightKnee: new SpringJoint({ stiffness: 0.08, damping: 0.5, lag: 0.15, parentInfluence: 0.35, maxRotation: Math.PI * 0.7 }),
            rightAnkle: new SpringJoint({ stiffness: 0.06, damping: 0.45, lag: 0.18, parentInfluence: 0.4, maxRotation: Math.PI * 0.5 })
        };
    }

    createMesh() {
        this.mesh.add(this.bodyRoot);

        this.createLegs();
        this.createTorso();
        this.createArms();
        this.createHead();
        this.createSkeletonRig();

        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createTorso() {
        this.hipsGroup.position.y = 0.82;
        this.bodyRoot.add(this.hipsGroup);

        this.spineGroup.position.y = 0.12;
        this.hipsGroup.add(this.spineGroup);

        this.torsoGroup.position.y = 0.22;
        this.spineGroup.add(this.torsoGroup);

        const pajamaMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaBlue });
        const stripeMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaStripe });
        const cuffMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaCuff });
        const darkMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaDark });
        const buttonMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaButton });
        const jointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaJoint });
        const shadowMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaShadow });
        const collarMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaCollar });

        // Pelvis - slightly smaller
        const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.32), pajamaMaterial);
        pelvis.position.y = 0.06;
        this.hipsGroup.add(pelvis);

        // Belly joint
        const bellyJoint = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), jointMaterial);
        bellyJoint.position.y = 0.04;
        bellyJoint.scale.set(1.2, 0.5, 0.9);
        this.spineGroup.add(bellyJoint);

        // Belly
        const belly = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.24, 0.32), pajamaMaterial);
        belly.position.y = 0.12;
        this.spineGroup.add(belly);

        // Chest joint
        const chestJoint = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), jointMaterial);
        chestJoint.position.y = 0.04;
        chestJoint.scale.set(1.3, 0.5, 0.95);
        this.torsoGroup.add(chestJoint);

        // Chest - main body
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.36), pajamaMaterial);
        chest.position.y = 0.18;
        this.torsoGroup.add(chest);
        this.body = chest;

        // Stripes
        for (let i = 0; i < 3; i++) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.61, 0.018, 0.37),
                stripeMaterial
            );
            stripe.position.set(0, 0.06 + i * 0.08, 0);
            this.torsoGroup.add(stripe);
        }

        // Shoulders
        const shoulderBar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.38), shadowMaterial);
        shoulderBar.position.y = 0.34;
        this.torsoGroup.add(shoulderBar);

        // Collar
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.4), collarMaterial);
        collar.position.set(0, 0.32, 0.02);
        this.torsoGroup.add(collar);

        // Shirt opening
        const shirtOpening = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.02), darkMaterial);
        shirtOpening.position.set(0, 0.06, 0.19);
        this.torsoGroup.add(shirtOpening);

        // Buttons
        for (let i = 0; i < 3; i++) {
            const button = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), buttonMaterial);
            button.position.set(0.065, 0.24 - i * 0.12, 0.2);
            this.torsoGroup.add(button);
        }

        // Pocket
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.02), cuffMaterial);
        pocket.position.set(-0.15, 0.15, 0.2);
        this.torsoGroup.add(pocket);
    }

    createHead() {
        // Neck
        this.neckGroup.position.y = 0.42;
        this.torsoGroup.add(this.neckGroup);

        const skinMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skin });

        // Neck mesh
        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.09, 0.1, 12),
            skinMaterial
        );
        neck.position.y = 0.05;
        this.neckGroup.add(neck);

        // Head group
        this.headGroup.position.y = 0.15;
        this.neckGroup.add(this.headGroup);

        // ============ SIMPLE CUTE HEAD ============
        // Main head - slightly oval sphere
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 24, 18),
            skinMaterial
        );
        head.scale.set(1.05, 1.0, 0.95);
        this.headGroup.add(head);
        this.head = head;

        // ============ HAIR ============
        this.createHair();

        // ============ FACE ============
        this.createFace();

        // Ears - small and cute
        const earMat = new THREE.MeshLambertMaterial({ color: PALETTE.skinShadow });
        const leftEar = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            earMat
        );
        leftEar.position.set(-0.24, 0, 0);
        leftEar.scale.set(0.5, 1, 0.7);
        this.headGroup.add(leftEar);

        const rightEar = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            earMat
        );
        rightEar.position.set(0.24, 0, 0);
        rightEar.scale.set(0.5, 1, 0.7);
        this.headGroup.add(rightEar);
    }

    /**
     * Create simple cute sleepy face
     */
    createFace() {
        const faceGroup = new THREE.Group();
        faceGroup.name = "Face";

        // Head radius is 0.24 * 1.05 (x-scale) = ~0.25
        // Face features need to be ON the surface, so z should be ~0.23-0.24
        const faceZ = 0.23;
        const eyeY = 0.03;
        const eyeSpacing = 0.07;

        // ========== EYES - Bigger cute style ==========
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

        // Left eye - bigger dark oval
        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 12, 8),
            eyeMat
        );
        leftEye.position.set(-eyeSpacing, eyeY, faceZ);
        leftEye.scale.set(0.9, 0.6, 0.25); // Sleepy half-closed but bigger
        faceGroup.add(leftEye);

        // Right eye
        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 12, 8),
            eyeMat
        );
        rightEye.position.set(eyeSpacing, eyeY, faceZ);
        rightEye.scale.set(0.9, 0.6, 0.25);
        faceGroup.add(rightEye);

        // Eye shine - white highlights (bigger too)
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const leftShine = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 4),
            shineMat
        );
        leftShine.position.set(-eyeSpacing + 0.015, eyeY + 0.008, faceZ + 0.01);
        faceGroup.add(leftShine);

        const rightShine = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 4),
            shineMat
        );
        rightShine.position.set(eyeSpacing + 0.015, eyeY + 0.008, faceZ + 0.01);
        faceGroup.add(rightShine);

        // ========== BLUSH - Pink cheeks ==========
        const blushMat = new THREE.MeshBasicMaterial({
            color: 0xffaaaa,
            transparent: true,
            opacity: 0.5
        });

        const leftBlush = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            blushMat
        );
        leftBlush.position.set(-0.1, -0.01, faceZ - 0.01);
        leftBlush.scale.set(1.0, 0.6, 0.2);
        faceGroup.add(leftBlush);

        const rightBlush = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            blushMat
        );
        rightBlush.position.set(0.1, -0.01, faceZ - 0.01);
        rightBlush.scale.set(1.0, 0.6, 0.2);
        faceGroup.add(rightBlush);

        // ========== MOUTH - Small sleepy mouth ==========
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0xdd9999 });

        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.015, 0.01),
            mouthMat
        );
        mouth.position.set(0, -0.05, faceZ);
        faceGroup.add(mouth);

        // Add face to head
        this.headGroup.add(faceGroup);
        this.faceGroup = faceGroup;
    }

    /**
     * Create simple short hair - bowl cut style sitting on top of head
     */
    createHair() {
        const hairGroup = new THREE.Group();
        hairGroup.name = "Hair";

        const hairMat = new THREE.MeshLambertMaterial({ color: PALETTE.hair });

        // Simple bowl-cut style hair using a flattened sphere
        // Positioned high on head, above the face
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.26, 20, 12),
            hairMat
        );
        // Flatten it and position on top of head
        hairTop.scale.set(1.0, 0.5, 1.0);
        hairTop.position.set(0, 0.14, -0.02);
        hairGroup.add(hairTop);

        // Small fringe/bangs at the front (above forehead, not covering face)
        const bangs = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.06, 0.08),
            hairMat
        );
        bangs.position.set(0, 0.12, 0.12);
        bangs.rotation.x = 0.3; // Slight tilt
        hairGroup.add(bangs);

        // Side hair - left
        const leftSide = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 6),
            hairMat
        );
        leftSide.position.set(-0.18, 0.06, 0);
        leftSide.scale.set(0.6, 1.0, 0.8);
        hairGroup.add(leftSide);

        // Side hair - right
        const rightSide = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 6),
            hairMat
        );
        rightSide.position.set(0.18, 0.06, 0);
        rightSide.scale.set(0.6, 1.0, 0.8);
        hairGroup.add(rightSide);

        // Back of head hair
        const backHair = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 10),
            hairMat
        );
        backHair.position.set(0, 0.04, -0.14);
        backHair.scale.set(1.0, 0.8, 0.5);
        hairGroup.add(backHair);

        this.headGroup.add(hairGroup);
        this.hairGroup = hairGroup;
    }

    createArms() {
        // Position shoulders at sides of torso - closer to body for natural hang
        // Lower Y position so arms hang down naturally
        this.leftShoulderGroup.position.set(-0.34, 0.28, 0);
        this.rightShoulderGroup.position.set(0.34, 0.28, 0);
        this.torsoGroup.add(this.leftShoulderGroup, this.rightShoulderGroup);

        this.leftArm = this.createArmHierarchy(-1, this.leftShoulderGroup, 'left');
        this.rightArm = this.createArmHierarchy(1, this.rightShoulderGroup, 'right');
    }

    createArmHierarchy(side, shoulderGroup, sideName) {
        const pajamaMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaBlue });
        const cuffMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaCuff });
        const skinMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skin });
        const jointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaJoint });

        const upperArmGroup = sideName === 'left' ? this.leftUpperArmGroup : this.rightUpperArmGroup;
        upperArmGroup.position.y = 0;
        shoulderGroup.add(upperArmGroup);

        // Shoulder joint - smaller to prevent overlap
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), jointMaterial);
        shoulder.position.set(side * 0.02, 0.01, 0);
        upperArmGroup.add(shoulder);

        // Upper arm - thinner
        const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.11), pajamaMaterial);
        upperArm.position.set(side * 0.02, -0.14, 0);
        upperArmGroup.add(upperArm);

        const elbowGroup = sideName === 'left' ? this.leftElbowGroup : this.rightElbowGroup;
        elbowGroup.position.set(side * 0.02, -0.28, 0);
        upperArmGroup.add(elbowGroup);

        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), jointMaterial);
        elbowGroup.add(elbow);

        const lowerArmGroup = sideName === 'left' ? this.leftLowerArmGroup : this.rightLowerArmGroup;
        lowerArmGroup.position.y = 0;
        elbowGroup.add(lowerArmGroup);

        const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.1), pajamaMaterial);
        lowerArm.position.y = -0.13;
        lowerArmGroup.add(lowerArm);

        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.055, 0.12), cuffMaterial);
        cuff.position.y = -0.26;
        lowerArmGroup.add(cuff);

        const wristGroup = sideName === 'left' ? this.leftWristGroup : this.rightWristGroup;
        wristGroup.position.y = -0.28;
        lowerArmGroup.add(wristGroup);

        const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), jointMaterial);
        wrist.position.y = -0.01;
        wristGroup.add(wrist);

        const handGroup = sideName === 'left' ? this.leftHandGroup : this.rightHandGroup;
        handGroup.position.y = -0.03;
        wristGroup.add(handGroup);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skinMaterial);
        hand.position.set(0, -0.04, 0);
        hand.scale.set(1, 0.85, 0.75);
        handGroup.add(hand);

        // Fingers
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(
                new THREE.SphereGeometry(0.014, 5, 4),
                skinMaterial
            );
            finger.position.set(
                side * (-0.015 + i * 0.012),
                -0.08,
                -0.015 + i * 0.012
            );
            finger.scale.set(0.65, 1.1, 0.65);
            handGroup.add(finger);
        }

        const thumb = new THREE.Mesh(
            new THREE.SphereGeometry(0.016, 5, 4),
            skinMaterial
        );
        thumb.position.set(side * 0.025, -0.05, 0.03);
        thumb.scale.set(0.75, 1, 0.75);
        handGroup.add(thumb);

        return { shoulderGroup, upperArmGroup, elbowGroup, lowerArmGroup, wristGroup, handGroup };
    }

    createLegs() {
        // Position legs with proper spacing
        this.leftHipGroup.position.set(-0.16, 0, 0);
        this.rightHipGroup.position.set(0.16, 0, 0);
        this.hipsGroup.add(this.leftHipGroup, this.rightHipGroup);

        this.leftLeg = this.createLegHierarchy(-1, this.leftHipGroup, 'left');
        this.rightLeg = this.createLegHierarchy(1, this.rightHipGroup, 'right');
    }

    createLegHierarchy(side, hipGroup, sideName) {
        const pajamaMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaBlue });
        const cuffMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaCuff });
        const slipperMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.slipperPink });
        const slipperInnerMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.slipperInner });
        const soleMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.slipperSole });
        const jointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pajamaJoint });

        const upperLegGroup = sideName === 'left' ? this.leftUpperLegGroup : this.rightUpperLegGroup;
        upperLegGroup.position.y = 0;
        hipGroup.add(upperLegGroup);

        const hip = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), jointMaterial);
        hip.position.y = 0.02;
        upperLegGroup.add(hip);

        const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.14), pajamaMaterial);
        upperLeg.position.y = -0.15;
        upperLegGroup.add(upperLeg);

        const kneeGroup = sideName === 'left' ? this.leftKneeGroup : this.rightKneeGroup;
        kneeGroup.position.y = -0.32;
        upperLegGroup.add(kneeGroup);

        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), jointMaterial);
        kneeGroup.add(knee);

        const lowerLegGroup = sideName === 'left' ? this.leftLowerLegGroup : this.rightLowerLegGroup;
        lowerLegGroup.position.y = 0;
        kneeGroup.add(lowerLegGroup);

        const lowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.13), pajamaMaterial);
        lowerLeg.position.y = -0.15;
        lowerLegGroup.add(lowerLeg);

        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.15), cuffMaterial);
        cuff.position.y = -0.3;
        lowerLegGroup.add(cuff);

        const ankleGroup = sideName === 'left' ? this.leftAnkleGroup : this.rightAnkleGroup;
        ankleGroup.position.y = -0.34;
        lowerLegGroup.add(ankleGroup);

        const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), jointMaterial);
        ankle.position.y = -0.01;
        ankleGroup.add(ankle);

        const footGroup = sideName === 'left' ? this.leftFootGroup : this.rightFootGroup;
        footGroup.position.y = -0.03;
        ankleGroup.add(footGroup);

        const slipperSize = GAME_CONSTANTS.SLIPPER_SIZE;
        const slipper = new THREE.Mesh(
            new THREE.BoxGeometry(0.18 * slipperSize, 0.07 * slipperSize, 0.3 * slipperSize),
            slipperMaterial
        );
        slipper.position.set(0, -0.035, 0.06);
        footGroup.add(slipper);

        const slipperInner = new THREE.Mesh(
            new THREE.BoxGeometry(0.12 * slipperSize, 0.035, 0.14 * slipperSize),
            slipperInnerMaterial
        );
        slipperInner.position.set(0, 0.015, -0.02);
        footGroup.add(slipperInner);

        const sole = new THREE.Mesh(
            new THREE.BoxGeometry(0.19 * slipperSize, 0.02, 0.32 * slipperSize),
            soleMaterial
        );
        sole.position.set(0, -0.075, 0.06);
        footGroup.add(sole);

        // Fuzzy bumps
        for (let i = 0; i < 4; i++) {
            const fuzz = new THREE.Mesh(
                new THREE.SphereGeometry(0.012, 5, 4),
                slipperMaterial
            );
            fuzz.position.set(
                (Math.random() - 0.5) * 0.12,
                0.015,
                -0.04 + Math.random() * 0.1
            );
            footGroup.add(fuzz);
        }

        return { hipGroup, upperLegGroup, kneeGroup, lowerLegGroup, ankleGroup, footGroup };
    }

    createSkeletonRig() {
        if (!GAME_CONSTANTS.PLAYER_SKELETON_VISIBLE) return;

        const group = new THREE.Group();
        group.position.z = -0.25;
        this.bodyRoot.add(group);

        const jointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skeletonJoint });
        const coreMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skeletonCore });
        const boneMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skeletonBone });

        const jointNames = [
            'hip', 'spine', 'chest', 'neck', 'head',
            'leftShoulder', 'leftElbow', 'leftHand',
            'rightShoulder', 'rightElbow', 'rightHand',
            'leftHip', 'leftKnee', 'leftAnkle',
            'rightHip', 'rightKnee', 'rightAnkle'
        ];

        const joints = {};
        jointNames.forEach((name) => {
            const isCore = ['hip', 'spine', 'chest', 'neck', 'head'].includes(name);
            const joint = new THREE.Mesh(
                new THREE.SphereGeometry(GAME_CONSTANTS.PLAYER_SKELETON_JOINT_SIZE * (isCore ? 1.15 : 1), 12, 8),
                isCore ? coreMaterial : jointMaterial
            );
            joints[name] = joint;
            group.add(joint);
        });

        const boneNames = [
            ['hip', 'spine'], ['spine', 'chest'], ['chest', 'neck'], ['neck', 'head'],
            ['chest', 'leftShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftHand'],
            ['chest', 'rightShoulder'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightHand'],
            ['hip', 'leftHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
            ['hip', 'rightHip'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle']
        ];

        const bones = boneNames.map(([from, to]) => {
            const bone = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    GAME_CONSTANTS.PLAYER_SKELETON_BONE_RADIUS,
                    GAME_CONSTANTS.PLAYER_SKELETON_BONE_RADIUS,
                    1,
                    8
                ),
                boneMaterial
            );
            group.add(bone);
            return { from, to, mesh: bone };
        });

        this.skeletonRig = { group, joints, bones };
        this.updateSkeletonRig(0, 0, false);
    }

    setState(newState) {
        this.state = newState;
    }

    update(deltaTime, balanceValue = 0, sleepinessValue = 0, speed = 0, hasMovementInput = false, bodyState = {}) {
        const sleepiness = sleepinessValue / 100;
        const speedRatio = THREE.MathUtils.clamp(speed / (GAME_CONSTANTS.BASE_SPEED * 1.15), 0, 1);
        const balanceRatio = THREE.MathUtils.clamp(balanceValue / GAME_CONSTANTS.BALANCE_MAX, -1, 1);

        const bodyActivation = bodyState.bodyActivation ?? (hasMovementInput ? 1 : 0);
        const collapseAmount = bodyState.collapseAmount ?? (hasMovementInput ? 0 : 1);
        const jointStrength = bodyState.jointStrength ?? bodyActivation;
        const stepSide = bodyState.stepSide ?? 0;
        const stepPulse = bodyState.stepPulse ?? false;
        const alternationBoost = bodyState.alternationBoost ?? 0;

        this.walkCycle += deltaTime * (2.2 + speedRatio * 4.2);
        this.sleepyTimer += deltaTime;
        this.breath += deltaTime * (1.5 + sleepiness);
        this.idleSwayPhase += deltaTime * (0.8 + sleepiness * 0.5);

        // Update floor collapse - key change for full collapse
        this.updateFloorCollapse(hasMovementInput, collapseAmount, balanceRatio, deltaTime);

        this.updateSleepNod(deltaTime, sleepiness);
        this.calculateLeanValues(balanceRatio, speedRatio, sleepiness, collapseAmount, bodyActivation, jointStrength, deltaTime);
        this.updateSpringPhysics(deltaTime, jointStrength);

        this.applyBodyAnimation(speedRatio, sleepiness, collapseAmount, bodyActivation);
        this.animateHead(sleepiness, collapseAmount, jointStrength);
        this.animateLimbs(speedRatio, hasMovementInput, {
            bodyActivation,
            collapseAmount,
            stepSide,
            stepPulse,
            alternationBoost
        });

        this.updateSkeletonRig(speedRatio, sleepiness, hasMovementInput, {
            bodyActivation,
            collapseAmount,
            jointStrength,
            stepSide,
            alternationBoost
        });

        this.syncPosition();
    }

    /**
     * Full floor collapse - character falls completely to ground
     */
    updateFloorCollapse(hasMovementInput, collapseAmount, balanceRatio, deltaTime) {
        if (!hasMovementInput && collapseAmount > 0.3) {
            // Accelerate floor collapse when not moving
            const collapseSpeed = GAME_CONSTANTS.COLLAPSE_SPEED * 1.5;
            this.floorCollapseAmount = Math.min(1, this.floorCollapseAmount + deltaTime * collapseSpeed);

            // Set collapse direction based on balance
            if (Math.abs(balanceRatio) > 0.1) {
                this.collapseDirection = balanceRatio > 0 ? 1 : -1;
            }
        } else {
            // Recover from collapse when moving
            const recoverySpeed = GAME_CONSTANTS.RECOVERY_SPEED;
            this.floorCollapseAmount = Math.max(0, this.floorCollapseAmount - deltaTime * recoverySpeed);
        }
    }

    updateSleepNod(deltaTime, sleepiness) {
        this.nextHeadNod -= deltaTime;

        if (this.nextHeadNod <= 0) {
            const sleepyChance = GAME_CONSTANTS.PLAYER_SLEEPY_NOD_CHANCE + sleepiness * 0.7;
            if (Math.random() < sleepyChance) {
                this.sleepNodAmount = 1;
            }
            this.nextHeadNod = 1.1 + Math.random() * (2.8 - sleepiness * 1.2);
        }

        this.sleepNodAmount = Math.max(0, this.sleepNodAmount - deltaTime * 1.9);
    }

    calculateLeanValues(balanceRatio, speedRatio, sleepiness, collapseAmount, bodyActivation, jointStrength, deltaTime) {
        const targetRootLean = balanceRatio * GAME_CONSTANTS.PLAYER_WOBBLE_STRENGTH;
        const rhythmicSway = Math.sin(this.walkCycle) * 0.08 * speedRatio;
        const sleepySway = Math.sin(this.sleepyTimer * 1.15) * (0.05 + sleepiness * 0.08);
        const idleSway = Math.sin(this.idleSwayPhase) * 0.15 * (1 - bodyActivation);

        // Enhanced slump for floor collapse
        const floorSlump = this.floorCollapseAmount * 2.5;
        const idleSlumpTarget = collapseAmount * (1.2 + sleepiness * 0.4) + floorSlump;

        this.slump = THREE.MathUtils.lerp(
            this.slump,
            idleSlumpTarget,
            deltaTime * GAME_CONSTANTS.PLAYER_IDLE_SLUMP_SPEED * (1 + this.floorCollapseAmount)
        );

        // Enhanced lean for collapse direction
        const collapseLeanBonus = this.floorCollapseAmount * this.collapseDirection * 0.8;

        this.rootLean = THREE.MathUtils.lerp(
            this.rootLean,
            targetRootLean + sleepySway + idleSway + collapseAmount * Math.sign(balanceRatio || 1) * 0.5 + collapseLeanBonus,
            0.05 + jointStrength * 0.12
        );

        this.torsoLean = THREE.MathUtils.lerp(
            this.torsoLean,
            this.rootLean * (1.2 + collapseAmount * 0.6 + this.floorCollapseAmount * 0.5) + rhythmicSway * bodyActivation,
            GAME_CONSTANTS.PLAYER_FOLLOW_THROUGH * (0.5 + jointStrength * 1.2)
        );

        this.headLean = THREE.MathUtils.lerp(
            this.headLean,
            this.torsoLean * (1.3 + collapseAmount * 0.8 + this.floorCollapseAmount * 0.6),
            GAME_CONSTANTS.PLAYER_FOLLOW_THROUGH * (0.4 + jointStrength * 0.9)
        );

        this.armLag = THREE.MathUtils.lerp(this.armLag, -this.torsoLean, 0.02 + jointStrength * 0.06);
    }

    updateSpringPhysics(deltaTime, jointStrength) {
        // Enhanced collapse effect in spring targets
        const collapseMultiplier = 1 + this.floorCollapseAmount * 1.5;

        const hipsTarget = new THREE.Euler(
            this.slump * 0.4 * collapseMultiplier,
            0,
            this.rootLean * collapseMultiplier
        );
        const spineTarget = new THREE.Euler(
            -this.slump * 0.6 * collapseMultiplier,
            0,
            this.torsoLean * 0.6
        );
        const neckTarget = new THREE.Euler(
            this.lastDroop * 0.4 + this.floorCollapseAmount * 0.8,
            0,
            this.headLean * 0.4
        );
        const headTarget = new THREE.Euler(
            this.lastDroop + this.floorCollapseAmount * 1.2,
            0,
            this.headLean
        );

        // Reduce stiffness during collapse for full ragdoll effect
        const collapseJointStrength = jointStrength * (1 - this.floorCollapseAmount * 0.7);

        this.springs.hips.update(deltaTime, hipsTarget, null, collapseJointStrength);
        this.springs.spine.update(deltaTime, spineTarget, this.springs.hips.currentRotation, collapseJointStrength);
        this.springs.neck.update(deltaTime, neckTarget, this.springs.spine.currentRotation, collapseJointStrength);
        this.springs.head.update(deltaTime, headTarget, this.springs.neck.currentRotation, collapseJointStrength);

        // Arm spring targets - arms hang loosely at sides
        const armSwing = Math.sin(this.walkCycle + Math.PI) * 0.2 * jointStrength * (1 - this.floorCollapseAmount);
        // Arms hang down naturally, slight forward lean when relaxed
        const armRelaxDrop = (1 - jointStrength) * 0.4 + this.floorCollapseAmount * 0.6;

        // Shoulders - hang at sides with minimal outward angle (was 0.25, now 0.05)
        const leftShoulderTarget = new THREE.Euler(armSwing + armRelaxDrop, 0, 0.05 + this.armLag * 0.2);
        const leftElbowTarget = new THREE.Euler(0.1 + armRelaxDrop * 0.5, 0, -0.05);
        const leftWristTarget = new THREE.Euler(armRelaxDrop * 0.3, 0, 0);

        const rightShoulderTarget = new THREE.Euler(-armSwing + armRelaxDrop, 0, -0.05 + this.armLag * 0.2);
        const rightElbowTarget = new THREE.Euler(0.1 + armRelaxDrop * 0.5, 0, 0.05);
        const rightWristTarget = new THREE.Euler(armRelaxDrop * 0.3, 0, 0);

        this.springs.leftShoulder.update(deltaTime, leftShoulderTarget, this.springs.spine.currentRotation, collapseJointStrength);
        this.springs.leftElbow.update(deltaTime, leftElbowTarget, this.springs.leftShoulder.currentRotation, collapseJointStrength);
        this.springs.leftWrist.update(deltaTime, leftWristTarget, this.springs.leftElbow.currentRotation, collapseJointStrength);

        this.springs.rightShoulder.update(deltaTime, rightShoulderTarget, this.springs.spine.currentRotation, collapseJointStrength);
        this.springs.rightElbow.update(deltaTime, rightElbowTarget, this.springs.rightShoulder.currentRotation, collapseJointStrength);
        this.springs.rightWrist.update(deltaTime, rightWristTarget, this.springs.rightElbow.currentRotation, collapseJointStrength);
    }

    applyBodyAnimation(speedRatio, sleepiness, collapseAmount, bodyActivation) {
        // Full floor collapse - body drops to ground but stays ON floor
        const floorDrop = this.floorCollapseAmount * 0.65; // How far body drops

        this.hipsGroup.rotation.z = this.springs.hips.currentRotation.z;
        this.hipsGroup.rotation.x = this.springs.hips.currentRotation.x;

        // Calculate Y position with floor clamping
        // Standing hip height is ~0.82, collapsed should be ~0.15-0.25 (lying on ground)
        const standingHeight = 0.82;
        const minFloorHeight = 0.18; // Minimum height so body lies ON floor, not in it
        const breathBob = Math.sin(this.breath) * 0.015 * bodyActivation;
        const slumpDrop = this.slump * 0.2;
        const rawY = standingHeight + breathBob - slumpDrop - floorDrop;
        this.hipsGroup.position.y = Math.max(minFloorHeight, rawY);

        this.spineGroup.rotation.z = this.springs.spine.currentRotation.z;
        this.spineGroup.rotation.x = -0.08 + this.springs.spine.currentRotation.x;
        this.spineGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.04 * bodyActivation;

        this.torsoGroup.rotation.z = this.torsoLean;
        this.torsoGroup.rotation.x = -0.05 - this.slump * 0.4 + bodyActivation * 0.03;
        this.torsoGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.025 * bodyActivation + collapseAmount * this.rootLean * 0.15;
        this.torsoGroup.position.y = 0.22 - Math.abs(Math.sin(this.walkCycle)) * 0.02 * speedRatio;
    }

    animateHead(sleepiness, collapseAmount = 0, jointStrength = 1) {
        const nodCurve = Math.sin((1 - this.sleepNodAmount) * Math.PI);
        const droop = sleepiness * GAME_CONSTANTS.PLAYER_HEAD_DROOP +
            nodCurve * 0.4 +
            collapseAmount * 0.9 +
            this.floorCollapseAmount * 1.2 +
            this.externalHeadDroop;
        const tinyShake = Math.sin(this.sleepyTimer * 3.2) * 0.02 * (0.5 + sleepiness);
        this.lastDroop = droop;

        this.neckGroup.rotation.x = this.springs.neck.currentRotation.x + droop * 0.35;
        this.neckGroup.rotation.z = this.springs.neck.currentRotation.z + tinyShake * jointStrength * 0.5;

        this.headGroup.rotation.x = this.springs.head.currentRotation.x + droop * 0.65;
        this.headGroup.rotation.z = this.springs.head.currentRotation.z + tinyShake * jointStrength;
        this.headGroup.position.y = 0.18 - this.slump * 0.08 - this.floorCollapseAmount * 0.1;
    }

    animateLimbs(speedRatio, hasMovementInput, bodyState = {}) {
        const bodyActivation = bodyState.bodyActivation ?? (hasMovementInput ? 1 : 0);
        const collapseAmount = bodyState.collapseAmount ?? 0;
        const stepSide = bodyState.stepSide ?? 0;
        const alternationBoost = bodyState.alternationBoost ?? 0;

        // Floor collapse affects all limbs
        const floorCollapse = this.floorCollapseAmount;

        // Legs - collapse fully to floor
        const uneven = Math.sin(this.walkCycle * 0.47) * 0.1;
        const legSwing = Math.sin(this.walkCycle) * (0.22 + speedRatio * 0.3) * speedRatio * (1 - floorCollapse);
        const weakKnee = 0.18 + this.slump * 0.7 + floorCollapse * 1.5;
        const leftStepPlant = stepSide === -1 ? 0.28 + alternationBoost * 0.15 : 0;
        const rightStepPlant = stepSide === 1 ? 0.28 + alternationBoost * 0.15 : 0;

        // Hip rotation - legs splay out during collapse
        this.leftHipGroup.rotation.x = (legSwing + leftStepPlant) * bodyActivation - weakKnee + uneven * 0.3;
        this.rightHipGroup.rotation.x = (-legSwing + rightStepPlant) * bodyActivation - weakKnee - uneven * 0.3;
        this.leftHipGroup.rotation.z = -0.05 + this.rootLean * 0.15 - collapseAmount * 0.3 - floorCollapse * 0.5;
        this.rightHipGroup.rotation.z = 0.05 + this.rootLean * 0.15 + collapseAmount * 0.3 + floorCollapse * 0.5;

        // Knees bend fully during collapse
        const looseKnee = 0.4 + collapseAmount * 1.2 + floorCollapse * 1.8;
        this.leftKneeGroup.rotation.x = looseKnee - leftStepPlant * 0.6 + Math.sin(this.sleepyTimer * 2.1) * collapseAmount * 0.15;
        this.rightKneeGroup.rotation.x = looseKnee - rightStepPlant * 0.6 + Math.sin(this.sleepyTimer * 2.0 + 1.1) * collapseAmount * 0.15;
        this.leftKneeGroup.rotation.z = -collapseAmount * 0.3 - floorCollapse * 0.4 + this.rootLean * 0.1;
        this.rightKneeGroup.rotation.z = collapseAmount * 0.3 + floorCollapse * 0.4 + this.rootLean * 0.1;

        // Ankles flop during collapse
        this.leftAnkleGroup.rotation.x = collapseAmount * 0.2 + floorCollapse * 0.6 + Math.sin(this.sleepyTimer * 1.5) * 0.04;
        this.rightAnkleGroup.rotation.x = collapseAmount * 0.2 + floorCollapse * 0.6 + Math.sin(this.sleepyTimer * 1.4 + 0.5) * 0.04;
        this.leftAnkleGroup.rotation.z = -collapseAmount * 0.25 - floorCollapse * 0.4;
        this.rightAnkleGroup.rotation.z = collapseAmount * 0.25 + floorCollapse * 0.4;

        // Arms - hang loosely at sides, swing lazily when walking
        // Arms should dangle naturally, not stick out stiffly
        const lazyArmSwing = Math.sin(this.walkCycle + Math.PI) * 0.25 * speedRatio * (1 - floorCollapse) * bodyActivation;

        // Arms hang down naturally - minimal outward angle
        const armHangAngle = 0.05; // Very slight outward angle (was 0.3 - too stiff!)
        const armRelax = (1 - bodyActivation) * 0.15; // More relaxed when not moving
        const collapseRelax = collapseAmount * 0.3 + floorCollapse * 0.5;

        this.leftShoulderGroup.rotation.copy(this.springs.leftShoulder.currentRotation);
        // Arms hang down at sides - small z rotation for natural hang
        this.leftShoulderGroup.rotation.z = armHangAngle + armRelax - collapseRelax;
        // Arms swing forward/back when walking, hang loosely when still
        this.leftShoulderGroup.rotation.x = lazyArmSwing + armRelax * 0.5 + collapseRelax * 0.8;

        this.rightShoulderGroup.rotation.copy(this.springs.rightShoulder.currentRotation);
        // Mirror for right arm
        this.rightShoulderGroup.rotation.z = -armHangAngle - armRelax + collapseRelax;
        this.rightShoulderGroup.rotation.x = -lazyArmSwing + armRelax * 0.5 + collapseRelax * 0.8;

        // Elbows - slightly bent naturally, like relaxed hanging arms
        // Small natural bend when standing, more bend during collapse
        const naturalBend = 0.15; // Slight natural elbow bend
        const collapseBend = collapseAmount * 0.6 + floorCollapse * 0.8;
        const sleepyWobble = Math.sin(this.sleepyTimer * 1.8) * 0.08 * (1 - bodyActivation);

        this.leftElbowGroup.rotation.copy(this.springs.leftElbow.currentRotation);
        this.leftElbowGroup.rotation.x = naturalBend + collapseBend + sleepyWobble;
        this.leftElbowGroup.rotation.z = -0.05 - collapseRelax * 0.2;

        this.rightElbowGroup.rotation.copy(this.springs.rightElbow.currentRotation);
        this.rightElbowGroup.rotation.x = naturalBend + collapseBend + Math.sin(this.sleepyTimer * 1.7 + 0.8) * 0.08 * (1 - bodyActivation);
        this.rightElbowGroup.rotation.z = 0.05 + collapseRelax * 0.2;

        // Wrists - hang loosely, floppy motion
        const wristWobble = Math.sin(this.sleepyTimer * 2.2) * 0.12 * GAME_CONSTANTS.HAND_LOOSENESS;
        const wristDroop = collapseAmount * 0.3 + floorCollapse * 0.4;

        this.leftWristGroup.rotation.copy(this.springs.leftWrist.currentRotation);
        this.leftWristGroup.rotation.x = wristDroop + wristWobble;
        this.leftWristGroup.rotation.z = Math.sin(this.sleepyTimer * 1.9) * 0.1 * GAME_CONSTANTS.HAND_LOOSENESS;

        this.rightWristGroup.rotation.copy(this.springs.rightWrist.currentRotation);
        this.rightWristGroup.rotation.x = wristDroop + Math.sin(this.sleepyTimer * 2.1 + 0.5) * 0.12 * GAME_CONSTANTS.HAND_LOOSENESS;
        this.rightWristGroup.rotation.z = Math.sin(this.sleepyTimer * 1.8 + 0.3) * 0.1 * GAME_CONSTANTS.HAND_LOOSENESS;
    }

    updateSkeletonRig(speedRatio, sleepiness, hasMovementInput, bodyState = {}) {
        if (!this.skeletonRig) return;

        // Similar to before but with enhanced floor collapse
        const bodyActivation = bodyState.bodyActivation ?? (hasMovementInput ? 1 : 0);
        const collapseAmount = bodyState.collapseAmount ?? 0;
        const jointStrength = bodyState.jointStrength ?? bodyActivation;
        const stepSide = bodyState.stepSide ?? 0;
        const alternationBoost = bodyState.alternationBoost ?? 0;
        const floorCollapse = this.floorCollapseAmount;

        const floppy = GAME_CONSTANTS.PLAYER_SKELETON_FLOPPINESS;
        const walk = this.walkCycle;
        const balancePull = this.rootLean * 0.5;
        const torsoPull = this.torsoLean * 0.4;
        const headPull = this.headLean * 0.32;
        const forwardSlump = this.slump * 0.2 + this.lastDroop * 0.08 + collapseAmount * 0.35 + floorCollapse * 0.5;

        const pose = {
            hip: new THREE.Vector3(balancePull * 0.15, 0.82 - collapseAmount * 0.3 - floorCollapse * 0.55, 0),
            spine: new THREE.Vector3(torsoPull * 0.12, 1.02 - collapseAmount * 0.4 - floorCollapse * 0.6, -forwardSlump * 0.5),
            chest: new THREE.Vector3(torsoPull * 0.25, 1.32 - collapseAmount * 0.55 - floorCollapse * 0.7, -forwardSlump * 0.9),
            neck: new THREE.Vector3(headPull * 0.18, 1.48 - collapseAmount * 0.7 - floorCollapse * 0.8, -forwardSlump * 1.1),
            head: new THREE.Vector3(headPull * 0.38, 1.65 - collapseAmount * 0.85 - floorCollapse * 0.95, -forwardSlump * 1.6)
        };

        pose.leftShoulder = pose.chest.clone().add(new THREE.Vector3(-0.4, -0.02, 0.05));
        pose.rightShoulder = pose.chest.clone().add(new THREE.Vector3(0.4, -0.02, 0.05));

        // Arms hang forward (positive Z) and down
        const armForwardOffset = 0.08 + collapseAmount * 0.15 + floorCollapse * 0.2;
        const armDropOffset = 0.1 + collapseAmount * 0.5 + floorCollapse * 0.6;
        pose.leftElbow = pose.leftShoulder.clone().add(new THREE.Vector3(-0.08, -0.28 - armDropOffset, armForwardOffset));
        pose.rightElbow = pose.rightShoulder.clone().add(new THREE.Vector3(0.08, -0.28 - armDropOffset, armForwardOffset));
        pose.leftHand = pose.leftElbow.clone().add(new THREE.Vector3(-0.04, -0.25 - collapseAmount * 0.2 - floorCollapse * 0.3, armForwardOffset * 0.5));
        pose.rightHand = pose.rightElbow.clone().add(new THREE.Vector3(0.04, -0.25 - collapseAmount * 0.2 - floorCollapse * 0.3, armForwardOffset * 0.5));

        pose.leftHip = pose.hip.clone().add(new THREE.Vector3(-0.16, -0.01, 0));
        pose.rightHip = pose.hip.clone().add(new THREE.Vector3(0.16, -0.01, 0));
        pose.leftKnee = pose.leftHip.clone().add(new THREE.Vector3(-0.03 - floorCollapse * 0.15, -0.35 + floorCollapse * 0.2, collapseAmount * 0.25 + floorCollapse * 0.35));
        pose.rightKnee = pose.rightHip.clone().add(new THREE.Vector3(0.03 + floorCollapse * 0.15, -0.35 + floorCollapse * 0.2, collapseAmount * 0.25 + floorCollapse * 0.35));
        pose.leftAnkle = pose.leftKnee.clone().add(new THREE.Vector3(-0.02 - floorCollapse * 0.1, -0.34 + collapseAmount * 0.15 + floorCollapse * 0.25, 0.05 + collapseAmount * 0.35 + floorCollapse * 0.4));
        pose.rightAnkle = pose.rightKnee.clone().add(new THREE.Vector3(0.02 + floorCollapse * 0.1, -0.34 + collapseAmount * 0.15 + floorCollapse * 0.25, 0.05 + collapseAmount * 0.35 + floorCollapse * 0.4));

        Object.entries(pose).forEach(([name, position]) => {
            const previous = this.skeletonPose[name] || position.clone();
            const follow = (name === 'head' ? 0.08 : 0.12) + jointStrength * (name === 'head' ? 0.16 : 0.22);
            previous.lerp(position, follow);
            this.skeletonPose[name] = previous;
            this.skeletonRig.joints[name].position.copy(previous);
        });

        this.skeletonRig.bones.forEach((bone) => {
            this.placeBoneBetween(bone.mesh, this.skeletonPose[bone.from], this.skeletonPose[bone.to]);
        });
    }

    placeBoneBetween(mesh, from, to) {
        const midpoint = from.clone().add(to).multiplyScalar(0.5);
        const direction = to.clone().sub(from);
        const length = Math.max(direction.length(), 0.001);

        mesh.position.copy(midpoint);
        mesh.scale.set(1, length, 1);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }

    syncPosition() {
        this.position.copy(this.mesh.position);
    }

    getMesh() {
        return this.mesh;
    }
}
