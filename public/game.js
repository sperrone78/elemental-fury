class Game {
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
        this.targetFPS = 60;
        this.fixedTimeStep = 1 / this.targetFPS;
        
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
                    let xpCount = 5; // Basic boss
                    let scoreReward = 100;
                    
                    if (enemy.isElite) {
                        xpCount = 12; // Elite boss - highest reward
                        scoreReward = 200;
                    } else if (enemy.isVeteran) {
                        xpCount = 8; // Veteran boss - medium reward
                        scoreReward = 150;
                    }
                    
                    for (let i = 0; i < xpCount; i++) {
                        this.createXPPickup(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40);
                    }
                    this.score += scoreReward;
                } else if (enemy.isElite) {
                    this.recordEnemyKill('elite');
                    this.pickups.push(new EliteXPPickup(enemy.x, enemy.y));
                    this.score += 50;
                } else if (enemy.isVeteran) {
                    this.recordEnemyKill('veteran');
                    this.pickups.push(new VeteranXPPickup(enemy.x, enemy.y));
                    this.score += 25;
                } else {
                    this.recordEnemyKill('basic');
                    this.createXPPickup(enemy.x, enemy.y);
                    this.score += 10;
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
                            { id: 'finalMissilesDamage', parentId: 'finalMissilesDamageRow', value: this.sessionStats.damageDealt.missiles },
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
            } else {
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
        }
    }
    
    handleCollisions() {
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (this.checkCollision(projectile, enemy)) {
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
            if (this.checkCollision(this.player, enemy)) {
                let damage = 30;
                if (enemy.isBoss) damage = 50;
                else if (enemy.isElite) damage = 40;
                else if (enemy.isVeteran) damage = 35;
                
                this.player.takeDamage(damage);
                
                if (!enemy.isBoss && !enemy.isElite) {
                    enemy.shouldRemove = true;
                }
            }
        });
        
        this.enemyProjectiles.forEach(projectile => {
            if (this.checkCollision(this.player, projectile)) {
                this.player.takeDamage(15);
                projectile.shouldRemove = true;
            }
        });
    }
    
    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }
    
    checkXPPickupCollision(player, pickup) {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Base collection range (smaller, for actual pickup)
        const collectionRange = player.radius + pickup.radius + 5;
        
        return distance < collectionRange;
    }
    
    updateXPPickupVortex(pickup) {
        const xpVortexLevel = this.playerProfile.shopUpgrades.xpVortex;
        if (xpVortexLevel === 0) return; // No vortex effect
        
        const dx = this.player.x - pickup.x;
        const dy = this.player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Vortex attraction range (larger than collection range)
        const baseRange = this.player.radius + pickup.radius + 20;
        const vortexRange = baseRange * (1 + (xpVortexLevel * 0.5)); // 50% increase per level
        
        if (distance < vortexRange && distance > 5) { // Don't attract if too close
            // Calculate attraction force based on distance and vortex level
            const attraction = (xpVortexLevel * 0.3 + 0.5) * (vortexRange - distance) / vortexRange;
            const speed = Math.min(attraction * 200 * this.deltaTime, distance * 0.8); // Max speed to prevent overshooting
            
            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move pickup towards player
            pickup.x += dirX * speed;
            pickup.y += dirY * speed;
            
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
        
        if (playerLevel >= 20) {
            // Elite enemies start appearing at level 20
            const eliteChance = Math.min(50, (playerLevel - 20) * 2); // 2% per level after 20, max 50%
            const veteranChance = Math.min(70, (playerLevel - 10) * 5); // 5% per level after 10, max 70%
            
            const roll = Math.random() * 100;
            if (roll < eliteChance) {
                enemy = new EliteEnemy(x, y);
            } else if (roll < eliteChance + veteranChance) {
                enemy = new VeteranEnemy(x, y);
            } else {
                enemy = new Enemy(x, y);
            }
        } else if (playerLevel >= 10) {
            // Veteran enemies start appearing at level 10
            const veteranChance = Math.min(80, (playerLevel - 10) * 8); // 8% per level after 10, max 80%
            
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
        
        // Debug: Check if all bosses in array have game reference
        const bossesInArray = this.enemies.filter(e => e.isBoss);
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
        
        // Diamond display is updated separately after game completion
        
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
        
        // Current session stats are now updated via updateCurrentSessionDisplay() during gameplay
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
        
        // Update detailed damage breakdown for current session
        document.getElementById('sessionBasicDamage').textContent = formatNumber(this.sessionStats.damageDealt.basicWeapon);
        document.getElementById('sessionFireballDamage').textContent = formatNumber(this.sessionStats.damageDealt.fireball);
        document.getElementById('sessionWaterGlobeDamage').textContent = formatNumber(this.sessionStats.damageDealt.waterGlobe);
        document.getElementById('sessionMissilesDamage').textContent = formatNumber(this.sessionStats.damageDealt.missiles);
        document.getElementById('sessionTremorsDamage').textContent = formatNumber(this.sessionStats.damageDealt.tremors);
        document.getElementById('sessionChainLightningDamage').textContent = formatNumber(this.sessionStats.damageDealt.chainLightning);
        document.getElementById('sessionEarthquakeDamage').textContent = formatNumber(this.sessionStats.damageDealt.earthquakeStormp);
        document.getElementById('sessionThunderStormDamage').textContent = formatNumber(this.sessionStats.damageDealt.thunderStorm);
        document.getElementById('sessionTornadoDamage').textContent = formatNumber(this.sessionStats.damageDealt.tornadoVortex);
        document.getElementById('sessionInfernoDamage').textContent = formatNumber(this.sessionStats.damageDealt.infernoWave);
        document.getElementById('sessionTotalDamage').textContent = formatNumber(this.sessionStats.damageDealt.total);
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 3;
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 10;
        
        this.weapons = [];
        this.game = null;
        this.weaponCooldowns = {};
        
        this.upgradeCount = {
            water: 0,    // was health
            earth: 0,    // was speed  
            fire: 0,     // was damage
            lightning: 0, // was fireRate
            air: 0       // was range
        };
        
        // New progression system tracking
        this.chosenElements = []; // Max 3 distinct elements per run
        this.masteryRings = []; // Max 2 equipped rings (from PlayerProfile)
        this.allElementsMasteredShown = false; // Flag to track if mastery message has been shown
        
        this.specialAbilities = {
            radiusAttack: false,
            fireball: false,
            missiles: false,
            shield: false,
            lightning: false,
            // Advanced abilities (level 6)
            freezingTouch: false,
            infernoWave: false,
            earthquakeStormp: false,
            tornadoVortex: false,
            thunderStorm: false
        };
        
        // Water globes array
        this.waterGlobes = [];
        
        this.shieldHealth = 0;
        this.maxShieldHealth = 50;
        this.healthRegen = 0;
        this.armor = 0;
        
        // Invincibility frames system
        this.invulnerable = false; // No starting invincibility
        this.invulnerabilityTime = 0;
        this.maxInvulnerabilityTime = 3.0;
        this.lastDamageTime = 0;
        this.damageCooldown = 0.5; // 0.5 seconds between damage instances
        
        // Fireball system
        this.fireballCooldown = 0;
        this.lastFireballTime = 0;
    }
    
    update(keys, mousePos, deltaTime) {
        // Handle invincibility frames
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        let dx = 0, dy = 0;
        
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.x += dx * this.speed * deltaTime * 60; // Multiply by 60 to maintain same speed as before
        this.y += dy * this.speed * deltaTime * 60;
        
        this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));
        
        this.weapons.forEach(weapon => weapon.update(mousePos, deltaTime));
        
        if (this.specialAbilities.fireball) {
            this.updateFireball();
        }
        
        if (this.specialAbilities.radiusAttack) {
            this.updateRadiusAttack();
        }
        
        if (this.specialAbilities.lightning) {
            this.updateLightningStrike();
        }
        
        if (this.specialAbilities.tornadoVortex) {
            this.updateTornadoVortex();
        }
        
        if (this.specialAbilities.earthquakeStormp) {
            this.updateEarthquakeStormp();
        }
        
        if (this.specialAbilities.thunderStorm) {
            this.updateThunderStorm();
        }
        
        // Update water globes
        this.waterGlobes.forEach(globe => globe.update(deltaTime));
        
        // Health regeneration
        if (this.healthRegen > 0) {
            if (!this.lastRegenTick) this.lastRegenTick = this.game.gameTime;
            if (this.game.gameTime - this.lastRegenTick >= 1) {
                this.health = Math.floor(Math.min(this.maxHealth, this.health + this.healthRegen));
                this.lastRegenTick = this.game.gameTime;
            }
        }
    }
    
    render(ctx) {
        if (this.specialAbilities.radiusAttack) {
            const earthLevel = this.upgradeCount.earth || 0;
            
            // Calculate current tremor range (same logic as in updateRadiusAttack)
            let tremorRange = 80; // Base range
            if (earthLevel >= 2) {
                tremorRange = 80 + (earthLevel - 1) * 20; // +20px per level: 100, 120, 140, 160
            }
            
            // Show faint outline of tremor range
            ctx.strokeStyle = `rgba(139, 69, 19, 0.2)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]); // Dashed line for subtlety
            ctx.beginPath();
            ctx.arc(this.x, this.y, tremorRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
            
            // Add subtle pulse effect when tremors are active
            if (!this.tremorCooldown) this.tremorCooldown = 0;
            const timeSinceTremor = this.game.gameTime - this.tremorCooldown;
            if (timeSinceTremor < 0.1) { // Brief flash when tremor pulses
                const pulseAlpha = (0.1 - timeSinceTremor) / 0.1;
                ctx.strokeStyle = `rgba(139, 69, 19, ${pulseAlpha * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, tremorRange, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        if (this.specialAbilities.shield && this.shieldHealth > 0) {
            const shieldAlpha = this.shieldHealth / this.maxShieldHealth;
            ctx.strokeStyle = `rgba(0, 255, 255, ${shieldAlpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Show invincibility visual feedback
        if (this.invulnerable) {
            const flashSpeed = 8; // Flash speed
            const flashAlpha = Math.sin(this.game.gameTime * flashSpeed) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(74, 158, 255, ${flashAlpha})`;
            
            // Draw protective glow
            ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4a9eff';
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Render water globes
        this.waterGlobes.forEach(globe => globe.render(ctx));
    }
    
    
    gainXP(amount) {
        this.xp += amount;
        this.game.sessionStats.xpGained += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNext = Math.floor(this.xpToNext * 1.2);
        
        
        // Mark that we need to spawn a boss after upgrade menu closes
        if (this.level === 5 || this.level === 10 || 
            this.level === 15 || this.level === 20 || 
            this.level === 25 || this.level === 30) {
            this.game.pendingBossSpawn = true;
        }
        
        // Check if all elements are mastered and we've already shown the message
        const availableUpgrades = this.game.upgradeSystem.getRandomUpgrades(3);
        if (availableUpgrades.length === 0 && this.allElementsMasteredShown) {
            // All elements mastered and message already shown - skip upgrade screen
            return;
        }
        
        this.game.upgradeSystem.showUpgradeMenu();
    }
    
    updateFireball() {
        // Calculate fireball cooldown based on fire mastery level
        const fireLevel = this.upgradeCount.fire || 0;
        let cooldown = 2.0; // Base 2 second cooldown
        
        if (fireLevel >= 2) {
            // Levels 2-5 reduce cooldown progressively
            const reduction = (fireLevel - 1) * 0.25; // 0.25s reduction per level after 1
            cooldown = Math.max(0.5, cooldown - reduction);
        }
        
        if (this.game.gameTime - this.lastFireballTime >= cooldown) {
            // Find closest enemy in range
            const fireballRange = 200; // Fireball range
            let closestEnemy = null;
            let closestDistance = fireballRange;
            
            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            if (closestEnemy) {
                // Fire fireball at closest enemy
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                const damage = this.weapons[0] ? this.weapons[0].damage : 20; // Use base weapon damage
                const range = 200; // Fireball range
                
                const fireball = new FireballProjectile(this.x, this.y, dirX, dirY, damage, range);
                this.game.projectiles.push(fireball);
                
                this.lastFireballTime = this.game.gameTime;
            }
        }
    }
    
    updateRadiusAttack() {
        if (!this.tremorCooldown) this.tremorCooldown = 0;
        
        const earthLevel = this.upgradeCount.earth || 0;
        
        // Ongoing AOE damage every 0.5 seconds
        const pulseInterval = 0.5;
        
        if (this.game.gameTime - this.tremorCooldown >= pulseInterval) {
            // Calculate range based on earth level (levels 2-5 increase range)
            let tremorRange = 80; // Base range
            if (earthLevel >= 2) {
                tremorRange = 80 + (earthLevel - 1) * 20; // +20px per level: 100, 120, 140, 160
            }
            
            // Calculate damage with level scaling  
            const baseDamage = 18; // Further reduced for better balance
            const damage = baseDamage + (earthLevel >= 2 ? (earthLevel - 1) * 2 : 0); // +2 damage per level
            
            let enemiesHit = 0;
            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= tremorRange) {
                    enemy.takeDamage(damage);
                    this.game.recordDamage('tremors', damage);
                    enemiesHit++;
                    
                    // Add ground crack particle effects
                    this.game.particles.push(new TremorParticle(enemy.x, enemy.y));
                }
            });
            
            // Visual feedback when tremors are active and hitting enemies
            if (enemiesHit > 0) {
                // Add screen shake effect
                this.game.screenShake = Math.min(this.game.screenShake + 2, 8);
                
                // Add central tremor particles around player
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * tremorRange * 0.7;
                    const px = this.x + Math.cos(angle) * dist;
                    const py = this.y + Math.sin(angle) * dist;
                    this.game.particles.push(new TremorParticle(px, py));
                }
            }
            
            this.tremorCooldown = this.game.gameTime;
        }
    }
    
    updateLightningStrike() {
        if (!this.lightningCooldown) this.lightningCooldown = 0;
        
        if (this.game.gameTime - this.lightningCooldown >= 2) {
            const enemiesInRange = this.game.enemies.filter(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= 150;
            });
            
            if (enemiesInRange.length > 0) {
                const baseChains = 4; // Increased from 3 to 4 for better chaining
                const bonusChains = Math.max(0, this.upgradeCount.lightning - 1); // +1 chain per level
                const totalChains = baseChains + Math.max(0, bonusChains);
                
                this.performLightningChain(enemiesInRange[0], enemiesInRange, totalChains, 30);
                this.lightningCooldown = this.game.gameTime;
            }
        }
    }
    
    performLightningChain(startEnemy, availableEnemies, bouncesLeft, damage) {
        if (bouncesLeft <= 0 || !startEnemy) return;
        
        startEnemy.takeDamage(damage);
        this.game.recordDamage('chainLightning', damage);
        
        let fromX = this.x;
        let fromY = this.y;
        
        if (bouncesLeft < 4) {
            const previousTarget = availableEnemies.find(e => e.wasLastLightningTarget);
            if (previousTarget) {
                fromX = previousTarget.x;
                fromY = previousTarget.y;
                previousTarget.wasLastLightningTarget = false;
            }
        }
        
        this.game.particles.push(new LightningBolt(fromX, fromY, startEnemy.x, startEnemy.y));
        startEnemy.wasLastLightningTarget = true;
        
        if (bouncesLeft > 1) {
            const nearbyEnemies = availableEnemies.filter(enemy => {
                if (enemy === startEnemy) return false;
                const dx = enemy.x - startEnemy.x;
                const dy = enemy.y - startEnemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= 300; // Increased to 3/8 of map width for better chaining
            });
            
            if (nearbyEnemies.length > 0) {
                const nextTarget = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                this.game.particles.push(new DelayedLightningChain(this, nextTarget, availableEnemies, bouncesLeft - 1, damage * 0.8, 0.1));
            }
        }
    }
    
    takeDamage(damage) {
        // Check invincibility frames
        if (this.invulnerable) {
            return; // No damage during invincibility
        }
        
        // Check damage cooldown to prevent multiple hits in rapid succession
        if (this.game.gameTime - this.lastDamageTime < this.damageCooldown) {
            return;
        }
        
        this.lastDamageTime = this.game.gameTime;
        
        // Apply armor reduction
        const actualDamage = Math.max(1, damage - this.armor);
        
        if (this.specialAbilities.shield && this.shieldHealth > 0) {
            this.shieldHealth -= actualDamage;
            if (this.shieldHealth < 0) {
                this.health += this.shieldHealth;
                this.shieldHealth = 0;
            }
        } else {
            this.health -= actualDamage;
        }
        
        // Add brief invincibility after taking damage (0.5 seconds)
        this.invulnerable = true;
        this.invulnerabilityTime = 0.5;
        
        // Freezing Touch activation
        if (this.specialAbilities.freezingTouch) {
            this.activateFreezingTouch();
        }
        
        if (this.health <= 0) {
            this.game.gameOver = true;
            this.game.gameState = 'gameOver';
            
            // Update player profile with session stats and diamond display
            this.game.playerProfile.updateGameStats(this.game.sessionStats);
            this.game.updateDiamondDisplay();
            this.game.updateProfileUI();
        }
    }
    
    activateFreezingTouch() {
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= 60) {
                enemy.frozen = true;
                enemy.frozenTime = 3; // 3 seconds
                this.game.particles.push(new IceRing(this.x, this.y, 60));
            }
        });
    }
    
    updateTornadoVortex() {
        if (!this.tornadoCooldown) this.tornadoCooldown = 0;
        
        if (this.game.gameTime - this.tornadoCooldown >= 2.5) { // Spawn tornado every 2.5 seconds (was 5)
            // Spawn tornado near player but not on top of them
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100; // 50-150 pixels from player
            const tornadoX = this.x + Math.cos(angle) * distance;
            const tornadoY = this.y + Math.sin(angle) * distance;
            
            // Keep tornado within bounds
            const clampedX = Math.max(50, Math.min(750, tornadoX));
            const clampedY = Math.max(50, Math.min(550, tornadoY));
            
            this.game.particles.push(new Tornado(clampedX, clampedY, this.game));
            this.tornadoCooldown = this.game.gameTime;
        }
    }
    
    updateEarthquakeStormp() {
        if (!this.earthquakeCooldown) this.earthquakeCooldown = 0;
        
        if (this.game.gameTime - this.earthquakeCooldown >= 8) { // Earthquake every 8 seconds
            // Create massive earthquake effect centered on player
            this.createEarthquake();
            this.earthquakeCooldown = this.game.gameTime;
        }
    }
    
    createEarthquake() {
        const maxRadius = 150;
        const damage = 80;
        
        // Damage all enemies within earthquake radius
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= maxRadius) {
                // Scale damage based on distance (more damage closer to epicenter)
                const scaledDamage = damage * (1 - distance / maxRadius * 0.5);
                const finalDamage = Math.floor(scaledDamage);
                enemy.takeDamage(finalDamage);
                this.game.recordDamage('earthquakeStormp', finalDamage);
                
                // Stun enemies briefly
                enemy.stunned = true;
                enemy.stunnedTime = 1.5;
            }
        });
        
        // Create visual earthquake effect
        this.game.particles.push(new EarthquakeWave(this.x, this.y, maxRadius));
        
        // Create multiple shockwave rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.game.particles.push(new ShockwaveRing(this.x, this.y, maxRadius * (i + 1) / 3, i * 0.2));
            }, i * 200);
        }
        
        // Create debris particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const debrisDistance = 30 + Math.random() * 60;
            const debrisX = this.x + Math.cos(angle) * debrisDistance;
            const debrisY = this.y + Math.sin(angle) * debrisDistance;
            this.game.particles.push(new DebrisParticle(debrisX, debrisY));
        }
    }
    
    updateThunderStorm() {
        if (!this.thunderStormCooldown) this.thunderStormCooldown = 0;
        
        if (this.game.gameTime - this.thunderStormCooldown >= 6) { // Thunder storm every 6 seconds
            this.createThunderStorm();
            this.thunderStormCooldown = this.game.gameTime;
        }
    }
    
    createThunderStorm() {
        const strikesCount = 8; // Number of lightning strikes
        const stormRadius = 200; // Area where strikes can occur
        const baseDamage = 60;
        
        // Create multiple lightning strikes across the battlefield
        for (let i = 0; i < strikesCount; i++) {
            setTimeout(() => {
                // Pick a random location within storm radius, preferring areas with enemies
                let targetX, targetY;
                
                // Try to target near enemies 70% of the time
                if (Math.random() < 0.7 && this.game.enemies.length > 0) {
                    const randomEnemy = this.game.enemies[Math.floor(Math.random() * this.game.enemies.length)];
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 80; // Strike within 80 pixels of enemy
                    targetX = randomEnemy.x + Math.cos(angle) * distance;
                    targetY = randomEnemy.y + Math.sin(angle) * distance;
                } else {
                    // Random location around player
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * stormRadius;
                    targetX = this.x + Math.cos(angle) * distance;
                    targetY = this.y + Math.sin(angle) * distance;
                }
                
                // Keep within bounds
                targetX = Math.max(20, Math.min(780, targetX));
                targetY = Math.max(20, Math.min(580, targetY));
                
                this.createLightningStrike(targetX, targetY, baseDamage);
            }, i * 150); // Stagger strikes by 150ms
        }
        
        // Create storm clouds visual effect
        this.game.particles.push(new StormClouds(this.x, this.y, stormRadius));
    }
    
    createLightningStrike(x, y, damage) {
        const strikeRadius = 40;
        
        // Damage enemies in strike area
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= strikeRadius) {
                // Scale damage based on distance from strike center
                const scaledDamage = damage * (1 - distance / strikeRadius * 0.3);
                const finalDamage = Math.floor(scaledDamage);
                enemy.takeDamage(finalDamage);
                this.game.recordDamage('thunderStorm', finalDamage);
                
                // Brief paralysis effect
                enemy.stunned = true;
                enemy.stunnedTime = 0.5;
            }
        });
        
        // Create lightning strike visual effects
        this.game.particles.push(new ThunderBolt(x, y - 50, x, y)); // Strike from above
        this.game.particles.push(new LightningImpact(x, y, strikeRadius));
        
        // Create electric sparks around impact
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const sparkX = x + Math.cos(angle) * (strikeRadius * 0.7);
            const sparkY = y + Math.sin(angle) * (strikeRadius * 0.7);
            this.game.particles.push(new ElectricSpark(sparkX, sparkY));
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 1;
        this.health = 30;
        this.maxHealth = 30;
        this.shouldRemove = false;
        this.isBoss = false;
        this.frozen = false;
        this.frozenTime = 0;
        this.stunned = false;
        this.stunnedTime = 0;
    }
    
    update(player, deltaTime) {
        // Handle frozen state
        if (this.frozen) {
            this.frozenTime -= deltaTime;
            if (this.frozenTime <= 0) {
                this.frozen = false;
            }
            return; // Don't move when frozen
        }
        
        // Handle stunned state
        if (this.stunned) {
            this.stunnedTime -= deltaTime;
            if (this.stunnedTime <= 0) {
                this.stunned = false;
            }
            return; // Don't move when stunned
        }
        
        // Validate player and enemy coordinates before movement calculation
        if (!player || isNaN(player.x) || isNaN(player.y) || isNaN(this.x) || isNaN(this.y)) {
            console.warn('Invalid coordinates detected in Enemy update:', {
                playerX: player?.x,
                playerY: player?.y,
                enemyX: this.x,
                enemyY: this.y
            });
            return; // Skip movement if coordinates are invalid
        }
        
        // Debug logging for VeteranBoss movement - focus on stuck ones
        if (this.isVeteran && this.health === 300 && Math.random() < 0.05) { // Focus on full-health (level-up) bosses
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Debug stuck level-up bosses
        
        if (distance > 0 && !isNaN(distance)) {
            const moveX = (dx / distance) * this.speed * deltaTime * 60;
            const moveY = (dy / distance) * this.speed * deltaTime * 60;
            
            
            // Validate movement before applying
            if (!isNaN(moveX) && !isNaN(moveY)) {
                this.x += moveX;
                this.y += moveY;
            }
        }
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#ff4444';
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.frozen || this.stunned) {
            ctx.stroke();
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
}

class BossEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.speed = 0.7;
        this.health = 200;
        this.maxHealth = 200;
        this.isBoss = true;
        this.lastShot = 0;
        this.shootCooldown = 1.5;
        this.game = null;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game && this.game.gameTime - this.lastShot >= this.shootCooldown) {
            this.shootAtPlayer(player);
            this.lastShot = this.game.gameTime;
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            this.game.enemyProjectiles.push(new EnemyProjectile(
                this.x, this.y, dirX, dirY
            ));
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#aa1111';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * (1 - healthPercent), 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 10, this.radius * 2 * healthPercent, 4);
    }
}

class VeteranBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.speed = 0.8;
        this.health = 300;
        this.maxHealth = 300;
        this.isBoss = true;
        this.isVeteran = true;
        this.lastShot = 0;
        this.shootCooldown = 1.2;
        this.lastSpikeBarrage = 0;
        this.spikeBarrageCooldown = 4;
        this.game = null;
        
        // Track initial position for debug
        this.initialX = this.x;
        this.initialY = this.y;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game) {
            // Regular shooting
            if (this.game.gameTime - this.lastShot >= this.shootCooldown) {
                this.shootAtPlayer(player);
                this.lastShot = this.game.gameTime;
            }
            
            // Spike Barrage special ability
            if (this.game.gameTime - this.lastSpikeBarrage >= this.spikeBarrageCooldown) {
                this.spikeBarrage(player);
                this.lastSpikeBarrage = this.game.gameTime;
            }
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            this.game.enemyProjectiles.push(new EnemyProjectile(
                this.x, this.y, dirX, dirY
            ));
        }
    }
    
    spikeBarrage(player) {
        // Fire 8 spikes in all directions
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            setTimeout(() => {
                this.game.enemyProjectiles.push(new SpikeProjectile(
                    this.x, this.y, dirX, dirY
                ));
            }, i * 50); // Stagger spike shots
        }
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = '#cc4400';
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw spikes around the boss
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const spikeX = this.x + Math.cos(angle) * this.radius;
            const spikeY = this.y + Math.sin(angle) * this.radius;
            const tipX = this.x + Math.cos(angle) * (this.radius + 8);
            const tipY = this.y + Math.sin(angle) * (this.radius + 8);
            
            ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#990000');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 15, this.radius * 2 * (1 - healthPercent), 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 15, this.radius * 2 * healthPercent, 6);
    }
}

class EliteBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 35;
        this.speed = 0.9;
        this.health = 400;
        this.maxHealth = 400;
        this.isBoss = true;
        this.isElite = true;
        this.armor = 10;
        this.lastShot = 0;
        this.shootCooldown = 1;
        this.lastDominance = 0;
        this.dominanceCooldown = 6;
        this.game = null;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game) {
            // Faster shooting than other bosses
            if (this.game.gameTime - this.lastShot >= this.shootCooldown) {
                this.shootAtPlayer(player);
                this.lastShot = this.game.gameTime;
            }
            
            // Royal Dominance special ability
            if (this.game.gameTime - this.lastDominance >= this.dominanceCooldown) {
                this.royalDominance();
                this.lastDominance = this.game.gameTime;
            }
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(dirY, dirX) + i * 0.2;
                const shotDirX = Math.cos(angle);
                const shotDirY = Math.sin(angle);
                
                this.game.enemyProjectiles.push(new EnemyProjectile(
                    this.x, this.y, shotDirX, shotDirY
                ));
            }
        }
    }
    
    royalDominance() {
        // Summon 3 veteran enemies around the boss
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3;
            const spawnX = this.x + Math.cos(angle) * 80;
            const spawnY = this.y + Math.sin(angle) * 80;
            
            // Keep spawns within bounds
            const clampedX = Math.max(20, Math.min(780, spawnX));
            const clampedY = Math.max(20, Math.min(580, spawnY));
            
            const summonedEnemy = new VeteranEnemy(clampedX, clampedY);
            this.game.enemies.push(summonedEnemy);
        }
        
        // Create summon effect
        this.game.particles.push(new SummonRing(this.x, this.y, 80));
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.armor);
        this.health -= actualDamage;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 4;
        } else {
            ctx.fillStyle = '#6600cc';
            ctx.strokeStyle = '#9944ff';
            ctx.lineWidth = 4;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Double ring for elite status
        ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#bb66ff');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 12, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 12, this.y - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Elite crown - larger and more elaborate
        ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#ffff00');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.radius + 5);
        ctx.lineTo(this.x - 8, this.y - this.radius - 8);
        ctx.lineTo(this.x - 4, this.y - this.radius + 2);
        ctx.lineTo(this.x, this.y - this.radius - 12);
        ctx.lineTo(this.x + 4, this.y - this.radius + 2);
        ctx.lineTo(this.x + 8, this.y - this.radius - 8);
        ctx.lineTo(this.x + 15, this.y - this.radius + 5);
        ctx.stroke();
        
        // Health bar - thicker for elite boss
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 20, this.radius * 2 * (1 - healthPercent), 8);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 20, this.radius * 2 * healthPercent, 8);
    }
}

class VeteranEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 14;
        this.speed = 1.2;
        this.health = 120;
        this.maxHealth = 120;
        this.isVeteran = true;
        this.xpReward = 15;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#ff8800';
            ctx.strokeStyle = '#ffaa44';
            ctx.lineWidth = 2;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Veterans have spikes
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const spikeX = this.x + Math.cos(angle) * this.radius;
            const spikeY = this.y + Math.sin(angle) * this.radius;
            const tipX = this.x + Math.cos(angle) * (this.radius + 4);
            const tipY = this.y + Math.sin(angle) * (this.radius + 4);
            
            ctx.strokeStyle = this.frozen ? '#ffffff' : '#cc6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }
    }
}

class EliteEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 16;
        this.speed = 1.4;
        this.health = 250;
        this.maxHealth = 250;
        this.isElite = true;
        this.xpReward = 30;
        this.armor = 5;
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.armor);
        this.health -= actualDamage;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = '#8800ff';
            ctx.strokeStyle = '#aa44ff';
            ctx.lineWidth = 3;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Elite enemies have a double ring
        ctx.strokeStyle = this.frozen ? '#ffffff' : '#cc88ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Elite crown effect
        ctx.strokeStyle = this.frozen ? '#ffffff' : '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y - this.radius + 2);
        ctx.lineTo(this.x - 4, this.y - this.radius - 4);
        ctx.lineTo(this.x, this.y - this.radius + 2);
        ctx.lineTo(this.x + 4, this.y - this.radius - 4);
        ctx.lineTo(this.x + 8, this.y - this.radius + 2);
        ctx.stroke();
    }
}

class BasicWeapon {
    constructor(owner) {
        this.owner = owner;
        this.damage = 20;
        this.cooldown = 0.5;
        this.lastFire = 0;
        this.range = 200;
    }
    
    update(mousePos, deltaTime) {
        if (this.owner.game.gameTime - this.lastFire >= this.cooldown) {
            this.fire(mousePos);
            this.lastFire = this.owner.game.gameTime;
        }
    }
    
    fire(mousePos) {
        const dx = mousePos.x - this.owner.x;
        const dy = mousePos.y - this.owner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Basic weapon always fires regular projectiles now (fireball is separate)
            this.owner.game.projectiles.push(new Projectile(
                this.owner.x, this.owner.y,
                dirX, dirY,
                this.damage, this.range
            ));
            
            if (this.owner.specialAbilities.missiles) {
                // Get Air mastery level to determine number of missiles
                const airLevel = this.owner.upgradeCount.air || 0;
                const missileCount = Math.min(airLevel, 5); // Max 5 missiles
                
                // Missile angles in degrees (converted to radians)
                // 45°, 315°, 180°, 90°, 270°
                const missileAngles = [45, 315, 180, 90, 270];
                
                for (let i = 0; i < missileCount; i++) {
                    const angleInDegrees = missileAngles[i];
                    const angleInRadians = (angleInDegrees * Math.PI) / 180;
                    
                    this.owner.game.projectiles.push(new MissileProjectile(
                        this.owner.x, this.owner.y,
                        Math.cos(angleInRadians), Math.sin(angleInRadians),
                        this.damage * 0.7, this.range
                    ));
                }
            }
        }
    }
}

class Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = 8;
        this.damage = damage;
        this.range = range;
        this.traveled = 0;
        this.radius = 3;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        const movement = this.speed * deltaTime * 60;
        this.x += this.dirX * movement;
        this.y += this.dirY * movement;
        this.traveled += movement;
        
        if (this.traveled >= this.range || 
            this.x < 0 || this.x > 800 || 
            this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffff44';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnemyProjectile {
    constructor(x, y, dirX, dirY) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = 5;
        this.radius = 4;
        this.shouldRemove = false;
        this.maxDistance = 400;
        this.traveled = 0;
    }
    
    update(deltaTime) {
        const movement = this.speed * deltaTime * 60;
        this.x += this.dirX * movement;
        this.y += this.dirY * movement;
        this.traveled += movement;
        
        if (this.traveled >= this.maxDistance || 
            this.x < 0 || this.x > 800 || 
            this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffaa66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class SpikeProjectile {
    constructor(x, y, dirX, dirY) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = 6;
        this.radius = 5;
        this.shouldRemove = false;
        this.maxDistance = 350;
        this.traveled = 0;
        this.rotation = Math.atan2(dirY, dirX);
    }
    
    update(deltaTime) {
        const movement = this.speed * deltaTime * 60;
        this.x += this.dirX * movement;
        this.y += this.dirY * movement;
        this.traveled += movement;
        
        if (this.traveled >= this.maxDistance || 
            this.x < 0 || this.x > 800 || 
            this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Spike body - dark orange
        ctx.fillStyle = '#cc4400';
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(8, 0);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fill();
        
        // Spike tip - bright orange
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(6, -1);
        ctx.lineTo(8, 0);
        ctx.lineTo(6, 1);
        ctx.closePath();
        ctx.fill();
        
        // Spike glow
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(8, 0);
        ctx.lineTo(-8, 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

class FireballProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        super(x, y, dirX, dirY, damage, range);
        this.radius = 6;
        this.explosionRadius = 30;
    }
    
    render(ctx) {
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    explode(game) {
        const hitEnemies = [];
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                enemy.takeDamage(this.damage);
                hitEnemies.push(enemy);
                
                // Enhanced DOT based on fire mastery level
                const fireLevel = game.player.upgradeCount.fire || 0;
                const dotDamage = 5 + Math.max(0, (fireLevel - 1) * 1);
                const dotDuration = 3 + Math.max(0, (fireLevel - 1) * 0.5);
                
                game.dotEffects.push(new DOTEffect(enemy, dotDamage, dotDuration, 1));
            }
        });
        
        // Inferno Wave: Level 6 Fire creates chain explosions
        if (game.player.specialAbilities.infernoWave && hitEnemies.length > 0) {
            hitEnemies.forEach(hitEnemy => {
                this.createInfernoWave(game, hitEnemy.x, hitEnemy.y, this.damage * 0.6);
            });
        }
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            game.particles.push(new ExplosionParticle(
                this.x + Math.cos(angle) * 15,
                this.y + Math.sin(angle) * 15
            ));
        }
    }
    
    createInfernoWave(game, centerX, centerY, damage) {
        const infernoRadius = 200; // 1/4th screen size (800/4)
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= infernoRadius && distance > 5) { // Avoid hitting the same enemy twice
                enemy.takeDamage(damage);
                game.recordDamage('infernoWave', damage);
                
                // Add DOT to secondary explosion targets too
                const fireLevel = game.player.upgradeCount.fire || 0;
                const dotDamage = 3 + Math.max(0, (fireLevel - 1) * 0.5);
                const dotDuration = 2 + Math.max(0, (fireLevel - 1) * 0.25);
                
                game.dotEffects.push(new DOTEffect(enemy, dotDamage, dotDuration, 1));
            }
        });
        
        // Create visual effect for Inferno Wave
        game.particles.push(new InfernoWave(centerX, centerY, infernoRadius));
        
        // Create explosion particles around the inferno wave
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            game.particles.push(new ExplosionParticle(
                centerX + Math.cos(angle) * 20,
                centerY + Math.sin(angle) * 20
            ));
        }
    }
}

class MissileProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        super(x, y, dirX, dirY, damage, range);
        this.speed = 10;
        this.radius = 2;
    }
    
    render(ctx) {
        ctx.save();
        
        // Calculate angle of missile direction for rotation
        const angle = Math.atan2(this.dirY, this.dirX);
        
        // Move to missile position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        // Draw missile body (elongated rectangle)
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-6, -2, 10, 4);
        
        // Draw missile nose cone (triangle)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(8, -2);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw missile fins (small triangles at back)
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-8, -3);
        ctx.lineTo(-6, -1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.lineTo(-8, 3);
        ctx.lineTo(-6, 1);
        ctx.closePath();
        ctx.fill();
        
        // Draw exhaust trail (small orange rectangle)
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-10, -1, 4, 2);
        
        ctx.restore();
    }
}

class WaterGlobe {
    constructor(player, index) {
        this.player = player;
        this.index = index;
        this.radius = 5;
        this.orbitRadius = 45;
        this.damage = 15;
        this.angle = (index * Math.PI * 2) / Math.max(1, this.getGlobeCount()); // Evenly distribute globes
        this.rotationSpeed = 0.02; // Radians per frame
    }
    
    getGlobeCount() {
        // Get the current water mastery level to determine number of globes
        const waterLevel = this.player.upgradeCount.water || 0;
        return Math.min(waterLevel, 5); // Max 5 globes at level 5
    }
    
    update(deltaTime) {
        // Update angle for orbital motion
        this.angle += this.rotationSpeed;
        if (this.angle > Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }
        
        // Calculate position around player
        this.x = this.player.x + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.angle) * this.orbitRadius;
        
        // Check for enemy collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        const enemies = this.player.game.enemies;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.radius + enemy.radius) {
                // Damage enemy
                enemy.takeDamage(this.damage);
                this.player.game.recordDamage('waterGlobe', this.damage);
                
                // Create impact particle effect
                this.createImpactEffect();
                
