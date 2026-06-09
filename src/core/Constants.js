// Game Constants - Simplified for easier gameplay

export const GAME_CONSTANTS = {
    // Timing (2 min max, ~60 sec average)
    ROUND_DURATION: 120,          // 2 minutes max
    RECOVERY_TIME_LIMIT: 5,       // generous recovery time

    // Movement (sleepy, player-driven walk)
    BASE_SPEED: 3.0,              // clear forward speed for short demos
    HEAVY_ACCELERATION: 2.8,      // sleepy body takes a moment to get going
    HEAVY_DECELERATION: 3.6,      // but can still stop quickly enough
    MIN_SPEED_MULTIPLIER: 0.7,    // minimum speed when very sleepy
    WOBBLE_VISUAL_SPEED: 2,       // visual wobble animation speed
    STEP_ALTERNATION_WINDOW: 0.85,
    STEP_HOLD_SPEED: 0.45,
    STEP_ALTERNATE_SPEED: 1.0,
    STEP_BOOST_DECAY: 1.4,

    // Balance (forgiving, but visibly physics-like)
    BALANCE_MAX: 100,
    BALANCE_DRIFT_RATE: 8,
    BALANCE_NUDGE_AMOUNT: 48,
    BALANCE_DECAY_RATE: 5,
    BALANCE_IDLE_FALL_RATE: 72,
    BALANCE_IDLE_GRACE: 0.12,
    BALANCE_WALK_RECOVERY: 34,
    BALANCE_MOMENTUM_DAMPING: 0.88,
    BODY_INPUT_GRACE: 0.18,
    BODY_ACTIVE_JOINT_STRENGTH: 1.0,
    BODY_INACTIVE_JOINT_STRENGTH: 0.04,
    BODY_ACTIVATION_SPEED: 9.5,
    BODY_DEACTIVATION_SPEED: 7.5,
    BODY_STANDUP_FORCE: 72,
    BODY_BALANCE_RECOVERY: 58,
    BODY_ACTIVE_DAMPING: 0.62,
    BODY_INACTIVE_DAMPING: 0.96,
    BODY_COLLAPSE_SPEED: 4.8,
    BODY_COLLAPSE_RECOVERY: 7.5,
    BALANCE_DANGER: 62,
    BALANCE_FALL: 86,
    STUMBLE_THRESHOLD: 72,

    // Sleepiness (gentle)
    SLEEPINESS_START: 10,
    SLEEPINESS_RATE: 0.3,         // slow increase (was 0.8)
    SLEEPINESS_MAX: 100,
    SLEEPINESS_WARNING: 70,       // yawn threshold
    SLEEPINESS_DANGER: 90,        // visual warning
    SLEEPINESS_DOZE: 100,         // doze threshold

    // Recovery (simple - 1 click)
    RECOVERY_CLICKS: 1,           // just 1 click needed!
    STUMBLE_PAUSE: 500,           // ms pause on stumble

    // Obstacles (gentle effects)
    PILLOW_SLEEPINESS: 10,        // was 15
    THRESHOLD_WOBBLE: 5,          // tiny wobble
    THRESHOLD_BALANCE: 18,
    CABLE_TIME_LOSS: 1,           // was 2
    CABLE_WOBBLE: 3,
    CABLE_BALANCE: 14,
    BENCH_BALANCE: 12,
    PUDDLE_WOBBLE: 8,
    PUDDLE_BALANCE: 24,

    // Items (helpful)
    COFFEE_SLEEPINESS: -30,       // big help
    COFFEE_SPEED_BOOST: 1.1,      // 10% faster
    COFFEE_BOOST_DURATION: 5,     // seconds
    WATER_STABLE_DURATION: 5,     // seconds of stability

    // Stage (shorter)
    STAGE_LENGTH: 150,            // was 250

    // Zone boundaries
    ZONE_1_END: 50,
    ZONE_2_END: 100,
    ZONE_3_END: 150,

    // Camera - Orbit Camera Settings
    CAMERA_DISTANCE: 8,
    CAMERA_HEIGHT: 5,
    CAMERA_LERP: 0.08,
    CAMERA_LOOK_HEIGHT: 1.5,

    // Camera Orbit Controls
    CAMERA_MIN_DISTANCE: 3,
    CAMERA_MAX_DISTANCE: 12,
    CAMERA_ZOOM_SPEED: 0.8,
    CAMERA_ZOOM_LERP: 0.1,
    CAMERA_ROTATION_SPEED: 0.003,
    CAMERA_ROTATION_LERP: 0.08,
    CAMERA_MIN_PITCH: -0.2,         // Minimum pitch angle (looking down)
    CAMERA_MAX_PITCH: 0.7,          // Maximum pitch angle (looking up)
    CAMERA_DEFAULT_PITCH: 0.4,      // Default pitch angle
    CAMERA_DEFAULT_YAW: 0,    // Default yaw angle (camera at +Z, looking toward player - sees back)

    // Character Rotation
    CHARACTER_ROTATION_SPEED: 8.0,  // How fast character turns to face movement direction
    CHARACTER_ROTATION_LAG: 0.15,   // Delay in character rotation for floppy feel

    // Player
    PLAYER_HEIGHT: 1.8,
    PLAYER_WIDTH: 0.6,
    PLAYER_WOBBLE_STRENGTH: 0.62,
    PLAYER_FOLLOW_THROUGH: 0.08,
    PLAYER_HEAD_DROOP: 0.48,
    PLAYER_SLEEPY_NOD_CHANCE: 0.55,
    PLAYER_IDLE_SLUMP_SPEED: 5.5,
    PLAYER_SKELETON_VISIBLE: false,
    PLAYER_SKELETON_JOINT_SIZE: 0.065,
    PLAYER_SKELETON_BONE_RADIUS: 0.025,
    PLAYER_SKELETON_FLOPPINESS: 1.25,

    // Character Spring Physics
    CHARACTER_SPRING_STIFFNESS_BASE: 0.15,
    CHARACTER_SPRING_DAMPING_BASE: 0.7,
    CHARACTER_LAG_MULTIPLIER: 1.0,

    // Floppy Animation
    HAND_LOOSENESS: 0.8,        // 0-1, how floppy hands are
    ARM_LOOSENESS: 0.6,         // 0-1, how floppy arms are
    WOBBLE_STRENGTH: 0.5,       // Overall body wobble
    COLLAPSE_SPEED: 3.0,        // How fast body collapses
    RECOVERY_SPEED: 2.0,        // How fast body recovers
    STEP_RESPONSIVENESS: 0.7,   // How responsive steps are

    // Visual Character Proportions
    HEAD_SIZE_MULTIPLIER: 1.2,  // Oversized head
    SLIPPER_SIZE: 1.1,          // Slightly big slippers

    // Colors
    COLORS: {
        SKY_TOP: 0x1a1a2e,
        SKY_BOTTOM: 0x4a4e69,
        GROUND: 0x2d3436,
        AMBIENT_LIGHT: 0x404080,
        DIRECTIONAL_LIGHT: 0xffeaa7,
        PLAYER_BODY: 0x74b9ff,
        PLAYER_HEAD: 0xffeaa7,
    }
};

// Game States
export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    DOZING: 'dozing',      // simplified from RECOVERY
    STUMBLE: 'stumble',    // brief pause
    WIN: 'win',
    LOSE: 'lose'
};

// Player States
export const PLAYER_STATES = {
    WALKING: 'walking',
    YAWNING: 'yawning',
    STUMBLING: 'stumbling',
    DOZING: 'dozing',
    CELEBRATING: 'celebrating'
};
