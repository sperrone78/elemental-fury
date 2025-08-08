/**
 * Fire Element Classes - Fireball Projectile and Inferno Wave
 */
import { Projectile } from '../entities/weapons/Projectile.js';
import { ELEMENT_CONFIG, GAME_CONFIG } from '../utils/Constants.js';
import { DOTEffect } from '../entities/effects/DOTEffect.js';
import { ExplosionParticle } from '../entities/effects/ExplosionParticle.js';

export class FireballProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        super(x, y, dirX, dirY, damage, range);
        this.radius = 6;
        this.explosionRadius = ELEMENT_CONFIG.FIRE.FIREBALL.RADIUS;
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
                this.createInfernoWave(game, hitEnemy.x, hitEnemy.y, this.damage * ELEMENT_CONFIG.FIRE.INFERNO_WAVE.DAMAGE_MULTIPLIER);
            });
        }
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const p = game.pools?.explosion ? game.pools.explosion.acquire(
                this.x + Math.cos(angle) * 15,
                this.y + Math.sin(angle) * 15
            ) : new ExplosionParticle(this.x + Math.cos(angle) * 15, this.y + Math.sin(angle) * 15);
            game.particles.push(p);
        }
    }
    
    createInfernoWave(game, centerX, centerY, damage) {
        const infernoRadius = ELEMENT_CONFIG.FIRE.INFERNO_WAVE.RADIUS;
        
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
            const p = game.pools?.explosion ? game.pools.explosion.acquire(
                centerX + Math.cos(angle) * 20,
                centerY + Math.sin(angle) * 20
            ) : new ExplosionParticle(centerX + Math.cos(angle) * 20, centerY + Math.sin(angle) * 20);
            game.particles.push(p);
        }
    }
}

export class InfernoWave {
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