import { ENEMY_CONFIG } from '../../utils/Constants.js';

export class XPPickup {
    constructor(x, y, value = ENEMY_CONFIG.BASIC.XP_DROP) {
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

export class VeteranXPPickup extends XPPickup {
    constructor(x, y) {
        super(x, y, ENEMY_CONFIG.VETERAN.XP_DROP);
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

export class EliteXPPickup extends XPPickup {
    constructor(x, y) {
        super(x, y, ENEMY_CONFIG.ELITE.XP_DROP);
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