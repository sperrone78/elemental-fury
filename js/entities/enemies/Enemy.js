import { ENEMY_CONFIG } from '../../utils/Constants.js';
import { MathUtils } from '../../utils/MathUtils.js';

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = ENEMY_CONFIG.BASIC.RADIUS;
        this.speed = ENEMY_CONFIG.BASIC.SPEED;
        this.health = ENEMY_CONFIG.BASIC.HEALTH;
        this.maxHealth = ENEMY_CONFIG.BASIC.HEALTH;
        this.shouldRemove = false;
        this.isBoss = false;
        this.frozen = false;
        this.frozenTime = 0;
        this.stunned = false;
        this.stunnedTime = 0;
    }
    
    update(player, deltaTime) {
        // Handle frozen state
        if (this.frozen) {
            this.frozenTime -= deltaTime;
            if (this.frozenTime <= 0) {
                this.frozen = false;
            }
            return; // Don't move when frozen
        }
        
        // Handle stunned state
        if (this.stunned) {
            this.stunnedTime -= deltaTime;
            if (this.stunnedTime <= 0) {
                this.stunned = false;
            }
            return; // Don't move when stunned
        }
        
        // Validate player and enemy coordinates before movement calculation
        if (!player || isNaN(player.x) || isNaN(player.y) || isNaN(this.x) || isNaN(this.y)) {
            console.warn('Invalid coordinates detected in Enemy update:', {
                playerX: player?.x,
                playerY: player?.y,
                enemyX: this.x,
                enemyY: this.y
            });
            return; // Skip movement if coordinates are invalid
        }
        
        // Debug logging for VeteranBoss movement - focus on stuck ones
        if (this.isVeteran && this.health === 300 && Math.random() < 0.05) { // Focus on full-health (level-up) bosses
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Debug stuck level-up bosses
        
        if (distance > 0 && !isNaN(distance)) {
            const moveX = (dx / distance) * this.speed * deltaTime * 60;
            const moveY = (dy / distance) * this.speed * deltaTime * 60;
            
            
            // Validate movement before applying
            if (!isNaN(moveX) && !isNaN(moveY)) {
                this.x += moveX;
                this.y += moveY;
            }
        }
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        } else if (this.stunned) {
            ctx.fillStyle = '#ffff44';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#ff4444';
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.frozen || this.stunned) {
            ctx.stroke();
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
}

export class VeteranEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = ENEMY_CONFIG.VETERAN.RADIUS;
        this.speed = ENEMY_CONFIG.VETERAN.SPEED;
        this.health = ENEMY_CONFIG.VETERAN.HEALTH;
        this.maxHealth = ENEMY_CONFIG.VETERAN.HEALTH;
        this.isVeteran = true;
        this.xpReward = ENEMY_CONFIG.VETERAN.XP_DROP;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#ff8800';
            ctx.strokeStyle = '#ffaa44';
            ctx.lineWidth = 2;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Veterans have spikes
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const spikeX = this.x + Math.cos(angle) * this.radius;
            const spikeY = this.y + Math.sin(angle) * this.radius;
            const tipX = this.x + Math.cos(angle) * (this.radius + 4);
            const tipY = this.y + Math.sin(angle) * (this.radius + 4);
            
            ctx.strokeStyle = this.frozen ? '#ffffff' : '#cc6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }
    }
}

export class EliteEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = ENEMY_CONFIG.ELITE.RADIUS;
        this.speed = ENEMY_CONFIG.ELITE.SPEED;
        this.health = ENEMY_CONFIG.ELITE.HEALTH;
        this.maxHealth = ENEMY_CONFIG.ELITE.HEALTH;
        this.isElite = true;
        this.xpReward = ENEMY_CONFIG.ELITE.XP_DROP;
        this.armor = ENEMY_CONFIG.ELITE.ARMOR;
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.armor);
        this.health -= actualDamage;
    }
    
    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#88ddff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = '#8800ff';
            ctx.strokeStyle = '#aa44ff';
            ctx.lineWidth = 3;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Elite enemies have a double ring
        ctx.strokeStyle = this.frozen ? '#ffffff' : '#cc88ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Elite crown effect
        ctx.strokeStyle = this.frozen ? '#ffffff' : '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y - this.radius + 2);
        ctx.lineTo(this.x - 4, this.y - this.radius - 4);
        ctx.lineTo(this.x, this.y - this.radius + 2);
        ctx.lineTo(this.x + 4, this.y - this.radius - 4);
        ctx.lineTo(this.x + 8, this.y - this.radius + 2);
        ctx.stroke();
    }
}