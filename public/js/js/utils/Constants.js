// Game Constants and Configuration
export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TARGET_FPS: 60,
    FIXED_TIME_STEP: 1/60
};

export const PLAYER_CONFIG = {
    RADIUS: 15,
    SPEED: 3,
    BASE_HEALTH: 100,
    INVULNERABILITY_TIME: 3000,
    DAMAGE_COOLDOWN: 500
};

export const WEAPON_CONFIG = {
    BASIC: {
        // Base stats - never modified directly
        BASE_DAMAGE: 20,
        BASE_RANGE: 200,
        BASE_COOLDOWN: 0.5,
        BASE_RADIUS: 3,
        // Legacy values for compatibility
        DAMAGE: 20,
        RANGE: 200,
        COOLDOWN: 0.5,
        PROJECTILE_SPEED: 8,
        RADIUS: 3
    }
};

export const ENEMY_CONFIG = {
    BASIC: {
        HEALTH: 30,
        SPEED: 1,
        RADIUS: 10,
        DAMAGE: 30,
        SCORE_REWARD: 10,
        XP_DROP: 5
    },
    VETERAN: {
        HEALTH: 120,
        SPEED: 1.2,
        RADIUS: 12,
        ARMOR: 5,
        DAMAGE: 35,
        SCORE_REWARD: 25,
        XP_DROP: 15,
        MIN_LEVEL: 10,
        SPAWN_CHANCE_PER_LEVEL: 0.08,
        MAX_SPAWN_CHANCE: 0.8
    },
    ELITE: {
        HEALTH: 250,
        SPEED: 1.5,
        RADIUS: 14,
        ARMOR: 5,
        DAMAGE: 40,
        SCORE_REWARD: 50,
        XP_DROP: 25,
        MIN_LEVEL: 20,
        SPAWN_CHANCE_PER_LEVEL: 0.02,
        MAX_SPAWN_CHANCE: 0.5
    },
    BOSS: {
        BASIC: { HEALTH: 200, XP_DROP: 5, SCORE_REWARD: 100, DAMAGE: 50 },
        VETERAN: { HEALTH: 300, XP_DROP: 8, SCORE_REWARD: 250, DAMAGE: 50 },
        ELITE: { HEALTH: 400, XP_DROP: 12, SCORE_REWARD: 500, DAMAGE: 50, ARMOR: 10 }
    }
};

export const ELEMENT_CONFIG = {
    FIRE: {
        FIREBALL: {
            BASE_COOLDOWN: 2.0,
            BASE_DAMAGE_MULTIPLIER: 1.5,
            BASE_RADIUS: 25,
            BASE_SPEED: 5,
            // Legacy values
            COOLDOWN: 2.0,
            DAMAGE_MULTIPLIER: 1.5,
            RADIUS: 25,
            SPEED: 5
        },
        INFERNO_WAVE: {
            BASE_RADIUS: 200,
            BASE_DAMAGE_MULTIPLIER: 0.6,
            // Legacy values
            RADIUS: 200,
            DAMAGE_MULTIPLIER: 0.6
        }
    },
    WATER: {
        GLOBE: {
            BASE_RADIUS: 5,
            BASE_ORBIT_RADIUS: 45,
            BASE_DAMAGE: 15,
            BASE_ROTATION_SPEED: 0.02,
            // Legacy values
            RADIUS: 5,
            ORBIT_RADIUS: 45,
            DAMAGE: 15,
            ROTATION_SPEED: 0.02
        },
        HEALTH_BONUS_PER_LEVEL: 0.1,
        HEALTH_REGEN_PER_LEVEL: 1.0
    },
    EARTH: {
        ARMOR_PER_LEVEL: [0, 5, 5, 5, 3, 3, 3], // levels 0-6
        TREMOR: {
            BASE_DAMAGE: 18,
            BASE_PULSE_INTERVAL: 0.5,
            BASE_RANGE: 80,
            BASE_RANGE_PER_LEVEL: 20,
            BASE_DAMAGE_PER_LEVEL: 2,
            // Legacy values
            PULSE_INTERVAL: 0.5,
            RANGE_PER_LEVEL: 20,
            DAMAGE_PER_LEVEL: 2
        },
        EARTHQUAKE: {
            RADIUS: 150,
            DAMAGE: 100,
            COOLDOWN: 8,
            STUN_DURATION: 1.5
        }
    },
    AIR: {
        RANGE_BONUS_PER_LEVEL: 0.1,
        WIND_BLADE: {
            DAMAGE_MULTIPLIER: 0.8,
            SPEED: 7,
            SEEK_RADIUS: 120,
            SEEK_STRENGTH: 2.5,
            CURVE_INTENSITY: 6.0,
            COUNT: [0, 1, 2, 3, 4, 5] // blades per level (0 for no level, then levels 1-5)
        },
        TORNADO: {
            COOLDOWN: 2.5,
            DAMAGE: 45,
            DAMAGE_INTERVAL: 0.3,
            DURATION: 12,
            RADIUS: 35,
            MOVEMENT_SPEED: 1
        }
    },
    LIGHTNING: {
        CHAIN: {
            BASE_DAMAGE: 30,
            BASE_CHAINS: 3,
            DAMAGE_REDUCTION: 0.8,
            CHAIN_DELAY: 0.1,
            INITIAL_RANGE: 150,
            CHAIN_RANGE: 200,
            COOLDOWN: 2.0
        },
        THUNDER_STORM: {
            DURATION: 8,
            DAMAGE: 25,
            RADIUS: 100
        }
    }
};

export const XP_CONFIG = {
    BASE_REQUIREMENT: 10,
    LEVEL_EXPONENT: 1.2
};

export const WAVE_CONFIG = {
    BASE_SPAWN_INTERVAL: 2.0,
    LEVEL_SCALING: 0.25,
    TIME_SCALING: 0.1,
    MINIMUM_INTERVAL: 0.1
};

export const SHOP_CONFIG = {
    XP_VORTEX: {
        MAX_LEVEL: 5,
        PRICES: [10, 15, 25, 40, 60],
        RANGE_MULTIPLIER_PER_LEVEL: 0.5,
        BASE_RANGE_OFFSET: 20
    },
    MASTERY_RING: {
        COST: 50
    }
};

export const DIAMOND_CONFIG = {
    SURVIVAL_BONUS: 1/30, // per second
    SCORE_BONUS: 1/1000, // per point
    BOSS_BONUS: 2 // per boss
};