import { ELEMENT_CONFIG } from '../utils/Constants.js';
import { WaterGlobe } from '../elements/Water.js';

export class UpgradeSystem {
    constructor() {
        this.upgradeMenu = document.getElementById('upgradeMenu');
        this.upgradeOptions = document.getElementById('upgradeOptions');
    }
    
    showUpgradeMenu() {
        this.game.isPaused = true;
        this.upgradeMenu.style.display = 'block';
        
        const upgrades = this.getRandomUpgrades(3);
        this.upgradeOptions.innerHTML = '';
        
        if (upgrades.length === 0) {
            // All elements are maxed out
            const option = document.createElement('div');
            option.className = 'upgrade-option mastered';
            option.innerHTML = `
                <div class="upgrade-header">
                    <div style="font-size: 24px;">🎆</div>
                    <div class="upgrade-title">All Elements Mastered!</div>
                </div>
                <div class="upgrade-description">You have achieved maximum mastery in all elements. Continue your legendary journey!</div>
            `;
            option.onclick = () => {
                this.upgradeMenu.style.display = 'none';
                this.game.isPaused = false;
                // Mark that we've shown the mastery message
                this.game.player.allElementsMasteredShown = true;
            };
            this.upgradeOptions.appendChild(option);
        } else {
            upgrades.forEach((upgrade, index) => {
                const option = document.createElement('div');
                option.className = `upgrade-option ${upgrade.type}`;
                
                // Create element icon
                const elementIcons = {
                    fire: '🔥',
                    water: '💧', 
                    earth: '🌍',
                    air: '🌪️',
                    lightning: '⚡'
                };
                
                option.innerHTML = `
                    <div class="upgrade-header">
                        <div class="upgrade-element-icon ${upgrade.type}"></div>
                        <div class="upgrade-title">${upgrade.name}</div>
                    </div>
                    <div class="upgrade-description">${upgrade.description}</div>
                `;
                
                option.onclick = () => this.selectUpgrade(upgrade);
                this.upgradeOptions.appendChild(option);
            });
        }
    }
    
