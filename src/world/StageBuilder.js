/**
 * StageBuilder - Places obstacles and items (simplified for easier gameplay)
 * Stage length: 150 units (about 50-60 seconds to complete)
 */

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../core/Constants.js';
import { createObstacle } from '../entities/Obstacle.js';
import { createItem } from '../entities/Item.js';

export class StageBuilder {
    constructor(scene, collisionSystem) {
        this.scene = scene;
        this.collisionSystem = collisionSystem;

        this.obstacles = [];
        this.items = [];
    }

    buildStage() {
        this.clearStage();

        // Zone 1: Dorm Hallway (0 - 50)
        this.buildZone1();

        // Zone 2: Outside Path (50 - 100)
        this.buildZone2();

        // Zone 3: Final Stretch (100 - 150)
        this.buildZone3();

        return {
            obstacles: this.obstacles,
            items: this.items
        };
    }

    buildZone1() {
        // Dorm hallway - easy start, few obstacles

        // One pillow (sleepy temptation)
        this.addObstacle('pillow', new THREE.Vector3(0.5, 0, 15));

        // One cable to step over
        this.addObstacle('cable', new THREE.Vector3(-0.3, 0, 35));

        // Coffee early for encouragement!
        this.addItem('coffee', new THREE.Vector3(0.8, 0, 25));
    }

    buildZone2() {
        // Outside path - moderate difficulty

        // Puddle (slippery)
        this.addObstacle('puddle', new THREE.Vector3(0.3, 0, 60));

        // Another pillow (why is this here??)
        this.addObstacle('pillow', new THREE.Vector3(-0.5, 0, 80));

        // Cable
        this.addObstacle('cable', new THREE.Vector3(0.4, 0, 90));

        // Water for balance help
        this.addItem('water', new THREE.Vector3(-0.8, 0, 70));

        // Coffee to stay awake
        this.addItem('coffee', new THREE.Vector3(1.0, 0, 95));
    }

    buildZone3() {
        // Final stretch - a few more obstacles but still manageable

        // Pillow near the end
        this.addObstacle('pillow', new THREE.Vector3(0.6, 0, 115));

        // One last puddle
        this.addObstacle('puddle', new THREE.Vector3(-0.4, 0, 130));

        // Final coffee for the last push!
        this.addItem('coffee', new THREE.Vector3(0, 0, 140));
    }

    addObstacle(type, position, options = {}) {
        const obstacle = createObstacle(type, position, options);
        if (obstacle) {
            this.obstacles.push(obstacle);
            this.scene.add(obstacle.mesh);
            this.collisionSystem.addObstacle(obstacle);
        }
        return obstacle;
    }

    addItem(type, position) {
        const item = createItem(type, position);
        if (item) {
            this.items.push(item);
            this.scene.add(item.mesh);
            this.collisionSystem.addItem(item);
        }
        return item;
    }

    updateItems(time) {
        for (const item of this.items) {
            if (item.active) {
                item.update(time);
            }
        }
    }

    removeCollectedItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active && item.mesh.parent) {
                this.animateItemCollection(item);
            }
        }
    }

    animateItemCollection(item) {
        const duration = 300;
        const startTime = performance.now();
        const startScale = item.mesh.scale.x;

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            const scale = startScale * (1 - progress);
            item.mesh.scale.set(scale, scale, scale);
            item.mesh.position.y += 0.05;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(item.mesh);
            }
        };

        animate();
    }

    clearStage() {
        for (const obstacle of this.obstacles) {
            if (obstacle.mesh.parent) {
                this.scene.remove(obstacle.mesh);
            }
        }
        for (const item of this.items) {
            if (item.mesh.parent) {
                this.scene.remove(item.mesh);
            }
        }

        this.obstacles = [];
        this.items = [];
        this.collisionSystem.clearAll();
    }

    reset() {
        this.buildStage();
    }
}
