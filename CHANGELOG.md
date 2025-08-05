# 📅 Changelog

All notable changes to Elemental Fury are documented here.

## [2.8.0] - 2025-01-26 - Modern Canvas UI Redesign

### 🎨 Added - Modern Canvas-Based UI
- **Canvas-Rendered Interface**: All UI elements now rendered directly on game canvas for seamless integration
- **Compact Health Bar**: 60% smaller modern bar with gradient colors (green→yellow→red based on health)
- **Compact XP Bar**: Sleek blue gradient progress bar below health
- **Rounded Design**: Modern pill-shaped UI elements with subtle semi-transparent borders
- **Auto-sizing Elements**: Timer and score backgrounds automatically adjust to content width
- **Browser Compatibility**: Fallback for roundRect method on older browsers

### 🗑️ Removed - Legacy HTML UI
- **Header Bar Removal**: Eliminated top header, reclaiming 60px of screen space
- **Below-Canvas UI**: Removed HTML-based level/timer/score display
- **DOM Dependencies**: Reduced HTML DOM updates during gameplay for better performance

### 📍 Enhanced - UI Positioning
- **Health/XP**: Top-left corner overlay on canvas
- **Timer**: Top-right with clock emoji ⏱️
- **Score**: Below timer with trophy emoji 🏆  
- **Level**: Compact "Lv.X" display next to XP bar
- **Full Viewport**: Game now uses 100% of screen height

## [2.2.0] - 2025-08-04 - Frame Rate Independence & Balance Update

### 🚀 Added - Frame Rate Independence
- **DeltaTime System**: Game now runs at consistent speed regardless of device frame rate (30fps, 60fps, 120fps, 144fps+)
- **Variable Timestep**: Game loop now uses requestAnimationFrame with proper deltaTime calculations
- **Performance Optimization**: Frame time capping prevents lag spikes when tab loses focus

### ⚖️ Enhanced - Game Balance
- **Enemy Damage Rebalance**: Starting enemies now deal 30 damage (was 10)
  - Veteran enemies: 35 damage (was 15)
  - Elite enemies: 40 damage (was 18)  
  - Boss enemies: 50 damage (was 20)
- **Enemy Health Buffs**: 
  - Veteran enemies: 120 HP (was 60, +100% increase)
  - Elite enemies: 250 HP (was 120, +108% increase)
- **Player Survivability**: Starting invincibility removed for more challenging gameplay

### 🛠️ Technical Improvements
- **Cross-Device Compatibility**: Game now plays identically on all devices regardless of refresh rate
- **Smooth Animation**: Variable frame rate ensures fluid motion at any FPS
- **Performance Consistency**: DeltaTime system normalizes all movement and timing calculations

## [2.1.0] - 2025-08-04 - Thunder Storm Release

### ⚡ Added - Lightning Ultimate
- **Thunder Storm Ultimate**: 8 targeted lightning strikes every 6 seconds
- **Smart Targeting**: 70% chance to strike near enemies
- **Visual Effects**: Storm clouds, thunder bolts, lightning impacts, electric sparks
- **Status Effect**: Brief 0.5s stun on struck enemies

### 🌍 Added - Earth Ultimate  
- **Earthquake Stomp Ultimate**: Massive AOE earthquake every 8 seconds
- **Damage Scaling**: 80 base damage in 150-pixel radius, scales with distance
- **Status Effect**: 1.5-second stun on all affected enemies
- **Visual Effects**: Earthquake waves, shockwave rings, physics-based debris

### 🌊 Enhanced - Earth Mastery Progression
- **Renamed**: "Radius Blast" → "Tremors" in UI
- **Faster Tremors**: Levels 4-6 reduce cooldown (3s → 2.5s → 2s → 1.5s)
- **Bonus Damage**: +10 damage per level above 3 (max 70 damage at level 6)
- **Updated Descriptions**: "Tremor Fury: Faster Tremors + Bonus Damage"

### 👾 Added - Enemy Status Effects
- **Stunned State**: New yellow/orange visual effect for stunned enemies
- **Behavior**: Stunned enemies cannot move (similar to frozen)
- **Sources**: Earth Earthquake Stomp, Lightning Thunder Storm
- **Integration**: Works alongside existing frozen state from Water mastery

