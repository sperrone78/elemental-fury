/**
 * Air Element Classes - Wind Blade Projectile and Tornado
 */
import { Projectile } from '../entities/weapons/Projectile.js';
import { ELEMENT_CONFIG, GAME_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

export class WindBladeProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, range, game) {
        super(x, y, dirX, dirY, damage, range);
        this.game = game;
        this.speed = ELEMENT_CONFIG.AIR.WIND_BLADE.SPEED;
        this.radius = 6; // Larger hit radius
        this.visualSize = 12; // Larger visual size
        this.age = 0;
        this.seekRadius = ELEMENT_CONFIG.AIR.WIND_BLADE.SEEK_RADIUS;
        this.seekStrength = ELEMENT_CONFIG.AIR.WIND_BLADE.SEEK_STRENGTH;
        this.curveIntensity = ELEMENT_CONFIG.AIR.WIND_BLADE.CURVE_INTENSITY;
        
        // Calculate when to start seeking (halfway through flight)
        this.maxFlightTime = range / (this.speed * 60); // Convert to seconds
        this.seekStartTime = this.maxFlightTime * 0.5; // Halfway point
        this.distanceTraveled = 0;
        
        // Initial curve direction (left or right)
        this.curveDirection = Math.random() > 0.5 ? 1 : -1;
        this.initialDirection = { x: dirX, y: dirY };
        
        // Visual trail
        this.trail = [];
        this.maxTrailLength = 10; // Longer trail
        
        // Rotation for visual effect
        this.rotation = Math.atan2(dirY, dirX);
        this.rotationSpeed = 0.25; // Slightly slower rotation
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Update trail alpha
        this.trail.forEach((point, index) => {
            point.alpha = (index + 1) / this.trail.length * 0.6;
        });
        
        // Seeking behavior - find closest enemy
        let closestEnemy = null;
        let closestDistance = this.seekRadius;
        
        if (this.game && this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                const distance = MathUtils.distance(this.x, this.y, enemy.x, enemy.y);
                if (distance < closestDistance) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
        }
        
        // Apply seeking force if enemy found (after halfway point)
        if (closestEnemy && this.age > this.seekStartTime) { // Start seeking halfway through flight
            const seekX = closestEnemy.x - this.x;
            const seekY = closestEnemy.y - this.y;
            const seekDistance = Math.sqrt(seekX * seekX + seekY * seekY);
            
            if (seekDistance > 0) {
                const normalizedSeekX = seekX / seekDistance;
                const normalizedSeekY = seekY / seekDistance;
                
                // Blend current direction with seek direction
                this.dirX = MathUtils.lerp(this.dirX, normalizedSeekX, this.seekStrength * deltaTime);
                this.dirY = MathUtils.lerp(this.dirY, normalizedSeekY, this.seekStrength * deltaTime);
                
                // Normalize the new direction
                const newMagnitude = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
                if (newMagnitude > 0) {
                    this.dirX /= newMagnitude;
                    this.dirY /= newMagnitude;
                }
            }
        } else {
            // Apply initial curving motion when no target
            const perpX = -this.initialDirection.y * this.curveDirection;
            const perpY = this.initialDirection.x * this.curveDirection;
            const curveForce = Math.sin(this.age * this.curveIntensity) * 0.3;
            
            this.dirX += perpX * curveForce * deltaTime;
            this.dirY += perpY * curveForce * deltaTime;
            
            // Normalize
            const magnitude = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
            if (magnitude > 0) {
                this.dirX /= magnitude;
                this.dirY /= magnitude;
            }
        }
        
        // Update rotation for visual spinning
        this.rotation += this.rotationSpeed * deltaTime * 60;
        
        // Call parent update for movement and range checking
        super.update(deltaTime);
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw trail first
        this.trail.forEach((point, index) => {
            if (index > 0) {
                const prevPoint = this.trail[index - 1];
                ctx.strokeStyle = `rgba(173, 216, 230, ${point.alpha * 0.5})`;
                ctx.lineWidth = 2 * (point.alpha);
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        });
        
        // Draw wind blade
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Main blade (crescent shape)
        ctx.fillStyle = 'rgba(173, 216, 230, 0.9)';
        ctx.strokeStyle = 'rgba(135, 206, 235, 1.0)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        // Draw larger crescent moon shape
        ctx.arc(0, 0, this.visualSize, 0.3, Math.PI - 0.3);
        ctx.arc(3, 0, this.visualSize * 0.75, Math.PI + 0.3, -0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner glow effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, this.visualSize * 0.5, 0.5, Math.PI - 0.5);
        ctx.arc(3, 0, this.visualSize * 0.4, Math.PI + 0.5, -0.5);
        ctx.closePath();
        ctx.fill();
        
        // Wind particles around blade (more for larger size)
        for (let i = 0; i < 6; i++) {
            const angle = (this.age * 4 + i * Math.PI/3) % (Math.PI * 2);
            const particleX = Math.cos(angle) * (this.visualSize + 4);
            const particleY = Math.sin(angle) * (this.visualSize * 0.6);
            
            ctx.fillStyle = `rgba(173, 216, 230, ${0.3 + 0.3 * Math.sin(this.age * 6 + i)})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
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
                {
                    const wp = this.game.pools?.windParticle ? this.game.pools.windParticle.acquire(enemy.x, enemy.y) : new WindParticle(enemy.x, enemy.y);
                    this.game.particles.push(wp);
                }
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