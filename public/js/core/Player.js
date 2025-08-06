import { PLAYER_CONFIG, GAME_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { FireballProjectile } from '../elements/Fire.js';
import { TremorParticle } from '../entities/effects/TremorParticle.js';
import { DebrisParticle } from '../entities/effects/DebrisParticle.js';
import { LightningBolt, DelayedLightningChain, IceRing, EarthquakeWave, ShockwaveRing, StormClouds, ThunderBolt, LightningImpact, ElectricSpark } from '../entities/effects/LightningEffects.js';
import { Tornado } from '../elements/Air.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = PLAYER_CONFIG.RADIUS;
        this.speed = PLAYER_CONFIG.SPEED;
        this.health = PLAYER_CONFIG.BASE_HEALTH;
        this.maxHealth = PLAYER_CONFIG.BASE_HEALTH;
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
            windBlades: false,
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
        this.maxInvulnerabilityTime = PLAYER_CONFIG.INVULNERABILITY_TIME / 1000;
        this.lastDamageTime = 0;
        this.damageCooldown = PLAYER_CONFIG.DAMAGE_COOLDOWN / 1000;
        
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
        
        // Desktop keyboard controls
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
        
        this.x = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.radius, this.y));
        
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
        this.xpToNext = MathUtils.calculateXPRequirement(this.level);
        
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
                const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            if (closestEnemy) {
                // Fire fireball at closest enemy
                const direction = MathUtils.normalize(closestEnemy.x - this.x, closestEnemy.y - this.y);
                
                const damage = this.weapons[0] ? this.weapons[0].damage : 20; // Use base weapon damage
                const range = 200; // Fireball range
                
                const fireball = new FireballProjectile(this.x, this.y, direction.x, direction.y, damage, range);
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
            const baseDamage = 7; // Significantly reduced for better balance (2.5x nerf)
            const damage = baseDamage + (earthLevel >= 2 ? (earthLevel - 1) * 1 : 0); // +1 damage per level
            
            let enemiesHit = 0;
            this.game.enemies.forEach(enemy => {
                const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
                
                if (distance <= tremorRange) {
                    enemy.takeDamage(damage);
                    this.game.recordDamage('tremors', damage);
                    enemiesHit++;
                    
                    // Add enhanced ground crack particle effects
                    for (let i = 0; i < 3; i++) {
                        const offsetX = (Math.random() - 0.5) * 20;
                        const offsetY = (Math.random() - 0.5) * 20;
                        this.game.particles.push(new TremorParticle(enemy.x + offsetX, enemy.y + offsetY));
                    }
                }
            });
            
            // Visual feedback when tremors are active and hitting enemies
            if (enemiesHit > 0) {
                // Add screen shake effect
                this.game.screenShake = Math.min(this.game.screenShake + 2, 8);
                
                // Add enhanced central tremor particles around player
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * tremorRange * 0.8;
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
                const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
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
                const distance = MathUtils.distance(enemy.x, enemy.y, startEnemy.x, startEnemy.y);
                return distance <= 300; // Increased to 3/8 of map width for better chaining
            });
            
            if (nearbyEnemies.length > 0) {
                const nextTarget = MathUtils.randomChoice(nearbyEnemies);
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
            const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
            
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
            const clampedX = MathUtils.clamp(tornadoX, 50, GAME_CONFIG.CANVAS_WIDTH - 50);
            const clampedY = MathUtils.clamp(tornadoY, 50, GAME_CONFIG.CANVAS_HEIGHT - 50);
            
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
            const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
            
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
                    const randomEnemy = MathUtils.randomChoice(this.game.enemies);
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
                targetX = MathUtils.clamp(targetX, 20, GAME_CONFIG.CANVAS_WIDTH - 20);
                targetY = MathUtils.clamp(targetY, 20, GAME_CONFIG.CANVAS_HEIGHT - 20);
                
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
            const distance = MathUtils.distance(enemy.x, enemy.y, x, y);
            
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