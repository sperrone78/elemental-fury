/**
 * EnemyProjectile - Basic projectile fired by enemies
 */
import { GAME_CONFIG } from '../../utils/Constants.js';

export class EnemyProjectile {
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