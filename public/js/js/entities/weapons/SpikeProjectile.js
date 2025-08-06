/**
 * SpikeProjectile - Spike projectile fired by boss enemies
 */
import { GAME_CONFIG } from '../../utils/Constants.js';

export class SpikeProjectile {
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
            this.x < 0 || this.x > GAME_CONFIG.CANVAS_WIDTH || 
            this.y < 0 || this.y > GAME_CONFIG.CANVAS_HEIGHT) {
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