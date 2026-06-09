/**
 * Obstacle - Base class and factory for obstacles
 */

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../core/Constants.js';

// Base Obstacle class
export class Obstacle {
    constructor(type, position) {
        this.id = `obstacle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.mesh = null;
        this.size = { width: 1, height: 0.5, depth: 1 };
        this.active = true;
        this.effects = {};

        this.createMesh(position);
    }

    createMesh(position) {
        // Override in subclasses
    }

    getEffects() {
        return this.effects;
    }
}

// Pillow - Makes sleepy
export class Pillow extends Obstacle {
    constructor(position) {
        super('pillow', position);
        this.effects = {
            sleepiness: GAME_CONSTANTS.PILLOW_SLEEPINESS,
            message: '푹신한 베개의 유혹...'
        };
    }

    createMesh(position) {
        this.size = { width: 0.8, height: 0.3, depth: 0.6 };

        const group = new THREE.Group();

        // Pillow body
        const pillowGeometry = new THREE.BoxGeometry(0.8, 0.25, 0.6);
        const pillowMaterial = new THREE.MeshLambertMaterial({ color: 0xffeaa7 });
        const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow.position.y = 0.125;
        group.add(pillow);

        // Pillow puff (rounded top)
        const puffGeometry = new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const puff = new THREE.Mesh(puffGeometry, pillowMaterial);
        puff.position.y = 0.15;
        puff.scale.set(1.1, 0.5, 0.8);
        group.add(puff);

        group.position.copy(position);
        group.castShadow = true;

        this.mesh = group;
    }
}

// Threshold / Door bump - Causes stumble
export class Threshold extends Obstacle {
    constructor(position) {
        super('threshold', position);
        this.effects = {
            balance: GAME_CONSTANTS.THRESHOLD_BALANCE * (Math.random() > 0.5 ? 1 : -1),
            message: '문턱에 걸렸습니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 3, height: 0.15, depth: 0.3 };

        const geometry = new THREE.BoxGeometry(3, 0.1, 0.3);
        const material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.05;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
}

// Charging cable - Trip hazard
export class ChargingCable extends Obstacle {
    constructor(position) {
        super('cable', position);
        this.effects = {
            balance: GAME_CONSTANTS.CABLE_BALANCE * (Math.random() > 0.5 ? 1 : -1),
            timeLoss: GAME_CONSTANTS.CABLE_TIME_LOSS,
            message: '충전기 선에 걸렸습니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 1.5, height: 0.1, depth: 0.8 };

        const group = new THREE.Group();

        // Cable curves
        const cableMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });

        // Create wavy cable using multiple small cylinders
        for (let i = 0; i < 8; i++) {
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8),
                cableMaterial
            );
            segment.position.x = (i - 3.5) * 0.18;
            segment.position.y = 0.02;
            segment.position.z = Math.sin(i * 0.8) * 0.15;
            segment.rotation.z = Math.PI / 2 + Math.sin(i * 0.5) * 0.3;
            group.add(segment);
        }

        // Charger block
        const chargerGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.1);
        const chargerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const charger = new THREE.Mesh(chargerGeometry, chargerMaterial);
        charger.position.set(0.8, 0.04, 0);
        group.add(charger);

        group.position.copy(position);
        group.castShadow = true;

        this.mesh = group;
    }
}

// Bench - Must walk around
export class Bench extends Obstacle {
    constructor(position, side = 'left') {
        super('bench', position);
        this.side = side;
        this.effects = {
            balance: GAME_CONSTANTS.BENCH_BALANCE * (side === 'left' ? 1 : -1),
            message: '벤치에 부딪혔습니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 1.5, height: 0.8, depth: 0.5 };

        const group = new THREE.Group();

        // Seat
        const seatGeometry = new THREE.BoxGeometry(1.5, 0.08, 0.4);
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const seat = new THREE.Mesh(seatGeometry, woodMaterial);
        seat.position.y = 0.45;
        group.add(seat);

        // Backrest
        const backGeometry = new THREE.BoxGeometry(1.5, 0.4, 0.06);
        const back = new THREE.Mesh(backGeometry, woodMaterial);
        back.position.set(0, 0.7, -0.17);
        group.add(back);

        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.45);
        const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x636e72 });

        const legPositions = [
            [-0.6, 0.225, 0.15], [0.6, 0.225, 0.15],
            [-0.6, 0.225, -0.15], [0.6, 0.225, -0.15]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, metalMaterial);
            leg.position.set(...pos);
            group.add(leg);
        });

        group.position.copy(position);
        group.castShadow = true;

        this.mesh = group;
    }
}

// Puddle - Slippery
export class Puddle extends Obstacle {
    constructor(position) {
        super('puddle', position);
        this.effects = {
            balance: GAME_CONSTANTS.PUDDLE_BALANCE * (Math.random() > 0.5 ? 1 : -1),
            message: '물웅덩이에 미끄러졌습니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 1.2, height: 0.02, depth: 0.8 };

        const group = new THREE.Group();

        // Puddle shape (ellipse)
        const puddleGeometry = new THREE.CircleGeometry(0.6, 16);
        const puddleMaterial = new THREE.MeshLambertMaterial({
            color: 0x74b9ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.y = 0.01;
        puddle.scale.set(1, 0.7, 1);
        group.add(puddle);

        // Reflection highlight
        const highlightGeometry = new THREE.CircleGeometry(0.2, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.rotation.x = -Math.PI / 2;
        highlight.position.set(-0.2, 0.015, -0.1);
        group.add(highlight);

        group.position.copy(position);

        this.mesh = group;
    }
}

// Factory function to create obstacles
export function createObstacle(type, position, options = {}) {
    switch (type) {
        case 'pillow':
            return new Pillow(position);
        case 'threshold':
            return new Threshold(position);
        case 'cable':
            return new ChargingCable(position);
        case 'bench':
            return new Bench(position, options.side);
        case 'puddle':
            return new Puddle(position);
        default:
            console.warn(`Unknown obstacle type: ${type}`);
            return null;
    }
}
