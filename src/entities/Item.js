/**
 * Item - Base class and factory for collectible items
 */

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../core/Constants.js';

// Base Item class
export class Item {
    constructor(type, position) {
        this.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.mesh = null;
        this.size = { width: 0.5, height: 0.5, depth: 0.5 };
        this.active = true;
        this.effects = {};

        // Animation
        this.floatOffset = Math.random() * Math.PI * 2;
        this.rotationSpeed = 1;

        this.createMesh(position);
    }

    createMesh(position) {
        // Override in subclasses
    }

    update(time) {
        if (!this.mesh || !this.active) return;

        // Float animation
        this.mesh.position.y = this.baseY + Math.sin(time * 2 + this.floatOffset) * 0.1;

        // Rotation
        this.mesh.rotation.y += 0.02 * this.rotationSpeed;
    }

    getEffects() {
        return this.effects;
    }

    collect() {
        this.active = false;
        // Animate collection
        if (this.mesh) {
            // Scale down and fade (handled by game)
        }
    }
}

// Coffee - Reduces sleepiness
export class Coffee extends Item {
    constructor(position) {
        super('coffee', position);
        this.effects = {
            sleepiness: GAME_CONSTANTS.COFFEE_SLEEPINESS,
            caffeineBoost: 10, // 10 seconds of reduced sleepiness gain
            message: '☕ 커피를 마셨습니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 0.4, height: 0.5, depth: 0.4 };

        const group = new THREE.Group();

        // Cup body
        const cupGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.25, 16);
        const cupMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.position.y = 0.125;
        group.add(cup);

        // Coffee inside
        const coffeeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
        const coffeeMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const coffee = new THREE.Mesh(coffeeGeometry, coffeeMaterial);
        coffee.position.y = 0.22;
        group.add(coffee);

        // Handle
        const handleGeometry = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
        const handle = new THREE.Mesh(handleGeometry, cupMaterial);
        handle.position.set(0.15, 0.15, 0);
        handle.rotation.z = -Math.PI / 2;
        group.add(handle);

        // Steam particles (simple)
        const steamMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        for (let i = 0; i < 3; i++) {
            const steam = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                steamMaterial
            );
            steam.position.set(
                (Math.random() - 0.5) * 0.1,
                0.3 + i * 0.05,
                (Math.random() - 0.5) * 0.1
            );
            group.add(steam);
        }

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.15;
        group.add(glow);

        group.position.copy(position);
        this.baseY = position.y + 0.3;
        group.position.y = this.baseY;

        this.mesh = group;
    }
}

// Cold Water - Stabilizes balance
export class ColdWater extends Item {
    constructor(position) {
        super('water', position);
        this.effects = {
            stabilize: GAME_CONSTANTS.WATER_STABLE_DURATION,
            message: '💧 차가운 물로 정신이 맑아집니다!'
        };
    }

    createMesh(position) {
        this.size = { width: 0.3, height: 0.5, depth: 0.3 };

        const group = new THREE.Group();

        // Bottle body
        const bottleGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 16);
        const bottleMaterial = new THREE.MeshLambertMaterial({
            color: 0x74b9ff,
            transparent: true,
            opacity: 0.7
        });
        const bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
        bottle.position.y = 0.15;
        group.add(bottle);

        // Bottle neck
        const neckGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.08, 16);
        const neck = new THREE.Mesh(neckGeometry, bottleMaterial);
        neck.position.y = 0.34;
        group.add(neck);

        // Cap
        const capGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0x0984e3 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.395;
        group.add(cap);

        // Water level inside
        const waterGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 16);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x81ecec,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = 0.12;
        group.add(water);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x74b9ff,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.2;
        group.add(glow);

        group.position.copy(position);
        this.baseY = position.y + 0.3;
        group.position.y = this.baseY;

        this.mesh = group;
    }
}

// Alarm Clock - Big wake up
export class AlarmClock extends Item {
    constructor(position) {
        super('alarm', position);
        this.effects = {
            sleepiness: GAME_CONSTANTS.ALARM_SLEEPINESS,
            balanceReset: GAME_CONSTANTS.ALARM_BALANCE_RESET,
            message: '⏰ 알람이 울립니다! 정신이 번쩍!'
        };
        this.rotationSpeed = 2; // Faster rotation
    }

    createMesh(position) {
        this.size = { width: 0.4, height: 0.4, depth: 0.3 };

        const group = new THREE.Group();

        // Clock body
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 32);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xe17055 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.15;
        group.add(body);

        // Clock face
        const faceGeometry = new THREE.CircleGeometry(0.13, 32);
        const faceMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.set(0, 0.15, 0.051);
        group.add(face);

        // Clock hands
        const handMaterial = new THREE.MeshBasicMaterial({ color: 0x2d3436 });

        // Hour hand
        const hourGeometry = new THREE.BoxGeometry(0.015, 0.06, 0.01);
        const hourHand = new THREE.Mesh(hourGeometry, handMaterial);
        hourHand.position.set(0, 0.18, 0.055);
        group.add(hourHand);

        // Minute hand
        const minuteGeometry = new THREE.BoxGeometry(0.01, 0.09, 0.01);
        const minuteHand = new THREE.Mesh(minuteGeometry, handMaterial);
        minuteHand.position.set(0.03, 0.15, 0.055);
        minuteHand.rotation.z = -Math.PI / 3;
        group.add(minuteHand);

        // Bells
        const bellGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const bellMaterial = new THREE.MeshLambertMaterial({ color: 0xffeaa7 });

        const leftBell = new THREE.Mesh(bellGeometry, bellMaterial);
        leftBell.position.set(-0.1, 0.28, 0);
        group.add(leftBell);

        const rightBell = new THREE.Mesh(bellGeometry, bellMaterial);
        rightBell.position.set(0.1, 0.28, 0);
        group.add(rightBell);

        // Hammer
        const hammerGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8);
        const hammer = new THREE.Mesh(hammerGeometry, bodyMaterial);
        hammer.position.set(0, 0.3, 0);
        hammer.rotation.z = Math.PI / 6;
        group.add(hammer);

        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x636e72 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.08, 0.04, 0);
        leftLeg.rotation.z = 0.2;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.08, 0.04, 0);
        rightLeg.rotation.z = -0.2;
        group.add(rightLeg);

        // Glow effect (stronger for alarm)
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xe17055,
            transparent: true,
            opacity: 0.25
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.15;
        group.add(glow);

        group.position.copy(position);
        this.baseY = position.y + 0.3;
        group.position.y = this.baseY;

        this.mesh = group;
    }
}

// Factory function to create items
export function createItem(type, position) {
    switch (type) {
        case 'coffee':
            return new Coffee(position);
        case 'water':
            return new ColdWater(position);
        case 'alarm':
            return new AlarmClock(position);
        default:
            console.warn(`Unknown item type: ${type}`);
            return null;
    }
}
