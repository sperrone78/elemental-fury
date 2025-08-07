# 🛠️ Development Documentation

This document outlines the technical implementation details and recent changes made to Elemental Fury.

## 📋 Recent Updates

### 🆕 Global Elemental Modifier System (v2.8.0)

#### Architecture Overhaul
- **NEW**: `ElementalModifiers` class (`js/systems/ElementalModifiers.js`) provides centralized stat calculation
- **Base Stat Preservation**: All weapons/abilities now store `BASE_*` values that never change directly
- **Dynamic Calculation**: Stats computed on-demand with all modifiers applied consistently
- **Global Impact**: Each element affects ALL compatible abilities across the entire game

#### Per-Level Scaling Implementation
```javascript
// Each element provides consistent +10% bonuses per level
Fire:      +10% damage to ALL attacks
Earth:     +10% radius to ALL area effects  
Air:       +10% range to ALL projectiles
Lightning: +10% attack speed to ALL weapons/abilities (reduces cooldowns)
Water:     +10% max health + 1 HP/sec regeneration (player only)
```

#### Cross-Element Synergy System
- **Fire + Earth**: High-damage explosions with massive radius (Fireball radius affected by Earth levels)
- **Lightning + Air**: Fast-firing, long-range projectiles (Wind Blades fire rate + range scaling)
- **Fire + Lightning**: Maximum DPS builds (damage multiplier + attack speed)
- **Earth + Water**: Large defensive globes (Water Globe size affected by Earth levels)

#### Implementation Details
- **Weapon Updates**: `BasicWeapon.js` now uses `getModifiedStats()` for dynamic stat calculation
- **Ability Updates**: All elemental abilities (Fireball, Chain Lightning, Thunder Storm, etc.) use modifier system
- **Constants Refactor**: Added `BASE_*` properties to preserve original values
- **Health Regeneration**: Water mastery provides passive HP regeneration integrated into player update loop

#### Enhanced Debugging System
**NEW**: `window.game.player.debugModifiers()` console command provides comprehensive stat analysis:

```javascript
// Example output:
🔧 Current Elemental Modifiers:
🔥 Fire 3: +30% Damage
🌍 Earth 2: +20% Radius  
🌪️ Air 1: +10% Range
⚡ Lightning 2: +19% Attack Speed
💧 Water 4: +40% Health, +4/sec Regen

📊 WEAPON & ABILITY IMPACT:
🎯 Basic Weapon Projectiles:
   Damage: 26 (base: 20, +6)
   Range: 220 (base: 200, +20)
   Fire Rate: 0.41s (base: 0.5s, -0.09s faster)

🔥 Fireball:
   Damage: 39 (base: 30, +9)
   Explosion Radius: 30.0px (base: 25px, +5.0px)
   Range: 220 (base: 200, +20)
   Cooldown: 1.64s (base: 2.0s)

🌪️ Wind Blades (1 per shot):
   Damage: 21 each (base: 16, +5)
   Range: 220 (base: 200, +20)
   Fire Rate: 0.41s (base: 0.5s, -0.09s faster)
   Total DPS: 51 (1 blades × 21 dmg ÷ 0.41s)

⚡ Chain Lightning:
   Target Count: 3 (base: 1, +2 from Lightning levels)
   Damage: 39 per hit (base: 30, +9)
   Range: 165 (base: 150, +15)
   Cooldown: 1.64s (base: 2.0s, -0.36s faster)
```

#### Technical Implementation
- **Performance**: Modifier calculations cached per frame, no performance impact
- **Backward Compatibility**: All existing code continues to work with legacy properties
- **Extensibility**: Easy to add new elements or modify scaling factors
- **Testing**: Comprehensive unit tests verify all modifier calculations

### Earth Element Balance & Visual Enhancement (v2.9.1)

#### Tremor Damage Rebalance
- **Base Damage**: 18 → 7 (61% reduction)
- **Level Scaling**: +2 → +1 damage per level 
- **Max DPS**: ~52 → ~22 (58% reduction at Level 5)
- **Implementation**: Modified `updateRadiusAttack()` in `Player.js`

