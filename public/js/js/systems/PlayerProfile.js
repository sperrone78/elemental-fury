import { DIAMOND_CONFIG, SHOP_CONFIG } from '../utils/Constants.js';

export class PlayerProfile {
    constructor() {
        this.version = 1;
        this.statistics = {
            // Game Stats
            totalGamesPlayed: 0,
            bestSurvivalTime: 0,
            highestScore: 0,
            highestLevel: 0,
            totalSurvivalTime: 0,
            
            // Enemy Kill Stats
            enemiesKilled: {
                basic: 0,
                veteran: 0,
                elite: 0,
                boss: 0,
                total: 0
            },
            
            // Damage Stats by Attack Type
            damageDealt: {
                basicWeapon: 0,
                fireball: 0,
                waterGlobe: 0,
                tremors: 0,
                earthquakeStormp: 0,
                chainLightning: 0,
                thunderStorm: 0,
                windBlades: 0,
                tornadoVortex: 0,
                infernoWave: 0,
                total: 0
            },
            
            // Element Mastery Stats
            elementMastery: {
                fire: { timesChosen: 0, maxLevelReached: 0 },
                water: { timesChosen: 0, maxLevelReached: 0 },
                earth: { timesChosen: 0, maxLevelReached: 0 },
                air: { timesChosen: 0, maxLevelReached: 0 },
                lightning: { timesChosen: 0, maxLevelReached: 0 }
            },
            
            // Progression Stats
            totalXPGained: 0,
            totalUpgradesChosen: 0,
            
            // Diamond Economy (future)
            totalDiamondsEarned: 0,
            totalDiamondsSpent: 0
        };
        
        this.preferences = {
            favoriteElement: null,
            preferredPlayStyle: null // 'aggressive', 'defensive', 'balanced'
        };
        
        // Shop upgrades
        this.shopUpgrades = {
            xpVortex: 0 // Level 0-5, increases XP pickup range
        };
        
        // Mastery Ring system (new progression feature)
        this.masteryRings = {
            owned: { fire: false, water: false, earth: false, air: false, lightning: false },
            equipped: [] // Max 2 rings equipped at once
        };
        
        this.load();
    }
    
