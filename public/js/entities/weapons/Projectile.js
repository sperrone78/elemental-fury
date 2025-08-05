import { WEAPON_CONFIG, GAME_CONFIG } from '../../utils/Constants.js';

export class Projectile {
    constructor(x, y, dirX, dirY, damage, range) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = WEAPON_CONFIG.BASIC.PROJECTILE_SPEED;
        this.damage = damage;
        this.range = range;
        this.traveled = 0;
        this.radius = WEAPON_CONFIG.BASIC.RADIUS;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        const movement = this.speed * deltaTime * 60;
        this.x += this.dirX * movement;
        this.y += this.dirY * movement;
        this.traveled += movement;
        
        if (this.traveled >= this.range || 
            this.x < 0 || this.x > GAME_CONFIG.CANVAS_WIDTH || 
            this.y < 0 || this.y > GAME_CONFIG.CANVAS_HEIGHT) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffff44';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}