#### Enhanced Particle System
- **TremorParticle Class Improvements**:
  - Size range: 3-7px → 2-10px with random scaling (1.0x-1.5x)
  - Added rotation animation with random speed
  - Glow effects via `ctx.shadowBlur = 4`
  - Enhanced color variations (brown/gray earth tones)
- **Spawn Rate Increase**: 4 → 16+ particles per pulse
  - 3 particles per enemy hit (was 1)
  - 8 central particles around player (was 3)
  - 20px random offset spread for enemy hit effects

#### UI System Enhancements
- **Dynamic Level Display**: `updatePowerupDisplay()` modified to show:
  - "Level X/5" without mastery ring
  - "Level X/10" with mastery ring
- **Progress Bar Accuracy**: Percentage calculated based on actual max level
- **Ultimate Ability Visibility**: Only shown when player has corresponding mastery ring
- **Ring Integration**: `player.masteryRings.includes(element)` check for all ultimate displays

### Frame Rate Independence System (v2.2.0)
- **DeltaTime Implementation**: Added consistent frame rate normalization across all devices
- **Variable Timestep**: Game loop now uses proper deltaTime calculations instead of fixed 1/60 timesteps
- **Cross-Device Performance**: Game runs identically on 30fps, 60fps, 120fps, and 144fps+ displays
- **Performance Optimization**: Frame time capping prevents lag spikes when browser tab loses focus

### Game Balance Rebalancing (v2.2.0)
- **Enemy Damage Scaling**: Increased all enemy damage by 3x (10→30, 15→35, 18→40, 20→50)
- **Enemy Health Buffs**: Veteran enemies 60→120 HP (+100%), Elite enemies 120→250 HP (+108%)
- **Player Survivability**: Removed starting invincibility for more challenging early game
- **Combat Pacing**: Maintains same time-to-kill while increasing individual hit impact

### Game State Management
- **Added Start Screen**: Informative welcome screen with game controls and objective
- **Improved Game Over**: Clean screen showing only final stats (time, score, level)
- **State System**: `'waiting'` → `'playing'` → `'gameOver'` transitions
- **DOM Ready Fix**: Proper initialization timing with `DOMContentLoaded`

### Ultimate Abilities Implementation

#### 🌍 Earthquake Stomp (Earth Level 6) - NEW
- **Functionality**: Massive AOE attack every 8 seconds
- **Damage**: 80 base damage in 150-pixel radius
- **Effects**: 1.5-second stun on all affected enemies
- **Visuals**: `EarthquakeWave`, `ShockwaveRing`, `DebrisParticle` classes

#### ⛈️ Thunder Storm (Lightning Level 6) - NEW
- **Functionality**: 8 targeted lightning strikes every 6 seconds
- **Smart Targeting**: 70% chance to target near enemies
- **Damage**: 60 base damage per strike in 40-pixel radius
- **Effects**: 0.5-second stun per strike
- **Visuals**: `StormClouds`, `ThunderBolt`, `LightningImpact`, `ElectricSpark` classes

### Earth Mastery Improvements
- **Renamed**: "Radius Blast" → "Tremors" in UI
- **Enhanced Scaling**: Levels 4-6 now provide:
  - **Faster Activation**: 3s → 2.5s → 2s → 1.5s cooldown
  - **Bonus Damage**: +10 damage per level above 3
- **Updated Descriptions**: "Tremor Fury: Faster Tremors + Bonus Damage"

### Enemy Status Effects
- **Stunned State**: New status effect for Earth and Lightning ultimates
- **Visual Indicators**: Yellow/orange coloring for stunned enemies
- **Behavior**: Enemies can't move when stunned (similar to frozen)

## 🏗️ Architecture Overview

### Core Classes