                // Remove enemy if dead
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    this.player.game.score += enemy.scoreReward || 10;
                    this.player.game.pickups.push(new XPPickup(enemy.x, enemy.y, enemy.xpReward));
                }
            }
        }
    }
    
    createImpactEffect() {
        // Create water splash particles
        for (let i = 0; i < 5; i++) {
            this.player.game.particles.push(new WaterSplashParticle(this.x, this.y));
        }
    }
    
    render(ctx) {
        // Main globe
        ctx.fillStyle = '#4db8ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = '#80d4ff';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer glow effect
        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class WaterSplashParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.shouldRemove = false;
        this.radius = Math.random() * 2 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(77, 184, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class XPPickup {
    constructor(x, y, value = 5) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.value = value;
        this.type = 'xp';
    }
    
    render(ctx) {
        // Add visual effects when being attracted by vortex
        if (this.isBeingAttracted) {
            // Pulsing glow effect
            const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            const glowRadius = this.radius + 3;
            
            // Outer glow
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
            gradient.addColorStop(0, `rgba(0, 255, 136, ${pulseIntensity * 0.8})`);
            gradient.addColorStop(0.7, `rgba(0, 255, 136, ${pulseIntensity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trailing particles effect
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 2 + Math.random() * 4;
                const trailX = this.x - Math.cos(angle) * distance;
                const trailY = this.y - Math.sin(angle) * distance;
                
                ctx.fillStyle = `rgba(0, 255, 136, ${0.3 * pulseIntensity})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Main XP pellet
        ctx.fillStyle = this.isBeingAttracted ? '#00ffaa' : '#00ff88';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = this.isBeingAttracted ? '#88ffcc' : '#66ffaa';
        ctx.beginPath();
        ctx.arc(this.x - 1, this.y - 1, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class VeteranXPPickup extends XPPickup {
    constructor(x, y) {
        super(x, y, 15);
        this.radius = 8;
    }
    
    render(ctx) {
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class EliteXPPickup extends XPPickup {
    constructor(x, y) {
        super(x, y, 30);
        this.radius = 10;
        this.pulseTime = 0;
    }
    
    update(deltaTime) {
        this.pulseTime += deltaTime;
    }
    
    render(ctx) {
        const pulse = Math.sin(this.pulseTime * 8) * 0.3 + 0.7;
        
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Elite XP has sparkles
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4 + this.pulseTime * 2;
            const sparkleX = this.x + Math.cos(angle) * (this.radius + 8);
            const sparkleY = this.y + Math.sin(angle) * (this.radius + 8);
            
            ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class DOTEffect {
    constructor(target, damage, duration, interval) {
        this.target = target;
        this.damage = damage;
        this.duration = duration;
        this.interval = interval;
        this.lastTick = 0;
        this.startTime = 0;
        this.shouldRemove = false;
    }
    
    update(gameTime, deltaTime) {
        if (this.startTime === 0) this.startTime = gameTime;
        
        if (gameTime - this.startTime >= this.duration) {
            this.shouldRemove = true;
            return;
        }
        
        if (gameTime - this.lastTick >= this.interval) {
            if (this.target && this.target.health > 0) {
                this.target.takeDamage(this.damage);
            }
            this.lastTick = gameTime;
        }
    }
}

class ExplosionParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class LightningBolt {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 0.2;
        this.maxLife = 0.2;
        this.shouldRemove = false;
        this.segments = this.generateBoltSegments();
    }
    
    generateBoltSegments() {
        const segments = [];
        const numSegments = 8;
        const jitterAmount = 15;
        
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            let x = this.x1 + (this.x2 - this.x1) * t;
            let y = this.y1 + (this.y2 - this.y1) * t;
            
            if (i > 0 && i < numSegments) {
                x += (Math.random() - 0.5) * jitterAmount;
                y += (Math.random() - 0.5) * jitterAmount;
            }
            
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class DelayedLightningChain {
    constructor(player, target, availableEnemies, bouncesLeft, damage, delay) {
        this.player = player;
        this.target = target;
        this.availableEnemies = availableEnemies;
        this.bouncesLeft = bouncesLeft;
        this.damage = damage;
        this.delay = delay;
        this.timer = 0;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer >= this.delay) {
            if (this.target && this.target.health > 0) {
                // Use fresh enemy list to avoid stale references
                const freshEnemies = this.player.game.enemies;
                this.player.performLightningChain(this.target, freshEnemies, this.bouncesLeft, this.damage);
            } else {
                // Target is dead, try to find another nearby enemy to continue the chain
                const nearbyEnemies = this.player.game.enemies.filter(enemy => {
                    const dx = enemy.x - (this.target ? this.target.x : this.player.x);
                    const dy = enemy.y - (this.target ? this.target.y : this.player.y);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance <= 300;
                });
                
                if (nearbyEnemies.length > 0) {
                    const newTarget = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                    this.player.performLightningChain(newTarget, this.player.game.enemies, this.bouncesLeft, this.damage);
                }
            }
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // This particle doesn't render anything, it just manages timing
    }
}

class IceRing {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.strokeStyle = `rgba(136, 221, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class InfernoWave {
    constructor(x, y, maxRadius) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.currentRadius = 0;
        this.life = 0.4;
        this.maxLife = 0.4;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.currentRadius = this.maxRadius * (1 - this.life / this.maxLife);
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        const pulseIntensity = Math.sin((1 - this.life / this.maxLife) * Math.PI * 4) * 0.3 + 0.7;
        
        // Outer ring - bright orange/red
        ctx.strokeStyle = `rgba(255, 69, 0, ${alpha * pulseIntensity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring - bright yellow
        ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * pulseIntensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Core ring - white hot
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * pulseIntensity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Tornado {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.radius = 35; // Increased from 20
        this.life = 12; // Increased from 10 seconds
        this.maxLife = 12;
        this.shouldRemove = false;
        this.rotation = 0;
        this.damage = 45; // Increased from 25
        this.lastDamage = 0;
        this.damageInterval = 0.3; // Damage every 0.3 seconds (was 0.5)
        
        // Random movement properties
        this.vx = (Math.random() - 0.5) * 2; // Random velocity -1 to 1
        this.vy = (Math.random() - 0.5) * 2;
        this.changeDirectionTimer = 0;
        this.directionChangeInterval = 2; // Change direction every 2 seconds
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.rotation += 0.3 * deltaTime * 60; // Spin the tornado
        
        if (this.life <= 0) {
            this.shouldRemove = true;
            return;
        }
        
        // Random movement direction changes
        this.changeDirectionTimer += deltaTime;
        if (this.changeDirectionTimer >= this.directionChangeInterval) {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.changeDirectionTimer = 0;
        }
        
        // Move the tornado
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        
        // Bounce off walls
        if (this.x < this.radius || this.x > 800 - this.radius) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > 600 - this.radius) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));
        }
        
        // Damage enemies periodically
        if (this.game.gameTime - this.lastDamage >= this.damageInterval) {
            this.damageNearbyEnemies();
            this.lastDamage = this.game.gameTime;
        }
    }
    
    damageNearbyEnemies() {
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.radius) {
                enemy.takeDamage(this.damage);
                this.game.recordDamage('tornadoVortex', this.damage);
                // Create small wind particles on hit
                this.game.particles.push(new WindParticle(enemy.x, enemy.y));
            }
        });
    }
    
    render(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife);
        
        // Draw tornado as a spiral with multiple layers
        for (let layer = 0; layer < 3; layer++) {
            const layerRadius = this.radius * (1 - layer * 0.3);
            const layerAlpha = alpha * (1 - layer * 0.2);
            
            ctx.strokeStyle = `rgba(173, 216, 230, ${layerAlpha})`;
            ctx.lineWidth = 3 - layer;
            ctx.beginPath();
            
            // Draw spiral
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.rotation + layer * 0.5;
                const spiralRadius = layerRadius * (i / 8);
                const spiralX = this.x + Math.cos(angle) * spiralRadius;
                const spiralY = this.y + Math.sin(angle) * spiralRadius;
                
                if (i === 0) {
                    ctx.moveTo(spiralX, spiralY);
                } else {
                    ctx.lineTo(spiralX, spiralY);
                }
            }
            ctx.stroke();
        }
        
        // Draw outer vortex ring
        ctx.strokeStyle = `rgba(135, 206, 235, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw debris particles around tornado
        for (let i = 0; i < 6; i++) {
            const debrisAngle = this.rotation * 2 + (i / 6) * Math.PI * 2;
            const debrisRadius = this.radius + Math.sin(this.rotation + i) * 10;
            const debrisX = this.x + Math.cos(debrisAngle) * debrisRadius;
            const debrisY = this.y + Math.sin(debrisAngle) * debrisRadius;
            
            ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(debrisX, debrisY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class WindParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 0.3;
        this.maxLife = 0.3;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vx *= Math.pow(0.95, deltaTime * 60); // Air resistance
        this.vy *= Math.pow(0.95, deltaTime * 60);
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(173, 216, 230, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EarthquakeWave {
    constructor(x, y, maxRadius) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.currentRadius = 0;
        this.life = 1.5;
        this.maxLife = 1.5;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.currentRadius = this.maxRadius * (1 - this.life / this.maxLife);
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        const pulseIntensity = Math.sin((1 - this.life / this.maxLife) * Math.PI * 6) * 0.4 + 0.6;
        
        // Outer earthquake ring - brown/earth colors
        ctx.strokeStyle = `rgba(139, 69, 19, ${alpha * pulseIntensity})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring - lighter brown
        ctx.strokeStyle = `rgba(210, 180, 140, ${alpha * pulseIntensity * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Core ring - yellow/orange
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * pulseIntensity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class ShockwaveRing {
    constructor(x, y, radius, delay) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.shouldRemove = false;
        this.delay = delay;
        this.delayTimer = 0;
        this.active = false;
    }
    
    update(deltaTime) {
        if (!this.active) {
            this.delayTimer += 1/60;
            if (this.delayTimer >= this.delay) {
                this.active = true;
            }
            return;
        }
        
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const alpha = this.life / this.maxLife;
        ctx.strokeStyle = `rgba(139, 69, 19, ${alpha * 0.8})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class DebrisParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2; // Upward bias
        this.life = 2;
        this.maxLife = 2;
        this.shouldRemove = false;
        this.size = 2 + Math.random() * 3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = 0.15;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vy += this.gravity; // Apply gravity
        this.vx *= 0.98; // Air resistance
        this.rotation += this.rotationSpeed;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

class TremorParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.shouldRemove = false;
        this.size = 3 + Math.random() * 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.5 ? 'brown' : 'gray';
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vx *= 0.95; // Slow down over time
        this.vy *= 0.95;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.color === 'brown') {
            ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        } else {
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
        }
        
        // Draw jagged rock/earth chunk
        ctx.beginPath();
        ctx.moveTo(-this.size/2, -this.size/3);
        ctx.lineTo(this.size/3, -this.size/2);
        ctx.lineTo(this.size/2, this.size/3);
        ctx.lineTo(-this.size/3, this.size/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class StormClouds {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 2;
        this.maxLife = 2;
        this.shouldRemove = false;
        this.cloudParticles = [];
        
        // Generate cloud particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const distance = this.radius * (0.5 + Math.random() * 0.5);
            const cloudX = this.x + Math.cos(angle) * distance;
            const cloudY = this.y + Math.sin(angle) * distance;
            
            this.cloudParticles.push({
                x: cloudX,
                y: cloudY,
                size: 15 + Math.random() * 20,
                alpha: 0.3 + Math.random() * 0.4,
                drift: (Math.random() - 0.5) * 0.5
            });
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        // Drift clouds slightly
        this.cloudParticles.forEach(cloud => {
            cloud.x += cloud.drift;
        });
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        this.cloudParticles.forEach(cloud => {
            ctx.fillStyle = `rgba(64, 64, 64, ${cloud.alpha * alpha})`;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class ThunderBolt {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 0.3;
        this.maxLife = 0.3;
        this.shouldRemove = false;
        this.segments = this.generateBoltSegments();
        this.thickness = 4;
    }
    
    generateBoltSegments() {
        const segments = [];
        const numSegments = 6;
        const jitterAmount = 20;
        
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            let x = this.x1 + (this.x2 - this.x1) * t;
            let y = this.y1 + (this.y2 - this.y1) * t;
            
            if (i > 0 && i < numSegments) {
                x += (Math.random() - 0.5) * jitterAmount;
                y += (Math.random() - 0.5) * jitterAmount * 0.5; // Less vertical jitter
            }
            
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        // Main lightning bolt - bright white/yellow
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        
        ctx.stroke();
        
        // Inner core - bright yellow
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        ctx.lineWidth = this.thickness * 0.5;
        ctx.stroke();
        
        // Outer glow - blue/white
        ctx.strokeStyle = `rgba(173, 216, 255, ${alpha * 0.4})`;
        ctx.lineWidth = this.thickness * 2;
        ctx.stroke();
    }
}

class LightningImpact {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 0.4;
        this.maxLife = 0.4;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        const pulseIntensity = Math.sin((1 - this.life / this.maxLife) * Math.PI * 4) * 0.5 + 0.5;
        
        // Electric impact ring - bright blue/white
        ctx.strokeStyle = `rgba(173, 216, 255, ${alpha * pulseIntensity})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1 - this.life / this.maxLife), 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring - yellow/white
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * pulseIntensity * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6 * (1 - this.life / this.maxLife), 0, Math.PI * 2);
        ctx.stroke();
        
        // Core flash
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulseIntensity * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ElectricSpark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.shouldRemove = false;
        this.size = 2 + Math.random() * 3;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vx *= Math.pow(0.95, deltaTime * 60); // Slow down over time
        this.vy *= Math.pow(0.95, deltaTime * 60);
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        // Electric spark - bright yellow/white
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer glow
        ctx.fillStyle = `rgba(173, 216, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class SummonRing {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.life = 1;
        this.maxLife = 1;
        this.shouldRemove = false;
        this.pulseTime = 0;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.pulseTime += 1/60;
        this.currentRadius = this.maxRadius * (1 - this.life / this.maxLife);
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        const pulseIntensity = Math.sin(this.pulseTime * 8) * 0.3 + 0.7;
        
        // Outer summoning ring - purple
        ctx.strokeStyle = `rgba(153, 68, 255, ${alpha * pulseIntensity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring - bright purple
        ctx.strokeStyle = `rgba(187, 102, 255, ${alpha * pulseIntensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Mystical runes around the ring
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + this.pulseTime;
            const runeX = this.x + Math.cos(angle) * this.currentRadius;
            const runeY = this.y + Math.sin(angle) * this.currentRadius;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulseIntensity})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central glow
        ctx.fillStyle = `rgba(153, 68, 255, ${alpha * pulseIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Player Profile and Statistics System
class PlayerProfile {
    constructor() {
        this.version = 1;
        this.statistics = {
            // Game Stats
            totalGamesPlayed: 0,
            bestSurvivalTime: 0,
            highestScore: 0,
            highestLevel: 0,
            totalSurvivalTime: 0,
            
            // Enemy Kill Stats
            enemiesKilled: {
                basic: 0,
                veteran: 0,
                elite: 0,
                boss: 0,
                total: 0
            },
            
            // Damage Stats by Attack Type
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
            
            // Element Mastery Stats
            elementMastery: {
                fire: { timesChosen: 0, maxLevelReached: 0 },
                water: { timesChosen: 0, maxLevelReached: 0 },
                earth: { timesChosen: 0, maxLevelReached: 0 },
                air: { timesChosen: 0, maxLevelReached: 0 },
                lightning: { timesChosen: 0, maxLevelReached: 0 }
            },
            
            // Progression Stats
            totalXPGained: 0,
            totalUpgradesChosen: 0,
            
            // Diamond Economy (future)
            totalDiamondsEarned: 0,
            totalDiamondsSpent: 0
        };
        
        this.preferences = {
            favoriteElement: null,
            preferredPlayStyle: null // 'aggressive', 'defensive', 'balanced'
        };
        
        // Shop upgrades
        this.shopUpgrades = {
            xpVortex: 0 // Level 0-5, increases XP pickup range
        };
        
        // Mastery Ring system (new progression feature)
        this.masteryRings = {
            owned: { fire: false, water: false, earth: false, air: false, lightning: false },
            equipped: [] // Max 2 rings equipped at once
        };
        
        this.load();
    }
    
    // Load profile from localStorage
    load() {
        try {
            const saved = localStorage.getItem('elemental-fury-profile');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.version === this.version) {
                    // Merge saved data, keeping structure but updating with saved values
                    this.mergeDeep(this.statistics, data.statistics || {});
                    this.mergeDeep(this.preferences, data.preferences || {});
                    this.mergeDeep(this.shopUpgrades, data.shopUpgrades || {});
                    this.mergeDeep(this.masteryRings, data.masteryRings || {});
                } else {
                    // Handle version migration in the future
                }
            }
        } catch (error) {
            console.error('Failed to load player profile:', error);
        }
    }
    
    // Save profile to localStorage
    save() {
        try {
            const data = {
                version: this.version,
                statistics: this.statistics,
                preferences: this.preferences,
                shopUpgrades: this.shopUpgrades,
                masteryRings: this.masteryRings,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('elemental-fury-profile', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save player profile:', error);
        }
    }
    
    // Deep merge utility for loading saved data
    mergeDeep(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    // Update stats when game ends
    updateGameStats(sessionStats) {
        this.statistics.totalGamesPlayed++;
        this.statistics.totalSurvivalTime += sessionStats.survivalTime;
        this.statistics.totalXPGained += sessionStats.xpGained;
        this.statistics.totalUpgradesChosen += sessionStats.upgradesChosen;
        
        // Update bests
        if (sessionStats.survivalTime > this.statistics.bestSurvivalTime) {
            this.statistics.bestSurvivalTime = sessionStats.survivalTime;
        }
        if (sessionStats.score > this.statistics.highestScore) {
            this.statistics.highestScore = sessionStats.score;
        }
        if (sessionStats.level > this.statistics.highestLevel) {
            this.statistics.highestLevel = sessionStats.level;
        }
        
        // Update enemy kills
        for (const enemyType in sessionStats.enemiesKilled) {
            this.statistics.enemiesKilled[enemyType] += sessionStats.enemiesKilled[enemyType];
        }
        
        // Update damage dealt
        for (const attackType in sessionStats.damageDealt) {
            this.statistics.damageDealt[attackType] += Math.floor(sessionStats.damageDealt[attackType]);
        }
        
        // Update element mastery stats
        for (const element in sessionStats.elementLevels) {
            const level = sessionStats.elementLevels[element];
            if (level > 0) {
                this.statistics.elementMastery[element].timesChosen++;
                if (level > this.statistics.elementMastery[element].maxLevelReached) {
                    this.statistics.elementMastery[element].maxLevelReached = level;
                }
            }
        }
        
        // Calculate and add diamond rewards
        const diamondsEarned = this.calculateDiamondReward(sessionStats);
        this.statistics.totalDiamondsEarned += diamondsEarned;
        
        this.save();
    }
    
    // Calculate diamond earnings based on performance
    calculateDiamondReward(sessionStats) {
        let diamonds = 0;
        
        // Base survival time reward (1 diamond per 30 seconds)
        diamonds += Math.floor(sessionStats.survivalTime / 30);
        
        // Score bonus (1 diamond per 1000 points)
        diamonds += Math.floor(sessionStats.score / 1000);
        
        // Boss kill bonuses
        diamonds += sessionStats.enemiesKilled.boss * 2;
        
        return diamonds;
    }
    
    // Purchase shop upgrade
    purchaseUpgrade(upgradeType) {
        const prices = {
            xpVortex: [10, 15, 25, 40, 60] // Prices for levels 1-5
        };
        
        if (!prices[upgradeType]) return false;
        
        const currentLevel = this.shopUpgrades[upgradeType];
        if (currentLevel >= 5) return false; // Max level reached
        
        const price = prices[upgradeType][currentLevel];
        if (this.statistics.totalDiamondsEarned - this.statistics.totalDiamondsSpent < price) {
            return false; // Not enough diamonds
        }
        
        // Purchase successful
        this.statistics.totalDiamondsSpent += price;
        this.shopUpgrades[upgradeType]++;
        this.save();
        return true;
    }
    
    // Purchase mastery ring
    purchaseMasteryRing(elementType) {
        const price = 50; // All mastery rings cost 50 diamonds
        
        if (this.masteryRings.owned[elementType]) return false; // Already owned
        if (this.statistics.totalDiamondsEarned - this.statistics.totalDiamondsSpent < price) {
            return false; // Not enough diamonds
        }
        
        // Purchase successful
        this.statistics.totalDiamondsSpent += price;
        this.masteryRings.owned[elementType] = true;
        this.save();
        return true;
    }
    
    // Equip/unequip mastery ring
    equipMasteryRing(elementType) {
        if (!this.masteryRings.owned[elementType]) return false; // Don't own ring
        
        const currentIndex = this.masteryRings.equipped.indexOf(elementType);
        if (currentIndex !== -1) {
            // Ring is equipped, unequip it
            this.masteryRings.equipped.splice(currentIndex, 1);
            this.save();
            return true;
        } else if (this.masteryRings.equipped.length < 2) {
            // Ring not equipped and have slot available
            this.masteryRings.equipped.push(elementType);
            this.save();
            return true;
        }
        return false; // No slots available
    }
    
    // Check if element can go past level 5
    canUpgradePastLevel5(elementType) {
        return this.masteryRings.equipped.includes(elementType);
    }
    
    // Get available diamonds for spending
    getAvailableDiamonds() {
        return (this.statistics.totalDiamondsEarned || 0) - (this.statistics.totalDiamondsSpent || 0);
    }
    
    // Get upgrade price
    getUpgradePrice(upgradeType) {
        const prices = {
            xpVortex: [10, 15, 25, 40, 60] // Prices for levels 1-5
        };
        
        if (!prices[upgradeType]) return 0;
        
        const currentLevel = this.shopUpgrades[upgradeType];
        if (currentLevel >= 5) return 0; // Max level reached
        
        return prices[upgradeType][currentLevel];
    }
    
    // Get mastery ring price (always 50 for unowned rings)
    getMasteryRingPrice(elementType) {
        return this.masteryRings.owned[elementType] ? 0 : 50;
    }
}

class WaveManager {
    constructor() {
        this.enemySpawnRate = 1;
        this.lastSpawn = 0;
        this.lastBossSpawn = 0;
        this.baseSpawnInterval = 2;
        this.currentSpawnInterval = 2;
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
            levelScaling = 1 + (playerLevel - 1) * 0.25;
        }
        
        // Global time scaling (10% faster every minute)
        const globalTimeScaling = 1 + (gameTime / 60) * 0.1;
        
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
        let minInterval = 0.1;
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

class UpgradeSystem {
    constructor() {
        this.upgradeMenu = document.getElementById('upgradeMenu');
        this.upgradeOptions = document.getElementById('upgradeOptions');
    }
    
    showUpgradeMenu() {
        this.game.isPaused = true;
        this.upgradeMenu.style.display = 'block';
        
        const upgrades = this.getRandomUpgrades(3);
        this.upgradeOptions.innerHTML = '';
        
        if (upgrades.length === 0) {
            // All elements are maxed out
            const option = document.createElement('div');
            option.className = 'upgrade-option mastered';
            option.innerHTML = `
                <div class="upgrade-header">
                    <div style="font-size: 24px;">🎆</div>
                    <div class="upgrade-title">All Elements Mastered!</div>
                </div>
                <div class="upgrade-description">You have achieved maximum mastery in all elements. Continue your legendary journey!</div>
            `;
            option.onclick = () => {
                this.upgradeMenu.style.display = 'none';
                this.game.isPaused = false;
                // Mark that we've shown the mastery message
                this.game.player.allElementsMasteredShown = true;
            };
            this.upgradeOptions.appendChild(option);
        } else {
            upgrades.forEach((upgrade, index) => {
                const option = document.createElement('div');
                option.className = `upgrade-option ${upgrade.type}`;
                
                // Create element icon
                const elementIcons = {
                    fire: '🔥',
                    water: '💧', 
                    earth: '🌍',
                    air: '🌪️',
                    lightning: '⚡'
                };
                
                option.innerHTML = `
                    <div class="upgrade-header">
                        <div class="upgrade-element-icon ${upgrade.type}"></div>
                        <div class="upgrade-title">${upgrade.name}</div>
                    </div>
                    <div class="upgrade-description">${upgrade.description}</div>
                `;
                
                option.onclick = () => this.selectUpgrade(upgrade);
                this.upgradeOptions.appendChild(option);
            });
        }
    }
    
    getRandomUpgrades(count) {
        // New progression spec implementation
        // Rule: Max 3 distinct elements per run, levels 1-10, rings required for 6-10
        
        const elementData = {
            fire: {
                name: 'Fire Mastery',
                ability: 'Fireball',
                initialDescription: 'Shoots a fireball at the closest enemy',
                effect: 'Faster fireball cooldown, +10% DPS to all attacks'
            },
            water: {
                name: 'Water Mastery', 
                ability: 'Water Globes',
                initialDescription: 'Creates orbiting water globes that damage enemies',
                effect: '+1 globe, +10% Health'
            },
            earth: {
                name: 'Earth Mastery',
                ability: 'Tremor',
                initialDescription: 'Creates ongoing tremor field that pulses damage around you',
                effect: 'Increased tremor range, +3 Armor'
            },
            lightning: {
                name: 'Lightning Mastery',
                ability: 'Chain Lightning',
                initialDescription: 'Lightning bolts that chain between enemies',
                effect: '+1 chain, +10% attack speed all attacks'
            },
            air: {
                name: 'Air Mastery',
                ability: 'Missiles',
                initialDescription: 'Fires additional missiles alongside regular attacks',
                effect: '+1 missile, +10% attack range all attacks'
            }
        };
        
        const availableElements = [];
        
        // Generate upgrade options based on progression rules
        for (const [elementType, data] of Object.entries(elementData)) {
            const currentLevel = this.game.player.upgradeCount[elementType] || 0;
            const isChosen = this.game.player.chosenElements.includes(elementType);
            const hasRing = this.game.player.masteryRings.includes(elementType);
            
            // Skip if maxed out (level 10)
            if (currentLevel >= 10) continue;
            
            // Skip if trying to go past level 5 without ring
            if (currentLevel >= 5 && !hasRing) continue;
            
            // Skip if not chosen and already have 3 distinct elements
            if (!isChosen && this.game.player.chosenElements.length >= 3) continue;
            
            // This element is available for upgrade
            const nextLevel = currentLevel + 1;
            let description;
            
            // Level 1: Show ability name + simple description
            if (currentLevel === 0) {
                description = `${data.ability} - ${data.initialDescription}`;
            } else {
                // Level 2+: Just show the effect
                description = data.effect;
            }
            
            // Add level-specific abilities
            if (nextLevel === 6) {
                const level6Abilities = {
                    fire: 'Inferno Wave',
                    water: 'Freezing Touch', 
                    earth: 'Earthquake (10% chance per tremor + stuns)',
                    lightning: 'Thunder Storm',
                    air: 'Tornado Vortex'
                };
                description += ` → Unlocks ${level6Abilities[elementType]}`;
            }
            
            // Add ring requirement warning
            if (currentLevel === 5 && !hasRing) {
                description += ' ⚠️ Requires Mastery Ring';
            }
            
            availableElements.push({
                name: data.name,
                description,
                type: elementType,
                currentLevel,
                nextLevel,
                effect: () => this.applyElementUpgrade(elementType, nextLevel)
            });
        }
        
        // Randomize and return requested count
        const shuffled = availableElements.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    applyElementUpgrade(elementType, newLevel) {
        const player = this.game.player;
        
        // Add to chosen elements if not already there
        if (!player.chosenElements.includes(elementType)) {
            player.chosenElements.push(elementType);
        }
        
        // Update level
        player.upgradeCount[elementType] = newLevel;
        
        // Apply effects based on element and level (from progression spec)
        switch (elementType) {
            case 'fire':
                this.applyFireUpgrade(newLevel);
                break;
            case 'water':
                this.applyWaterUpgrade(newLevel); 
                break;
            case 'earth':
                this.applyEarthUpgrade(newLevel);
                break;
            case 'lightning':
                this.applyLightningUpgrade(newLevel);
                break;
            case 'air':
                this.applyAirUpgrade(newLevel);
                break;
        }
        
        // Track stats
        this.game.sessionStats.elementLevels[elementType] = newLevel;
        this.game.sessionStats.upgradesChosen++;
    }
    
    applyFireUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 fireball, +10% DPS to all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.damage = Math.floor(w.damage * 1.1));
            if (level === 1) {
                player.specialAbilities.fireball = true;
            }
        }
        
        // Level 6: Inferno Wave
        if (level === 6) {
            player.specialAbilities.infernoWave = true;
        }
        
        // Levels 7-10: +10% DPS + 10% Range on Inferno Wave  
        if (level >= 7) {
            player.weapons.forEach(w => w.damage = Math.floor(w.damage * 1.1));
            // Inferno Wave range/damage boost handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyWaterUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 globe, +10% Health
        if (level <= 5) {
            player.maxHealth = Math.floor(player.maxHealth * 1.1);
            player.health = Math.floor(Math.min(player.health * 1.1, player.maxHealth));
            this.updateWaterGlobes(player, level);
        }
        
        // Level 6: Freezing Touch
        if (level === 6) {
            player.specialAbilities.freezingTouch = true;
        }
        
        // Levels 7-10: +10% Health +10% Extra damage taken by frozen enemies
        if (level >= 7) {
            player.maxHealth = Math.floor(player.maxHealth * 1.1);
            player.health = Math.floor(Math.min(player.health * 1.1, player.maxHealth));
            // Frozen damage bonus handled in damage calculation
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    updateWaterGlobes(player, level) {
        // Clear existing globes
        player.waterGlobes = [];
        
        // Create new globes based on level (1 globe per level, max 5)
        const globeCount = Math.min(level, 5);
        for (let i = 0; i < globeCount; i++) {
            player.waterGlobes.push(new WaterGlobe(player, i));
        }
    }
    
    applyEarthUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +25% more frequent tremors, +3 Armor
        if (level <= 5) {
            player.armor += 3;
            if (level === 1) {
                player.specialAbilities.radiusAttack = true;
            }
        }
        
        // Level 6: Earthquake (10% chance per tremor + stuns)
        if (level === 6) {
            player.specialAbilities.earthquakeStormp = true;
        }
        
        // Levels 7-10: +3 armor +10% chance to start earthquake + 10% frequency to tremor
        if (level >= 7) {
            player.armor += 3;
            // Earthquake chance and tremor frequency handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyLightningUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 chain, +10% attack speed all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.cooldown = Math.floor(w.cooldown * 0.9 * 100) / 100);
            if (level === 1) {
                player.specialAbilities.lightning = true;
            }
        }
        
        // Level 6: Thunder Storm
        if (level === 6) {
            player.specialAbilities.thunderStorm = true;
        }
        
        // Levels 7-10: +10% radius of storm clouds +10% duration of storm
        if (level >= 7) {
            player.weapons.forEach(w => w.cooldown = Math.floor(w.cooldown * 0.9 * 100) / 100);
            // Storm radius/duration handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyAirUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 missile, +10% attack range all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.range = Math.floor(w.range * 1.1));
            if (level === 1) {
                player.specialAbilities.missiles = true;
            }
        }
        
        // Level 6: Tornado Vortex
        if (level === 6) {
            player.specialAbilities.tornadoVortex = true;
        }
        
        // Levels 7-10: +1 extra tornado per spawn
        if (level >= 7) {
            player.weapons.forEach(w => w.range = Math.floor(w.range * 1.1));
            // Extra tornado count handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    // Check and unlock fusion ultimates when two elements reach level 10
    checkForFusionUltimates() {
        const player = this.game.player;
        const level10Elements = [];
        
        // Find all elements at level 10
        for (const [element, level] of Object.entries(player.upgradeCount)) {
            if (level >= 10) {
                level10Elements.push(element);
            }
        }
        
        // Need at least 2 elements at level 10 for fusion
        if (level10Elements.length < 2) return;
        
        // Check for specific fusion combinations
        const fusionTable = {
            'fire+air': 'wildfire',
            'fire+earth': 'magmaSurge', 
            'fire+water': 'steamBurst',
            'air+water': 'tempest',
            'earth+lightning': 'seismicShock',
            'water+lightning': 'thunderStorm' // Enhanced version
        };
        
        // Check all possible pairs
        for (let i = 0; i < level10Elements.length; i++) {
            for (let j = i + 1; j < level10Elements.length; j++) {
                const element1 = level10Elements[i];
                const element2 = level10Elements[j];
                
                // Create fusion key (alphabetical order)
                const fusionKey1 = `${element1}+${element2}`;
                const fusionKey2 = `${element2}+${element1}`;
                
                const fusionAbility = fusionTable[fusionKey1] || fusionTable[fusionKey2];
                
                if (fusionAbility && !player.specialAbilities[fusionAbility]) {
                    player.specialAbilities[fusionAbility] = true;
                    
                    // Show fusion unlock notification
                    this.showFusionUnlockNotification(element1, element2, fusionAbility);
                }
            }
        }
    }
    
    // Show notification when fusion ultimate is unlocked
    showFusionUnlockNotification(element1, element2, fusionAbility) {
        const fusionNames = {
            wildfire: 'Wildfire - Fast-spreading burning ground',
            magmaSurge: 'Magma Surge - Lava wave with DoT and slow',
            steamBurst: 'Steam Burst - High-pressure AoE that obscures vision',
            tempest: 'Tempest - Moving storm that pulls enemies',
            seismicShock: 'Seismic Shock - Earthquake with chain stun',
            thunderStorm: 'Enhanced Thunder Storm - Lightning rain around player'
        };
        
        const fusionName = fusionNames[fusionAbility] || fusionAbility;
        
        // Create a visual notification (could be expanded)
        console.log(`FUSION ULTIMATE UNLOCKED! ${element1.toUpperCase()} + ${element2.toUpperCase()} = ${fusionName}`);
        
        // TODO: Add visual notification system for fusion unlocks
    }
    
    selectUpgrade(upgrade) {
        upgrade.effect();
        this.game.sessionStats.upgradesChosen++;
        this.upgradeMenu.style.display = 'none';
        this.game.isPaused = false;
        
        // Spawn boss after upgrade menu closes if one was pending
        if (this.game.pendingBossSpawn) {
            this.game.spawnBoss();
            this.game.pendingBossSpawn = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});