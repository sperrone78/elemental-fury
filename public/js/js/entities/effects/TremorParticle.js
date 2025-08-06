/**
 * TremorParticle - Earth tremor particle effect
 */
export class TremorParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.shouldRemove = false;
        this.size = 2 + Math.random() * 8; // Larger size range for more variety
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = Math.random() > 0.5 ? 'brown' : 'gray';
        this.scale = 1 + Math.random() * 0.5; // Random scale multiplier
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vx *= 0.95; // Slow down over time
        this.vy *= 0.95;
        this.rotation += this.rotationSpeed; // Add rotation animation
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
        ctx.scale(this.scale, this.scale);
        
        if (this.color === 'brown') {
            ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        } else {
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
        }
        
        // Draw jagged rock/earth chunk with enhanced visibility
        ctx.beginPath();
        ctx.moveTo(-this.size/2, -this.size/3);
        ctx.lineTo(this.size/3, -this.size/2);
        ctx.lineTo(this.size/2, this.size/3);
        ctx.lineTo(-this.size/3, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Add subtle glow effect for better visibility
        ctx.shadowColor = this.color === 'brown' ? 'rgba(139, 69, 19, 0.3)' : 'rgba(128, 128, 128, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fill();
        
        ctx.restore();
    }
}