import { WEAPON_CONFIG } from '../../utils/Constants.js';
import { MathUtils } from '../../utils/MathUtils.js';
import { Projectile } from './Projectile.js';
import { MissileProjectile } from '../../elements/Air.js';

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
            
            if (this.owner.specialAbilities.missiles) {
                // Get Air mastery level to determine number of missiles
                const airLevel = this.owner.upgradeCount.air || 0;
                const missileCount = Math.min(airLevel, 5); // Max 5 missiles
                
                // Missile angles in degrees (converted to radians)
                // 45°, 315°, 180°, 90°, 270°
                const missileAngles = [45, 315, 180, 90, 270];
                
                for (let i = 0; i < missileCount; i++) {
                    const angleInDegrees = missileAngles[i];
                    const angleInRadians = MathUtils.degreesToRadians(angleInDegrees);
                    
                    // Note: MissileProjectile class needs to be extracted and imported
                    this.owner.game.projectiles.push(new MissileProjectile(
                        this.owner.x, this.owner.y,
                        Math.cos(angleInRadians), Math.sin(angleInRadians),
                        this.damage * 0.7, this.range
                    ));
                }
            }
        }
    }
}