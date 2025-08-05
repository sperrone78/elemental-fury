# ⚡ Elemental Fury

A vampire survivor-like game featuring elemental combat and progressive mastery system.

## 🎮 Game Overview

Elemental Fury is a top-down survival game where players master 5 elemental powers while fighting endless waves of enemies. Each element has unique abilities and devastating ultimate powers unlocked at level 6.

## 🌟 Features

### Game Mechanics
- **Start Screen**: Informative welcome screen with controls and game info
- **Game Over Screen**: Shows final stats (time survived, score, level)
- **Progressive Difficulty**: Enemy spawns increase with player level
- **Multiple Enemy Types**: Basic, Veteran, Elite, and Boss enemies
- **Experience System**: Gain XP to level up and choose upgrades

### Controls
- **WASD**: Movement
- **Mouse**: Aim attacks
- **SPACE/ENTER**: Start game or restart after game over

## 🔥 Elemental Mastery System

### Fire Mastery 🔥
- **Levels 1-3**: +50% weapon damage per level
- **Level 3 Ability**: **Fireball** - Explosive projectiles with area damage
- **Levels 4-6**: Enhanced DOT (Damage Over Time) effects
- **Level 6 Ultimate**: **🌋 Inferno Wave** - Chain explosions from fireballs

### Water Mastery 💧
- **Levels 1-3**: +20 max health and healing per level
- **Level 3 Ability**: **🛡️ Protective Shield** - Absorbs damage
- **Levels 4-6**: +2 health regeneration per second per level
- **Level 6 Ultimate**: **❄️ Freezing Touch** - Freeze nearby enemies when taking damage

### Earth Mastery 🌍
- **Levels 1-3**: +5 armor per level (damage reduction)
- **Level 3 Ability**: **🌊 Tremors** - AOE blast every 3 seconds
- **Levels 4-6**: **Tremor Fury** - +3 armor + faster tremors (2.5s → 2s → 1.5s) + bonus damage
- **Level 6 Ultimate**: **🌍 Earthquake Stomp** - Massive 150-radius earthquake every 8 seconds

### Air Mastery 🌪️
- **Levels 1-3**: +25% weapon range per level
- **Level 3 Ability**: **🚀 Twin Missiles** - Additional projectiles
- **Levels 4-6**: +20% projectile speed per level
- **Level 6 Ultimate**: **🌪️ Tornado Vortex** - Powerful tornadoes spawn every 2.5 seconds

### Lightning Mastery ⚡
- **Levels 1-3**: +33% attack speed per level (-25% weapon cooldown)
- **Level 3 Ability**: **⚡ Swift Strike** - Chain lightning with 3+ bounces
- **Levels 4-6**: +1 chain bounce per level
- **Level 6 Ultimate**: **⛈️ Thunder Storm** - 8 targeted lightning strikes every 6 seconds

## 👾 Enemy Types

### Basic Enemy
- **Health**: 30 HP
- **Damage**: 30 (3-4 hits to kill player)
- **Speed**: Normal
- **Reward**: 5 XP, 10 points

### Veteran Enemy (Level 10+)
- **Health**: 120 HP (+100% from basic)
- **Damage**: 35 (3 hits to kill player)
- **Speed**: 20% faster
- **Features**: Spiked appearance
- **Reward**: 15 XP, 25 points

### Elite Enemy (Level 20+)
- **Health**: 250 HP (+108% from veteran)
- **Damage**: 40 (2-3 hits to kill player)
- **Speed**: 40% faster
- **Features**: Armor (reduces damage by 5), crown effect
- **Reward**: 30 XP, 50 points

### Boss Enemies (Level-Specific Spawns)

#### Basic Boss (Levels 5, 10, then random from 25+)
- **Health**: 200 HP
- **Damage**: 50 (2 hits to kill player)
- **Features**: Shoots projectiles, health bar
- **Reward**: 25 XP (5 pickups), 100 points

#### Veteran Boss (Levels 15, 20, then random from 30+)
- **Health**: 300 HP
- **Damage**: 50 (2 hits to kill player)
- **Features**: Enhanced projectiles, spike barrage
- **Reward**: 40 XP (8 pickups), 250 points

#### Elite Boss (Level 25+, every 5 levels + random from 40+)
- **Health**: 400 HP
- **Damage**: 50 (2 hits to kill player) + 10 armor
- **Features**: Royal dominance, fast shooting
- **Reward**: 60 XP (12 pickups), 500 points

## 🎯 Status Effects

### Frozen ❄️
- **Source**: Water mastery Freezing Touch
- **Effect**: Enemies can't move
- **Duration**: 3 seconds
- **Visual**: Blue tint with white outline

### Stunned ⚡
- **Source**: Earth Earthquake Stomp, Lightning Thunder Storm
- **Effect**: Enemies can't move
- **Duration**: 0.5-1.5 seconds
- **Visual**: Yellow tint with orange outline

