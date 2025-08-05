/**
 * Air Element Classes - Missile Projectile and Tornado
 */
import { Projectile } from '../entities/weapons/Projectile.js';
import { ELEMENT_CONFIG, GAME_CONFIG } from '../utils/Constants.js';

export class MissileProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        super(x, y, dirX, dirY, damage, range);
        this.speed = ELEMENT_CONFIG.AIR.MISSILE.SPEED;
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

export class Tornado {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.radius = ELEMENT_CONFIG.AIR.TORNADO.RADIUS;
        this.life = ELEMENT_CONFIG.AIR.TORNADO.DURATION;
        this.maxLife = ELEMENT_CONFIG.AIR.TORNADO.DURATION;
        this.shouldRemove = false;
        this.rotation = 0;
        this.damage = ELEMENT_CONFIG.AIR.TORNADO.DAMAGE;
        this.lastDamage = 0;
        this.damageInterval = ELEMENT_CONFIG.AIR.TORNADO.DAMAGE_INTERVAL;
        
        // Random movement properties
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.changeDirectionTimer = 0;
        this.directionChangeInterval = 2;
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
        if (this.x < this.radius || this.x > GAME_CONFIG.CANVAS_WIDTH - this.radius) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > GAME_CONFIG.CANVAS_HEIGHT - this.radius) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.radius, this.y));
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

export class WindParticle {
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