/**
 * Centralized system for calculating elemental modifiers
 * Handles per-level bonuses for all elements based on player progression
 */
export class ElementalModifiers {
    constructor(player) {
        this.player = player;
    }
    
    /**
     * Calculate all modifiers based on current elemental levels
     * Returns object with all modifier values
     */
    getModifiers() {
        const levels = this.player.upgradeCount;
        
        return {
            // Fire: +10% Damage per level
            damageMultiplier: 1.0 + (levels.fire || 0) * 0.10,
            
            // Earth: +10% Radius per level  
            radiusMultiplier: 1.0 + (levels.earth || 0) * 0.10,
            
            // Air: +10% Range per level
            rangeMultiplier: 1.0 + (levels.air || 0) * 0.10,
            
            // Lightning: +10% Attack Speed per level (reduces cooldown)
            attackSpeedMultiplier: Math.pow(0.9, levels.lightning || 0), // 0.9^level for cooldown reduction
            
            // Water: Health and regen bonuses (handled separately in Player class)
            healthMultiplier: 1.0 + (levels.water || 0) * 0.10,
            healthRegenPerSecond: (levels.water || 0) * 1.0
        };
    }
    
    /**
     * Apply modifiers to base weapon stats
     * @param {Object} baseStats - {damage, range, cooldown, radius}
     * @returns {Object} Modified stats
     */
    getModifiedWeaponStats(baseStats) {
        const modifiers = this.getModifiers();
        
        return {
            damage: Math.floor(baseStats.damage * modifiers.damageMultiplier),
            range: Math.floor(baseStats.range * modifiers.rangeMultiplier), 
            cooldown: parseFloat((baseStats.cooldown * modifiers.attackSpeedMultiplier).toFixed(2)),
            radius: baseStats.radius * modifiers.radiusMultiplier
        };
    }
    
    /**
     * Apply modifiers to base projectile stats
     * @param {Object} baseStats - {damage, range, radius, speed}
     * @returns {Object} Modified stats
     */
    getModifiedProjectileStats(baseStats) {
        const modifiers = this.getModifiers();
        
        return {
            damage: Math.floor(baseStats.damage * modifiers.damageMultiplier),
            range: Math.floor(baseStats.range * modifiers.rangeMultiplier),
            radius: baseStats.radius * modifiers.radiusMultiplier,
            speed: baseStats.speed // Speed not modified by elements currently
        };
    }
    
    /**
     * Apply modifiers to ability stats (for special abilities)
     * @param {Object} baseStats - {damage, range, radius, cooldown}
     * @returns {Object} Modified stats
     */
    getModifiedAbilityStats(baseStats) {
        const modifiers = this.getModifiers();
        
        return {
            damage: Math.floor(baseStats.damage * modifiers.damageMultiplier),
            range: baseStats.range * modifiers.rangeMultiplier,
            radius: baseStats.radius * modifiers.radiusMultiplier,
            cooldown: baseStats.cooldown * modifiers.attackSpeedMultiplier
        };
    }
    
    /**
     * Get the current health regeneration rate per second
     * @returns {number} HP per second from water mastery
     */
    getHealthRegenRate() {
        return this.getModifiers().healthRegenPerSecond;
    }
    
    /**
     * Calculate modified max health based on water mastery
     * @param {number} baseHealth - Base health value
     * @returns {number} Modified max health
     */
    getModifiedMaxHealth(baseHealth) {
        return Math.floor(baseHealth * this.getModifiers().healthMultiplier);
    }
    