    // Load profile from localStorage
    load() {
        try {
            const saved = localStorage.getItem('elemental-fury-profile');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.version === this.version) {
                    // Merge saved data, keeping structure but updating with saved values
                    this.mergeDeep(this.statistics, data.statistics || {});
                    this.mergeDeep(this.preferences, data.preferences || {});
                    this.mergeDeep(this.shopUpgrades, data.shopUpgrades || {});
                    this.mergeDeep(this.masteryRings, data.masteryRings || {});
                } else {
                    // Handle version migration in the future
                }
            }
        } catch (error) {
            console.error('Failed to load player profile:', error);
        }
    }
    
    // Save profile to localStorage
    save() {
        try {
            const data = {
                version: this.version,
                statistics: this.statistics,
                preferences: this.preferences,
                shopUpgrades: this.shopUpgrades,
                masteryRings: this.masteryRings,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('elemental-fury-profile', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save player profile:', error);
        }
    }
    
    // Deep merge utility for loading saved data
    mergeDeep(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    // Update stats when game ends
    updateGameStats(sessionStats) {
        this.statistics.totalGamesPlayed++;
        this.statistics.totalSurvivalTime += sessionStats.survivalTime;
        this.statistics.totalXPGained += sessionStats.xpGained;
        this.statistics.totalUpgradesChosen += sessionStats.upgradesChosen;
        
        // Update bests
        if (sessionStats.survivalTime > this.statistics.bestSurvivalTime) {
            this.statistics.bestSurvivalTime = sessionStats.survivalTime;
        }
        if (sessionStats.score > this.statistics.highestScore) {
            this.statistics.highestScore = sessionStats.score;
        }
        if (sessionStats.level > this.statistics.highestLevel) {
            this.statistics.highestLevel = sessionStats.level;
        }
        
        // Update enemy kills
        for (const enemyType in sessionStats.enemiesKilled) {
            this.statistics.enemiesKilled[enemyType] += sessionStats.enemiesKilled[enemyType];
        }
        
        // Update damage dealt
        for (const attackType in sessionStats.damageDealt) {
            this.statistics.damageDealt[attackType] += Math.floor(sessionStats.damageDealt[attackType]);
        }
        
        // Update element mastery stats
        for (const element in sessionStats.elementLevels) {
            const level = sessionStats.elementLevels[element];
            if (level > 0) {
                this.statistics.elementMastery[element].timesChosen++;
                if (level > this.statistics.elementMastery[element].maxLevelReached) {
                    this.statistics.elementMastery[element].maxLevelReached = level;
                }
            }
        }
        
        // Calculate and add diamond rewards
        const diamondsEarned = this.calculateDiamondReward(sessionStats);
        this.statistics.totalDiamondsEarned += diamondsEarned;
        
        this.save();
    }
    
    // Calculate diamond earnings based on performance
    calculateDiamondReward(sessionStats) {
        let diamonds = 0;
        
        // Base survival time reward (1 diamond per 30 seconds)
        diamonds += Math.floor(sessionStats.survivalTime * DIAMOND_CONFIG.SURVIVAL_BONUS);
        
        // Score bonus (1 diamond per 1000 points)
        diamonds += Math.floor(sessionStats.score * DIAMOND_CONFIG.SCORE_BONUS);
        
        // Boss kill bonuses
        diamonds += sessionStats.enemiesKilled.boss * DIAMOND_CONFIG.BOSS_BONUS;
        
        return diamonds;
    }
    
    // Purchase shop upgrade
    purchaseUpgrade(upgradeType) {
        const prices = {
            xpVortex: SHOP_CONFIG.XP_VORTEX.PRICES
        };
        
        if (!prices[upgradeType]) return false;
        
        const currentLevel = this.shopUpgrades[upgradeType];
        if (currentLevel >= SHOP_CONFIG.XP_VORTEX.MAX_LEVEL) return false; // Max level reached
        
        const price = prices[upgradeType][currentLevel];
        if (this.statistics.totalDiamondsEarned - this.statistics.totalDiamondsSpent < price) {
            return false; // Not enough diamonds
        }
        
        // Purchase successful
        this.statistics.totalDiamondsSpent += price;
        this.shopUpgrades[upgradeType]++;
        this.save();
        return true;
    }
    
    // Purchase mastery ring
    purchaseMasteryRing(elementType) {
        const price = SHOP_CONFIG.MASTERY_RING.COST;
        
        if (this.masteryRings.owned[elementType]) return false; // Already owned
        if (this.statistics.totalDiamondsEarned - this.statistics.totalDiamondsSpent < price) {
            return false; // Not enough diamonds
        }
        
        // Purchase successful
        this.statistics.totalDiamondsSpent += price;
        this.masteryRings.owned[elementType] = true;
        this.save();
        return true;
    }
    
    // Equip/unequip mastery ring
    equipMasteryRing(elementType) {
        if (!this.masteryRings.owned[elementType]) return false; // Don't own ring
        
        const currentIndex = this.masteryRings.equipped.indexOf(elementType);
        if (currentIndex !== -1) {
            // Ring is equipped, unequip it
            this.masteryRings.equipped.splice(currentIndex, 1);
            this.save();
            return true;
        } else if (this.masteryRings.equipped.length < 2) {
            // Ring not equipped and have slot available
            this.masteryRings.equipped.push(elementType);
            this.save();
            return true;
        }
        return false; // No slots available
    }
    
    // Check if element can go past level 5
    canUpgradePastLevel5(elementType) {
        return this.masteryRings.equipped.includes(elementType);
    }
    
    // Get available diamonds for spending
    getAvailableDiamonds() {
        return (this.statistics.totalDiamondsEarned || 0) - (this.statistics.totalDiamondsSpent || 0);
    }
    
    // Get upgrade price
    getUpgradePrice(upgradeType) {
        const prices = {
            xpVortex: SHOP_CONFIG.XP_VORTEX.PRICES
        };
        
        if (!prices[upgradeType]) return 0;
        
        const currentLevel = this.shopUpgrades[upgradeType];
        if (currentLevel >= SHOP_CONFIG.XP_VORTEX.MAX_LEVEL) return 0; // Max level reached
        
        return prices[upgradeType][currentLevel];
    }
    
    // Get mastery ring price (always 50 for unowned rings)
    getMasteryRingPrice(elementType) {
        return this.masteryRings.owned[elementType] ? 0 : SHOP_CONFIG.MASTERY_RING.COST;
    }
}