### Burning 🔥
- **Source**: Fire mastery DOT effects
- **Effect**: Damage over time
- **Duration**: 3+ seconds (enhanced at higher fire levels)

## 🎨 Visual Effects

### Particle Systems
- **Explosions**: Fire damage and earth tremors
- **Lightning Bolts**: Chain lightning and thunder strikes
- **Ice Rings**: Freezing touch activation
- **Debris**: Earthquake aftermath
- **Storm Clouds**: Thunder storm atmospheric effects
- **Tornadoes**: Moving vortexes with debris

### UI Elements
- **Modern Health Bar**: Canvas-rendered compact bar with gradient colors (green→yellow→red)
- **Modern XP Bar**: Canvas-rendered progress bar with blue gradient
- **Canvas-Integrated UI**: Health, XP, Level, Timer, and Score rendered directly on game canvas
- **Rounded Design**: Modern pill-shaped UI elements with subtle borders
- **Elemental Progress**: 6-level mastery bars for each element in side panels
- **Auto-sizing**: UI elements automatically adjust to content width

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: HTML5 Canvas, JavaScript (ES6+)
- **Hosting**: Firebase Hosting
- **Deployment**: Automated via Firebase CLI

### Performance Features
- **Frame Rate Independence**: DeltaTime system ensures consistent gameplay at any FPS (30, 60, 120, 144+)
- **Efficient Collision Detection**: Distance-based calculations
- **Particle Management**: Automatic cleanup of expired effects
- **Smooth Animation**: Variable frame rate game loop with requestAnimationFrame
- **Responsive Design**: Scales to different screen sizes
- **Performance Optimization**: Frame time capping prevents lag spikes when tab loses focus

### Code Architecture
- **Class-based Design**: Modular entity system
- **Component Pattern**: Separate systems for upgrades, waves, particles
- **State Management**: Clean game state transitions
- **Event-driven**: Responsive input handling

## 🚀 Getting Started

### Local Development
1. Clone the repository
2. Open `index.html` in a web browser
3. Or run a local server: `python -m http.server 8080`

### Deployment
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy`

## 🎯 Game Strategy Tips

### Early Game (Levels 1-10)
- Focus on one element for consistent upgrades
- Fire and Lightning offer immediate combat benefits
- Water provides survivability for longer runs

### Mid Game (Levels 10-20)
- Start diversifying into secondary elements
- Earth becomes powerful with Tremors
- Watch for Veteran enemies starting at level 10

### Late Game (Level 20+)
- Elite enemies require strategic positioning
- Ultimate abilities (level 6) provide massive power spikes
- Combine elements for maximum effectiveness

### Extreme Late Game (Level 15+)
- **Critical Phase**: Random boss spawns begin - game becomes significantly harder
- **Time Pressure**: Spawn rates increase every minute, preventing idle strategies
- **Shop Strategy**: Essential to purchase XP Vortex upgrades for faster leveling
- **Element Focus**: Prioritize defensive elements (Earth armor, Water healing)
- **Level 20+ Warning**: All boss types spawn every 10 seconds - designed to be unwinnable without shop upgrades

### Ultimate Combinations
- **Fire + Earth**: Explosions + Earthquakes for crowd control
- **Lightning + Air**: Speed + Chain damage for fast clear
- **Water + Any**: Survivability allows risky plays

## 📈 Progression System

### Level Up Mechanics
- **XP Requirements**: Increase by 20% each level
- **Specific Boss Spawns**: 
  - Levels 5 & 10: Basic Boss
  - Levels 12, 15 & 20: Veteran Boss
  - Level 18 & 25+: Elite Boss (every 5 levels)
- **Random Boss Spawns**: 
  - Levels 10-14: Basic Bosses (every 20s)
  - Levels 15-19: Basic + Veteran Bosses (every 15s)
  - Level 20+: All Boss Types (every 10s)
- **Enemy Scaling**: More veterans/elites at higher levels
- **Spawn Rate Scaling**: 25% increase per level + 10% increase per minute of play time
- **Choice System**: 3 random upgrades per level (filtered for available elements)

### Mastery Milestones
- **Level 3**: Unlock special ability
- **Level 6**: Unlock ultimate ability
- **Maxed Elements**: Show completion status in upgrade menu

## 🏆 Achievements (Visual Indicators)

- **⚡ Symbol**: Special ability unlocked (level 3)
- **🌟 Symbol**: Ultimate ability unlocked (level 6)
- **Green Highlight**: Unlocked abilities in UI
- **Progress Bars**: Visual mastery progression

---

**🌐 Play Online**: [elemental-fury.web.app](https://elemental-fury.web.app)

**🎮 Master the elements. Survive the fury. Become legendary.**