    /**
     * Debug method to log current modifiers and their impact on all weapon types
     */
    logModifiers() {
        const modifiers = this.getModifiers();
        console.log('🔧 Current Elemental Modifiers:');
        console.log(`🔥 Fire ${this.player.upgradeCount.fire || 0}: +${((modifiers.damageMultiplier - 1) * 100).toFixed(0)}% Damage`);
        console.log(`🌍 Earth ${this.player.upgradeCount.earth || 0}: +${((modifiers.radiusMultiplier - 1) * 100).toFixed(0)}% Radius`);
        console.log(`🌪️ Air ${this.player.upgradeCount.air || 0}: +${((modifiers.rangeMultiplier - 1) * 100).toFixed(0)}% Range`);
        console.log(`⚡ Lightning ${this.player.upgradeCount.lightning || 0}: +${((1 / modifiers.attackSpeedMultiplier - 1) * 100).toFixed(0)}% Attack Speed`);
        console.log(`💧 Water ${this.player.upgradeCount.water || 0}: +${((modifiers.healthMultiplier - 1) * 100).toFixed(0)}% Health, +${modifiers.healthRegenPerSecond}/sec Regen`);
        
        console.log('\n📊 WEAPON & ABILITY IMPACT:');
        console.log('==========================================');
        
        // Basic Weapon
        const basicWeapon = this.getModifiedWeaponStats({damage: 20, range: 200, cooldown: 0.5, radius: 3});
        console.log(`🎯 Basic Weapon Projectiles:`);
        console.log(`   Damage: ${basicWeapon.damage} (base: 20, +${basicWeapon.damage - 20})`);
        console.log(`   Range: ${basicWeapon.range} (base: 200, +${basicWeapon.range - 200})`);
        console.log(`   Fire Rate: ${basicWeapon.cooldown}s (base: 0.5s, ${(basicWeapon.cooldown - 0.5).toFixed(2)}s faster)`);
        
        // Fireball
        if (this.player.specialAbilities?.fireball) {
            const fireballStats = this.getModifiedAbilityStats({damage: 30, radius: 25, range: 200, cooldown: 2.0});
            console.log(`🔥 Fireball:`);
            console.log(`   Damage: ${fireballStats.damage} (base: 30, +${fireballStats.damage - 30})`);
            console.log(`   Explosion Radius: ${fireballStats.radius.toFixed(1)}px (base: 25px, +${(fireballStats.radius - 25).toFixed(1)}px)`);
            console.log(`   Range: ${Math.floor(fireballStats.range)} (base: 200, +${Math.floor(fireballStats.range) - 200})`);
            console.log(`   Cooldown: ${fireballStats.cooldown.toFixed(2)}s (base: 2.0s)`);
            
            if (this.player.specialAbilities?.infernoWave) {
                const infernoRadius = 200 * modifiers.radiusMultiplier;
                console.log(`🌋 Inferno Wave Chain Radius: ${infernoRadius.toFixed(1)}px (base: 200px, +${(infernoRadius - 200).toFixed(1)}px)`);
            }
        }
        
        // Water Globes  
        if (this.player.waterGlobes?.length > 0) {
            const waterLevel = this.player.upgradeCount.water || 0;
            const globeRadius = 5 * modifiers.radiusMultiplier;
            const orbitRadius = 45 + (waterLevel * 5);
            console.log(`💧 Water Globes (${this.player.waterGlobes.length} active):`);
            console.log(`   Globe Size: ${globeRadius.toFixed(1)}px radius (base: 5px, +${(globeRadius - 5).toFixed(1)}px)`);
            console.log(`   Orbit Distance: ${orbitRadius}px (base: 45px, +${orbitRadius - 45}px from Water levels)`);
            console.log(`   Damage: 15 per globe (not modified by elements)`);
        }
        
        // Tremors
        if (this.player.specialAbilities?.radiusAttack) {
            const tremorStats = this.getModifiedAbilityStats({damage: 7, radius: 80});
            console.log(`🌍 Tremors:`);
            console.log(`   Damage: ${tremorStats.damage} per pulse (base: 7, +${tremorStats.damage - 7})`);
            console.log(`   Radius: ${tremorStats.radius.toFixed(1)}px (base: 80px, +${(tremorStats.radius - 80).toFixed(1)}px)`);
            console.log(`   Pulse Rate: 0.5s (not modified)`);
            
            if (this.player.specialAbilities?.earthquakeStormp) {
                const earthquakeRadius = 150 * modifiers.radiusMultiplier;
                console.log(`🌍 Earthquake Stomp Radius: ${earthquakeRadius.toFixed(1)}px (base: 150px, +${(earthquakeRadius - 150).toFixed(1)}px)`);
            }
        }
        
        // Wind Blades
        if (this.player.specialAbilities?.windBlades) {
            const airLevel = this.player.upgradeCount.air || 0;
            const bladeCount = Math.min(airLevel, 5);
            const windBladeStats = this.getModifiedWeaponStats({damage: 16, range: 200, radius: 6, cooldown: 0.5}); // 20 * 0.8 = 16 base damage
            console.log(`🌪️ Wind Blades (${bladeCount} per shot):`);
            console.log(`   Damage: ${windBladeStats.damage} each (base: 16, +${windBladeStats.damage - 16})`);
            console.log(`   Range: ${windBladeStats.range} (base: 200, +${windBladeStats.range - 200})`);
            console.log(`   Fire Rate: ${windBladeStats.cooldown}s (base: 0.5s, ${(windBladeStats.cooldown - 0.5).toFixed(2)}s faster)`);
            console.log(`   Total DPS: ${Math.floor(bladeCount * windBladeStats.damage / windBladeStats.cooldown)} (${bladeCount} blades × ${windBladeStats.damage} dmg ÷ ${windBladeStats.cooldown}s)`);
            console.log(`   Seeking Radius: 120px (not modified)`);
            
            if (this.player.specialAbilities?.tornadoVortex) {
                const tornadoRadius = 35 * modifiers.radiusMultiplier;
                console.log(`🌪️ Tornado Damage Radius: ${tornadoRadius.toFixed(1)}px (base: 35px, +${(tornadoRadius - 35).toFixed(1)}px)`);
            }
        }
        
        // Chain Lightning
        if (this.player.specialAbilities?.lightning) {
            const lightningLevel = this.player.upgradeCount.lightning || 0;
            const totalTargets = 1 + lightningLevel; // NEW: 1 base + 1 per level
            const lightningStats = this.getModifiedAbilityStats({damage: 30, cooldown: 2.0, range: 150});
            console.log(`⚡ Chain Lightning:`);
            console.log(`   Target Count: ${totalTargets} (base: 1, +${lightningLevel} from Lightning levels)`);
            console.log(`   Damage: ${lightningStats.damage} per hit (base: 30, +${lightningStats.damage - 30})`);
            console.log(`   Range: ${Math.floor(lightningStats.range)} (base: 150, +${Math.floor(lightningStats.range) - 150})`);
            console.log(`   Cooldown: ${lightningStats.cooldown.toFixed(2)}s (base: 2.0s, ${(lightningStats.cooldown - 2.0).toFixed(2)}s faster)`);
            console.log(`   Chain Range: 300px (not modified)`);
            console.log(`   Damage Reduction: 20% per chain`);
            
            if (this.player.specialAbilities?.thunderStorm) {
                const stormStats = this.getModifiedAbilityStats({damage: 60, radius: 200, strikeRadius: 40, cooldown: 6.0});
                console.log(`⚡ Thunder Storm:`);
                console.log(`   Storm Area: ${stormStats.radius.toFixed(1)}px (base: 200px, +${(stormStats.radius - 200).toFixed(1)}px)`);
                console.log(`   Strike Radius: ${stormStats.strikeRadius.toFixed(1)}px each (base: 40px, +${(stormStats.strikeRadius - 40).toFixed(1)}px)`);
                console.log(`   Strike Damage: ${stormStats.damage} each (base: 60, +${stormStats.damage - 60})`);
                console.log(`   Cooldown: ${stormStats.cooldown.toFixed(2)}s (base: 6.0s, ${(stormStats.cooldown - 6.0).toFixed(2)}s faster)`);
                console.log(`   Strike Count: 8 (not modified)`);
            }
        }
        
        console.log('\n💡 TIP: Earth radius affects ALL area-of-effect abilities!');
    }
}