### 🎮 Added - Game State Management
- **Start Screen**: Welcome screen with controls, game objective, and elemental info
- **Improved Game Over**: Clean screen showing only final stats (time, score, level)
- **State Transitions**: `'waiting'` → `'playing'` → `'gameOver'` flow
- **Keyboard Controls**: SPACE/ENTER to start game or restart after death

### 🐛 Fixed - Technical Issues
- **DOM Timing**: Game now initializes after DOM is ready
- **Event Handling**: Proper keyboard input processing
- **Cache Issues**: Version checking and deployment improvements

### 🎨 Added - Visual Enhancements
- **Earthquake Effects**: Brown/earth-toned expanding waves with debris
- **Lightning Effects**: Bright white/yellow bolts with blue glow
- **Storm Atmosphere**: Drifting gray clouds during thunder storms
- **Status Indicators**: Clear visual feedback for all enemy states

---

## [2.0.0] - 2025-08-04 - Game Over Widget Release

### 🎮 Added - Game Over System
- **Game Over Screen**: Displays when player dies
- **Final Statistics**: Shows survival time, final score, and level achieved
- **Restart Functionality**: Continue playing with SPACE/ENTER
- **Visual Polish**: Clean overlay design matching game theme

### 🏗️ Improved - Code Architecture
- **Modular Design**: Better separation of game systems
- **State Management**: Cleaner game state handling
- **Performance**: Optimized rendering and update loops

---

## [1.0.0] - 2025-08-04 - Initial Release

### 🎮 Core Game Features
- **Elemental Combat System**: 5 unique elemental masteries
- **Progressive Difficulty**: Enemy spawns scale with player level
- **Experience System**: Gain XP to unlock upgrades
- **Multiple Enemy Types**: Basic, Veteran, Elite, and Boss enemies

### 🔥 Fire Mastery
- **Levels 1-3**: +50% weapon damage
- **Level 3**: Fireball ability with explosion damage
- **Levels 4-6**: Enhanced DOT effects
- **Level 6**: Inferno Wave ultimate (chain explosions)

### 💧 Water Mastery  
- **Levels 1-3**: +20 max health per level
- **Level 3**: Protective Shield ability
- **Levels 4-6**: +2 health regeneration per level
- **Level 6**: Freezing Touch ultimate

### 🌍 Earth Mastery
- **Levels 1-3**: +25% movement speed
- **Level 3**: Radius Blast ability (AOE damage)
- **Levels 4-6**: +3 armor per level
- **Level 6**: Earthquake Stomp placeholder

### 🌪️ Air Mastery
- **Levels 1-3**: +25% weapon range
- **Level 3**: Twin Missiles ability
- **Levels 4-6**: +20% projectile speed
- **Level 6**: Tornado Vortex ultimate

### ⚡ Lightning Mastery
- **Levels 1-3**: +33% attack speed
- **Level 3**: Chain Lightning ability
- **Levels 4-6**: +1 chain bounce per level
- **Level 6**: Thunder Storm placeholder

### 👾 Enemy System
- **Basic Enemies**: 30 HP, normal speed, 5 XP reward
- **Veteran Enemies**: 60 HP, 20% faster, appear at level 10+
- **Elite Enemies**: 120 HP, armor, appear at level 20+
- **Boss Enemies**: 200 HP, projectile attacks, every 5 levels

### 🎨 Visual Effects
- **Particle Systems**: Explosions, lightning, ice effects
- **UI Elements**: Health bars, XP progress, elemental mastery displays
- **Status Effects**: Frozen enemies with visual indicators

### 🛠️ Technical Foundation
- **HTML5 Canvas**: Smooth 60 FPS gameplay
- **Firebase Hosting**: Cloud deployment
- **Responsive Design**: Works on different screen sizes
- **Performance Optimized**: Efficient collision detection and rendering

---

## 📋 Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in backward-compatible manner  
- **PATCH** version for backward-compatible bug fixes

## 🏷️ Release Tags

### Added
- New features, content, or capabilities

### Changed  
- Changes to existing functionality

### Enhanced
- Improvements to existing features

### Fixed
- Bug fixes and corrections

### Removed
- Deprecated or removed features

---

*All dates are in YYYY-MM-DD format*
*Game available at: [elemental-fury.web.app](https://elemental-fury.web.app)*