    getRandomUpgrades(count) {
        // New progression spec implementation
        // Rule: Max 3 distinct elements per run, levels 1-10, rings required for 6-10
        
        const elementData = {
            fire: {
                name: 'Fire Mastery',
                ability: 'Fireball',
                initialDescription: 'Shoots a fireball at the closest enemy',
                effect: 'Faster fireball cooldown, +10% DPS to all attacks'
            },
            water: {
                name: 'Water Mastery', 
                ability: 'Water Globes',
                initialDescription: 'Creates orbiting water globes that damage enemies',
                effect: '+1 globe, +10% Health'
            },
            earth: {
                name: 'Earth Mastery',
                ability: 'Tremor',
                initialDescription: 'Creates ongoing tremor field that pulses damage around you',
                effect: 'Increased tremor range, +3 Armor'
            },
            lightning: {
                name: 'Lightning Mastery',
                ability: 'Chain Lightning',
                initialDescription: 'Lightning bolts that chain between enemies',
                effect: '+1 chain, +10% attack speed all attacks'
            },
            air: {
                name: 'Air Mastery',
                ability: 'Wind Blades',
                initialDescription: 'Summons seeking wind blades that curve toward enemies',
                effect: '+1 wind blade, +10% attack range all attacks'
            }
        };
        
        const availableElements = [];
        
        // Generate upgrade options based on progression rules
        for (const [elementType, data] of Object.entries(elementData)) {
            const currentLevel = this.game.player.upgradeCount[elementType] || 0;
            const isChosen = this.game.player.chosenElements.includes(elementType);
            const hasRing = this.game.player.masteryRings.includes(elementType);
            
            // Skip if maxed out (level 10)
            if (currentLevel >= 10) continue;
            
            // Skip if trying to go past level 5 without ring
            if (currentLevel >= 5 && !hasRing) continue;
            
            // Skip if not chosen and already have 3 distinct elements
            if (!isChosen && this.game.player.chosenElements.length >= 3) continue;
            
            // This element is available for upgrade
            const nextLevel = currentLevel + 1;
            let description;
            
            // Level 1: Show ability name + simple description
            if (currentLevel === 0) {
                description = `${data.ability} - ${data.initialDescription}`;
            } else {
                // Level 2+: Just show the effect
                description = data.effect;
            }
            
            // Add level-specific abilities
            if (nextLevel === 6) {
                const level6Abilities = {
                    fire: 'Inferno Wave',
                    water: 'Freezing Touch', 
                    earth: 'Earthquake (10% chance per tremor + stuns)',
                    lightning: 'Thunder Storm',
                    air: 'Tornado Vortex'
                };
                description += ` → Unlocks ${level6Abilities[elementType]}`;
            }
            
            // Add ring requirement warning
            if (currentLevel === 5 && !hasRing) {
                description += ' ⚠️ Requires Mastery Ring';
            }
            
            availableElements.push({
                name: data.name,
                description,
                type: elementType,
                currentLevel,
                nextLevel,
                effect: () => this.applyElementUpgrade(elementType, nextLevel)
            });
        }
        
        // Randomize and return requested count
        const shuffled = availableElements.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    applyElementUpgrade(elementType, newLevel) {
        const player = this.game.player;
        
        // Add to chosen elements if not already there
        if (!player.chosenElements.includes(elementType)) {
            player.chosenElements.push(elementType);
        }
        
        // Update level
        player.upgradeCount[elementType] = newLevel;
        
        // Apply effects based on element and level (from progression spec)
        switch (elementType) {
            case 'fire':
                this.applyFireUpgrade(newLevel);
                break;
            case 'water':
                this.applyWaterUpgrade(newLevel); 
                break;
            case 'earth':
                this.applyEarthUpgrade(newLevel);
                break;
            case 'lightning':
                this.applyLightningUpgrade(newLevel);
                break;
            case 'air':
                this.applyAirUpgrade(newLevel);
                break;
        }
        
        // Track stats
        this.game.sessionStats.elementLevels[elementType] = newLevel;
        this.game.sessionStats.upgradesChosen++;
    }
    
    applyFireUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 fireball, +10% DPS to all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.damage = Math.floor(w.damage * 1.1));
            if (level === 1) {
                player.specialAbilities.fireball = true;
            }
        }
        
        // Level 6: Inferno Wave
        if (level === 6) {
            player.specialAbilities.infernoWave = true;
        }
        
        // Levels 7-10: +10% DPS + 10% Range on Inferno Wave  
        if (level >= 7) {
            player.weapons.forEach(w => w.damage = Math.floor(w.damage * 1.1));
            // Inferno Wave range/damage boost handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyWaterUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 globe, +10% Health
        if (level <= 5) {
            player.maxHealth = Math.floor(player.maxHealth * (1 + ELEMENT_CONFIG.WATER.HEALTH_BONUS_PER_LEVEL));
            player.health = Math.floor(Math.min(player.health * (1 + ELEMENT_CONFIG.WATER.HEALTH_BONUS_PER_LEVEL), player.maxHealth));
            this.updateWaterGlobes(player, level);
        }
        
        // Level 6: Freezing Touch
        if (level === 6) {
            player.specialAbilities.freezingTouch = true;
        }
        
        // Levels 7-10: +10% Health +10% Extra damage taken by frozen enemies
        if (level >= 7) {
            player.maxHealth = Math.floor(player.maxHealth * (1 + ELEMENT_CONFIG.WATER.HEALTH_BONUS_PER_LEVEL));
            player.health = Math.floor(Math.min(player.health * (1 + ELEMENT_CONFIG.WATER.HEALTH_BONUS_PER_LEVEL), player.maxHealth));
            // Frozen damage bonus handled in damage calculation
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    updateWaterGlobes(player, level) {
        // Clear existing globes
        player.waterGlobes = [];
        
        // Create new globes based on level (1 globe per level, max 5)
        const globeCount = Math.min(level, 5);
        for (let i = 0; i < globeCount; i++) {
            player.waterGlobes.push(new WaterGlobe(player, i));
        }
    }
    
    applyEarthUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +25% more frequent tremors, +3 Armor
        if (level <= 5) {
            player.armor += ELEMENT_CONFIG.EARTH.ARMOR_PER_LEVEL[level] || 3;
            if (level === 1) {
                player.specialAbilities.radiusAttack = true;
            }
        }
        
        // Level 6: Earthquake (10% chance per tremor + stuns)
        if (level === 6) {
            player.specialAbilities.earthquakeStormp = true;
        }
        
        // Levels 7-10: +3 armor +10% chance to start earthquake + 10% frequency to tremor
        if (level >= 7) {
            player.armor += ELEMENT_CONFIG.EARTH.ARMOR_PER_LEVEL[level] || 3;
            // Earthquake chance and tremor frequency handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyLightningUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 chain, +10% attack speed all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.cooldown = Math.floor(w.cooldown * 0.9 * 100) / 100);
            if (level === 1) {
                player.specialAbilities.lightning = true;
            }
        }
        
        // Level 6: Thunder Storm
        if (level === 6) {
            player.specialAbilities.thunderStorm = true;
        }
        
        // Levels 7-10: +10% radius of storm clouds +10% duration of storm
        if (level >= 7) {
            player.weapons.forEach(w => w.cooldown = Math.floor(w.cooldown * 0.9 * 100) / 100);
            // Storm radius/duration handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    applyAirUpgrade(level) {
        const player = this.game.player;
        
        // Levels 1-5: +1 wind blade, +10% attack range all attacks
        if (level <= 5) {
            player.weapons.forEach(w => w.range = Math.floor(w.range * (1 + ELEMENT_CONFIG.AIR.RANGE_BONUS_PER_LEVEL)));
            if (level === 1) {
                player.specialAbilities.windBlades = true;
            }
        }
        
        // Level 6: Tornado Vortex
        if (level === 6) {
            player.specialAbilities.tornadoVortex = true;
        }
        
        // Levels 7-10: +1 extra tornado per spawn
        if (level >= 7) {
            player.weapons.forEach(w => w.range = Math.floor(w.range * (1 + ELEMENT_CONFIG.AIR.RANGE_BONUS_PER_LEVEL)));
            // Extra tornado count handled in ability code
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
    }
    
    // Check and unlock fusion ultimates when two elements reach level 10
    checkForFusionUltimates() {
        const player = this.game.player;
        const level10Elements = [];
        
        // Find all elements at level 10
        for (const [element, level] of Object.entries(player.upgradeCount)) {
            if (level >= 10) {
                level10Elements.push(element);
            }
        }
        
        // Need at least 2 elements at level 10 for fusion
        if (level10Elements.length < 2) return;
        
        // Check for specific fusion combinations
        const fusionTable = {
            'fire+air': 'wildfire',
            'fire+earth': 'magmaSurge', 
            'fire+water': 'steamBurst',
            'air+water': 'tempest',
            'earth+lightning': 'seismicShock',
            'water+lightning': 'thunderStorm' // Enhanced version
        };
        
        // Check all possible pairs
        for (let i = 0; i < level10Elements.length; i++) {
            for (let j = i + 1; j < level10Elements.length; j++) {
                const element1 = level10Elements[i];
                const element2 = level10Elements[j];
                
                // Create fusion key (alphabetical order)
                const fusionKey1 = `${element1}+${element2}`;
                const fusionKey2 = `${element2}+${element1}`;
                
                const fusionAbility = fusionTable[fusionKey1] || fusionTable[fusionKey2];
                
                if (fusionAbility && !player.specialAbilities[fusionAbility]) {
                    player.specialAbilities[fusionAbility] = true;
                    
                    // Show fusion unlock notification
                    this.showFusionUnlockNotification(element1, element2, fusionAbility);
                }
            }
        }
    }
    
    // Show notification when fusion ultimate is unlocked
    showFusionUnlockNotification(element1, element2, fusionAbility) {
        const fusionNames = {
            wildfire: 'Wildfire - Fast-spreading burning ground',
            magmaSurge: 'Magma Surge - Lava wave with DoT and slow',
            steamBurst: 'Steam Burst - High-pressure AoE that obscures vision',
            tempest: 'Tempest - Moving storm that pulls enemies',
            seismicShock: 'Seismic Shock - Earthquake with chain stun',
            thunderStorm: 'Enhanced Thunder Storm - Lightning rain around player'
        };
        
        const fusionName = fusionNames[fusionAbility] || fusionAbility;
        
        // Create a visual notification (could be expanded)
        // Fusion ultimate unlocked
        
        // TODO: Add visual notification system for fusion unlocks
    }
    
    selectUpgrade(upgrade) {
        upgrade.effect();
        this.game.sessionStats.upgradesChosen++;
        this.upgradeMenu.style.display = 'none';
        this.game.isPaused = false;
        
        // Spawn boss after upgrade menu closes if one was pending
        if (this.game.pendingBossSpawn) {
            this.game.spawnBoss();
            this.game.pendingBossSpawn = false;
        }
    }
}