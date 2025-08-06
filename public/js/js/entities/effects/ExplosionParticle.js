/**
 * ExplosionParticle - Visual particle effect for explosions
 */
export class ExplosionParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.shouldRemove = false;
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
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}