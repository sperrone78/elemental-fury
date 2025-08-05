/**
 * DebrisParticle - Debris particle effect for earth-based abilities
 */
export class DebrisParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2; // Upward bias
        this.life = 2;
        this.maxLife = 2;
        this.shouldRemove = false;
        this.size = 2 + Math.random() * 3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = 0.15;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vy += this.gravity; // Apply gravity
        this.vx *= 0.98; // Air resistance
        this.rotation += this.rotationSpeed;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}