#### Game Class
```javascript
class Game {
    constructor() {
        this.gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
        
        // Delta time system for consistent frame rate
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.fixedTimeStep = 1 / this.targetFPS;
        // ... other properties
    }
    
    gameLoop(currentTime = 0) {
        // Calculate delta time in seconds
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }
        
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent huge jumps
        this.deltaTime = Math.min(this.deltaTime, this.fixedTimeStep * 2);
        
        if (this.gameState === 'playing') {
            this.update(this.deltaTime);
        }
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    startGame() { /* Initialize new game */ }
    updateUI() { /* Update side panel displays only */ }
    render() { /* Handle different game states */ }
    renderCanvasUI() { /* Modern UI rendered directly on canvas */ }
}
```

#### Player Class
```javascript
class Player {
    updateEarthquakeStormp() { /* Earth ultimate */ }
    updateThunderStorm() { /* Lightning ultimate */ }
    createEarthquake() { /* AOE damage + stun */ }
    createThunderStorm() { /* Multiple strikes */ }
}
```

#### Enemy Classes
- **Enemy**: Base class with frozen/stunned states
- **VeteranEnemy**: Enhanced health and speed
- **EliteEnemy**: Armor and crown effects
- **BossEnemy**: Projectile attacks and health bars

### Particle System

#### Earth Ultimate Effects
- **EarthquakeWave**: Expanding brown rings
- **ShockwaveRing**: Delayed secondary waves
- **DebrisParticle**: Physics-based debris with gravity

#### Lightning Ultimate Effects
- **StormClouds**: Atmospheric cloud cover
- **ThunderBolt**: Jagged lightning from above
- **LightningImpact**: Electric impact rings
- **ElectricSpark**: Scattered electric particles

### Upgrade System
```javascript
class UpgradeSystem {
    getRandomUpgrades() {
        // Dynamic descriptions based on current level
        // Filters maxed elements (level 6)
        // Updates description text for levels 4-6
    }
}
```

## 🎮 Game State Flow

```
Page Load → DOM Ready → Game Constructor → 'waiting' state
    ↓
User presses SPACE/ENTER → startGame() → 'playing' state
    ↓
Player dies → 'gameOver' state → Show final stats
    ↓
User presses SPACE/ENTER → startGame() → 'playing' state (restart)
```

## 🎨 Visual Design System

### Color Schemes
- **Fire**: `#ff4400` to `#ff8800` gradients
- **Water**: `#0066ff` to `#00aaff` gradients  
- **Earth**: `#8B4513` to `#D2691E` gradients
- **Air**: `#87CEEB` to `#E0E0E0` gradients
- **Lightning**: `#FFD700` to `#FFFF00` gradients

### Status Effect Colors
- **Frozen**: `#88ddff` (light cyan)
- **Stunned**: `#ffff44` (bright yellow)
- **Normal**: `#ff4444` (red)

### Modern Canvas UI Architecture

#### Canvas-Rendered Elements
- **Health Bar**: Compact 120px rounded bar with gradient colors
  - Green (>60% health) → Yellow (30-60%) → Red (<30%)
  - Semi-transparent background with subtle white border
- **XP Bar**: Blue gradient progress bar below health
- **Level Display**: Shows "Lv.X" next to XP bar
- **Timer**: Top-right with clock emoji, auto-sizing background
- **Score**: Below timer with trophy emoji, comma-separated values

#### Technical Implementation
```javascript
renderCanvasUI() {
    // Modern rounded rectangles with gradients
    // Auto-sizing pill backgrounds
    // Browser compatibility fallback for roundRect
    // Performance-optimized canvas rendering
}
```

### UI Feedback
- **Unlocked Abilities**: Green highlight class
- **Progress Bars**: Animated width transitions  
- **Blinking Prompt**: CSS keyframe animation

## 🔧 Performance Optimizations

### Particle Management
- **Automatic Cleanup**: `shouldRemove` flag system
- **Efficient Rendering**: Alpha-based fadeouts
- **Memory Management**: Array splicing for expired particles

### Collision Detection
- **Distance-based**: `Math.sqrt(dx*dx + dy*dy)` calculations
- **Radius Checking**: Simple circle collision detection
- **Early Returns**: Skip processing for distant objects

