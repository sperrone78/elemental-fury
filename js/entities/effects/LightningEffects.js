/**
 * Lightning and Electric Effect Classes
 */

export class LightningBolt {
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

export class DelayedLightningChain {
    constructor(player, target, availableEnemies, totalTargets, damage, delay, currentTarget = 1) {
        this.player = player;
        this.target = target;
        this.availableEnemies = availableEnemies;
        this.totalTargets = totalTargets;
        this.damage = damage;
        this.delay = delay;
        this.currentTarget = currentTarget;
        this.timer = 0;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer >= this.delay) {
            if (this.target && this.target.health > 0) {
                // Use fresh enemy list to avoid stale references
                const freshEnemies = this.player.game.enemies;
                this.player.performLightningChain(this.target, freshEnemies, this.totalTargets, this.damage, this.currentTarget);
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

export class IceRing {
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

export class EarthquakeWave {
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

export class ShockwaveRing {
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

export class StormClouds {
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

export class ThunderBolt {
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

export class LightningImpact {
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

export class ElectricSpark {
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