# Elemental Fury - Game Systems & Variables

*Last Updated: August 5, 2025 - Version 2.7.0*

## Table of Contents
1. [Player Systems](#player-systems)
2. [Combat Systems](#combat-systems)
3. [Elemental Mastery](#elemental-mastery)
4. [Enemy Systems](#enemy-systems)
5. [Progression Systems](#progression-systems)
6. [Shop & Economy](#shop--economy)
7. [Performance & Balance](#performance--balance)

---

## Player Systems

### Core Player Stats
```javascript
// Base Stats
health: 100
maxHealth: 100
radius: 15
speed: 3
level: 1
xp: 0
xpToNext: 10 // Scales with level
```

### Movement & Controls
- **WASD**: Movement (speed: 3 units/frame)
- **Mouse**: Aim direction for attacks
- **Canvas Size**: 800x600 pixels

### Health & Damage
- **Base Health**: 100 HP
- **Damage Sources**: 
  - Basic Enemy: 30 damage
  - Veteran Enemy: 35 damage  
  - Elite Enemy: 40 damage
  - Boss Enemy: 50 damage
- **Invulnerability**: 3 seconds after taking damage
- **Damage Cooldown**: 0.5 seconds between damage instances

---

## Combat Systems

### Basic Weapon System
```javascript
// BasicWeapon stats
damage: 20
range: 200
cooldown: 0.5 // seconds
projectileSpeed: 8
radius: 3
```

### Projectile Types
1. **Basic Projectile**: Standard attack
2. **Fireball**: Explosive with area damage
3. **Missile**: Twin projectiles (Air mastery)

### Damage Tracking
- All damage is tracked by type for statistics
- Session and lifetime damage tracking
- Used for diamond reward calculations

---

## Elemental Mastery

### Fire Mastery (6 Levels)
```javascript
// Level progression effects
Level 1-3: Basic fireball ability
Level 4+: Faster fireball cooldown (2s → 1.25s → 1s → 0.5s)
Level 6: Inferno Wave Ultimate
  - Radius: 200px (1/4 screen)
  - Damage multiplier: 0.6x of original
  - Chain explosion effect
```

### Water Mastery (6 Levels)
```javascript
Level 1-3: Basic effects
Level 6: Freezing Touch Ultimate
```

### Earth Mastery (6 Levels)
```javascript
// Armor System (Damage Reduction)
Level 1-3: +5 armor per level (15 total)
Level 4-6: +3 armor per level (24 total max)

// Tremors (Radius Attack) - Unlocked Level 3+
baseDamage: 40
range: 80px
cooldown: 3s → 2.5s → 2s → 1.5s (faster per level)
Level 4+: +10 damage per level above 3
Level 6: Earthquake Stomp Ultimate
  - Radius: 150px
  - Damage: 100
  - Cooldown: 8 seconds
  - Effect: Stuns enemies for 1.5 seconds
```

### Air Mastery (6 Levels)
```javascript
// Weapon Range Bonus
Level 1-3: +25% weapon range per level (up to +75%)

// Twin Missiles - Unlocked Level 3+
baseProjectiles: 2 additional missiles
angle: ±0.3 radians from main direction
Level 4-6: +20% projectile speed per level

// Tornado Vortex Ultimate - Level 6
cooldown: 2.5 seconds
damage: 45 per hit
damageInterval: 0.3 seconds
tornadoDuration: 12 seconds
tornadoRadius: 35px
movementSpeed: Random (vx/vy ±1 units)
effect: Moving tornadoes with high damage output
```

### Lightning Mastery (6 Levels)
```javascript
// Chain Lightning
baseDamage: Variable
maxBounces: Scales with level
range: 120px between targets
Level 6: Thunder Storm Ultimate
```

---

## Enemy Systems

### Enemy Types & Stats
```javascript
// Basic Enemy
health: 30
speed: 1
radius: 10
scoreReward: 10
xpDrop: 5

// Veteran Enemy (appears level 10+)
health: 120 (+100% from basic)
speed: 1.2
radius: 12
armor: 5 (damage reduction)
scoreReward: 25
xpDrop: 15
spawnChance: 8% per level after 10 (max 80%)

// Elite Enemy (appears level 20+)
health: 250 (+108% from veteran)  
speed: 1.5
radius: 14
armor: 5 (damage reduction)
scoreReward: 50
xpDrop: 25
spawnChance: 2% per level after 20 (max 50%)

// Boss Enemies
BasicBoss: { health: 200, xpDrop: 5, scoreReward: 100 }
VeteranBoss: { health: 300, xpDrop: 8, scoreReward: 250 }
EliteBoss: { health: 400, xpDrop: 12, scoreReward: 500 }
```

### Spawn System
```javascript
// Wave Manager
baseSpawnInterval: 2 seconds
levelScaling: 25% faster per level
timeScaling: 10% faster per minute of gameplay
combinedScaling: levelScaling × timeScaling
minimumInterval: 0.1 seconds (prevents instant spawning)
maxConcurrentEnemies: No hard limit
spawnLocations: 4 sides of screen (random, inside visible frame)
```

### Boss Spawn Conditions
**Guaranteed Level-Based Spawns:**
- **Levels 5 & 10**: Basic Boss (200 HP)
- **Levels 15 & 20**: Veteran Boss (300 HP)
- **Levels 25 & 30**: Elite Boss (400 HP + 10 armor)

**Random Time-Based Spawns:**
- **Levels 10-19**: Basic Boss every 15 seconds
- **Levels 20-29**: Basic + Veteran Boss every 12 seconds  
- **Level 30+**: All Boss types every 10 seconds
- **Boss Type**: RNG weighted by level (Basic 40-60%, Veteran 30-40%, Elite 10-30%)

---

## Progression Systems

### XP & Leveling
```javascript
// XP Requirements (exponential scaling)
xpToNext = 10 * level^1.2

// XP Sources
basicEnemy: 5 XP
veteranEnemy: 15 XP  
eliteEnemy: 25 XP
bossEnemy: 5-12 XP (varies by boss type)
```

### Upgrade System
- **Upgrades per Level**: 3 random options
- **Element Selection**: Weighted toward chosen elements
- **Progression**: Linear power increases per element level

---

## Shop & Economy

### Diamond Economy
```javascript
// Diamond Earning (per game completion)
baseSurvival: 1 diamond per 30 seconds survived
scoreBonus: 1 diamond per 1000 points
bossBonus: 2 diamonds per boss killed

// Shop Items
XP_VORTEX: {
  maxLevel: 5,
  prices: [10, 15, 25, 40, 60], // diamonds
  effect: "+50% XP pickup range per level",
  baseRange: player.radius + pickup.radius + 20,
  multiplier: 1 + (level * 0.5)
}
```

### XP Vortex Mechanics
```javascript
// Attraction System
attractionRange: baseRange * (1 + level * 0.5)
collectionRange: player.radius + pickup.radius + 5
attractionForce: (level * 0.3 + 0.5) * distanceRatio
maxSpeed: attraction * 200 * deltaTime (capped at 80% of distance)

// Visual Effects
pulsingGlow: true
colorChange: '#00ff88' → '#00ffaa'
trailingParticles: 3 per attracted pickup
```

---

## Performance & Balance

### Frame Rate System
```javascript
targetFPS: 60
fixedTimeStep: 1/60 seconds
deltaTime: Dynamic based on actual frame time
maxDeltaTime: Capped to prevent large jumps
```

### Game Balance Variables
```javascript
// Core Balance
playerSpeed: 3
basicWeaponDamage: 20
enemyHealthProgression: Exponential
xpRequirements: level^1.2 scaling
spawnRateIncrease: 15% per level

// Power Scaling
elementDamageScaling: Linear per level
bossHealthScaling: 200 → 300 → 400
diamondEconomy: Balanced for ~10-60 diamonds per game
enemyArmorScaling: 0 → 5 → 5 → 10 (basic → veteran → elite → elite boss)
```

### Statistical Tracking
```javascript
// Session Stats (per game)
survivalTime, score, level, xpGained
enemiesKilled: { basic, veteran, elite, boss, total }
damageDealt: { basicWeapon, fireball, missiles, tremors, 
               chainLightning, earthquakeStormp, thunderStorm, 
               tornadoVortex, infernoWave, total }
elementLevels: { fire, water, earth, air, lightning }

// Lifetime Stats (persistent)
totalGamesPlayed, bestSurvivalTime, highestScore
totalSurvivalTime, totalXPGained, totalUpgradesChosen
totalDiamondsEarned, totalDiamondsSpent
elementMastery: { maxLevelReached, timesChosen }
```

---

## Technical Systems

### Game States
```javascript
gameState: 'waiting' | 'playing' | 'gameOver' | 'shop'
```

### Key Performance Metrics
- **Collision Detection**: O(n²) for simplicity
- **Particle Systems**: Dynamic creation/removal
- **Memory Management**: Automatic cleanup of expired objects
- **Rendering**: Canvas 2D with efficient draw calls

### Save System
- **localStorage**: Persistent player profile and shop upgrades
- **Auto-save**: After each game completion
- **Data Structure**: JSON with version control for migrations

---

## Recommended Balance Review Areas

### 1. **Economy Balance**
- Diamond earning rates vs shop prices
- XP Vortex upgrade pricing curve
- Long-term progression satisfaction

### 2. **Power Scaling**
- Enemy health vs player damage output
- Element upgrade power curves
- Late-game difficulty spikes

### 3. **Engagement Systems**
- XP pickup satisfaction with vortex
- Visual feedback for all systems
- Upgrade choice meaningfulness

### 4. **Performance Considerations**
- Enemy spawn rates at high levels
- Particle system optimization
- Memory usage with long sessions

---

*This document reflects the current state of Elemental Fury v2.6.0. All values are subject to balance adjustments based on player feedback and testing.*