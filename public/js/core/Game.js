import { GAME_CONFIG, PLAYER_CONFIG, ENEMY_CONFIG, DIAMOND_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { Player } from './Player.js';
import { BasicWeapon } from '../entities/weapons/BasicWeapon.js';
import { WaveManager } from '../systems/WaveManager.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { PlayerProfile } from '../systems/PlayerProfile.js';
import { Enemy, VeteranEnemy, EliteEnemy } from '../entities/enemies/Enemy.js';
import { BossEnemy, VeteranBoss, EliteBoss } from '../entities/enemies/BossEnemy.js';
import { XPPickup, VeteranXPPickup, EliteXPPickup } from '../entities/pickups/XPPickup.js';
import { EnemyProjectile, SpikeProjectile } from '../entities/weapons/index.js';
import { FireballProjectile, InfernoWave } from '../elements/Fire.js';
import { MissileProjectile, Tornado, WindParticle } from '../elements/Air.js';
import { WaterGlobe, WaterSplashParticle } from '../elements/Water.js';
import { 
    ExplosionParticle, 
    DebrisParticle, 
    TremorParticle, 
    DOTEffect,
    LightningBolt, 
    DelayedLightningChain, 
    IceRing, 
    EarthquakeWave, 
    ShockwaveRing, 
    StormClouds, 
    ThunderBolt, 
    LightningImpact, 
    ElectricSpark 
} from '../entities/effects/index.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.pickups = [];
        this.dotEffects = [];
        
        this.gameTime = 0;
        this.score = 0;
        this.isPaused = false;
        this.gameOver = false;
        this.gameState = 'waiting'; // 'waiting', 'playing', 'gameOver', 'shop'
        this.pendingBossSpawn = false; // Flag for spawning boss after upgrade menu
        
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // Delta time system for consistent frame rate
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.targetFPS = GAME_CONFIG.TARGET_FPS;
        this.fixedTimeStep = GAME_CONFIG.FIXED_TIME_STEP;
        
        // Screen shake for visual effects
        this.screenShake = 0;
        
        this.waveManager = new WaveManager();
        this.upgradeSystem = new UpgradeSystem();
        this.upgradeSystem.game = this;
        
        // Initialize player profile and statistics tracking
        this.playerProfile = new PlayerProfile();
        this.sessionStats = this.initializeSessionStats();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameOver = false;
        this.player = new Player(this.width / 2, this.height / 2);
        this.player.game = this;
        this.player.weapons = [new BasicWeapon(this.player)];
        
        // Load equipped mastery rings from profile
        this.player.masteryRings = [...this.playerProfile.masteryRings.equipped];
        this.gameTime = 0;
        this.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.pickups = [];
        this.dotEffects = [];
        document.getElementById('startWidget').style.display = 'none';
        document.getElementById('upgradeMenu').style.display = 'none';
        document.getElementById('pauseOverlay').style.display = 'none';
        
        // Reset upgrade system
        this.upgradeSystem = new UpgradeSystem();
        this.upgradeSystem.game = this;
        
        // Reset wave manager
        this.waveManager = new WaveManager();
        
        // Reset session statistics
        this.sessionStats = this.initializeSessionStats();
        
        // Reset all power levels in UI
        ['fire', 'water', 'air', 'earth', 'lightning'].forEach(element => {
            document.getElementById(`${element}-level`).textContent = '0';
            document.getElementById(`${element}-progress`).style.width = '0%';
            document.getElementById(`${element}-ability`).classList.remove('unlocked');
            document.getElementById(`${element}-ultimate`).classList.remove('unlocked');
        });
        
        // Initialize UI with starting values
        this.updateUI();
        this.updateDiamondDisplay(); // Initialize diamond display with current total
        this.updateProfileUI();
    }
    
    // Initialize session statistics tracking
    initializeSessionStats() {
        return {
            survivalTime: 0,
            score: 0,
            level: 1,
            xpGained: 0,
            upgradesChosen: 0,
            enemiesKilled: {
                basic: 0,
                veteran: 0,
                elite: 0,
                boss: 0,
                total: 0
            },
            damageDealt: {
                basicWeapon: 0,
                fireball: 0,
                waterGlobe: 0,
                tremors: 0,
                earthquakeStormp: 0,
                chainLightning: 0,
                thunderStorm: 0,
                missiles: 0,
                tornadoVortex: 0,
                infernoWave: 0,
                total: 0
            },
            elementLevels: {
                fire: 0,
                water: 0,
                earth: 0,
                air: 0,
                lightning: 0
            }
        };
    }
    
    // Track damage dealt by attack type
    recordDamage(attackType, damage) {
        if (this.sessionStats.damageDealt[attackType] !== undefined) {
            const roundedDamage = Math.floor(damage);
            this.sessionStats.damageDealt[attackType] += roundedDamage;
            this.sessionStats.damageDealt.total += roundedDamage;
        }
    }
    
    // Track enemy kill by type
    recordEnemyKill(enemyType) {
        if (this.sessionStats.enemiesKilled[enemyType] !== undefined) {
            this.sessionStats.enemiesKilled[enemyType]++;
            this.sessionStats.enemiesKilled.total++;
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Handle keyboard shortcuts for different game states
            if (this.gameState === 'waiting' && (e.key === ' ' || e.key === 'Enter')) {
                this.startGame();
            } else if (this.gameState === 'playing' && e.key === ' ') {
                this.togglePause();
            } else if (this.gameState === 'shop' && e.key === 'Escape') {
                this.exitShop();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        // Shop button event listeners
        const newGameBtn = document.getElementById('newGameBtn');
        const shopBtn = document.getElementById('shopBtn');
        const backToGameBtn = document.getElementById('backToGameBtn');
        const buyXpVortex = document.getElementById('buyXpVortex');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                if (this.gameState === 'gameOver' || this.gameState === 'waiting') {
                    this.startGame();
                }
            });
        }
        
        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                if (this.gameState === 'gameOver' || this.gameState === 'waiting') {
                    this.enterShop();
                }
            });
        }
        
        if (backToGameBtn) {
            backToGameBtn.addEventListener('click', () => {
                if (this.gameState === 'shop') {
                    this.exitShop();
                }
            });
        }
        
        if (buyXpVortex) {
            buyXpVortex.addEventListener('click', () => {
                if (this.gameState === 'shop') {
                    this.purchaseXpVortex();
                }
            });
        }
        
        // Mastery Ring purchase buttons
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        elements.forEach(element => {
            const buyBtn = document.getElementById(`buy${element.charAt(0).toUpperCase() + element.slice(1)}Ring`);
            if (buyBtn) {
                buyBtn.addEventListener('click', () => {
                    if (this.gameState === 'shop') {
                        this.purchaseMasteryRing(element);
                    }
                });
            }
        });
    }
    
    gameLoop(currentTime = 0) {
        // Calculate delta time in seconds
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }
        
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent huge jumps (e.g., when tab loses focus)
        this.deltaTime = Math.min(this.deltaTime, this.fixedTimeStep * 2);
        
        this.update();
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.isPaused || this.gameState !== 'playing') return;
        
        this.gameTime += this.deltaTime;
        
        this.player.update(this.keys, this.mousePos, this.deltaTime);
        
        this.waveManager.update(this.gameTime, this, this.player.level, this.deltaTime);
        
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.player, this.deltaTime);
            if (enemy.health <= 0) {
                // Track enemy kill by type
                if (enemy.isBoss) {
                    this.recordEnemyKill('boss');
                    let xpCount = ENEMY_CONFIG.BOSS.BASIC.XP_DROP;
                    let scoreReward = ENEMY_CONFIG.BOSS.BASIC.SCORE_REWARD;
                    
                    if (enemy.isElite) {
                        xpCount = ENEMY_CONFIG.BOSS.ELITE.XP_DROP;
                        scoreReward = ENEMY_CONFIG.BOSS.ELITE.SCORE_REWARD;
                    } else if (enemy.isVeteran) {
                        xpCount = ENEMY_CONFIG.BOSS.VETERAN.XP_DROP;
                        scoreReward = ENEMY_CONFIG.BOSS.VETERAN.SCORE_REWARD;
                    }
                    
                    // Create appropriate XP pickups based on boss type
                    if (enemy.isElite) {
                        // Elite bosses drop EliteXPPickup instances
                        for (let i = 0; i < xpCount; i++) {
                            this.pickups.push(new EliteXPPickup(
                                enemy.x + (Math.random() - 0.5) * 40, 
                                enemy.y + (Math.random() - 0.5) * 40
                            ));
                        }
                    } else if (enemy.isVeteran) {
                        // Veteran bosses drop VeteranXPPickup instances
                        for (let i = 0; i < xpCount; i++) {
                            this.pickups.push(new VeteranXPPickup(
                                enemy.x + (Math.random() - 0.5) * 40, 
                                enemy.y + (Math.random() - 0.5) * 40
                            ));
                        }
                    } else {
                        // Basic bosses drop basic XP pickups
                        for (let i = 0; i < xpCount; i++) {
                            this.createXPPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40);
                        }
                    }
                    this.score += scoreReward;
                } else if (enemy.isElite) {
                    this.recordEnemyKill('elite');
                    this.pickups.push(new EliteXPPickup(enemy.x, enemy.y));
                    this.score += ENEMY_CONFIG.ELITE.SCORE_REWARD;
                } else if (enemy.isVeteran) {
                    this.recordEnemyKill('veteran');
                    this.pickups.push(new VeteranXPPickup(enemy.x, enemy.y));
                    this.score += ENEMY_CONFIG.VETERAN.SCORE_REWARD;
                } else {
                    this.recordEnemyKill('basic');
                    this.createXPPickup(enemy.x, enemy.y);
                    this.score += ENEMY_CONFIG.BASIC.SCORE_REWARD;
                }
                this.enemies.splice(index, 1);
            }
        });
        
        this.projectiles.forEach((projectile, index) => {
            projectile.update(this.deltaTime);
            if (projectile.shouldRemove) {
                this.projectiles.splice(index, 1);
            }
        });
        
        this.enemyProjectiles.forEach((projectile, index) => {
            projectile.update(this.deltaTime);
            if (projectile.shouldRemove) {
                this.enemyProjectiles.splice(index, 1);
            }
        });
        
        this.particles.forEach((particle, index) => {
            particle.update(this.deltaTime);
            if (particle.shouldRemove) {
                this.particles.splice(index, 1);
            }
        });
        
        this.dotEffects.forEach((dot, index) => {
            dot.update(this.gameTime, this.deltaTime);
            if (dot.shouldRemove) {
                this.dotEffects.splice(index, 1);
            }
        });
        
        this.pickups.forEach((pickup, index) => {
            if (pickup.update) pickup.update(this.deltaTime); // For animated pickups like EliteXPPickup
            
            // Handle XP Vortex attraction
            if (pickup.type === 'xp') {
                this.updateXPPickupVortex(pickup);
            }
            
            if (this.checkXPPickupCollision(this.player, pickup)) {
                if (pickup.type === 'xp') {
                    this.player.gainXP(pickup.value);
                }
                this.pickups.splice(index, 1);
            }
        });
        
        this.handleCollisions();
        
        // Update session stats
        this.sessionStats.survivalTime = this.gameTime;
        this.sessionStats.score = this.score;
        this.sessionStats.level = this.player.level;
        
        // Update element levels in session stats
        for (const element in this.player.upgradeCount) {
            this.sessionStats.elementLevels[element] = this.player.upgradeCount[element];
        }
        
        // Update screen shake (decay over time)
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - this.deltaTime * 15); // Decay shake over time
        }
        
        this.updateUI();
        this.updateCurrentSessionDisplay(); // Update current session stats during gameplay
    }
    
    render() {
        // Clear background
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing' && this.player) {
            // Apply screen shake if active
            if (this.screenShake > 0) {
                this.ctx.save();
                const shakeX = (Math.random() - 0.5) * this.screenShake;
                const shakeY = (Math.random() - 0.5) * this.screenShake;
                this.ctx.translate(shakeX, shakeY);
            }
            
            this.player.render(this.ctx);
            this.enemies.forEach(enemy => enemy.render(this.ctx));
            this.projectiles.forEach(projectile => projectile.render(this.ctx));
            this.enemyProjectiles.forEach(projectile => projectile.render(this.ctx));
            this.particles.forEach(particle => particle.render(this.ctx));
            this.pickups.forEach(pickup => pickup.render(this.ctx));
            
            // Restore context if screen shake was applied
            if (this.screenShake > 0) {
                this.ctx.restore();
            }
        } else if (this.gameState === 'waiting' || this.gameState === 'gameOver') {
            // Show start widget
            document.getElementById('startWidget').style.display = 'block';
            
            if (this.gameState === 'gameOver') {
                this.renderGameOverScreen();
            } else {
                this.renderStartScreen();
            }
        }
    }
    
    renderGameOverScreen() {
        // Update start widget text for game over
        const startPrompt = document.querySelector('.start-prompt');
        const startTitle = document.querySelector('.start-title');
        const startSubtitle = document.querySelector('.start-subtitle');
        const controlsSection = document.querySelector('.controls-section');
        const gameInfoSections = document.querySelectorAll('.game-info:not(#finalStats)');
        const finalStats = document.getElementById('finalStats');
        
        if (startPrompt) {
            startPrompt.textContent = 'Game Over! Press SPACE or ENTER to Restart!';
        }
        if (startTitle) {
            startTitle.innerHTML = '💀 GAME OVER 💀';
        }
        if (startSubtitle) {
            startSubtitle.style.display = 'none';
        }
        if (controlsSection) {
            controlsSection.style.display = 'none';
        }
        gameInfoSections.forEach(section => {
            section.style.display = 'none';
        });
        if (finalStats) {
            finalStats.style.display = 'block';
            this.populateGameOverStats();
        }
    }
    
    renderStartScreen() {
        // Reset start widget text for new game
        const startPrompt = document.querySelector('.start-prompt');
        const startTitle = document.querySelector('.start-title');
        const startSubtitle = document.querySelector('.start-subtitle');
        const controlsSection = document.querySelector('.controls-section');
        const gameInfoSections = document.querySelectorAll('.game-info:not(#finalStats)');
        const finalStats = document.getElementById('finalStats');
        
        if (startPrompt) {
            startPrompt.textContent = 'Press SPACE or ENTER to Start!';
        }
        if (startTitle) {
            startTitle.innerHTML = '⚡ ELEMENTAL FURY ⚡';
        }
        if (startSubtitle) {
            startSubtitle.style.display = 'block';
        }
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }
        gameInfoSections.forEach(section => {
            section.style.display = 'block';
        });
        if (finalStats) {
            finalStats.style.display = 'none';
        }
    }
    
    populateGameOverStats() {
        // Helper function to format time
        const formatTime = (timeInSeconds) => {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        // Helper function to format large numbers
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };
        
        // Populate basic stats
        document.getElementById('finalTime').textContent = formatTime(this.gameTime);
        document.getElementById('finalScore').textContent = formatNumber(this.score);
        document.getElementById('finalLevel').textContent = this.player ? this.player.level : 1;
        document.getElementById('finalXP').textContent = this.sessionStats ? this.sessionStats.xpGained : 0;
        
        // Populate combat stats
        document.getElementById('finalKills').textContent = this.sessionStats ? this.sessionStats.enemiesKilled.total : 0;
        document.getElementById('finalTotalDamage').textContent = this.sessionStats ? formatNumber(this.sessionStats.damageDealt.total) : 0;
        
        // Populate detailed damage breakdown
        if (this.sessionStats) {
            document.getElementById('finalBasicDamage').textContent = formatNumber(this.sessionStats.damageDealt.basicWeapon);
            document.getElementById('finalFireballDamage').textContent = formatNumber(this.sessionStats.damageDealt.fireball);
            document.getElementById('finalWaterGlobeDamage').textContent = formatNumber(this.sessionStats.damageDealt.waterGlobe);
            document.getElementById('finalMissilesDamage').textContent = formatNumber(this.sessionStats.damageDealt.missiles);
            document.getElementById('finalTremorsDamage').textContent = formatNumber(this.sessionStats.damageDealt.tremors);
            document.getElementById('finalChainLightningDamage').textContent = formatNumber(this.sessionStats.damageDealt.chainLightning);
            document.getElementById('finalEarthquakeDamage').textContent = formatNumber(this.sessionStats.damageDealt.earthquakeStormp);
            document.getElementById('finalThunderStormDamage').textContent = formatNumber(this.sessionStats.damageDealt.thunderStorm);
            document.getElementById('finalTornadoDamage').textContent = formatNumber(this.sessionStats.damageDealt.tornadoVortex);
            document.getElementById('finalInfernoDamage').textContent = formatNumber(this.sessionStats.damageDealt.infernoWave);
            
            // Show elements used
            const elementsUsed = [];
            const elementNames = {fire: 'Fire', water: 'Water', earth: 'Earth', air: 'Air', lightning: 'Lightning'};
            for (const element in this.sessionStats.elementLevels) {
                const level = this.sessionStats.elementLevels[element];
                if (level > 0) {
                    elementsUsed.push(`${elementNames[element]}: Lvl ${level}`);
                }
            }
            document.getElementById('finalElementsUsed').innerHTML = elementsUsed.length > 0 ? 
                elementsUsed.join('<br>') : 'No elements used';
            
            // Calculate and show diamonds earned
            const diamondsEarned = this.playerProfile.calculateDiamondReward(this.sessionStats);
            document.getElementById('finalDiamondsEarned').textContent = diamondsEarned;
        }
    }
    
    handleCollisions() {
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (MathUtils.circleIntersect(projectile.x, projectile.y, projectile.radius, 
                                             enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(projectile.damage);
                    
                    // Track damage by projectile type
                    if (projectile instanceof FireballProjectile) {
                        this.recordDamage('fireball', projectile.damage);
                        projectile.explode(this);
                    } else if (projectile instanceof MissileProjectile) {
                        this.recordDamage('missiles', projectile.damage);
                    } else {
                        // Basic weapon projectile
                        this.recordDamage('basicWeapon', projectile.damage);
                    }
                    
                    projectile.shouldRemove = true;
                }
            });
        });
        
        this.enemies.forEach(enemy => {
            if (MathUtils.circleIntersect(this.player.x, this.player.y, this.player.radius,
                                         enemy.x, enemy.y, enemy.radius)) {
                let damage = ENEMY_CONFIG.BASIC.DAMAGE;
                if (enemy.isBoss) damage = ENEMY_CONFIG.BOSS.BASIC.DAMAGE;
                else if (enemy.isElite) damage = ENEMY_CONFIG.ELITE.DAMAGE;
                else if (enemy.isVeteran) damage = ENEMY_CONFIG.VETERAN.DAMAGE;
                
                this.player.takeDamage(damage);
                
                if (!enemy.isBoss && !enemy.isElite) {
                    enemy.shouldRemove = true;
                }
            }
        });
        
        this.enemyProjectiles.forEach(projectile => {
            if (MathUtils.circleIntersect(this.player.x, this.player.y, this.player.radius,
                                         projectile.x, projectile.y, projectile.radius)) {
                this.player.takeDamage(15);
                projectile.shouldRemove = true;
            }
        });
    }
    
    checkCollision(obj1, obj2) {
        return MathUtils.circleIntersect(obj1.x, obj1.y, obj1.radius, obj2.x, obj2.y, obj2.radius);
    }
    
    checkXPPickupCollision(player, pickup) {
        // Base collection range (smaller, for actual pickup)
        const collectionRange = player.radius + pickup.radius + 5;
        return MathUtils.distance(player.x, player.y, pickup.x, pickup.y) < collectionRange;
    }
    
    updateXPPickupVortex(pickup) {
        const xpVortexLevel = this.playerProfile.shopUpgrades.xpVortex;
        if (xpVortexLevel === 0) return; // No vortex effect
        
        const distance = MathUtils.distance(this.player.x, this.player.y, pickup.x, pickup.y);
        
        // Vortex attraction range (larger than collection range)
        const baseRange = this.player.radius + pickup.radius + 20;
        const vortexRange = baseRange * (1 + (xpVortexLevel * 0.5)); // 50% increase per level
        
        if (distance < vortexRange && distance > 5) { // Don't attract if too close
            // Calculate attraction force based on distance and vortex level
            const attraction = (xpVortexLevel * 0.3 + 0.5) * (vortexRange - distance) / vortexRange;
            const speed = Math.min(attraction * 200 * this.deltaTime, distance * 0.8); // Max speed to prevent overshooting
            
            // Normalize direction vector
            const direction = MathUtils.normalize(this.player.x - pickup.x, this.player.y - pickup.y);
            
            // Move pickup towards player
            pickup.x += direction.x * speed;
            pickup.y += direction.y * speed;
            
            // Add some visual effects
            if (!pickup.isBeingAttracted) {
                pickup.isBeingAttracted = true;
                pickup.attractionStartTime = this.gameTime;
            }
        } else {
            pickup.isBeingAttracted = false;
        }
    }
    
    createXPPickup(x, y) {
        this.pickups.push(new XPPickup(x, y));
    }
    
    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: x = Math.random() * this.width; y = -20; break;
            case 1: x = this.width + 20; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height + 20; break;
            case 3: x = -20; y = Math.random() * this.height; break;
        }
        
        const playerLevel = this.player.level;
        let enemy;
        
        if (playerLevel >= ENEMY_CONFIG.ELITE.MIN_LEVEL) {
            // Elite enemies start appearing at level 20
            const eliteChance = Math.min(ENEMY_CONFIG.ELITE.MAX_SPAWN_CHANCE * 100, 
                                        (playerLevel - ENEMY_CONFIG.ELITE.MIN_LEVEL) * ENEMY_CONFIG.ELITE.SPAWN_CHANCE_PER_LEVEL * 100);
            const veteranChance = Math.min(ENEMY_CONFIG.VETERAN.MAX_SPAWN_CHANCE * 100, 
                                          (playerLevel - ENEMY_CONFIG.VETERAN.MIN_LEVEL) * ENEMY_CONFIG.VETERAN.SPAWN_CHANCE_PER_LEVEL * 100);
            
            const roll = Math.random() * 100;
            if (roll < eliteChance) {
                enemy = new EliteEnemy(x, y);
            } else if (roll < eliteChance + veteranChance) {
                enemy = new VeteranEnemy(x, y);
            } else {
                enemy = new Enemy(x, y);
            }
        } else if (playerLevel >= ENEMY_CONFIG.VETERAN.MIN_LEVEL) {
            // Veteran enemies start appearing at level 10
            const veteranChance = Math.min(ENEMY_CONFIG.VETERAN.MAX_SPAWN_CHANCE * 100, 
                                          (playerLevel - ENEMY_CONFIG.VETERAN.MIN_LEVEL) * ENEMY_CONFIG.VETERAN.SPAWN_CHANCE_PER_LEVEL * 100);
            
            const roll = Math.random() * 100;
            if (roll < veteranChance) {
                enemy = new VeteranEnemy(x, y);
            } else {
                enemy = new Enemy(x, y);
            }
        } else {
            enemy = new Enemy(x, y);
        }
        
        this.enemies.push(enemy);
    }
    
    spawnBoss() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        // Spawn bosses INSIDE the visible frame to avoid any edge issues
        switch(side) {
            case 0: x = 50 + Math.random() * (this.width - 100); y = 50; break; // Top edge, inside frame
            case 1: x = this.width - 50; y = 50 + Math.random() * (this.height - 100); break; // Right edge, inside frame
            case 2: x = 50 + Math.random() * (this.width - 100); y = this.height - 50; break; // Bottom edge, inside frame
            case 3: x = 50; y = 50 + Math.random() * (this.height - 100); break; // Left edge, inside frame
        }
        
        const playerLevel = this.player.level;
        let boss;
        
        // Specific boss types for specific levels (guaranteed spawns)
        if (playerLevel === 5 || playerLevel === 10) {
            boss = new BossEnemy(x, y);
        } else if (playerLevel === 15 || playerLevel === 20) {
            boss = new VeteranBoss(x, y);
        } else if (playerLevel === 25 || playerLevel === 30) {
            boss = new EliteBoss(x, y);
        } else {
            // Original random logic for other levels or random spawns
            if (playerLevel >= 25) {
                // Elite bosses start appearing at level 25
                const eliteBossChance = Math.min(60, (playerLevel - 25) * 4); // 4% per level after 25, max 60%
                const veteranBossChance = Math.min(80, (playerLevel - 15) * 6); // 6% per level after 15, max 80%
                
                const roll = Math.random() * 100;
                if (roll < eliteBossChance) {
                    boss = new EliteBoss(x, y);
                } else if (roll < eliteBossChance + veteranBossChance) {
                    boss = new VeteranBoss(x, y);
                } else {
                    boss = new BossEnemy(x, y);
                }
            } else if (playerLevel >= 15) {
                // Veteran bosses start appearing at level 15
                const veteranBossChance = Math.min(75, (playerLevel - 15) * 7.5); // 7.5% per level after 15, max 75%
                
                const roll = Math.random() * 100;
                if (roll < veteranBossChance) {
                    boss = new VeteranBoss(x, y);
                } else {
                    boss = new BossEnemy(x, y);
                }
            } else {
                boss = new BossEnemy(x, y);
            }
        }
        
        boss.game = this;
        this.enemies.push(boss);
    }
    
    updateUI() {
        if (this.gameState !== 'playing' || !this.player) return;
        
        // Update health display and bar
        document.getElementById('health').textContent = Math.floor(this.player.health);
        document.getElementById('maxHealth').textContent = Math.floor(this.player.maxHealth);
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-bar').style.width = `${Math.max(0, healthPercent)}%`;
        
        // Update XP display and bar
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('xp').textContent = Math.floor(this.player.xp);
        document.getElementById('xpNext').textContent = Math.floor(this.player.xpToNext);
        const xpPercent = (this.player.xp / this.player.xpToNext) * 100;
        document.getElementById('xp-bar').style.width = `${xpPercent}%`;
        
        // Update score
        document.getElementById('score').textContent = this.score;
        
        // Update timer
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.updatePowerupDisplay();
    }
    
    updatePowerupDisplay() {
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        
        elements.forEach(element => {
            const count = this.player.upgradeCount[element] || 0;
            const percentage = (count / 10) * 100;
            
            document.getElementById(`${element}-level`).textContent = count;
            document.getElementById(`${element}-progress`).style.width = `${percentage}%`;
            
            const abilityElement = document.getElementById(`${element}-ability`);
            const ultimateElement = document.getElementById(`${element}-ultimate`);
            
            if (count >= 3) {
                abilityElement.classList.add('unlocked');
            } else {
                abilityElement.classList.remove('unlocked');
            }
            
            if (count >= 6) {
                ultimateElement.classList.add('unlocked');
            } else {
                ultimateElement.classList.remove('unlocked');
            }
        });
    }
    
    // Update player profile UI display
    updateProfileUI() {
        const stats = this.playerProfile.statistics;
        
        // Helper function to format time
        const formatTime = (timeInSeconds) => {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        // Helper function to format large numbers
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };
        
        // Update game statistics
        document.getElementById('totalGames').textContent = stats.totalGamesPlayed;
        document.getElementById('bestTime').textContent = formatTime(stats.bestSurvivalTime);
        document.getElementById('highScore').textContent = formatNumber(stats.highestScore);
        document.getElementById('maxLevel').textContent = stats.highestLevel;
        document.getElementById('totalPlayTime').textContent = formatTime(stats.totalSurvivalTime);
        
        // Update enemy kills
        document.getElementById('basicKills').textContent = formatNumber(stats.enemiesKilled.basic);
        document.getElementById('veteranKills').textContent = formatNumber(stats.enemiesKilled.veteran);
        document.getElementById('eliteKills').textContent = formatNumber(stats.enemiesKilled.elite);
        document.getElementById('bossKills').textContent = formatNumber(stats.enemiesKilled.boss);
        document.getElementById('totalKills').textContent = formatNumber(stats.enemiesKilled.total);
        
        // Update damage statistics
        document.getElementById('basicWeaponDamage').textContent = formatNumber(stats.damageDealt.basicWeapon);
        document.getElementById('fireballDamage').textContent = formatNumber(stats.damageDealt.fireball);
        document.getElementById('waterGlobeDamage').textContent = formatNumber(stats.damageDealt.waterGlobe);
        document.getElementById('missilesDamage').textContent = formatNumber(stats.damageDealt.missiles);
        document.getElementById('tremorsDamage').textContent = formatNumber(stats.damageDealt.tremors);
        document.getElementById('chainLightningDamage').textContent = formatNumber(stats.damageDealt.chainLightning);
        document.getElementById('earthquakeDamage').textContent = formatNumber(stats.damageDealt.earthquakeStormp);
        document.getElementById('thunderStormDamage').textContent = formatNumber(stats.damageDealt.thunderStorm);
        document.getElementById('tornadoDamage').textContent = formatNumber(stats.damageDealt.tornadoVortex);
        document.getElementById('infernoDamage').textContent = formatNumber(stats.damageDealt.infernoWave);
        document.getElementById('totalDamage').textContent = formatNumber(stats.damageDealt.total);
        
        // Update element mastery
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        elements.forEach(element => {
            const maxLevel = stats.elementMastery[element].maxLevelReached;
            document.getElementById(`${element}Mastery`).textContent = maxLevel;
        });
    }
    
    // Update diamond display only after game completion
    updateDiamondDisplay() {
        const availableDiamonds = this.playerProfile.getAvailableDiamonds();
        document.getElementById('totalDiamonds').textContent = availableDiamonds;
    }
    
    // Enter shop mode
    enterShop() {
        this.previousGameState = this.gameState; // Remember where we came from
        this.gameState = 'shop';
        document.getElementById('shopMenu').style.display = 'block';
        this.updateShopDisplay();
    }
    
    // Exit shop mode
    exitShop() {
        this.gameState = this.previousGameState || 'waiting'; // Return to previous state
        document.getElementById('shopMenu').style.display = 'none';
    }
    
    // Toggle pause state
    togglePause() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        
        if (this.isPaused) {
            this.updatePauseStats();
            pauseOverlay.style.display = 'block';
        } else {
            pauseOverlay.style.display = 'none';
        }
    }
    
    // Update pause overlay stats
    updatePauseStats() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('pauseTime').textContent = timeString;
        document.getElementById('pauseLevel').textContent = this.player.level;
        document.getElementById('pauseScore').textContent = this.score.toLocaleString();
    }
    
    // Update shop display with current prices and levels
    updateShopDisplay() {
        const availableDiamonds = this.playerProfile.getAvailableDiamonds();
        const xpVortexLevel = this.playerProfile.shopUpgrades.xpVortex;
        const xpVortexPrice = this.playerProfile.getUpgradePrice('xpVortex');
        
        // Update diamond balance
        document.getElementById('shopDiamonds').textContent = availableDiamonds;
        
        // Update XP Vortex item
        document.getElementById('xpVortexLevel').textContent = xpVortexLevel;
        document.getElementById('xpVortexPrice').textContent = xpVortexPrice;
        
        const buyButton = document.getElementById('buyXpVortex');
        if (xpVortexLevel >= 5) {
            buyButton.textContent = 'MAX';
            buyButton.disabled = true;
        } else if (availableDiamonds < xpVortexPrice) {
            buyButton.textContent = 'Buy';
            buyButton.disabled = true;
        } else {
            buyButton.textContent = 'Buy';
            buyButton.disabled = false;
        }
        
        // Update Mastery Rings
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        elements.forEach(element => {
            const isOwned = this.playerProfile.masteryRings.owned[element];
            const isEquipped = this.playerProfile.masteryRings.equipped.includes(element);
            const price = this.playerProfile.getMasteryRingPrice(element);
            
            // Update status text
            const statusElement = document.getElementById(`${element}RingStatus`);
            if (isEquipped) {
                statusElement.textContent = 'Equipped';
                statusElement.style.color = '#00ff00';
            } else if (isOwned) {
                statusElement.textContent = 'Owned (Click to equip)';
                statusElement.style.color = '#ffaa00';
            } else {
                statusElement.textContent = 'Not Owned';
                statusElement.style.color = '#ccc';
            }
            
            // Update price and button
            const priceElement = document.getElementById(`${element}RingPrice`);
            const buyBtn = document.getElementById(`buy${element.charAt(0).toUpperCase() + element.slice(1)}Ring`);
            
            if (isOwned) {
                priceElement.textContent = '0';
                if (isEquipped) {
                    buyBtn.textContent = 'Unequip';
                    buyBtn.disabled = false;
                } else if (this.playerProfile.masteryRings.equipped.length >= 2) {
                    buyBtn.textContent = 'No Slots';
                    buyBtn.disabled = true;
                } else {
                    buyBtn.textContent = 'Equip';
                    buyBtn.disabled = false;
                }
            } else {
                priceElement.textContent = price;
                if (availableDiamonds < price) {
                    buyBtn.textContent = 'Buy';
                    buyBtn.disabled = true;
                } else {
                    buyBtn.textContent = 'Buy';
                    buyBtn.disabled = false;
                }
            }
        });
    }
    
    // Purchase XP Vortex upgrade
    purchaseXpVortex() {
        if (this.playerProfile.purchaseUpgrade('xpVortex')) {
            this.updateShopDisplay();
            this.updateDiamondDisplay(); // Update header display
        }
    }
    
    purchaseMasteryRing(elementType) {
        const isOwned = this.playerProfile.masteryRings.owned[elementType];
        
        if (isOwned) {
            // Handle equip/unequip
            if (this.playerProfile.equipMasteryRing(elementType)) {
                this.updateShopDisplay();
            }
        } else {
            // Handle purchase
            if (this.playerProfile.purchaseMasteryRing(elementType)) {
                this.updateShopDisplay();
                this.updateDiamondDisplay(); // Update header display
            }
        }
    }
    
    // Update current session display during gameplay
    updateCurrentSessionDisplay() {
        if (this.gameState !== 'playing' || !this.sessionStats) return;
        
        // Helper function to format time
        const formatTime = (timeInSeconds) => {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        // Helper function to format large numbers
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };
        
        // Update current session stats
        document.getElementById('sessionTime').textContent = formatTime(this.sessionStats.survivalTime);
        document.getElementById('sessionScore').textContent = formatNumber(this.sessionStats.score);
        document.getElementById('sessionLevel').textContent = this.sessionStats.level;
        document.getElementById('sessionKills').textContent = this.sessionStats.enemiesKilled.total;
        document.getElementById('sessionXP').textContent = this.sessionStats.xpGained;
        
        // Update detailed damage breakdown for current session - only show damage types that have done damage
        const damageTypes = [
            { id: 'sessionBasicDamage', key: 'basicWeapon', label: 'Basic Weapon' },
            { id: 'sessionFireballDamage', key: 'fireball', label: 'Fireball' },
            { id: 'sessionWaterGlobeDamage', key: 'waterGlobe', label: 'Water Globe' },
            { id: 'sessionMissilesDamage', key: 'missiles', label: 'Missiles' },
            { id: 'sessionTremorsDamage', key: 'tremors', label: 'Tremors' },
            { id: 'sessionChainLightningDamage', key: 'chainLightning', label: 'Chain Lightning' },
            { id: 'sessionEarthquakeDamage', key: 'earthquakeStormp', label: 'Earthquake' },
            { id: 'sessionThunderStormDamage', key: 'thunderStorm', label: 'Thunder Storm' },
            { id: 'sessionTornadoDamage', key: 'tornadoVortex', label: 'Tornado' },
            { id: 'sessionInfernoDamage', key: 'infernoWave', label: 'Inferno Wave' }
        ];
        
        damageTypes.forEach(damageType => {
            const element = document.getElementById(damageType.id);
            const parentRow = element ? element.closest('.stat-row') : null;
            const damage = this.sessionStats.damageDealt[damageType.key];
            
            if (element) {
                element.textContent = formatNumber(damage);
            }
            
            // Hide/show the entire row based on whether damage was dealt
            // Always show basic weapon, hide others if no damage
            if (parentRow) {
                if (damage > 0 || damageType.key === 'basicWeapon') {
                    parentRow.style.display = '';
                } else {
                    parentRow.style.display = 'none';
                }
            }
        });
        
        document.getElementById('sessionTotalDamage').textContent = formatNumber(this.sessionStats.damageDealt.total);
    }
}