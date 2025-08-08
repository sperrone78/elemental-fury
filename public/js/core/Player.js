import { PLAYER_CONFIG, GAME_CONFIG, ELEMENT_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { FireballProjectile } from '../elements/Fire.js';
import { TremorParticle } from '../entities/effects/TremorParticle.js';
import { DebrisParticle } from '../entities/effects/DebrisParticle.js';
import { LightningBolt, DelayedLightningChain, IceRing, EarthquakeWave, ShockwaveRing, StormClouds, ThunderBolt, LightningImpact, ElectricSpark } from '../entities/effects/LightningEffects.js';
import { Tornado, WindBladeProjectile } from '../elements/Air.js';
import { ElementalModifiers } from '../systems/ElementalModifiers.js';

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
        
        // Elemental modifier system
        this.elementalModifiers = new ElementalModifiers(this);
        
        this.upgradeCount = {
            water: 0,    // was health
            earth: 0,    // was speed  
            fire: 0,     // was damage
            lightning: 0, // was fireRate
            air: 0       // was range
        };
        
        // New progression system tracking
        this.chosenElements = []; // Max 3 distinct elements for levels 1-5
        this.ultimateElements = []; // Elements that reached Level 6 (max 2 for ultimate mastery)
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
        // Wind Blades system
        this.nextWindBladeAt = null;
        
        // Elemental Aura System variables
        this.auraTime = 0;
        this.lastX = x;
        this.lastY = y;
        this.trailParticles = [];
        this.auraParticles = [];
        
        // Debug method for testing modifiers
        this.debugModifiers = () => {
            console.log('🔧 Current Elemental Modifiers:');
            this.elementalModifiers.logModifiers();
        };
    }
    
    // Elemental Aura System Methods
    // Returns a blended color palette based on the two highest elemental levels
    getDominantElementColor() {
        const palette = {
            fire: { core: '#ff0000' },
            water: { core: '#1f1ffc' },
            earth: { core: '#8b5a2b' },
            air: { core: '#95e1d3' },
            lightning: { core: '#ffff00' }
        };

        // Helper functions kept local to this class for clarity
        const hexToRgb = (hex) => {
            const sanitized = hex.replace('#', '');
            const bigint = parseInt(sanitized, 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        };

        const rgbToHex = (r, g, b) => {
            const toHex = (v) => v.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        };

        const rgbaString = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

        // Sort elements by their levels descending
        const sorted = Object.entries(this.upgradeCount)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0));

        const [first, second] = [sorted[0], sorted[1] || ['fire', 0]];
        const firstLevel = first ? first[1] : 0;
        const secondLevel = second ? second[1] : 0;

        // If no elements leveled, return neutral palette
        if ((firstLevel || 0) === 0) {
            const neutral = { r: 74, g: 124, b: 89 }; // #4a7c59
            return {
                core: '#4a7c59',
                aura: rgbaString(neutral.r, neutral.g, neutral.b, 0.3)
            };
        }

        // If only one element leveled, use its color directly
        if ((secondLevel || 0) === 0) {
            const base = palette[first[0]] || palette.fire;
            const c = hexToRgb(base.core);
            return {
                core: base.core,
                aura: rgbaString(c.r, c.g, c.b, 0.3)
            };
        }

        // Blend two highest elements proportionally to their levels
        const total = firstLevel + secondLevel;
        const w1 = firstLevel / total;
        const w2 = secondLevel / total;

        const c1 = hexToRgb((palette[first[0]] || palette.fire).core);
        const c2 = hexToRgb((palette[second[0]] || palette.fire).core);

        const blended = {
            r: Math.round(c1.r * w1 + c2.r * w2),
            g: Math.round(c1.g * w1 + c2.g * w2),
            b: Math.round(c1.b * w1 + c2.b * w2)
        };

        return {
            core: rgbToHex(blended.r, blended.g, blended.b),
            aura: rgbaString(blended.r, blended.g, blended.b, 0.3)
        };
    }
    
    updateAura() {
        this.auraTime += 0.016; // Roughly 60fps timing
        
        // Add movement trail particles
        const moved = Math.abs(this.x - this.lastX) > 1 || Math.abs(this.y - this.lastY) > 1;
        if (moved && this.trailParticles.length < 15) {
            const dominantColor = this.getDominantElementColor();
            this.trailParticles.push({
                x: this.lastX + (Math.random() - 0.5) * 4,
                y: this.lastY + (Math.random() - 0.5) * 4,
                life: 0.8,
                maxLife: 0.8,
                color: dominantColor.core
            });
        }
        
        // Update trail particles
        this.trailParticles = this.trailParticles.filter(particle => {
            particle.life -= 0.016;
            return particle.life > 0;
        });
        
        // Generate floating aura particles
        if (this.auraParticles.length < 8) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const dominantColor = this.getDominantElementColor();
            
            this.auraParticles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                angle: angle,
                baseDistance: distance,
                orbitSpeed: 0.5 + Math.random() * 0.5,
                life: 2 + Math.random() * 2,
                maxLife: 2 + Math.random() * 2,
                size: 2 + Math.random() * 2,
                color: dominantColor.core
            });
        }
        
        // Update floating particles
        this.auraParticles = this.auraParticles.filter(particle => {
            particle.life -= 0.016;
            particle.angle += particle.orbitSpeed * 0.016;
            const oscillation = Math.sin(this.auraTime + particle.angle) * 5;
            particle.x = this.x + Math.cos(particle.angle) * (particle.baseDistance + oscillation);
            particle.y = this.y + Math.sin(particle.angle) * (particle.baseDistance + oscillation);
            return particle.life > 0;
        });
        
        this.lastX = this.x;
        this.lastY = this.y;
    }
    
    renderElementalAura(ctx) {
        const blendedColor = this.getDominantElementColor();
        const auraRadius = 50 + Math.sin(this.auraTime * 2) * 5;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 20,
            this.x, this.y, auraRadius
        );
        // Use two alpha stops for a soft aura
        gradient.addColorStop(0, blendedColor.aura);
        gradient.addColorStop(0.5, blendedColor.aura.replace('0.3', '0.1'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderTrailParticles(ctx) {
        this.trailParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            const size = 3 * alpha;
            
            ctx.fillStyle = particle.color.replace(')', `, ${alpha * 0.6})`);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderAuraParticles(ctx) {
        this.auraParticles.forEach(particle => {
            const alpha = (particle.life / particle.maxLife) * 0.8;
            const pulseSize = particle.size + Math.sin(this.auraTime * 4 + particle.angle) * 1;
            
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        });
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
        
        if (this.specialAbilities.windBlades) {
            this.updateWindBlades();
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
        
        // Health regeneration (including elemental water regen)
        const totalRegen = this.healthRegen + this.elementalModifiers.getHealthRegenRate();
        if (totalRegen > 0) {
            if (!this.lastRegenTick) this.lastRegenTick = this.game.gameTime;
            if (this.game.gameTime - this.lastRegenTick >= 1) {
                this.health = Math.floor(Math.min(this.maxHealth, this.health + totalRegen));
                this.lastRegenTick = this.game.gameTime;
            }
        }
        
        // Update elemental aura system
        this.updateAura();
    }

    updateWindBlades() {
        // Compute cooldown: base 0.5s reduced by Lightning attack speed
        const baseCooldown = (ELEMENT_CONFIG && ELEMENT_CONFIG.AIR && ELEMENT_CONFIG.AIR.WIND_BLADE && ELEMENT_CONFIG.AIR.WIND_BLADE.COOLDOWN) || 0.5;
        const modifiers = this.elementalModifiers.getModifiers();
        const cooldown = Math.max(0.1, baseCooldown * modifiers.attackSpeedMultiplier); // clamp to avoid bursty catch-up

        // Schedule-style timing to avoid catch-up bursts
        if (this.nextWindBladeAt == null) {
            this.nextWindBladeAt = this.game.gameTime + cooldown;
            return;
        }
        if (this.game.gameTime < this.nextWindBladeAt) return;

        const airLevel = this.upgradeCount.air || 0;
        const bladeCount = ELEMENT_CONFIG.AIR.WIND_BLADE.COUNT[Math.min(airLevel, 5)] || 0;
        if (bladeCount <= 0) { this.nextWindBladeAt = this.game.gameTime + cooldown; return; }

        // Use modified weapon stats for damage/range scaling (Fire/Air/Earth/Lightning)
        const baseStats = {
            damage: this.weapons[0] ? this.weapons[0].baseDamage || 20 : 20,
            range: 200,
            cooldown: 0.5,
            radius: 6
        };
        const modified = this.elementalModifiers.getModifiedWeaponStats(baseStats);

        for (let i = 0; i < bladeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const proj = this.game.pools?.windBladeProjectile
                ? this.game.pools.windBladeProjectile.acquire(
                    this.x, this.y,
                    Math.cos(angle), Math.sin(angle),
                    modified.damage * ELEMENT_CONFIG.AIR.WIND_BLADE.DAMAGE_MULTIPLIER,
                    modified.range,
                    this.game
                  )
                : new WindBladeProjectile(
                    this.x, this.y,
                    Math.cos(angle), Math.sin(angle),
                    modified.damage * ELEMENT_CONFIG.AIR.WIND_BLADE.DAMAGE_MULTIPLIER,
                    modified.range,
                    this.game
                  );
            this.game.projectiles.push(proj);
        }

        this.nextWindBladeAt += cooldown;
    }
    
    render(ctx) {
        // Render elemental aura effects first (behind player)
        this.renderElementalAura(ctx);
        this.renderTrailParticles(ctx);
        this.renderAuraParticles(ctx);
        
        if (this.specialAbilities.radiusAttack) {
            // Use new modifier system for tremor range display
            const baseTremorStats = {
                radius: 80 // Base tremor range
            };
            const modifiedStats = this.elementalModifiers.getModifiedAbilityStats(baseTremorStats);
            const tremorRange = modifiedStats.radius;
            
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
            // Use dynamic blended color based on top two elements
            const blendedColor = this.getDominantElementColor();
            ctx.fillStyle = blendedColor.core;
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
                
                const baseStats = {
                    damage: this.weapons[0] ? this.weapons[0].baseDamage || 20 : 20,
                    range: 200
                };
                const modifiedStats = this.elementalModifiers.getModifiedWeaponStats(baseStats);
                
                const fireball = new FireballProjectile(
                    this.x, this.y, 
                    direction.x, direction.y, 
                    modifiedStats.damage, 
                    modifiedStats.range,
                    this // Pass player reference for radius calculation
                );
                this.game.projectiles.push(fireball);
                
                this.lastFireballTime = this.game.gameTime;
            }
        }
    }
    
    updateRadiusAttack() {
        if (!this.tremorCooldown) this.tremorCooldown = 0;
        
        // Use new modifier system for tremor stats
        const baseTremorStats = {
            damage: 7, // Base tremor damage
            radius: 80 // Base tremor range
        };
        
        const modifiedStats = this.elementalModifiers.getModifiedAbilityStats(baseTremorStats);
        const pulseInterval = 0.5; // Keep base interval - don't modify frequency
        
        if (this.game.gameTime - this.tremorCooldown >= pulseInterval) {
            // Use modified damage and radius
            const tremorRange = modifiedStats.radius;
            const damage = modifiedStats.damage;
            
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
                        {
                            const p = this.game.pools?.tremor ? this.game.pools.tremor.acquire(enemy.x + offsetX, enemy.y + offsetY) : new TremorParticle(enemy.x + offsetX, enemy.y + offsetY);
                            this.game.particles.push(p);
                        }
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
                    {
                        const p = this.game.pools?.tremor ? this.game.pools.tremor.acquire(px, py) : new TremorParticle(px, py);
                        this.game.particles.push(p);
                    }
                }
            }
            
            this.tremorCooldown = this.game.gameTime;
        }
    }
    
    updateLightningStrike() {
        if (!this.lightningCooldown) this.lightningCooldown = 0;
        
        // Use modifier system for lightning cooldown
        const baseLightningStats = {
            cooldown: 2.0,
            damage: 30,
            range: 150
        };
        
        const modifiedStats = this.elementalModifiers.getModifiedAbilityStats(baseLightningStats);
        
        if (this.game.gameTime - this.lightningCooldown >= modifiedStats.cooldown) {
            const enemiesInRange = this.game.enemies.filter(enemy => {
                const distance = MathUtils.distance(enemy.x, enemy.y, this.x, this.y);
                return distance <= modifiedStats.range;
            });
            
            if (enemiesInRange.length > 0) {
                // NEW SYSTEM: 1 base target + 1 per Lightning level
                const lightningLevel = this.upgradeCount.lightning || 0;
                const totalTargets = 1 + lightningLevel; // Level 1 = 2 targets, Level 2 = 3 targets, etc.
                
                this.performLightningChain(enemiesInRange[0], enemiesInRange, totalTargets, modifiedStats.damage);
                this.lightningCooldown = this.game.gameTime;
            }
        }
    }
    
    performLightningChain(startEnemy, availableEnemies, totalTargets, damage, currentTarget = 1) {
        if (currentTarget > totalTargets || !startEnemy) return;
        
        startEnemy.takeDamage(damage);
        this.game.recordDamage('chainLightning', damage);
        
        let fromX = this.x;
        let fromY = this.y;
        
        // If not the first target, chain from previous enemy
        if (currentTarget > 1) {
            const previousTarget = availableEnemies.find(e => e.wasLastLightningTarget);
            if (previousTarget) {
                fromX = previousTarget.x;
                fromY = previousTarget.y;
                previousTarget.wasLastLightningTarget = false;
            }
        }
        
        this.game.particles.push(new LightningBolt(fromX, fromY, startEnemy.x, startEnemy.y));
        startEnemy.wasLastLightningTarget = true;
        
        // Continue chaining if we haven't hit all targets yet
        if (currentTarget < totalTargets) {
            const nearbyEnemies = availableEnemies.filter(enemy => {
                if (enemy === startEnemy) return false;
                const distance = MathUtils.distance(enemy.x, enemy.y, startEnemy.x, startEnemy.y);
                return distance <= 300; // Chain range
            });
            
            if (nearbyEnemies.length > 0) {
                const nextTarget = MathUtils.randomChoice(nearbyEnemies);
                this.game.particles.push(new DelayedLightningChain(
                    this, 
                    nextTarget, 
                    availableEnemies, 
                    totalTargets, 
                    damage * 0.8, // Damage reduction per chain
                    0.1, // Chain delay
                    currentTarget + 1 // Next target number
                ));
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
            {
                const d = this.game.pools?.debris ? this.game.pools.debris.acquire(debrisX, debrisY) : new DebrisParticle(debrisX, debrisY);
                this.game.particles.push(d);
            }
        }
    }
    
    updateThunderStorm() {
        if (!this.thunderStormCooldown) this.thunderStormCooldown = 0;
        
        // Use modifier system for thunder storm
        const baseThunderStormStats = {
            cooldown: 6.0,
            damage: 60,
            radius: 200,
            strikeRadius: 40
        };
        
        const modifiedStats = this.elementalModifiers.getModifiedAbilityStats(baseThunderStormStats);
        
        if (this.game.gameTime - this.thunderStormCooldown >= modifiedStats.cooldown) {
            this.createThunderStorm(modifiedStats);
            this.thunderStormCooldown = this.game.gameTime;
        }
    }
    
    createThunderStorm(modifiedStats) {
        const strikesCount = 8; // Number of lightning strikes
        const stormRadius = modifiedStats.radius; // Modified storm area
        const baseDamage = modifiedStats.damage; // Modified damage
        
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
                
                this.createLightningStrike(targetX, targetY, baseDamage, modifiedStats.strikeRadius);
            }, i * 150); // Stagger strikes by 150ms
        }
        
        // Create storm clouds visual effect
        this.game.particles.push(new StormClouds(this.x, this.y, stormRadius));
    }
    
    createLightningStrike(x, y, damage, strikeRadius = 40) {
        
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
            {
                const p = this.game.pools?.spark ? this.game.pools.spark.acquire(sparkX, sparkY) : new ElectricSpark(sparkX, sparkY);
                this.game.particles.push(p);
            }
        }
    }
}