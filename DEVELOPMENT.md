# 🛠️ Development Documentation

This document outlines the technical implementation details and recent changes made to Elemental Fury.

## 📋 Recent Updates

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
        // ... other properties
    }
    
    startGame() { /* Initialize new game */ }
    updateUI() { /* Update health, XP, score displays */ }
    render() { /* Handle different game states */ }
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
- **60 FPS Target**: `requestAnimationFrame` loop
- **Delta Time**: Frame-independent updates (`1/60` assumption)
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
- **Tornado Spawn**: 5 seconds

### Enemy Health Progression
- **Basic**: 30 HP
- **Veteran**: 60 HP (2x)
- **Elite**: 120 HP (4x) + 5 armor
- **Boss**: 200 HP + projectiles

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
*Version: 2.1 - Thunder Storm Release*