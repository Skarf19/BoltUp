/**
 * CollisionSystem - Handles collision detection between player and obstacles/items
 */

import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.obstacles = [];
        this.items = [];

        // Player collision box size
        this.playerSize = { width: 0.6, height: 1.8, depth: 0.4 };

        // Collision cooldown to prevent multiple triggers
        this.collisionCooldowns = new Map();
        this.cooldownTime = 500; // ms
    }

    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    clearAll() {
        this.obstacles = [];
        this.items = [];
        this.collisionCooldowns.clear();
    }

    checkCollisions(playerPosition, callbacks) {
        const now = performance.now();
        const collisions = {
            obstacles: [],
            items: []
        };

        // Create player bounding box
        const playerBox = new THREE.Box3(
            new THREE.Vector3(
                playerPosition.x - this.playerSize.width / 2,
                playerPosition.y,
                playerPosition.z - this.playerSize.depth / 2
            ),
            new THREE.Vector3(
                playerPosition.x + this.playerSize.width / 2,
                playerPosition.y + this.playerSize.height,
                playerPosition.z + this.playerSize.depth / 2
            )
        );

        // Check obstacles
        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;

            const obstacleBox = this.getObstacleBox(obstacle);

            if (playerBox.intersectsBox(obstacleBox)) {
                // Check cooldown
                const lastCollision = this.collisionCooldowns.get(obstacle.id);
                if (!lastCollision || now - lastCollision > this.cooldownTime) {
                    this.collisionCooldowns.set(obstacle.id, now);
                    collisions.obstacles.push(obstacle);

                    if (callbacks.onObstacleHit) {
                        callbacks.onObstacleHit(obstacle);
                    }
                }
            }
        }

        // Check items
        for (const item of this.items) {
            if (!item.active) continue;

            const itemBox = this.getItemBox(item);

            if (playerBox.intersectsBox(itemBox)) {
                collisions.items.push(item);
                item.active = false; // Mark as collected

                if (callbacks.onItemCollect) {
                    callbacks.onItemCollect(item);
                }
            }
        }

        return collisions;
    }

    getObstacleBox(obstacle) {
        const pos = obstacle.mesh.position;
        const size = obstacle.size || { width: 1, height: 0.5, depth: 1 };

        return new THREE.Box3(
            new THREE.Vector3(
                pos.x - size.width / 2,
                pos.y,
                pos.z - size.depth / 2
            ),
            new THREE.Vector3(
                pos.x + size.width / 2,
                pos.y + size.height,
                pos.z + size.depth / 2
            )
        );
    }

    getItemBox(item) {
        const pos = item.mesh.position;
        const size = item.size || { width: 0.5, height: 0.5, depth: 0.5 };

        return new THREE.Box3(
            new THREE.Vector3(
                pos.x - size.width / 2,
                pos.y,
                pos.z - size.depth / 2
            ),
            new THREE.Vector3(
                pos.x + size.width / 2,
                pos.y + size.height,
                pos.z + size.depth / 2
            )
        );
    }

    // Debug: visualize collision boxes
    createDebugBoxes(scene) {
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

        for (const obstacle of this.obstacles) {
            const box = this.getObstacleBox(obstacle);
            const helper = new THREE.Box3Helper(box, 0xff0000);
            scene.add(helper);
        }

        const itemMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        for (const item of this.items) {
            const box = this.getItemBox(item);
            const helper = new THREE.Box3Helper(box, 0x00ff00);
            scene.add(helper);
        }
    }

    reset() {
        this.collisionCooldowns.clear();
        // Reactivate all items
        for (const item of this.items) {
            item.active = true;
        }
    }
}
