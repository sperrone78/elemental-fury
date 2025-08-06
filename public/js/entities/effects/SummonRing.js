export class SummonRing {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.life = 1;
        this.maxLife = 1;
        this.shouldRemove = false;
        this.pulseTime = 0;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.pulseTime += 1/60;
        this.currentRadius = this.maxRadius * (1 - this.life / this.maxLife);
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        const pulseIntensity = Math.sin(this.pulseTime * 8) * 0.3 + 0.7;
        
        // Outer summoning ring - purple
        ctx.strokeStyle = `rgba(153, 68, 255, ${alpha * pulseIntensity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring - bright purple
        ctx.strokeStyle = `rgba(187, 102, 255, ${alpha * pulseIntensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Mystical runes around the ring
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + this.pulseTime;
            const runeX = this.x + Math.cos(angle) * this.currentRadius;
            const runeY = this.y + Math.sin(angle) * this.currentRadius;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulseIntensity})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central glow
        ctx.fillStyle = `rgba(153, 68, 255, ${alpha * pulseIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}