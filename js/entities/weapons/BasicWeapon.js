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
            
            // Basic weapon always fires regular projectiles now (fireball is separate)
            this.owner.game.projectiles.push(new Projectile(
                this.owner.x, this.owner.y,
                dirX, dirY,
                this.damage, this.range
            ));
            
            if (this.owner.specialAbilities.windBlades) {
                // Get Air mastery level to determine number of wind blades
                const airLevel = this.owner.upgradeCount.air || 0;
                const bladeCount = ELEMENT_CONFIG.AIR.WIND_BLADE.COUNT[Math.min(airLevel, 5)];
                
                // Fire wind blades at completely random angles around the character
                for (let i = 0; i < bladeCount; i++) {
                    const randomAngle = Math.random() * Math.PI * 2; // Full 360 degrees
                    
                    this.owner.game.projectiles.push(new WindBladeProjectile(
                        this.owner.x, this.owner.y,
                        Math.cos(randomAngle), Math.sin(randomAngle),
                        this.damage * ELEMENT_CONFIG.AIR.WIND_BLADE.DAMAGE_MULTIPLIER, 
                        this.range,
                        this.owner.game
                    ));
                }
            }
        }
    }
}