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

    // Hair - Light brown / ash brown (bed hair look)
    hair: 0x8B7355,          // Light brown / ash brown
    hairHighlight: 0xA08060,  // Slightly lighter brown for highlights

    // Face - larger and more visible
    eyeWhite: 0xffffff,
    eyeIris: 0x1a1208,
    eyePupil: 0x000000,
    eyebrow: 0x6B5344,  // Brown to match hair
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
        // Neck - positioned higher for better proportions
        this.neckGroup.position.y = 0.42;
        this.torsoGroup.add(this.neckGroup);

        // Neck mesh
        const neckMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skin });
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 12), neckMaterial);
        neck.position.y = 0.06;
        this.neckGroup.add(neck);

        // Head group
        this.headGroup.position.y = 0.18;
        this.neckGroup.add(this.headGroup);

        const skinMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.skin });
        const headScale = GAME_CONSTANTS.HEAD_SIZE_MULTIPLIER;

        // ============ HEAD SHAPE - Less round, more human-like ============
        // Create a composite head shape: main cranium + face area + chin

        // Main cranium - slightly flattened sphere for back/top of head
        const cranium = new THREE.Mesh(
            new THREE.SphereGeometry(0.26 * headScale, 16, 12),
            skinMaterial
        );
        cranium.scale.set(0.95, 0.88, 0.85); // Flatter, less spherical
        cranium.position.set(0, 0.02, -0.02); // Shifted back slightly
        this.headGroup.add(cranium);

        // Face area - flattened front for facial features
        const faceArea = new THREE.Mesh(
            new THREE.BoxGeometry(0.38 * headScale, 0.32 * headScale, 0.22 * headScale),
            skinMaterial
        );
        faceArea.position.set(0, -0.02, 0.08);
        // Round the edges slightly by scaling
        this.headGroup.add(faceArea);

        // Forehead - smooth transition
        const forehead = new THREE.Mesh(
            new THREE.SphereGeometry(0.2 * headScale, 12, 8),
            skinMaterial
        );
        forehead.scale.set(1.1, 0.5, 0.6);
        forehead.position.set(0, 0.12, 0.12);
        this.headGroup.add(forehead);

        // Cheekbones - slight definition
        const leftCheek = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 * headScale, 8, 6),
            skinMaterial
        );
        leftCheek.scale.set(0.8, 0.6, 0.5);
        leftCheek.position.set(-0.14, -0.02, 0.14);
        this.headGroup.add(leftCheek);

        const rightCheek = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 * headScale, 8, 6),
            skinMaterial
        );
        rightCheek.scale.set(0.8, 0.6, 0.5);
        rightCheek.position.set(0.14, -0.02, 0.14);
        this.headGroup.add(rightCheek);

        // Chin - gives the face more definition
        const chin = new THREE.Mesh(
            new THREE.SphereGeometry(0.12 * headScale, 10, 8),
            skinMaterial
        );
        chin.scale.set(0.8, 0.6, 0.7);
        chin.position.set(0, -0.16, 0.1);
        this.headGroup.add(chin);

        // Back of head - smooth coverage
        const backHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.22 * headScale, 12, 10),
            skinMaterial
        );
        backHead.scale.set(1.0, 0.9, 0.7);
        backHead.position.set(0, 0, -0.1);
        this.headGroup.add(backHead);

        // Store head reference for face positioning
        this.head = cranium;

        // ============ MESSY BED HAIR - No hat! ============
        this.createHair(headScale);

        // ============ FACE ============
        this.createFace(headScale);

        // Ears - on sides of head
        const leftEar = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 6),
            skinMaterial
        );
        leftEar.position.set(-0.32, 0.0, 0);
        leftEar.scale.set(0.4, 1, 0.6);
        this.headGroup.add(leftEar);

        const rightEar = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 6),
            skinMaterial
        );
        rightEar.position.set(0.32, 0.0, 0);
        rightEar.scale.set(0.4, 1, 0.6);
        this.headGroup.add(rightEar);
    }

    /**
     * Create sleepy face with visible features
     * Face is positioned on the flatter front area of the head
     */
    createFace(headScale) {
        const faceGroup = new THREE.Group();
        faceGroup.name = "SleepyFace";

        // New head has flatter front - faceArea box at z=0.08, depth 0.22*headScale
        // Front surface is at approximately z = 0.08 + (0.22 * headScale / 2) = 0.19
        const faceZ = 0.19;

        // Face vertical center (slightly above head center for natural look)
        const faceY = -0.02; // Adjusted for new head shape

        // Eye spacing (wider for cartoon look)
        const eyeSpacing = 0.1;
        const eyeY = faceY + 0.05;

        // ========== MATERIALS - Clean face, no facial hair look ==========
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Bright white
        const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x4a3520 }); // Medium brown (not too dark)
        const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }); // Very dark (not pure black)
        const eyelidMat = new THREE.MeshBasicMaterial({ color: PALETTE.skin }); // Skin tone
        const eyebagMat = new THREE.MeshBasicMaterial({ color: 0xddb0a8 }); // Light tired pinkish (subtle)
        const eyebrowMat = new THREE.MeshBasicMaterial({ color: PALETTE.eyebrow }); // Brown to match hair
        const noseMat = new THREE.MeshBasicMaterial({ color: PALETTE.skin }); // Same as skin (subtle)
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0xee9999 }); // Light pink lips
        const mouthDarkMat = new THREE.MeshBasicMaterial({ color: 0xcc7777 }); // Pinkish inside (NOT dark!)
        const blushMat = new THREE.MeshBasicMaterial({
            color: 0xffcccc,
            transparent: true,
            opacity: 0.3
        });

        // ========== EYES - Large, half-closed, sleepy - BIGGER for visibility ==========

        // Left eye socket/white - large oval, clearly visible
        const leftEyeWhite = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 12),  // Larger
            eyeWhiteMat
        );
        leftEyeWhite.position.set(-eyeSpacing, eyeY, faceZ + 0.02);
        leftEyeWhite.scale.set(1.1, 0.5, 0.3); // Wide, short (half-closed)
        faceGroup.add(leftEyeWhite);

        // Right eye socket/white
        const rightEyeWhite = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 12),  // Larger
            eyeWhiteMat
        );
        rightEyeWhite.position.set(eyeSpacing, eyeY, faceZ + 0.02);
        rightEyeWhite.scale.set(1.1, 0.5, 0.3);
        faceGroup.add(rightEyeWhite);

        // Left iris - dark, clearly visible
        const leftIris = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 12, 10),  // Larger
            eyeIrisMat
        );
        leftIris.position.set(-eyeSpacing, eyeY - 0.005, faceZ + 0.03);
        leftIris.scale.set(1.0, 0.55, 0.35);
        faceGroup.add(leftIris);

        // Right iris
        const rightIris = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 12, 10),  // Larger
            eyeIrisMat
        );
        rightIris.position.set(eyeSpacing, eyeY - 0.005, faceZ + 0.03);
        rightIris.scale.set(1.0, 0.55, 0.35);
        faceGroup.add(rightIris);

        // Left pupil - visible black dot
        const leftPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 6),  // Larger
            eyePupilMat
        );
        leftPupil.position.set(-eyeSpacing, eyeY - 0.008, faceZ + 0.04);
        leftPupil.scale.set(0.9, 0.6, 0.4);
        faceGroup.add(leftPupil);

        // Right pupil
        const rightPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 6),  // Larger
            eyePupilMat
        );
        rightPupil.position.set(eyeSpacing, eyeY - 0.008, faceZ + 0.04);
        rightPupil.scale.set(0.9, 0.6, 0.4);
        faceGroup.add(rightPupil);

        // ========== HEAVY EYELIDS - Drooping over eyes ==========

        // Left upper eyelid (skin colored, covers top of eye) - LARGER
        const leftEyelid = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.04, 0.035),  // Bigger
            eyelidMat
        );
        leftEyelid.position.set(-eyeSpacing, eyeY + 0.025, faceZ + 0.025);
        leftEyelid.rotation.z = -0.12; // Drooping inward
        leftEyelid.rotation.x = 0.15;  // Tilted forward
        faceGroup.add(leftEyelid);

        // Right upper eyelid
        const rightEyelid = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.04, 0.035),  // Bigger
            eyelidMat
        );
        rightEyelid.position.set(eyeSpacing, eyeY + 0.025, faceZ + 0.025);
        rightEyelid.rotation.z = 0.12; // Drooping inward
        rightEyelid.rotation.x = 0.15;
        faceGroup.add(rightEyelid);

        // ========== EYEBAGS - Dark circles under eyes ==========

        // Left eyebag - more prominent
        const leftEyebag = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 10, 8),  // Bigger
            eyebagMat
        );
        leftEyebag.position.set(-eyeSpacing, eyeY - 0.04, faceZ + 0.01);
        leftEyebag.scale.set(1.3, 0.45, 0.35);
        faceGroup.add(leftEyebag);

        // Right eyebag
        const rightEyebag = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 10, 8),  // Bigger
            eyebagMat
        );
        rightEyebag.position.set(eyeSpacing, eyeY - 0.04, faceZ + 0.01);
        rightEyebag.scale.set(1.3, 0.45, 0.35);
        faceGroup.add(rightEyebag);

        // ========== EYEBROWS - Thick, tired, droopy ==========

        // Left eyebrow - thicker and more visible
        const leftEyebrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.028, 0.025),  // Bigger
            eyebrowMat
        );
        leftEyebrow.position.set(-eyeSpacing, eyeY + 0.07, faceZ + 0.02);
        leftEyebrow.rotation.z = 0.2; // Angled down toward outside
        faceGroup.add(leftEyebrow);

        // Right eyebrow - slightly raised (asymmetric tired look)
        const rightEyebrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.028, 0.025),  // Bigger
            eyebrowMat
        );
        rightEyebrow.position.set(eyeSpacing, eyeY + 0.075, faceZ + 0.02);
        rightEyebrow.rotation.z = -0.1; // Less angled
        faceGroup.add(rightEyebrow);

        // ========== NOSE - Small, cute, visible ==========

        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 10, 8),  // Slightly bigger
            noseMat
        );
        nose.position.set(0, faceY - 0.015, faceZ + 0.04);
        nose.scale.set(0.85, 0.75, 0.55);
        faceGroup.add(nose);

        // Nostrils - tiny, subtle (NOT dark - would look like mustache)
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0xccaa99 }); // Light skin shadow
        const leftNostril = new THREE.Mesh(
            new THREE.SphereGeometry(0.006, 6, 4),  // Very small
            nostrilMat
        );
        leftNostril.position.set(-0.012, faceY - 0.028, faceZ + 0.042);
        faceGroup.add(leftNostril);

        const rightNostril = new THREE.Mesh(
            new THREE.SphereGeometry(0.006, 6, 4),  // Very small
            nostrilMat
        );
        rightNostril.position.set(0.012, faceY - 0.028, faceZ + 0.042);
        faceGroup.add(rightNostril);

        // ========== MOUTH - Visible, slightly open, tired ==========

        // Mouth opening (dark inside) - LARGER
        const mouthOpening = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.03, 0.025),  // Bigger
            mouthDarkMat
        );
        mouthOpening.position.set(0, faceY - 0.08, faceZ + 0.02);
        mouthOpening.rotation.z = 0.02; // Slightly crooked (tired)
        faceGroup.add(mouthOpening);

        // Upper lip - visible
        const upperLip = new THREE.Mesh(
            new THREE.BoxGeometry(0.085, 0.015, 0.022),  // Bigger
            mouthMat
        );
        upperLip.position.set(0, faceY - 0.065, faceZ + 0.025);
        faceGroup.add(upperLip);

        // Lower lip - slightly open/droopy
        const lowerLip = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.018, 0.02),  // Bigger
            mouthMat
        );
        lowerLip.position.set(0, faceY - 0.095, faceZ + 0.022);
        faceGroup.add(lowerLip);

        // Small drool hint - cute tired detail
        const drool = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 6, 4),  // Slightly bigger
            new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.7 })
        );
        drool.position.set(0.04, faceY - 0.098, faceZ + 0.025);
        faceGroup.add(drool);

        // ========== BLUSH - Subtle pink cheeks ==========

        const leftBlush = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            blushMat
        );
        leftBlush.position.set(-0.14, faceY - 0.02, faceZ - 0.04);
        leftBlush.scale.set(1, 0.6, 0.3);
        faceGroup.add(leftBlush);

        const rightBlush = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 6),
            blushMat
        );
        rightBlush.position.set(0.14, faceY - 0.02, faceZ - 0.04);
        rightBlush.scale.set(1, 0.6, 0.3);
        faceGroup.add(rightBlush);

        // Add face group to head
        this.headGroup.add(faceGroup);
        this.faceGroup = faceGroup;
    }

    /**
     * Create messy short bed hair - ONLY on top of head
     * Small spiky chunks sticking up at random angles
     * NO side coverage, NO face coverage - just messy top spikes
     */
    createHair(headScale) {
        const hairGroup = new THREE.Group();
        hairGroup.name = "MessyBedHair";

        const hairMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.hair });
        const hairHighlightMat = new THREE.MeshLambertMaterial({ color: PALETTE.hairHighlight });

        // ========== SPIKY TOP HAIR - Small chunks sticking up ==========
        // All positioned on TOP of head only, pointing upward/outward at random angles

        const spikyHair = [
            // Center top - sticking straight up
            { pos: [0, 0.28, 0], rot: [0, 0, 0], radius: 0.025, height: 0.08 },
            { pos: [0.02, 0.27, 0.02], rot: [0.3, 0, 0.2], radius: 0.022, height: 0.07 },
            { pos: [-0.02, 0.27, 0.01], rot: [0.2, 0, -0.25], radius: 0.023, height: 0.065 },

            // Front-center - leaning forward slightly
            { pos: [0, 0.25, 0.08], rot: [0.5, 0, 0], radius: 0.02, height: 0.055 },
            { pos: [0.03, 0.24, 0.07], rot: [0.45, 0, 0.15], radius: 0.018, height: 0.05 },
            { pos: [-0.03, 0.24, 0.07], rot: [0.4, 0, -0.2], radius: 0.019, height: 0.052 },

            // Left side top - tilting left
            { pos: [-0.06, 0.26, 0], rot: [0.1, 0, -0.5], radius: 0.024, height: 0.07 },
            { pos: [-0.08, 0.24, 0.02], rot: [0.2, 0, -0.6], radius: 0.02, height: 0.06 },
            { pos: [-0.05, 0.25, -0.03], rot: [-0.2, 0, -0.4], radius: 0.021, height: 0.055 },
            { pos: [-0.09, 0.23, -0.02], rot: [-0.1, 0.2, -0.7], radius: 0.018, height: 0.05 },

            // Right side top - tilting right
            { pos: [0.06, 0.26, 0.01], rot: [0.15, 0, 0.5], radius: 0.023, height: 0.068 },
            { pos: [0.08, 0.24, 0.03], rot: [0.25, 0, 0.55], radius: 0.019, height: 0.058 },
            { pos: [0.05, 0.25, -0.02], rot: [-0.15, 0, 0.45], radius: 0.02, height: 0.052 },
            { pos: [0.09, 0.23, -0.01], rot: [0, -0.15, 0.65], radius: 0.017, height: 0.048 },

            // Back top - tilting backward
            { pos: [0, 0.24, -0.06], rot: [-0.6, 0, 0], radius: 0.025, height: 0.065 },
            { pos: [-0.04, 0.23, -0.07], rot: [-0.5, 0, -0.2], radius: 0.02, height: 0.055 },
            { pos: [0.04, 0.23, -0.07], rot: [-0.55, 0, 0.15], radius: 0.021, height: 0.058 },
            { pos: [-0.07, 0.22, -0.05], rot: [-0.4, 0.1, -0.35], radius: 0.018, height: 0.05 },
            { pos: [0.07, 0.22, -0.05], rot: [-0.35, -0.1, 0.4], radius: 0.019, height: 0.052 },

            // Extra random spikes for messy look
            { pos: [0.01, 0.29, -0.01], rot: [-0.1, 0.2, 0.1], radius: 0.02, height: 0.06 },
            { pos: [-0.04, 0.27, 0.04], rot: [0.35, 0.1, -0.3], radius: 0.018, height: 0.055 },
            { pos: [0.05, 0.26, 0.05], rot: [0.4, -0.1, 0.25], radius: 0.019, height: 0.05 },
        ];

        spikyHair.forEach((spike, i) => {
            const mat = i % 3 === 0 ? hairHighlightMat : hairMaterial;
            const hair = new THREE.Mesh(
                new THREE.ConeGeometry(spike.radius, spike.height, 5),
                mat
            );
            hair.position.set(...spike.pos);
            hair.rotation.set(...spike.rot);
            hairGroup.add(hair);
        });

        // ========== HAIR BASE - Small flat layer on top of head ==========
        // Just enough to cover the scalp, not a helmet
        const hairBase = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
            hairMaterial
        );
        hairBase.position.set(0, 0.15, -0.02);
        hairBase.scale.set(1.0, 0.4, 0.9);
        hairGroup.add(hairBase);

        // Add hair group to head
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
