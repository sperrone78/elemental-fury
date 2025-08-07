import { ELEMENT_CONFIG, PLAYER_CONFIG } from '../utils/Constants.js';
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
                const isUltimateChoice = upgrade.nextLevel === 6;
                option.className = `upgrade-option ${upgrade.type}${isUltimateChoice ? ' ultimate-choice' : ''}`;
                
                // Create element icon
                const elementIcons = {
                    fire: '🔥',
                    water: '💧', 
                    earth: '🌍',
                    air: '🌪️',
                    lightning: '⚡'
                };
                
                // Special layout for Ultimate choices
                if (isUltimateChoice) {
                    option.innerHTML = `
                        <div class="upgrade-header">
                            <div class="upgrade-element-icon ${upgrade.type}"></div>
                            <div class="upgrade-title">${upgrade.name}</div>
                        </div>
                        <div class="upgrade-description">${upgrade.description.replace(/\n/g, '<br>')}</div>
                    `;
                } else {
                    option.innerHTML = `
                        <div class="upgrade-header">
                            <div class="upgrade-element-icon ${upgrade.type}"></div>
                            <div class="upgrade-title">${upgrade.name}</div>
                        </div>
                        <div class="upgrade-description">${upgrade.description}</div>
                    `;
                }
                
                option.onclick = () => this.selectUpgrade(upgrade);
                this.upgradeOptions.appendChild(option);
            });
        }
    }
    
    getRandomUpgrades(count) {
        // New progression spec implementation  
        // Rule: Max 3 distinct elements for levels 1-5, then choose 2 for ultimate mastery (6-10)
        
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
            const isUltimate = this.game.player.ultimateElements.includes(elementType);
            const hasRing = this.game.player.masteryRings.includes(elementType);
            
            // Skip if maxed out (level 10)
            if (currentLevel >= 10) continue;
            
            // Skip if trying to go past level 5 without ring
            if (currentLevel >= 5 && !hasRing) continue;
            
            // NEW RULE: Only allow 2 elements to reach Level 6
            if (currentLevel === 5 && this.game.player.ultimateElements.length >= 2 && !isUltimate) {
                continue; // Can't take a 3rd element to level 6
            }
            
            // NEW RULE: Only elements that reached Level 6 can continue to 7-10
            if (currentLevel >= 6 && !isUltimate) {
                continue; // Only Level 6+ elements can continue past level 6
            }
            
            // Skip if not chosen and already have 3 distinct elements
            if (!isChosen && this.game.player.chosenElements.length >= 3) continue;
            
            // This element is available for upgrade
            const nextLevel = currentLevel + 1;
            let description;
            
            // Level 1: Show ability name + simple description
            if (currentLevel === 0) {
                description = `${data.ability} - ${data.initialDescription}`;
            } else if (nextLevel === 6) {
                // Level 6 Ultimate Choice: Show enhanced description
                const level6Abilities = {
                    fire: '🌋 Inferno Wave - Chain explosions from fireballs',
                    water: '❄️ Freezing Touch - Freeze nearby enemies when taking damage', 
                    earth: '🌍 Earthquake Stomp - Massive earthquake every 8 seconds',
                    lightning: '⛈️ Thunder Storm - 8 targeted lightning strikes every 6 seconds',
                    air: '🌪️ Tornado Vortex - Powerful moving tornadoes every 2.5 seconds'
                };
                description = `🎯 ULTIMATE MASTERY 🎯\n${level6Abilities[elementType]}\n\n⚠️ WARNING: You can only choose 2 Elements to reach level 6`;
            } else {
                // Level 2-5: Just show the effect
                description = data.effect;
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
        
        // Track ultimate elements (Level 6+)
        if (newLevel >= 6 && !player.ultimateElements.includes(elementType)) {
            player.ultimateElements.push(elementType);
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
        
        // Level 1: Unlock fireball ability
        if (level === 1) {
            player.specialAbilities.fireball = true;
        }
        
        // Level 6: Inferno Wave
        if (level === 6) {
            player.specialAbilities.infernoWave = true;
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
        
        // Note: +10% damage per level is now handled by ElementalModifiers system
    }
    
    applyWaterUpgrade(level) {
        const player = this.game.player;
        
        // Update max health based on new water level (handled by ElementalModifiers)
        const baseHealth = PLAYER_CONFIG.BASE_HEALTH;
        player.maxHealth = player.elementalModifiers.getModifiedMaxHealth(baseHealth);
        player.health = Math.min(player.health, player.maxHealth);
        
        // Update water globes
        this.updateWaterGlobes(player, level);
        
        // Level 6: Freezing Touch
        if (level === 6) {
            player.specialAbilities.freezingTouch = true;
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
        
        // Note: +10% health and +1 HP/sec per level now handled by ElementalModifiers system
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
        
        // Add armor based on level (still handled directly since it's not a modifier)
        player.armor += ELEMENT_CONFIG.EARTH.ARMOR_PER_LEVEL[level] || 3;
        
        // Level 1: Unlock tremor ability
        if (level === 1) {
            player.specialAbilities.radiusAttack = true;
        }
        
        // Level 6: Earthquake Stomp
        if (level === 6) {
            player.specialAbilities.earthquakeStormp = true;
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
        
        // Update water globes to apply new Earth radius modifier
        if (player.waterGlobes.length > 0) {
            const waterLevel = player.upgradeCount.water || 0;
            this.updateWaterGlobes(player, waterLevel);
        }
        
        // Note: +10% radius per level is now handled by ElementalModifiers system
    }
    
    applyLightningUpgrade(level) {
        const player = this.game.player;
        
        // Level 1: Unlock lightning ability
        if (level === 1) {
            player.specialAbilities.lightning = true;
        }
        
        // Level 6: Thunder Storm
        if (level === 6) {
            player.specialAbilities.thunderStorm = true;
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
        
        // Note: +10% attack speed per level is now handled by ElementalModifiers system
    }
    
    applyAirUpgrade(level) {
        const player = this.game.player;
        
        // Level 1: Unlock wind blades ability
        if (level === 1) {
            player.specialAbilities.windBlades = true;
        }
        
        // Level 6: Tornado Vortex
        if (level === 6) {
            player.specialAbilities.tornadoVortex = true;
        }
        
        // Level 10: Check for fusion ultimates
        if (level === 10) {
            this.checkForFusionUltimates();
        }
        
        // Note: +10% range per level is now handled by ElementalModifiers system
    }
    
    // Check and unlock fusion ultimates when both ultimate elements reach level 10
    checkForFusionUltimates() {
        const player = this.game.player;
        const level10UltimateElements = [];
        
        // Find ultimate elements that reached level 10
        for (const element of player.ultimateElements) {
            if ((player.upgradeCount[element] || 0) >= 10) {
                level10UltimateElements.push(element);
            }
        }
        
        // Need both ultimate elements at level 10 for fusion (since we only have 2)
        if (level10UltimateElements.length < 2) return;
        
        // Check for specific fusion combinations
        const fusionTable = {
            'fire+air': 'wildfire',
            'fire+earth': 'magmaSurge', 
            'fire+water': 'steamBurst',
            'air+water': 'tempest',
            'earth+lightning': 'seismicShock',
            'water+lightning': 'thunderStorm' // Enhanced version
        };
        
        // Since we only have 2 ultimate elements, just check that pair
        if (level10UltimateElements.length === 2) {
            const element1 = level10UltimateElements[0];
            const element2 = level10UltimateElements[1];
            
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