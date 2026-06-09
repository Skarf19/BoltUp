/**
 * Environment - Creates 3D environment objects for each zone
 */

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../core/Constants.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.lights = [];

        // Zone-specific lighting
        this.zoneLights = {
            zone1: null,
            zone2: null,
            zone3: null
        };

        // Goal glow animation
        this.goalGlow = null;
        this.goalLight = null;
    }

    build() {
        this.createSkyGradient();
        this.createZone1Environment(); // Dorm
        this.createZone2Environment(); // Campus Path
        this.createZone3Environment(); // Prayer Hall
        this.createGoal();
    }

    createSkyGradient() {
        // Create a large backdrop for dawn sky gradient
        const skyGeometry = new THREE.PlaneGeometry(500, 200);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x1a1a2e) },
                bottomColor: { value: new THREE.Color(0x4a4e69) },
                horizonColor: { value: new THREE.Color(0xffeaa7) },
                offset: { value: 0.4 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform vec3 horizonColor;
                uniform float offset;
                uniform float exponent;
                varying vec2 vUv;
                void main() {
                    float h = pow(max(vUv.y - offset, 0.0), exponent);
                    vec3 color = mix(horizonColor, topColor, h);
                    color = mix(bottomColor, color, vUv.y);
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        sky.position.set(0, 50, 300);
        sky.rotation.x = -0.1;
        this.scene.add(sky);
        this.objects.push(sky);
    }

    createZone1Environment() {
        // Dorm building (enhanced)
        const dormGroup = new THREE.Group();

        // Main building
        const buildingGeometry = new THREE.BoxGeometry(15, 12, 12);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(-12, 6, -8);
        building.castShadow = true;
        building.receiveShadow = true;
        dormGroup.add(building);

        // Windows with warm light
        const windowGeometry = new THREE.PlaneGeometry(1.2, 1.5);
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.9
        });

        const windowPositions = [
            [-4.49, 3, -6], [-4.49, 3, -10], [-4.49, 7, -6], [-4.49, 7, -10],
            [-4.49, 3, -2], [-4.49, 7, -2]
        ];

        windowPositions.forEach(pos => {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(pos[0], pos[1], pos[2]);
            window.rotation.y = Math.PI / 2;
            dormGroup.add(window);

            // Window glow
            const glowLight = new THREE.PointLight(0xffeaa7, 0.3, 8);
            glowLight.position.set(pos[0] - 1, pos[1], pos[2]);
            dormGroup.add(glowLight);
        });

        // Roof
        const roofGeometry = new THREE.BoxGeometry(16, 1, 13);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(-12, 12.5, -8);
        dormGroup.add(roof);

        // Door area light
        const doorLight = new THREE.PointLight(0xffeaa7, 0.5, 10);
        doorLight.position.set(-4, 3, 0);
        dormGroup.add(doorLight);

        this.scene.add(dormGroup);
        this.objects.push(dormGroup);

        // Indoor hallway walls (near start)
        this.createHallwayWalls();
    }

    createHallwayWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3, 40),
            wallMaterial
        );
        leftWall.position.set(-3, 1.5, 15);
        leftWall.castShadow = true;
        this.scene.add(leftWall);
        this.objects.push(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3, 40),
            wallMaterial
        );
        rightWall.position.set(3, 1.5, 15);
        rightWall.castShadow = true;
        this.scene.add(rightWall);
        this.objects.push(rightWall);

        // Ceiling lights in hallway
        for (let z = 5; z < 50; z += 15) {
            const ceilingLight = new THREE.PointLight(0xffffee, 0.3, 12);
            ceilingLight.position.set(0, 2.8, z);
            this.scene.add(ceilingLight);
            this.lights.push(ceilingLight);

            // Light fixture
            const fixtureGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.3);
            const fixtureMaterial = new THREE.MeshBasicMaterial({ color: 0xffffee });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(0, 2.95, z);
            this.scene.add(fixture);
            this.objects.push(fixture);
        }
    }

    createZone2Environment() {
        // Outdoor campus path

        // Trees along the path
        const treePositions = [
            [-8, 85], [9, 95], [-9, 115], [8, 135],
            [-8, 155], [9, 165], [-7, 175]
        ];

        treePositions.forEach(([x, z]) => {
            this.createTree(x, z);
        });

        // Campus buildings in background
        this.createBackgroundBuilding(-20, 120, 0.8);
        this.createBackgroundBuilding(22, 150, 0.6);
        this.createBackgroundBuilding(-18, 170, 0.7);

        // Stone path markers
        for (let z = 85; z < 180; z += 12) {
            this.createPathStone(z);
        }

        // More street lamps
        const lampPositions = [90, 120, 150];
        lampPositions.forEach((z, i) => {
            const side = i % 2 === 0 ? -4.5 : 4.5;
            this.createStreetLamp(side, z);
        });
    }

    createTree(x, z) {
        const treeGroup = new THREE.Group();

        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Foliage layers (cone shapes)
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1e5631 });

        const layer1 = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 2, 8),
            foliageMaterial
        );
        layer1.position.y = 3;
        layer1.castShadow = true;
        treeGroup.add(layer1);

        const layer2 = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 1.5, 8),
            foliageMaterial
        );
        layer2.position.y = 4.2;
        layer2.castShadow = true;
        treeGroup.add(layer2);

        const layer3 = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 1.2, 8),
            foliageMaterial
        );
        layer3.position.y = 5.2;
        layer3.castShadow = true;
        treeGroup.add(layer3);

        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
        this.objects.push(treeGroup);
    }

    createBackgroundBuilding(x, z, scale = 1) {
        const buildingGroup = new THREE.Group();

        const height = (8 + Math.random() * 6) * scale;
        const width = (6 + Math.random() * 4) * scale;
        const depth = (6 + Math.random() * 4) * scale;

        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({
            color: new THREE.Color().setHSL(0.6, 0.1, 0.3 + Math.random() * 0.1)
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2;
        building.castShadow = true;
        buildingGroup.add(building);

        // Random lit windows
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.7
        });

        for (let wy = 2; wy < height - 1; wy += 2) {
            for (let wx = -width/3; wx < width/3; wx += 1.5) {
                if (Math.random() > 0.4) {
                    const window = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.6, 0.8),
                        windowMaterial
                    );
                    window.position.set(wx, wy, depth/2 + 0.01);
                    buildingGroup.add(window);
                }
            }
        }

        buildingGroup.position.set(x, 0, z);
        this.scene.add(buildingGroup);
        this.objects.push(buildingGroup);
    }

    createPathStone(z) {
        const stoneGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.4);
        const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x636e72 });

        // Left stone
        const leftStone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        leftStone.position.set(-2.5, 0.025, z);
        leftStone.receiveShadow = true;
        this.scene.add(leftStone);
        this.objects.push(leftStone);

        // Right stone
        const rightStone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        rightStone.position.set(2.5, 0.025, z);
        rightStone.receiveShadow = true;
        this.scene.add(rightStone);
        this.objects.push(rightStone);
    }

    createStreetLamp(x, z) {
        const lampGroup = new THREE.Group();

        // Post
        const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 4.5);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 2.25;
        post.castShadow = true;
        lampGroup.add(post);

        // Arm
        const armGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.08);
        const arm = new THREE.Mesh(armGeometry, postMaterial);
        arm.position.set(x > 0 ? -0.5 : 0.5, 4.4, 0);
        lampGroup.add(arm);

        // Lamp head
        const headGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(x > 0 ? -1 : 1, 4.3, 0);
        lampGroup.add(head);

        // Light bulb
        const bulbGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.set(x > 0 ? -1 : 1, 4.1, 0);
        lampGroup.add(bulb);

        // Light
        const light = new THREE.PointLight(0xffeaa7, 0.6, 15);
        light.position.set(x > 0 ? -1 : 1, 4, 0);
        light.castShadow = true;
        lampGroup.add(light);
        this.lights.push(light);

        lampGroup.position.set(x, 0, z);
        this.scene.add(lampGroup);
        this.objects.push(lampGroup);
    }

    createZone3Environment() {
        // Final stretch - more trees, dramatic lighting toward goal

        // Trees lining the final path
        const treePositions = [
            [-7, 195], [8, 205], [-8, 220], [7, 235]
        ];
        treePositions.forEach(([x, z]) => {
            this.createTree(x, z);
        });

        // Final lamps
        this.createStreetLamp(-4.5, 200);
        this.createStreetLamp(4.5, 230);
    }

    createGoal() {
        const goalGroup = new THREE.Group();
        const goalZ = GAME_CONSTANTS.STAGE_LENGTH + 12;

        // Prayer hall building
        const hallGeometry = new THREE.BoxGeometry(16, 12, 12);
        const hallMaterial = new THREE.MeshLambertMaterial({ color: 0xdfe6e9 });
        const hall = new THREE.Mesh(hallGeometry, hallMaterial);
        hall.position.set(0, 6, goalZ);
        hall.castShadow = true;
        hall.receiveShadow = true;
        goalGroup.add(hall);

        // Roof (triangular)
        const roofGeometry = new THREE.ConeGeometry(12, 5, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x636e72 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 14.5, goalZ);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        goalGroup.add(roof);

        // Cross on top
        const crossMaterial = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });

        // Vertical part of cross
        const crossVert = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 4, 0.4),
            crossMaterial
        );
        crossVert.position.set(0, 19, goalZ);
        goalGroup.add(crossVert);

        // Horizontal part of cross
        const crossHoriz = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.4, 0.4),
            crossMaterial
        );
        crossHoriz.position.set(0, 20, goalZ);
        goalGroup.add(crossHoriz);

        // Entrance door
        const doorGeometry = new THREE.BoxGeometry(3, 5, 0.2);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 2.5, goalZ - 6.1);
        goalGroup.add(door);

        // Door arch
        const archGeometry = new THREE.TorusGeometry(1.5, 0.2, 8, 16, Math.PI);
        const archMaterial = new THREE.MeshLambertMaterial({ color: 0xb2bec3 });
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.position.set(0, 5, goalZ - 6);
        arch.rotation.x = Math.PI / 2;
        arch.rotation.z = Math.PI;
        goalGroup.add(arch);

        // Windows (stained glass effect)
        const windowColors = [0x74b9ff, 0xfd79a8, 0xffeaa7];
        const windowPositions = [[-4, 6], [4, 6], [-4, 3], [4, 3]];

        windowPositions.forEach((pos, i) => {
            const windowGeometry = new THREE.CircleGeometry(1, 16);
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: windowColors[i % windowColors.length],
                transparent: true,
                opacity: 0.8
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(pos[0], pos[1], goalZ - 6.01);
            goalGroup.add(window);
        });

        // Goal glow
        this.goalGlow = new THREE.PointLight(0xffeaa7, 1.5, 40);
        this.goalGlow.position.set(0, 8, goalZ - 5);
        goalGroup.add(this.goalGlow);

        // Ground glow effect
        const glowGeometry = new THREE.CircleGeometry(8, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const groundGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        groundGlow.rotation.x = -Math.PI / 2;
        groundGlow.position.set(0, 0.02, GAME_CONSTANTS.STAGE_LENGTH);
        goalGroup.add(groundGlow);

        // Goal line
        const lineGeometry = new THREE.PlaneGeometry(6, 0.5);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.8
        });
        const goalLine = new THREE.Mesh(lineGeometry, lineMaterial);
        goalLine.rotation.x = -Math.PI / 2;
        goalLine.position.set(0, 0.03, GAME_CONSTANTS.STAGE_LENGTH);
        goalGroup.add(goalLine);

        this.scene.add(goalGroup);
        this.objects.push(goalGroup);
    }

    update(time, playerZ) {
        // Animate goal glow
        if (this.goalGlow) {
            this.goalGlow.intensity = 1.2 + Math.sin(time * 2) * 0.3;
        }

        // Zone-based ambient adjustments could go here
    }

    destroy() {
        for (const obj of this.objects) {
            if (obj.parent) {
                this.scene.remove(obj);
            }
        }
        this.objects = [];
    }
}
