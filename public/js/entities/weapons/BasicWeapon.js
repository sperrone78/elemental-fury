import { WEAPON_CONFIG, ELEMENT_CONFIG } from '../../utils/Constants.js';
import { MathUtils } from '../../utils/MathUtils.js';
import { Projectile } from './Projectile.js';
import { WindBladeProjectile } from '../../elements/Air.js';

export class BasicWeapon {
    constructor(owner) {
        this.owner = owner;
        this.damage = WEAPON_CONFIG.BASIC.DAMAGE;
        this.cooldown = WEAPON_CONFIG.BASIC.COOLDOWN;
        this.lastFire = 0;
        this.range = WEAPON_CONFIG.BASIC.RANGE;
    }
    
    update(mousePos, deltaTime) {
        if (this.owner.game.gameTime - this.lastFire >= this.cooldown) {
            this.fire(mousePos);
            this.lastFire = this.owner.game.gameTime;
        }
    }
    
    fire(mousePos) {
        const dx = mousePos.x - this.owner.x;
        const dy = mousePos.y - this.owner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Basic weapon always fires regular projectiles (pooled if available)
            const proj = this.owner.game.pools?.projectile
                ? this.owner.game.pools.projectile.acquire(
                    this.owner.x, this.owner.y,
                    dirX, dirY,
                    this.damage, this.range
                  )
                : new Projectile(
                    this.owner.x, this.owner.y,
                    dirX, dirY,
                    this.damage, this.range
                  );
            this.owner.game.projectiles.push(proj);
        }
    }
}