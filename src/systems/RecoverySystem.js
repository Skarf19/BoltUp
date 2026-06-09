/**
 * RecoverySystem - Simple "벌떡!" recovery
 * Just press Space or click ONCE to recover
 */

import { GAME_CONSTANTS } from '../core/Constants.js';
import { audioManager } from '../audio/AudioManager.js';

export class RecoverySystem {
    constructor() {
        this.isActive = false;
        this.recoveryType = null;  // 'doze' or 'stumble'
        this.onComplete = null;
    }

    // Start recovery (called when player dozes or stumbles)
    startRecovery(type, onComplete) {
        this.isActive = true;
        this.recoveryType = type;
        this.onComplete = onComplete;

        console.log(`Recovery needed: ${type} - press Space or click!`);
    }

    // Player pressed recovery button
    attemptRecovery() {
        if (!this.isActive) return false;

        // Instant success!
        audioManager.playRecoverySuccess();

        const result = {
            type: this.recoveryType,
            success: true
        };

        this.isActive = false;
        this.recoveryType = null;

        if (this.onComplete) {
            this.onComplete(result);
        }

        return true;
    }

    getStatus() {
        return {
            isActive: this.isActive,
            type: this.recoveryType
        };
    }

    reset() {
        this.isActive = false;
        this.recoveryType = null;
        this.onComplete = null;
    }
}