### Animation System
- **Variable Frame Rate**: `requestAnimationFrame` loop with deltaTime normalization
- **Frame Rate Independence**: All movement/timing calculations use deltaTime multipliers
- **Performance Consistency**: Multiplier approach (deltaTime * 60) maintains existing game feel
- **Smooth Transitions**: CSS transitions for UI elements

## 🚀 Deployment Pipeline

### Local Development
```bash
# Run local server
python -m http.server 8080
# Or use any static file server
```

### Production Deployment
```bash
# Copy files to public directory
cp game.js public/game.js
cp index.html public/index.html

# Deploy to Firebase
firebase deploy
```

### File Structure
```
/
├── game.js (development)
├── index.html (development)  
├── public/
│   ├── game.js (deployed)
│   └── index.html (deployed)
├── firebase.json (hosting config)
└── README.md (documentation)
```

## 🐛 Debugging Features

### Console Logging
- **Version Check**: Game loading confirmation
- **Input Debug**: Space/Enter key press detection
- **State Transitions**: Game state change logging

### Development Tools
- **Browser DevTools**: F12 for console and inspection
- **Firebase Console**: Deployment monitoring
- **GitHub Issues**: Bug tracking and feature requests

## 📊 Game Balance

### Damage Scaling
- **Base Weapon**: 20 damage
- **Fire Mastery**: 1.5x multiplier per level (1-3)
- **Earth Tremors**: 40 base + level bonuses
- **Lightning Chains**: 30 base damage with bounces
- **Ultimate Abilities**: 60-80 base damage

### Cooldown Timings
- **Basic Weapon**: 0.5 seconds
- **Tremors**: 3s → 1.5s (levels 3-6)
- **Lightning Strike**: 2 seconds
- **Earth Ultimate**: 8 seconds
- **Lightning Ultimate**: 6 seconds
- **Tornado Spawn**: 2.5 seconds

### Enemy Health Progression
- **Basic**: 30 HP
- **Veteran**: 120 HP (4x) 
- **Elite**: 250 HP (8.3x) + 5 armor
- **Boss**: 200 HP + projectiles

### Enemy Damage Progression
- **Basic**: 30 damage (3-4 hits to kill)
- **Veteran**: 35 damage (3 hits to kill)
- **Elite**: 40 damage (2-3 hits to kill)
- **Boss**: 50 damage (2 hits to kill)

## 🔄 State Management

### Game State Variables
```javascript
{
    gameState: 'waiting' | 'playing' | 'gameOver',
    gameTime: number, // seconds
    score: number,
    isPaused: boolean,
    gameOver: boolean // legacy, kept for compatibility
}
```

### Player State
```javascript
{
    health: number,
    maxHealth: number,
    level: number,
    xp: number,
    xpToNext: number,
    upgradeCount: {
        fire: 0-6,
        water: 0-6,
        earth: 0-6,
        air: 0-6,
        lightning: 0-6
    },
    specialAbilities: {
        // Level 3 abilities
        fireball: boolean,
        shield: boolean,
        radiusAttack: boolean,
        missiles: boolean,
        lightning: boolean,
        // Level 6 ultimates
        infernoWave: boolean,
        freezingTouch: boolean,
        earthquakeStormp: boolean,
        tornadoVortex: boolean,
        thunderStorm: boolean
    }
}
```

## 📝 Code Standards

### Naming Conventions
- **Classes**: PascalCase (`EarthquakeWave`)
- **Methods**: camelCase (`updateThunderStorm`)
- **Variables**: camelCase (`strikesCount`)
- **Constants**: UPPER_CASE (rare usage)

### Class Structure
1. **Constructor**: Initialize properties
2. **Update Method**: Game logic per frame
3. **Render Method**: Visual drawing
4. **Utility Methods**: Helper functions

### Error Handling
- **Null Checks**: Defensive programming for DOM elements
- **Bounds Checking**: Keep entities within canvas
- **Graceful Degradation**: Continue on non-critical errors

---

*Last Updated: August 2025*
*Version: 2.2 - Frame Rate Independence & Balance Update*