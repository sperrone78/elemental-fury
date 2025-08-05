/**
 * DOTEffect - Damage Over Time effect system
 */
export class DOTEffect {
    constructor(target, damage, duration, interval) {
        this.target = target;
        this.damage = damage;
        this.duration = duration;
        this.interval = interval;
        this.lastTick = 0;
        this.startTime = 0;
        this.shouldRemove = false;
    }
    
    update(gameTime, deltaTime) {
        if (this.startTime === 0) this.startTime = gameTime;
        
        if (gameTime - this.startTime >= this.duration) {
            this.shouldRemove = true;
            return;
        }
        
        if (gameTime - this.lastTick >= this.interval) {
            if (this.target && this.target.health > 0) {
                this.target.takeDamage(this.damage);
            }
            this.lastTick = gameTime;
        }
    }
}