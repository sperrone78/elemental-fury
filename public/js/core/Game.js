import { GAME_CONFIG, PLAYER_CONFIG, ENEMY_CONFIG, DIAMOND_CONFIG, WEAPON_CONFIG, ELEMENT_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { SpatialGrid } from '../utils/SpatialGrid.js';
import { Player } from './Player.js';
import { BasicWeapon } from '../entities/weapons/BasicWeapon.js';
import { WaveManager } from '../systems/WaveManager.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { PlayerProfile } from '../systems/PlayerProfile.js';
import { Enemy, VeteranEnemy, EliteEnemy } from '../entities/enemies/Enemy.js';
import { BossEnemy, VeteranBoss, EliteBoss } from '../entities/enemies/BossEnemy.js';
import { XPPickup, VeteranXPPickup, EliteXPPickup } from '../entities/pickups/XPPickup.js';
import { EnemyProjectile, SpikeProjectile, Projectile } from '../entities/weapons/index.js';
import { FireballProjectile, InfernoWave } from '../elements/Fire.js';
import { WindBladeProjectile, Tornado, WindParticle } from '../elements/Air.js';
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
import { ObjectPool } from '../utils/ObjectPool.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgCanvas = document.getElementById('bgCanvas');
        this.bgCtx = this.bgCanvas ? this.bgCanvas.getContext('2d') : this.ctx;
        this.uiCanvas = document.getElementById('uiCanvas');
        this.uiCtx = this.uiCanvas ? this.uiCanvas.getContext('2d') : this.ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.pickups = [];
        this.dotEffects = [];
        
        // Broad-phase acceleration structure for collisions
        this.enemyGrid = new SpatialGrid(64);

        // Initialize object pools for common particles
        this.pools = {
            explosion: new ObjectPool(
                () => new ExplosionParticle(0, 0),
                (p, x, y) => { p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 4; p.vy = (Math.random() - 0.5) * 4; p.life = p.maxLife = 0.5; }
            ),
            debris: new ObjectPool(
                () => new DebrisParticle(0, 0),
                (d, x, y) => { d.x = x; d.y = y; d.vx = (Math.random() - 0.5) * 8; d.vy = (Math.random() - 0.5) * 8 - 2; d.life = d.maxLife = 2; d.size = 2 + Math.random() * 3; d.rotation = Math.random() * Math.PI * 2; d.rotationSpeed = (Math.random() - 0.5) * 0.2; d.gravity = 0.15; }
            ),
            tremor: new ObjectPool(
                () => new TremorParticle(0, 0),
                (p, x, y) => { p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 2; p.vy = (Math.random() - 0.5) * 2; p.life = p.maxLife = 0.8; p.rotation = Math.random() * Math.PI * 2; }
            ),
            spark: new ObjectPool(
                () => new ElectricSpark(0, 0),
                (p, x, y) => { p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 6; p.vy = (Math.random() - 0.5) * 6; p.life = p.maxLife = 0.5; }
            ),
            windParticle: new ObjectPool(
                () => new WindParticle(0, 0),
                (w, x, y) => { w.x = x; w.y = y; w.vx = (Math.random() - 0.5) * 6; w.vy = (Math.random() - 0.5) * 6; w.life = w.maxLife = 0.3; }
            ),
            dot: new ObjectPool(
                () => new DOTEffect(null, 0, 0, 1),
                (e, target, damage, duration, interval) => { e.target = target; e.damage = damage; e.duration = duration; e.interval = interval; e.lastTick = 0; e.startTime = 0; }
            ),
            projectile: new ObjectPool(
                () => new Projectile(0, 0, 1, 0, 0, 0),
                (p, x, y, dirX, dirY, damage, range) => {
                    p.x = x; p.y = y; p.dirX = dirX; p.dirY = dirY; p.damage = damage; p.range = range; p.traveled = 0; p.radius = WEAPON_CONFIG.BASIC.RADIUS; p.speed = WEAPON_CONFIG.BASIC.PROJECTILE_SPEED;
                }
            ),
            windBladeProjectile: new ObjectPool(
                () => new WindBladeProjectile(0, 0, 1, 0, 0, 0, this),
                (p, x, y, dirX, dirY, damage, range, game) => {
                    p.x = x; p.y = y; p.dirX = dirX; p.dirY = dirY; p.damage = damage; p.range = range; p.game = game;
                    p.speed = ELEMENT_CONFIG.AIR.WIND_BLADE.SPEED;
                    p.radius = 6; p.visualSize = 12;
                    p.age = 0; p.seekRadius = ELEMENT_CONFIG.AIR.WIND_BLADE.SEEK_RADIUS; p.seekStrength = ELEMENT_CONFIG.AIR.WIND_BLADE.SEEK_STRENGTH; p.curveIntensity = ELEMENT_CONFIG.AIR.WIND_BLADE.CURVE_INTENSITY;
                    p.maxFlightTime = range / (p.speed * 60);
                    p.seekStartTime = p.maxFlightTime * 0.5;
                    p.distanceTraveled = 0;
                    p.curveDirection = Math.random() > 0.5 ? 1 : -1;
                    p.initialDirection = { x: dirX, y: dirY };
                    p.trail = [];
                    p.maxTrailLength = 10;
                    p.rotation = Math.atan2(dirY, dirX);
                    p.rotationSpeed = 0.25;
                }
            ),
            enemyProjectile: new ObjectPool(
                () => new EnemyProjectile(0, 0, 1, 0),
                (p, x, y, dirX, dirY) => { p.x = x; p.y = y; p.dirX = dirX; p.dirY = dirY; p.traveled = 0; p.shouldRemove = false; }
            ),
            spikeProjectile: new ObjectPool(
                () => new SpikeProjectile(0, 0, 1, 0),
                (p, x, y, dirX, dirY) => { p.x = x; p.y = y; p.dirX = dirX; p.dirY = dirY; p.rotation = Math.atan2(dirY, dirX); p.traveled = 0; p.shouldRemove = false; }
            )
        };
        
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
        this.accumulator = 0;
        this.maxSubSteps = 5;
        
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
        this.updateRingIcons(); // Initialize ring icons on startup
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
                windBlades: 0,
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
        if (this.lastFrameTime === 0) this.lastFrameTime = currentTime;
        const frameDelta = Math.min((currentTime - this.lastFrameTime) / 1000, 0.25);
        this.lastFrameTime = currentTime;
        this.accumulator += frameDelta;
        let subSteps = 0;
        while (this.accumulator >= this.fixedTimeStep && subSteps < this.maxSubSteps) {
            this.deltaTime = this.fixedTimeStep;
            this.update();
            this.accumulator -= this.fixedTimeStep;
            subSteps++;
        }
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.isPaused || this.gameState !== 'playing') return;
        
        this.gameTime += this.deltaTime;
        
        this.player.update(this.keys, this.mousePos, this.deltaTime);
        
        this.waveManager.update(this.gameTime, this, this.player.level, this.deltaTime);
        
        // Rebuild spatial grid for enemies
        this.enemyGrid.clear();
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.player, this.deltaTime);
            this.enemyGrid.insertEnemy(enemy);
            if (enemy.health <= 0 && !enemy.shouldRemove) {
                this.processEnemyDeath(enemy);
            }
        });
        
        // Remove dead enemies after processing all damage
        this.enemies = this.enemies.filter(enemy => !enemy.shouldRemove);
        
        this.projectiles.forEach((projectile) => {
            projectile.update(this.deltaTime);
        });
        this.projectiles = this.projectiles.filter(p => {
            if (p.shouldRemove) {
                if (p instanceof Projectile && this.pools?.projectile) this.pools.projectile.release(p);
                else if (p instanceof EnemyProjectile && this.pools?.enemyProjectile) this.pools.enemyProjectile.release(p);
                else if (p instanceof SpikeProjectile && this.pools?.spikeProjectile) this.pools.spikeProjectile.release(p);
                else if (p instanceof WindBladeProjectile && this.pools?.windBladeProjectile) this.pools.windBladeProjectile.release(p);
                return false;
            }
            return true;
        });
        
        this.enemyProjectiles.forEach((projectile) => {
            projectile.update(this.deltaTime);
        });
        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.shouldRemove);
        
        {
            const remainingParticles = [];
            this.particles.forEach((particle) => {
                particle.update(this.deltaTime);
                if (particle.shouldRemove) {
                    this.releaseParticle(particle);
                } else {
                    remainingParticles.push(particle);
                }
            });
            this.particles = remainingParticles;
        }
        
        this.dotEffects = this.dotEffects.filter(d => {
            d.update(this.gameTime, this.deltaTime);
            if (d.shouldRemove) {
                if (this.pools?.dot) this.pools.dot.release(d);
                return false;
            }
            return true;
        });
        
        this.pickups.forEach((pickup) => {
            if (pickup.update) pickup.update(this.deltaTime); // For animated pickups like EliteXPPickup
            // Handle XP Vortex attraction
            if (pickup.type === 'xp') {
                this.updateXPPickupVortex(pickup);
            }
            if (this.checkXPPickupCollision(this.player, pickup)) {
                if (pickup.type === 'xp') {
                    this.player.gainXP(pickup.value);
                }
                pickup.shouldRemove = true;
            }
        });
        this.pickups = this.pickups.filter(p => !p.shouldRemove);
        
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
    
    processEnemyDeath(enemy) {
        // Mark for removal immediately to prevent duplicate processing
        enemy.shouldRemove = true;
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
            if (enemy.isElite) {
                for (let i = 0; i < xpCount; i++) {
                    this.pickups.push(new EliteXPPickup(
                        enemy.x + (Math.random() - 0.5) * 40,
                        enemy.y + (Math.random() - 0.5) * 40
                    ));
                }
            } else if (enemy.isVeteran) {
                for (let i = 0; i < xpCount; i++) {
                    this.pickups.push(new VeteranXPPickup(
                        enemy.x + (Math.random() - 0.5) * 40,
                        enemy.y + (Math.random() - 0.5) * 40
                    ));
                }
            } else {
                for (let i = 0; i < xpCount; i++) {
                    this.createXPPickup(
                        enemy.x + (Math.random() - 0.5) * 40,
                        enemy.y + (Math.random() - 0.5) * 40
                    );
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
    }

    releaseParticle(particle) {
        if (particle instanceof ExplosionParticle && this.pools?.explosion) {
            this.pools.explosion.release(particle);
        } else if (particle instanceof TremorParticle && this.pools?.tremor) {
            this.pools.tremor.release(particle);
        } else if (particle instanceof ElectricSpark && this.pools?.spark) {
            this.pools.spark.release(particle);
        }
    }

    render() {
        // Clear layered canvases
        if (this.bgCtx) {
            this.bgCtx.fillStyle = '#111';
            this.bgCtx.fillRect(0, 0, this.width, this.height);
        }
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.uiCtx) this.uiCtx.clearRect(0, 0, this.width, this.height);
        
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
            
            // Render UI elements on canvas
            this.renderCanvasUI();
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
        
        // Populate detailed damage breakdown - only show sources greater than 0
        if (this.sessionStats) {
            const damageData = [
                { id: 'finalBasicDamage', parentId: 'finalBasicDamageRow', value: this.sessionStats.damageDealt.basicWeapon },
                { id: 'finalFireballDamage', parentId: 'finalFireballDamageRow', value: this.sessionStats.damageDealt.fireball },
                { id: 'finalWaterGlobeDamage', parentId: 'finalWaterGlobeDamageRow', value: this.sessionStats.damageDealt.waterGlobe },
                { id: 'finalWindBladesDamage', parentId: 'finalWindBladesDamageRow', value: this.sessionStats.damageDealt.windBlades },
                { id: 'finalTremorsDamage', parentId: 'finalTremorsDamageRow', value: this.sessionStats.damageDealt.tremors },
                { id: 'finalChainLightningDamage', parentId: 'finalChainLightningDamageRow', value: this.sessionStats.damageDealt.chainLightning },
                { id: 'finalEarthquakeDamage', parentId: 'finalEarthquakeDamageRow', value: this.sessionStats.damageDealt.earthquakeStormp },
                { id: 'finalThunderStormDamage', parentId: 'finalThunderStormDamageRow', value: this.sessionStats.damageDealt.thunderStorm },
                { id: 'finalTornadoDamage', parentId: 'finalTornadoDamageRow', value: this.sessionStats.damageDealt.tornadoVortex },
                { id: 'finalInfernoDamage', parentId: 'finalInfernoDamageRow', value: this.sessionStats.damageDealt.infernoWave }
            ];
            
            damageData.forEach(({ id, parentId, value }) => {
                const element = document.getElementById(id);
                const parentElement = document.getElementById(parentId);
                
                if (value > 0) {
                    element.textContent = formatNumber(value);
                    if (parentElement) {
                        parentElement.style.display = 'block';
                    }
                } else {
                    if (parentElement) {
                        parentElement.style.display = 'none';
                    }
                }
            });
            
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
            const nearby = this.enemyGrid.queryEnemiesInRadius(projectile.x, projectile.y, projectile.radius + 72);
            nearby.forEach(enemy => {
                if (MathUtils.circleIntersect(projectile.x, projectile.y, projectile.radius,
                                              enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(projectile.damage);
                    
                    // Track damage by projectile type
                    if (projectile instanceof FireballProjectile) {
                        this.recordDamage('fireball', projectile.damage);
                        projectile.explode(this);
                    } else if (projectile instanceof WindBladeProjectile) {
                        this.recordDamage('windBlades', projectile.damage);
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
        
        // All UI is now rendered on canvas in renderCanvasUI()
        this.updatePowerupDisplay();
    }
    
    // Update ring icons regardless of game state (for start screen/game over screen)
    updateRingIcons() {
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        
        elements.forEach(element => {
            const ringIconElement = document.getElementById(`${element}-ring-icon`);
            
            if (!ringIconElement) {
                return;
            }
            
            const hasRing = this.playerProfile && this.playerProfile.masteryRings.equipped.includes(element);
            
            if (hasRing) {
                ringIconElement.classList.add('equipped');
            } else {
                ringIconElement.classList.remove('equipped');
            }
        });
    }
    
    updatePowerupDisplay() {
        const elements = ['fire', 'water', 'earth', 'air', 'lightning'];
        
        elements.forEach(element => {
            const count = this.player.upgradeCount[element] || 0;
            const hasRing = this.player && this.player.masteryRings && this.player.masteryRings.includes(element);
            const maxLevel = hasRing ? 10 : 5;
            const percentage = (count / maxLevel) * 100;
            
            document.getElementById(`${element}-level`).textContent = `${count}/${maxLevel}`;
            document.getElementById(`${element}-progress`).style.width = `${percentage}%`;
            
            const abilityElement = document.getElementById(`${element}-ability`);
            const ultimateElement = document.getElementById(`${element}-ultimate`);
            const ringIconElement = document.getElementById(`${element}-ring-icon`);
            
            // Show/hide ring icon based on equipped mastery rings
            if (hasRing) {
                ringIconElement.classList.add('equipped');
            } else {
                ringIconElement.classList.remove('equipped');
            }
            
            // Handle ability visibility (level 1 unlocks abilities)
            if (count >= 1) {
                abilityElement.classList.add('unlocked');
                abilityElement.classList.remove('available');
            } else {
                // Hide completely when no levels in this element
                abilityElement.classList.remove('unlocked', 'available');
            }
            
            // Handle ultimate visibility (only show when actually unlocked at level 6)
            
            if (hasRing && count >= 6) {
                ultimateElement.classList.add('unlocked');
                ultimateElement.classList.remove('available');
            } else {
                // Hide completely unless actually unlocked
                ultimateElement.classList.remove('unlocked', 'available');
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
        document.getElementById('windBladesDamage').textContent = formatNumber(stats.damageDealt.windBlades);
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

        this.initializeShopTabs();

    }
    
    // Exit shop mode
    exitShop() {
        this.gameState = this.previousGameState || 'waiting'; // Return to previous state
        document.getElementById('shopMenu').style.display = 'none';
    }
    
    // Initialize shop tabs
    initializeShopTabs() {
        const itemsTab = document.getElementById('itemsTab');
        const ringsTab = document.getElementById('ringsTab');
        const itemsSection = document.getElementById('itemsSection');
        const ringsSection = document.getElementById('ringsSection');
        
        function switchTab(activeTab, activeSection, inactiveTab, inactiveSection) {
            
            
            // Update tab appearance
            activeTab.classList.add('active');
            inactiveTab.classList.remove('active');
            
            // Update section visibility
            activeSection.classList.add('active');
            inactiveSection.classList.remove('active');
            
            // FORCE visibility states to ensure proper switching
            activeSection.style.setProperty('display', 'block', 'important');
            inactiveSection.style.setProperty('display', 'none', 'important');

            
            // Ensure the active class is applied for proper CSS visibility
            
            // DYNAMIC SHOP SIZING: Handle both tabs
            
            // Reset shop to standard size for Items tab
            if (activeSection.id === 'itemsSection') {
                const shopContentContainer = document.querySelector('.shop-content');
                const shopMenu = document.querySelector('#shopMenu');
                
                if (shopContentContainer) {
                    shopContentContainer.style.setProperty('height', 'auto', 'important');
                    shopContentContainer.style.setProperty('min-height', '150px', 'important');
                    shopContentContainer.style.setProperty('max-height', 'none', 'important');
                    shopContentContainer.style.setProperty('overflow-y', 'visible', 'important');

                }
                
                if (shopMenu) {
                    shopMenu.style.setProperty('height', 'auto', 'important');
                    shopMenu.style.setProperty('max-height', 'none', 'important');

                }
                
                // Ensure rings section is hidden
                const ringsSection = document.querySelector('#ringsSection');
                if (ringsSection) {
                    ringsSection.style.setProperty('display', 'none', 'important');

                }
            }
            
            // EMERGENCY FIX: If this is the rings section, force it to be visible
            if (activeSection.id === 'ringsSection') {

                activeSection.style.setProperty('display', 'block', 'important');
                activeSection.style.setProperty('visibility', 'visible', 'important');
                activeSection.style.setProperty('height', 'auto', 'important');
                activeSection.style.setProperty('width', '100%', 'important');
                activeSection.style.setProperty('background', 'transparent', 'important');
                activeSection.style.setProperty('border', 'none', 'important');
                activeSection.style.setProperty('padding', '0', 'important');
                
                const shopItems = activeSection.querySelector('.shop-items');
                if (shopItems) {
                    shopItems.style.setProperty('display', 'block', 'important');
                    shopItems.style.setProperty('visibility', 'visible', 'important');
                    shopItems.style.setProperty('height', 'auto', 'important');
                    shopItems.style.setProperty('background', 'transparent', 'important');
                    shopItems.style.setProperty('min-height', 'auto', 'important');

                }
                
                // DYNAMIC SIZING: Calculate needed height based on content
                const shopContentContainer = document.querySelector('.shop-content');
                const shopFooter = document.querySelector('.shop-footer');
                const shopMenu = document.querySelector('#shopMenu');
                
                if (shopContentContainer && activeSection.id === 'ringsSection') {
                    // Count ring items to calculate dynamic height
                    const ringItems = activeSection.querySelectorAll('.shop-item');
                    const ringCount = ringItems.length;
                    
                    // Calculate dynamic height: base + (rings * item height + spacing)
                    const baseHeight = 80; // Header space
                    const itemHeight = 100; // Approximate height per ring item
                    const spacing = 15; // Margin between items
                    const dynamicHeight = baseHeight + (ringCount * (itemHeight + spacing)) + 40; // Extra padding
                    

                    
                    // Make content scrollable instead of expanding the entire shop
                    shopContentContainer.style.setProperty('height', `${Math.min(dynamicHeight, 400)}px`, 'important');
                    shopContentContainer.style.setProperty('min-height', '200px', 'important');
                    shopContentContainer.style.setProperty('max-height', '400px', 'important');
                    shopContentContainer.style.setProperty('overflow-y', 'auto', 'important');
                    shopContentContainer.style.setProperty('overflow-x', 'hidden', 'important');

                    
                    // Keep shop menu at reasonable height, let content scroll
                    if (shopMenu) {
                        shopMenu.style.setProperty('height', 'auto', 'important');
                        shopMenu.style.setProperty('max-height', '90vh', 'important');

                    }
                    

                }
                
                // CLEAN STYLING: Use normal layout now that DOM is fixed
                activeSection.style.setProperty('position', 'static', 'important');
                activeSection.style.setProperty('display', 'block', 'important');
                activeSection.style.setProperty('visibility', 'visible', 'important');
                activeSection.style.setProperty('height', 'auto', 'important');
                activeSection.style.setProperty('width', '100%', 'important');
                activeSection.style.setProperty('z-index', 'auto', 'important');
                activeSection.style.setProperty('background', 'transparent', 'important');
                activeSection.style.setProperty('border', 'none', 'important');
                activeSection.style.setProperty('padding', '0', 'important');
                activeSection.style.setProperty('top', 'auto', 'important');
                activeSection.style.setProperty('left', 'auto', 'important');

                
                // ULTIMATE DEBUG: Check what's actually happening
                const computedStyle = window.getComputedStyle(activeSection);

                
                // RUNTIME DOM DEBUG: Check actual live DOM structure

                let domParent = activeSection.parentElement;
                let level = 0;
                while (domParent && level < 5) {

                    domParent = domParent.parentElement;
                    level++;
                }
                
                // Check if ringsSection is where it should be
                const shopContent = document.querySelector('.shop-content');
                const ringsInShopContent = shopContent ? shopContent.contains(activeSection) : false;

                
                // Check siblings
                const siblings = Array.from(activeSection.parentElement.children);

                
                // PHYSICAL DOM FIX: If ringsSection is wrongly nested, move it to shop-content
                if (activeSection.parentElement.id === 'itemsSection') {

                    const shopContentDiv = document.querySelector('.shop-content');
                    if (shopContentDiv) {
                        // Remove from wrong parent and add to correct parent
                        activeSection.remove();
                        shopContentDiv.appendChild(activeSection);

                        
                        // Verify the fix

                    }
                }
                
                // Force display and visibility again
                activeSection.style.setProperty('display', 'block', 'important');
                activeSection.style.setProperty('visibility', 'visible', 'important');
                
                // Check all child elements
                const allChildren = activeSection.querySelectorAll('*');

                allChildren.forEach((child, index) => {
                    if (index < 5) { // Only log first 5 to avoid spam
                        const childStyle = window.getComputedStyle(child);

                    }
                });
                

                
                // ULTRA DEBUG: Check parent chain visibility
                let parent = activeSection.parentElement;
                level = 0;
                while (parent && level < 5) {
                    const computedStyle = window.getComputedStyle(parent);

                    parent = parent.parentElement;
                    level++;
                }
                
                // Check our own computed styles vs inline styles

            }
            
            // Debug: Log the final state
            
        }
        
        if (itemsTab && ringsTab && itemsSection && ringsSection) {

            
            // Don't clone - just add listeners directly
            const newItemsTab = itemsTab;
            const newRingsTab = ringsTab;
            
            newItemsTab.addEventListener('click', function() {

                switchTab(newItemsTab, itemsSection, newRingsTab, ringsSection);
            });
            
            newRingsTab.addEventListener('click', function() {

                switchTab(newRingsTab, ringsSection, newItemsTab, itemsSection);
            });
            

            

            

            
            // Temporary fix: Force rings section to be visible with inline styles
            if (ringsSection) {
                ringsSection.style.display = 'block !important';
                ringsSection.style.visibility = 'visible !important';
                ringsSection.style.height = 'auto !important';
                ringsSection.style.minHeight = '200px';
                ringsSection.style.width = '100%';
                ringsSection.style.overflow = 'visible !important';
                ringsSection.style.position = 'relative';
                ringsSection.style.zIndex = '1000';
                ringsSection.style.background = 'rgba(255, 0, 0, 0.1)'; // Red background for debugging
                ringsSection.style.border = '2px solid red'; // Red border for debugging
                
                // Also force the child elements to be visible
                const shopItems = ringsSection.querySelector('.shop-items');
                if (shopItems) {
                    shopItems.style.display = 'block !important';
                    shopItems.style.height = 'auto !important';
                    shopItems.style.minHeight = '100px';
                }
                
    
                
            }
            
            // Shop tabs initialized successfully
        } else {
            console.error('Shop tab elements not found - check HTML structure');
        }
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
                this.updateRingIcons(); // Update ring icons
            }
        } else {
            // Handle purchase
            if (this.playerProfile.purchaseMasteryRing(elementType)) {
                this.updateShopDisplay();
                this.updateDiamondDisplay(); // Update header display
                this.updateRingIcons(); // Update ring icons
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
            { id: 'sessionWindBladesDamage', key: 'windBlades', label: 'Wind Blades' },
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
    
    renderCanvasUI() {
        if (!this.player) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        // Fallback for roundRect if not supported
        if (!ctx.roundRect) {
            ctx.roundRect = function(x, y, width, height, radius) {
                this.beginPath();
                this.moveTo(x + radius, y);
                this.lineTo(x + width - radius, y);
                this.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.lineTo(x + width, y + height - radius);
                this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.lineTo(x + radius, y + height);
                this.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.lineTo(x, y + radius);
                this.quadraticCurveTo(x, y, x + radius, y);
                this.closePath();
            };
        }
        
        // Modern compact health bar
        const healthBarWidth = 120;
        const healthBarHeight = 8;
        const healthBarX = 15;
        const healthBarY = 15;
        
        // Health bar background (rounded)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4, 4);
        ctx.fill();
        
        // Health bar border (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 3);
        ctx.stroke();
        
        // Health bar fill (gradient)
        const healthPercent = this.player.health / this.player.maxHealth;
        const gradient = ctx.createLinearGradient(healthBarX, 0, healthBarX + healthBarWidth, 0);
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#4ade80'); // green
            gradient.addColorStop(1, '#22c55e');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#fbbf24'); // yellow
            gradient.addColorStop(1, '#f59e0b');
        } else {
            gradient.addColorStop(0, '#ef4444'); // red
            gradient.addColorStop(1, '#dc2626');
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(healthBarX + 1, healthBarY + 1, (healthBarWidth - 2) * healthPercent, healthBarHeight - 2, 2);
        ctx.fill();
        
        // Health text (compact)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.floor(this.player.health)}`, healthBarX + healthBarWidth + 8, healthBarY + 6);
        
        // Modern compact XP bar
        const xpBarY = healthBarY + healthBarHeight + 8;
        
        // XP bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(healthBarX - 2, xpBarY - 2, healthBarWidth + 4, healthBarHeight + 4, 4);
        ctx.fill();
        
        // XP bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(healthBarX, xpBarY, healthBarWidth, healthBarHeight, 3);
        ctx.stroke();
        
        // XP bar fill (blue gradient)
        const xpPercent = this.player.xp / this.player.xpToNext;
        const xpGradient = ctx.createLinearGradient(healthBarX, 0, healthBarX + healthBarWidth, 0);
        xpGradient.addColorStop(0, '#3b82f6');
        xpGradient.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = xpGradient;
        ctx.beginPath();
        ctx.roundRect(healthBarX + 1, xpBarY + 1, (healthBarWidth - 2) * xpPercent, healthBarHeight - 2, 2);
        ctx.fill();
        
        // XP text (compact)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`Lv.${this.player.level}`, healthBarX + healthBarWidth + 8, xpBarY + 6);
        
        // Top-right UI elements (Timer, Score)
        const rightX = this.width - 15;
        const rightY = 15;
        
        // Timer background
        const timerText = `${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        const timerWidth = ctx.measureText(timerText).width + 16;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(rightX - timerWidth, rightY - 2, timerWidth, 18, 9);
        ctx.fill();
        
        // Timer text
        ctx.fillStyle = '#ff8800';
        ctx.fillText(`⏱️ ${timerText}`, rightX - 8, rightY + 11);
        
        // Score background
        const scoreText = this.score.toLocaleString();
        const scoreY = rightY + 25;
        const scoreWidth = ctx.measureText(scoreText).width + 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(rightX - scoreWidth, scoreY - 2, scoreWidth, 18, 9);
        ctx.fill();
        
        // Score text
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`🏆 ${scoreText}`, rightX - 8, scoreY + 11);
        
        ctx.restore();
    }
}