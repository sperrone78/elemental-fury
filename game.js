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
        this.gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
        
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        this.waveManager = new WaveManager();
        this.upgradeSystem = new UpgradeSystem();
        this.upgradeSystem.game = this;
        
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
        
        // Reset upgrade system
        this.upgradeSystem = new UpgradeSystem();
        this.upgradeSystem.game = this;
        
        // Reset wave manager
        this.waveManager = new WaveManager();
        
        // Reset all power levels in UI
        ['fire', 'water', 'air', 'earth', 'lightning'].forEach(element => {
            document.getElementById(`${element}-level`).textContent = '0';
            document.getElementById(`${element}-progress`).style.width = '0%';
            document.getElementById(`${element}-ability`).classList.remove('unlocked');
            document.getElementById(`${element}-ultimate`).classList.remove('unlocked');
        });
        
        // Initialize UI with starting values
        this.updateUI();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if ((this.gameState === 'waiting' || this.gameState === 'gameOver') && (e.key === ' ' || e.key === 'Enter')) {
                console.log('Space/Enter pressed, game state:', this.gameState);
                this.startGame();
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
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.isPaused || this.gameState !== 'playing') return;
        
        this.gameTime += 1/60;
        
        this.player.update(this.keys, this.mousePos);
        
        this.waveManager.update(this.gameTime, this, this.player.level);
        
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.player);
            if (enemy.health <= 0) {
                if (enemy.isBoss) {
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
                    this.pickups.push(new EliteXPPickup(enemy.x, enemy.y));
                    this.score += 50;
                } else if (enemy.isVeteran) {
                    this.pickups.push(new VeteranXPPickup(enemy.x, enemy.y));
                    this.score += 25;
                } else {
                    this.createXPPickup(enemy.x, enemy.y);
                    this.score += 10;
                }
                this.enemies.splice(index, 1);
            }
        });
        
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.shouldRemove) {
                this.projectiles.splice(index, 1);
            }
        });
        
        this.enemyProjectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.shouldRemove) {
                this.enemyProjectiles.splice(index, 1);
            }
        });
        
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.shouldRemove) {
                this.particles.splice(index, 1);
            }
        });
        
        this.dotEffects.forEach((dot, index) => {
            dot.update(this.gameTime);
            if (dot.shouldRemove) {
                this.dotEffects.splice(index, 1);
            }
        });
        
        this.pickups.forEach((pickup, index) => {
            if (pickup.update) pickup.update(); // For animated pickups like EliteXPPickup
            
            if (this.checkCollision(this.player, pickup)) {
                if (pickup.type === 'xp') {
                    this.player.gainXP(pickup.value);
                }
                this.pickups.splice(index, 1);
            }
        });
        
        this.handleCollisions();
        this.updateUI();
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
                    const minutes = Math.floor(this.gameTime / 60);
                    const seconds = Math.floor(this.gameTime % 60);
                    document.getElementById('finalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    document.getElementById('finalScore').textContent = this.score;
                    document.getElementById('finalLevel').textContent = this.player ? this.player.level : 1;
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
                    
                    if (projectile instanceof FireballProjectile) {
                        projectile.explode(this);
                    }
                    
                    projectile.shouldRemove = true;
                }
            });
        });
        
        this.enemies.forEach(enemy => {
            if (this.checkCollision(this.player, enemy)) {
                let damage = 10;
                if (enemy.isBoss) damage = 20;
                else if (enemy.isElite) damage = 18;
                else if (enemy.isVeteran) damage = 15;
                
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
        
        switch(side) {
            case 0: x = Math.random() * this.width; y = -35; break;
            case 1: x = this.width + 35; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height + 35; break;
            case 3: x = -35; y = Math.random() * this.height; break;
        }
        
        const playerLevel = this.player.level;
        let boss;
        
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
        
        boss.game = this;
        this.enemies.push(boss);
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
    }
    
    update(keys, mousePos) {
        let dx = 0, dy = 0;
        
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        
        this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));
        
        this.weapons.forEach(weapon => weapon.update(mousePos));
        
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
        
        ctx.fillStyle = '#4a9eff';
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
        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNext = Math.floor(this.xpToNext * 1.2);
        
        if (this.level % 5 === 0) {
            this.game.spawnBoss();
        }
        
        this.game.upgradeSystem.showUpgradeMenu();
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
        
        // Freezing Touch activation
        if (this.specialAbilities.freezingTouch) {
            this.activateFreezingTouch();
        }
        
        if (this.health <= 0) {
            this.game.gameOver = true;
            this.game.gameState = 'gameOver';
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
        
        if (this.game.gameTime - this.tornadoCooldown >= 5) { // Spawn tornado every 5 seconds
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
                enemy.takeDamage(Math.floor(scaledDamage));
                
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
                enemy.takeDamage(Math.floor(scaledDamage));
                
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
    
    update(player) {
        // Handle frozen state
        if (this.frozen) {
            this.frozenTime -= 1/60;
            if (this.frozenTime <= 0) {
                this.frozen = false;
            }
            return; // Don't move when frozen
        }
        
        // Handle stunned state
        if (this.stunned) {
            this.stunnedTime -= 1/60;
            if (this.stunnedTime <= 0) {
                this.stunned = false;
            }
            return; // Don't move when stunned
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
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
    
    update(player) {
        super.update(player);
        
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
    }
    
    update(player) {
        super.update(player);
        
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
    
    update(player) {
        super.update(player);
        
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
        this.health = 60;
        this.maxHealth = 60;
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
        this.health = 120;
        this.maxHealth = 120;
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
    
    update(mousePos) {
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
            
            if (this.owner.specialAbilities.fireball) {
                this.owner.game.projectiles.push(new FireballProjectile(
                    this.owner.x, this.owner.y,
                    dirX, dirY,
                    this.damage, this.range
                ));
            } else {
                this.owner.game.projectiles.push(new Projectile(
                    this.owner.x, this.owner.y,
                    dirX, dirY,
                    this.damage, this.range
                ));
            }
            
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
    
    update() {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        this.traveled += this.speed;
        
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
    
    update() {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        this.traveled += this.speed;
        
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
    
    update() {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        this.traveled += this.speed;
        
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
        const infernoRadius = 40;
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= infernoRadius && distance > 5) { // Avoid hitting the same enemy twice
                enemy.takeDamage(damage);
                
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
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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
    
    update() {
        this.pulseTime += 1/60;
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
    
    update(gameTime) {
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
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
        
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
    
    update() {
        this.timer += 1/60;
        
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
    
    update() {
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
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
        this.radius = 20;
        this.life = 10; // 10 seconds as requested
        this.maxLife = 10;
        this.shouldRemove = false;
        this.rotation = 0;
        this.damage = 25;
        this.lastDamage = 0;
        this.damageInterval = 0.5; // Damage every 0.5 seconds
        
        // Random movement properties
        this.vx = (Math.random() - 0.5) * 2; // Random velocity -1 to 1
        this.vy = (Math.random() - 0.5) * 2;
        this.changeDirectionTimer = 0;
        this.directionChangeInterval = 2; // Change direction every 2 seconds
    }
    
    update() {
        this.life -= 1/60;
        this.rotation += 0.3; // Spin the tornado
        
        if (this.life <= 0) {
            this.shouldRemove = true;
            return;
        }
        
        // Random movement direction changes
        this.changeDirectionTimer += 1/60;
        if (this.changeDirectionTimer >= this.directionChangeInterval) {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.changeDirectionTimer = 0;
        }
        
        // Move the tornado
        this.x += this.vx;
        this.y += this.vy;
        
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
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Air resistance
        this.vy *= 0.95;
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
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
    
    update() {
        if (!this.active) {
            this.delayTimer += 1/60;
            if (this.delayTimer >= this.delay) {
                this.active = true;
            }
            return;
        }
        
        this.life -= 1/60;
        
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
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity; // Apply gravity
        this.vx *= 0.98; // Air resistance
        this.rotation += this.rotationSpeed;
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
        
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
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Slow down over time
        this.vy *= 0.95;
        this.life -= 1/60;
        
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
    
    update() {
        this.life -= 1/60;
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

class WaveManager {
    constructor() {
        this.enemySpawnRate = 1;
        this.lastSpawn = 0;
        this.baseSpawnInterval = 2;
        this.currentSpawnInterval = 2;
    }
    
    update(gameTime, game, playerLevel) {
        this.currentSpawnInterval = this.baseSpawnInterval / (1 + (playerLevel - 1) * 0.15);
        
        this.currentSpawnInterval = Math.max(0.3, this.currentSpawnInterval);
        
        if (gameTime - this.lastSpawn >= this.currentSpawnInterval) {
            game.spawnEnemy();
            this.lastSpawn = gameTime;
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
            option.className = 'upgrade-option';
            option.innerHTML = `<strong>All Elements Mastered!</strong><br>You have achieved maximum mastery in all elements. Continue your journey!`;
            option.onclick = () => {
                this.upgradeMenu.style.display = 'none';
                this.game.isPaused = false;
            };
            this.upgradeOptions.appendChild(option);
        } else {
            upgrades.forEach((upgrade, index) => {
                const option = document.createElement('div');
                option.className = 'upgrade-option';
                option.innerHTML = `<strong>${upgrade.name}</strong><br>${upgrade.description}`;
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
                description: 'Stone Steps: +25% Movement Speed', 
                type: 'earth',
                effect: () => { 
                    const level = this.game.player.upgradeCount.earth;
                    
                    if (level < 3) {
                        this.game.player.speed *= 1.25;
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
                desc = 'Tremor Fury: Faster Tremors + Bonus Damage';
            } else if (upgrade.type === 'fire' && count >= 3) {
                desc = 'Burning Mastery: Enhanced DOT Effects';
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
        this.upgradeMenu.style.display = 'none';
        this.game.isPaused = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});