/**
 * Water Element Classes - Water Globe and Water Splash Particle
 */
import { ELEMENT_CONFIG } from '../utils/Constants.js';
import { XPPickup } from '../entities/pickups/XPPickup.js';

export class WaterGlobe {
    constructor(player, index) {
        this.player = player;
        this.index = index;
        
        // Apply Earth radius modifier to water globe size
        const baseRadius = ELEMENT_CONFIG.WATER.GLOBE.BASE_RADIUS;
        if (player && player.elementalModifiers) {
            const modifiers = player.elementalModifiers.getModifiers();
            this.radius = baseRadius * modifiers.radiusMultiplier;
        } else {
            this.radius = baseRadius;
        }
        
        // Increase orbital distance based on water level for better spacing
        const waterLevel = player.upgradeCount.water || 0;
        const baseOrbitRadius = ELEMENT_CONFIG.WATER.GLOBE.BASE_ORBIT_RADIUS;
        this.orbitRadius = baseOrbitRadius + (waterLevel * 5); // +5px per water level
        
        this.damage = ELEMENT_CONFIG.WATER.GLOBE.BASE_DAMAGE;
        this.angle = (index * Math.PI * 2) / Math.max(1, this.getGlobeCount()); // Evenly distribute globes
        this.rotationSpeed = ELEMENT_CONFIG.WATER.GLOBE.BASE_ROTATION_SPEED;
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

export class WaterSplashParticle {
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