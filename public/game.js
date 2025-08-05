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
        console.log('Starting game...');
        this.gameState = 'playing';
        this.gameOver = false;
        this.player = new Player(this.width / 2, this.height / 2);
        this.player.game = this;
        this.player.weapons = [new BasicWeapon(this.player)];
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
            this.sessionStats.damageDealt[attackType] += damage;
            this.sessionStats.damageDealt.total += damage;
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
        
        this.updateUI();
        this.updateCurrentSessionDisplay(); // Update current session stats during gameplay
    }
    
    render() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing' && this.player) {
            this.player.render(this.ctx);
            this.enemies.forEach(enemy => enemy.render(this.ctx));
            this.projectiles.forEach(projectile => projectile.render(this.ctx));
            this.enemyProjectiles.forEach(projectile => projectile.render(this.ctx));
            this.particles.forEach(particle => particle.render(this.ctx));
            this.pickups.forEach(pickup => pickup.render(this.ctx));
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
                    
                    // Populate detailed damage breakdown
                    if (this.sessionStats) {
                        document.getElementById('finalBasicDamage').textContent = formatNumber(this.sessionStats.damageDealt.basicWeapon);
                        document.getElementById('finalFireballDamage').textContent = formatNumber(this.sessionStats.damageDealt.fireball);
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
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('maxHealth').textContent = this.player.maxHealth;
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-bar').style.width = `${Math.max(0, healthPercent)}%`;
        
        // Update XP display and bar
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('xp').textContent = this.player.xp;
        document.getElementById('xpNext').textContent = this.player.xpToNext;
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
            const percentage = (count / 6) * 100;
            
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
    }
    
    // Purchase XP Vortex upgrade
    purchaseXpVortex() {
        if (this.playerProfile.purchaseUpgrade('xpVortex')) {
            this.updateShopDisplay();
            this.updateDiamondDisplay(); // Update header display
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
        
        // Health regeneration
        if (this.healthRegen > 0) {
            if (!this.lastRegenTick) this.lastRegenTick = this.game.gameTime;
            if (this.game.gameTime - this.lastRegenTick >= 1) {
                this.health = Math.min(this.maxHealth, this.health + this.healthRegen);
                this.lastRegenTick = this.game.gameTime;
            }
        }
    }
    
    render(ctx) {
        if (this.specialAbilities.radiusAttack) {
            if (!this.radiusAttackCooldown) this.radiusAttackCooldown = 0;
            const timeSinceAttack = this.game.gameTime - this.radiusAttackCooldown;
            const cooldownDuration = 3;
            const pulseProgress = (timeSinceAttack % cooldownDuration) / cooldownDuration;
            
            if (timeSinceAttack < 0.3) {
                const blastAlpha = (0.3 - timeSinceAttack) / 0.3;
                ctx.strokeStyle = `rgba(139, 69, 19, ${blastAlpha * 0.8})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                const pulseRadius = 20 + (pulseProgress * 15);
                const pulseAlpha = 0.4 * (1 - pulseProgress);
                ctx.strokeStyle = `rgba(139, 69, 19, ${pulseAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
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
        
        console.log(`Player reached level ${this.level}`);
        
        // Mark that we need to spawn a boss after upgrade menu closes
        if (this.level === 5 || this.level === 10 || 
            this.level === 15 || this.level === 20 || 
            this.level === 25 || this.level === 30) {
            this.game.pendingBossSpawn = true;
        }
        
        this.game.upgradeSystem.showUpgradeMenu();
    }
    
    updateFireball() {
        // Calculate fireball cooldown based on fire mastery level
        const fireLevel = this.upgradeCount.fire || 0;
        let cooldown = 2.0; // Base 2 second cooldown
        
        if (fireLevel >= 4) {
            // Levels 4-6 reduce cooldown: 2s -> 1.25s -> 1s -> 0.5s
            const reduction = (fireLevel - 3) * 0.5; // 0.5s reduction per level after 3
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
        if (!this.radiusAttackCooldown) this.radiusAttackCooldown = 0;
        
        // Scale cooldown based on earth mastery level (levels 4-6 get faster tremors)
        const earthLevel = this.upgradeCount.earth || 0;
        let cooldown = 3; // Base 3 second cooldown
        if (earthLevel >= 4) {
            cooldown = Math.max(1, 3 - (earthLevel - 3) * 0.5); // 2.5s at level 4, 2s at level 5, 1.5s at level 6
        }
        
        if (this.game.gameTime - this.radiusAttackCooldown >= cooldown) {
            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= 80) {
                    const damage = 40 + (earthLevel >= 4 ? (earthLevel - 3) * 10 : 0); // Bonus damage at higher levels
                    enemy.takeDamage(damage);
                    this.game.recordDamage('tremors', damage);
                    this.game.particles.push(new ExplosionParticle(enemy.x, enemy.y));
                }
            });
            this.radiusAttackCooldown = this.game.gameTime;
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
                const baseChains = 3;
                const bonusChains = Math.floor((this.upgradeCount.lightning - 3) / 1);
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
        
        if (bouncesLeft < 3) {
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
                return distance <= 100;
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
        if (this.isVeteran && this.health === 300 && Math.random() < 0.01) {
            console.log(`Enemy movement calc: dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}, distance=${distance.toFixed(1)}, speed=${this.speed}, deltaTime=${deltaTime?.toFixed(3)}`);
        }
        
        if (distance > 0 && !isNaN(distance)) {
            const moveX = (dx / distance) * this.speed * deltaTime * 60;
            const moveY = (dy / distance) * this.speed * deltaTime * 60;
            
            // Debug movement values
            if (this.isVeteran && this.health === 300 && Math.random() < 0.01) {
                console.log(`Movement values: moveX=${moveX.toFixed(3)}, moveY=${moveY.toFixed(3)}, will apply=${!isNaN(moveX) && !isNaN(moveY)}`);
            }
            
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
                const angle1 = Math.atan2(dirY, dirX) + 0.3;
                const angle2 = Math.atan2(dirY, dirX) - 0.3;
                
                this.owner.game.projectiles.push(new MissileProjectile(
                    this.owner.x, this.owner.y,
                    Math.cos(angle1), Math.sin(angle1),
                    this.damage * 0.7, this.range
                ));
                
                this.owner.game.projectiles.push(new MissileProjectile(
                    this.owner.x, this.owner.y,
                    Math.cos(angle2), Math.sin(angle2),
                    this.damage * 0.7, this.range
                ));
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
                const dotDamage = 5 + Math.max(0, (fireLevel - 3) * 2);
                const dotDuration = 3 + Math.max(0, (fireLevel - 3) * 1);
                
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
                const dotDamage = 3 + Math.max(0, (fireLevel - 3) * 1);
                const dotDuration = 2 + Math.max(0, (fireLevel - 3) * 0.5);
                
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
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.stroke();
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
                this.player.performLightningChain(this.target, this.availableEnemies, this.bouncesLeft, this.damage);
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
                } else {
                    // Handle version migration in the future
                    console.log('Profile version mismatch, keeping defaults');
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
            this.statistics.damageDealt[attackType] += sessionStats.damageDealt[attackType];
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
}

class WaveManager {
    constructor() {
        this.enemySpawnRate = 1;
        this.lastSpawn = 0;
        this.lastBossSpawn = 0;
        this.baseSpawnInterval = 2;
        this.currentSpawnInterval = 2;
        this.baseBossSpawnInterval = 15; // Base time between random boss spawns
    }
    
    update(gameTime, game, playerLevel, deltaTime) {
        // More aggressive spawn rate scaling - level AND time based
        const levelScaling = 1 + (playerLevel - 1) * 0.25;
        const timeScaling = 1 + (gameTime / 60) * 0.1; // 10% faster every minute
        const combinedScaling = levelScaling * timeScaling;
        
        this.currentSpawnInterval = this.baseSpawnInterval / combinedScaling;
        
        // Lower minimum spawn interval to make it more challenging
        this.currentSpawnInterval = Math.max(0.1, this.currentSpawnInterval);
        
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
            // Level 30+: All bosses can spawn (after Elite introduction)
            spawnInterval = 10; // Every 10 seconds
            const roll = Math.random();
            if (roll < 0.4) bossType = 'basic';
            else if (roll < 0.7) bossType = 'veteran';
            else bossType = 'elite';
            shouldSpawnBoss = true;
        } else if (playerLevel >= 20) {
            // Level 20-29: Basic and Veteran bosses can spawn (after Veteran introduction)
            spawnInterval = 12; // Every 12 seconds
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
        const allUpgrades = [
            { 
                name: 'Water Mastery', 
                description: 'Healing Waters: +20 Max Health', 
                type: 'water',
                effect: () => { 
                    const level = this.game.player.upgradeCount.water;
                    
                    if (level < 3) {
                        this.game.player.maxHealth += 20; 
                        this.game.player.health += 20;
                    } else if (level < 6) {
                        this.game.player.healthRegen += 2;
                    }
                    
                    this.game.player.upgradeCount.water++;
                    
                    if (this.game.player.upgradeCount.water === 3) {
                        this.game.player.specialAbilities.shield = true;
                        this.game.player.shieldHealth = this.game.player.maxShieldHealth;
                    } else if (this.game.player.upgradeCount.water === 6) {
                        this.game.player.specialAbilities.freezingTouch = true;
                    }
                }
            },
            { 
                name: 'Earth Mastery', 
                description: 'Stone Skin: +5 Armor (Damage Reduction)', 
                type: 'earth',
                effect: () => { 
                    const level = this.game.player.upgradeCount.earth;
                    
                    if (level < 3) {
                        this.game.player.armor += 5;
                    } else if (level < 6) {
                        this.game.player.armor += 3;
                    }
                    
                    this.game.player.upgradeCount.earth++;
                    
                    if (this.game.player.upgradeCount.earth === 3) {
                        this.game.player.specialAbilities.radiusAttack = true;
                    } else if (this.game.player.upgradeCount.earth === 6) {
                        this.game.player.specialAbilities.earthquakeStormp = true;
                    }
                }
            },
            { 
                name: 'Fire Mastery', 
                description: 'Blazing Power: +50% Weapon Damage', 
                type: 'fire',
                effect: () => { 
                    const level = this.game.player.upgradeCount.fire;
                    
                    if (level < 3) {
                        this.game.player.weapons.forEach(w => w.damage *= 1.5);
                    } else if (level < 6) {
                        // Extend DOT duration and damage
                        // This will be handled in DOT effect creation
                    }
                    
                    this.game.player.upgradeCount.fire++;
                    
                    if (this.game.player.upgradeCount.fire === 3) {
                        this.game.player.specialAbilities.fireball = true;
                    } else if (this.game.player.upgradeCount.fire === 6) {
                        this.game.player.specialAbilities.infernoWave = true;
                    }
                }
            },
            { 
                name: 'Lightning Mastery', 
                description: 'Swift Strike: +33% Attack Speed', 
                type: 'lightning',
                effect: () => { 
                    const level = this.game.player.upgradeCount.lightning;
                    
                    if (level < 3) {
                        this.game.player.weapons.forEach(w => w.cooldown *= 0.75);
                    } else if (level < 6) {
                        // Increase chain count (handled in lightning chain logic)
                    }
                    
                    this.game.player.upgradeCount.lightning++;
                    
                    if (this.game.player.upgradeCount.lightning === 3) {
                        this.game.player.specialAbilities.lightning = true;
                    } else if (this.game.player.upgradeCount.lightning === 6) {
                        this.game.player.specialAbilities.thunderStorm = true;
                    }
                }
            },
            { 
                name: 'Air Mastery', 
                description: 'Wind\'s Reach: +25% Weapon Range', 
                type: 'air',
                effect: () => { 
                    const level = this.game.player.upgradeCount.air;
                    
                    if (level < 3) {
                        this.game.player.weapons.forEach(w => w.range *= 1.25);
                    } else if (level < 6) {
                        this.game.player.weapons.forEach(w => w.speed = (w.speed || 8) * 1.2);
                    }
                    
                    this.game.player.upgradeCount.air++;
                    
                    if (this.game.player.upgradeCount.air === 3) {
                        this.game.player.specialAbilities.missiles = true;
                    } else if (this.game.player.upgradeCount.air === 6) {
                        this.game.player.specialAbilities.tornadoVortex = true;
                    }
                }
            }
        ];
        
        // Filter out maxed elements (level 6)
        const availableUpgrades = allUpgrades.filter(upgrade => {
            const count = this.game.player.upgradeCount[upgrade.type];
            return count < 6;
        }).map(upgrade => {
            let desc = upgrade.description;
            const count = this.game.player.upgradeCount[upgrade.type];
            
            // Update description based on current level
            if (upgrade.type === 'water' && count >= 3) {
                desc = 'Flowing Vitality: +2 Health Regen/sec';
            } else if (upgrade.type === 'earth' && count >= 3) {
                desc = 'Stone Fortification: +3 Armor + Tremor Fury';
            } else if (upgrade.type === 'fire' && count >= 3) {
                desc = 'Fireball Mastery: Faster Auto-Fireballs';
            } else if (upgrade.type === 'lightning' && count >= 3) {
                desc = 'Chain Lightning: +1 Bounce Count';
            } else if (upgrade.type === 'air' && count >= 3) {
                desc = 'Wind Speed: +20% Projectile Speed';
            }
            
            if (count > 0) {
                desc += ` (${count}/6)`;
            }
            if (count >= 3 && count < 6) {
                desc += ' ⚡';
            } else if (count >= 6) {
                desc += ' 🌟';
            }
            return { ...upgrade, description: desc };
        });
        
        // Handle case where there might be fewer available upgrades than requested
        const shuffled = availableUpgrades.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
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