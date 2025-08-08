import { ENEMY_CONFIG, GAME_CONFIG } from '../../utils/Constants.js';
import { MathUtils } from '../../utils/MathUtils.js';
import { Enemy, VeteranEnemy } from './Enemy.js';
import { EnemyProjectile, SpikeProjectile } from '../weapons/index.js';
import { SummonRing } from '../effects/SummonRing.js';

export class BossEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.speed = 0.7;
        this.health = ENEMY_CONFIG.BOSS.BASIC.HEALTH;
        this.maxHealth = ENEMY_CONFIG.BOSS.BASIC.HEALTH;
        this.isBoss = true;
        this.lastShot = 0;
        this.shootCooldown = 1.5;
        this.game = null;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game && this.game.gameTime - this.lastShot >= this.shootCooldown) {
            this.shootAtPlayer(player);
            this.lastShot = this.game.gameTime;
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            const proj = this.game.pools?.enemyProjectile
                ? this.game.pools.enemyProjectile.acquire(this.x, this.y, dirX, dirY)
                : new EnemyProjectile(this.x, this.y, dirX, dirY);
            this.game.enemyProjectiles.push(proj);
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#aa1111';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * (1 - healthPercent), 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 10, this.radius * 2 * healthPercent, 4);
    }
}

export class VeteranBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.speed = 0.8;
        this.health = ENEMY_CONFIG.BOSS.VETERAN.HEALTH;
        this.maxHealth = ENEMY_CONFIG.BOSS.VETERAN.HEALTH;
        this.isBoss = true;
        this.isVeteran = true;
        this.lastShot = 0;
        this.shootCooldown = 1.2;
        this.lastSpikeBarrage = 0;
        this.spikeBarrageCooldown = 4;
        this.game = null;
        
        // Track initial position for debug
        this.initialX = this.x;
        this.initialY = this.y;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game) {
            // Regular shooting
            if (this.game.gameTime - this.lastShot >= this.shootCooldown) {
                this.shootAtPlayer(player);
                this.lastShot = this.game.gameTime;
            }
            
            // Spike Barrage special ability
            if (this.game.gameTime - this.lastSpikeBarrage >= this.spikeBarrageCooldown) {
                this.spikeBarrage(player);
                this.lastSpikeBarrage = this.game.gameTime;
            }
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            const proj = this.game.pools?.enemyProjectile
                ? this.game.pools.enemyProjectile.acquire(this.x, this.y, dirX, dirY)
                : new EnemyProjectile(this.x, this.y, dirX, dirY);
            this.game.enemyProjectiles.push(proj);
        }
    }
    
    spikeBarrage(player) {
        // Fire 8 spikes in all directions
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            setTimeout(() => {
                const proj = this.game.pools?.spikeProjectile
                    ? this.game.pools.spikeProjectile.acquire(this.x, this.y, dirX, dirY)
                    : new SpikeProjectile(this.x, this.y, dirX, dirY);
                this.game.enemyProjectiles.push(proj);
            }, i * 50); // Stagger spike shots
        }
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = '#cc4400';
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw spikes around the boss
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const spikeX = this.x + Math.cos(angle) * this.radius;
            const spikeY = this.y + Math.sin(angle) * this.radius;
            const tipX = this.x + Math.cos(angle) * (this.radius + 8);
            const tipY = this.y + Math.sin(angle) * (this.radius + 8);
            
            ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#990000');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 15, this.radius * 2 * (1 - healthPercent), 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 15, this.radius * 2 * healthPercent, 6);
    }
}

export class EliteBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 35;
        this.speed = 0.9;
        this.health = ENEMY_CONFIG.BOSS.ELITE.HEALTH;
        this.maxHealth = ENEMY_CONFIG.BOSS.ELITE.HEALTH;
        this.isBoss = true;
        this.isElite = true;
        this.armor = ENEMY_CONFIG.BOSS.ELITE.ARMOR;
        this.lastShot = 0;
        this.shootCooldown = 1;
        this.lastDominance = 0;
        this.dominanceCooldown = 6;
        this.game = null;
    }
    
    update(player, deltaTime) {
        super.update(player, deltaTime);
        
        if (this.game) {
            // Faster shooting than other bosses
            if (this.game.gameTime - this.lastShot >= this.shootCooldown) {
                this.shootAtPlayer(player);
                this.lastShot = this.game.gameTime;
            }
            
            // Royal Dominance special ability
            if (this.game.gameTime - this.lastDominance >= this.dominanceCooldown) {
                this.royalDominance();
                this.lastDominance = this.game.gameTime;
            }
        }
    }
    
    shootAtPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(dirY, dirX) + i * 0.2;
                const shotDirX = Math.cos(angle);
                const shotDirY = Math.sin(angle);
                
                    this.game.enemyProjectiles.push(new EnemyProjectile(
                    this.x, this.y, shotDirX, shotDirY
                ));
            }
        }
    }
    
    royalDominance() {
        // Summon 3 veteran enemies around the boss
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3;
            const spawnX = this.x + Math.cos(angle) * 80;
            const spawnY = this.y + Math.sin(angle) * 80;
            
            // Keep spawns within bounds
            const clampedX = MathUtils.clamp(spawnX, 20, GAME_CONFIG.CANVAS_WIDTH - 20);
            const clampedY = MathUtils.clamp(spawnY, 20, GAME_CONFIG.CANVAS_HEIGHT - 20);
            
            const summonedEnemy = new VeteranEnemy(clampedX, clampedY);
            this.game.enemies.push(summonedEnemy);
        }
        
        // Note: SummonRing class needs to be extracted and imported
        // Create summon effect
        this.game.particles.push(new SummonRing(this.x, this.y, 80));
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.armor);
        this.health -= actualDamage;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 4;
        } else {
            ctx.fillStyle = '#6600cc';
            ctx.strokeStyle = '#9944ff';
            ctx.lineWidth = 4;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Double ring for elite status
        ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#bb66ff');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 12, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 12, this.y - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Elite crown - larger and more elaborate
        ctx.strokeStyle = this.frozen ? '#ffffff' : (this.stunned ? '#ffaa00' : '#ffff00');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.radius + 5);
        ctx.lineTo(this.x - 8, this.y - this.radius - 8);
        ctx.lineTo(this.x - 4, this.y - this.radius + 2);
        ctx.lineTo(this.x, this.y - this.radius - 12);
        ctx.lineTo(this.x + 4, this.y - this.radius + 2);
        ctx.lineTo(this.x + 8, this.y - this.radius - 8);
        ctx.lineTo(this.x + 15, this.y - this.radius + 5);
        ctx.stroke();
        
        // Health bar - thicker for elite boss
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 20, this.radius * 2 * (1 - healthPercent), 8);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius + (this.radius * 2 * (1 - healthPercent)), this.y - this.radius - 20, this.radius * 2 * healthPercent, 8);
    }
}