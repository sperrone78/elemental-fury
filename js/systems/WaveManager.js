import { WAVE_CONFIG } from '../utils/Constants.js';

export class WaveManager {
    constructor() {
        this.enemySpawnRate = 1;
        this.lastSpawn = 0;
        this.lastBossSpawn = 0;
        this.baseSpawnInterval = WAVE_CONFIG.BASE_SPAWN_INTERVAL;
        this.currentSpawnInterval = WAVE_CONFIG.BASE_SPAWN_INTERVAL;
        this.baseBossSpawnInterval = 15; // Base time between random boss spawns
        this.levelStartTime = 0; // Track when current level started
        this.currentPlayerLevel = 1;
    }
    
    update(gameTime, game, playerLevel, deltaTime) {
        // Track level changes to reset level timer
        if (playerLevel !== this.currentPlayerLevel) {
            this.levelStartTime = gameTime;
            this.currentPlayerLevel = playerLevel;
        }
        
        // Calculate time spent in current level
        const timeInLevel = gameTime - this.levelStartTime;
        
        // MUCH more aggressive scaling after level 20
        let levelScaling;
        if (playerLevel >= 25) {
            // Level 25+: Extremely aggressive (60% faster per level)
            levelScaling = 1 + (playerLevel - 1) * 0.6;
        } else if (playerLevel >= 20) {
            // Level 20-24: Very aggressive (40% faster per level)
            levelScaling = 1 + (playerLevel - 1) * 0.4;
        } else {
            // Level 1-19: Original scaling (25% faster per level)
            levelScaling = 1 + (playerLevel - 1) * WAVE_CONFIG.LEVEL_SCALING;
        }
        
        // Global time scaling (10% faster every minute)
        const globalTimeScaling = 1 + (gameTime / 60) * WAVE_CONFIG.TIME_SCALING;
        
        // Within-level acceleration - gets faster the longer you stay at a level
        // This prevents "sitting in the middle" strategy
        let levelTimeScaling = 1;
        if (playerLevel >= 15) {
            // After level 15, spawn rate increases significantly within each level
            levelTimeScaling = 1 + (timeInLevel / 30) * 0.5; // 50% faster every 30 seconds in level
        }
        
        const combinedScaling = levelScaling * globalTimeScaling * levelTimeScaling;
        
        this.currentSpawnInterval = this.baseSpawnInterval / combinedScaling;
        
        // Much lower minimum for high levels
        let minInterval = WAVE_CONFIG.MINIMUM_INTERVAL;
        if (playerLevel >= 25) {
            minInterval = 0.05; // Insanely fast spawning at level 25+
        } else if (playerLevel >= 20) {
            minInterval = 0.07; // Very fast spawning at level 20+
        }
        
        this.currentSpawnInterval = Math.max(minInterval, this.currentSpawnInterval);
        
        // Regular enemy spawning
        if (gameTime - this.lastSpawn >= this.currentSpawnInterval) {
            game.spawnEnemy();
            this.lastSpawn = gameTime;
        }
        
        // Random boss spawning during rounds based on level
        this.handleRandomBossSpawning(gameTime, game, playerLevel);
    }
    
    handleRandomBossSpawning(gameTime, game, playerLevel) {
        let shouldSpawnBoss = false;
        let bossType = 'basic';
        let spawnInterval = this.baseBossSpawnInterval;
        
        if (playerLevel >= 30) {
            // Level 30+: All bosses can spawn - MUCH more frequent
            spawnInterval = 5; // Every 5 seconds (was 10)
            const roll = Math.random();
            if (roll < 0.3) bossType = 'basic';
            else if (roll < 0.6) bossType = 'veteran';
            else bossType = 'elite';
            shouldSpawnBoss = true;
        } else if (playerLevel >= 25) {
            // Level 25-29: Basic and Veteran + some Elite bosses
            spawnInterval = 6; // Every 6 seconds
            const roll = Math.random();
            if (roll < 0.4) bossType = 'basic';
            else if (roll < 0.8) bossType = 'veteran';
            else bossType = 'elite';
            shouldSpawnBoss = true;
        } else if (playerLevel >= 20) {
            // Level 20-24: Basic and Veteran bosses - more frequent
            spawnInterval = 8; // Every 8 seconds (was 12)
            const roll = Math.random();
            if (roll < 0.6) bossType = 'basic';
            else bossType = 'veteran';
            shouldSpawnBoss = true;
        } else if (playerLevel >= 10) {
            // Level 10-19: Only Basic bosses can spawn randomly (after Basic introduction)
            spawnInterval = 15; // Every 15 seconds
            bossType = 'basic';
            shouldSpawnBoss = true;
        }
        
        if (shouldSpawnBoss && gameTime - this.lastBossSpawn >= spawnInterval) {
            game.spawnBoss();
            this.lastBossSpawn = gameTime;
        }
    }
}