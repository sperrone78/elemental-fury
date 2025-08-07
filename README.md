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

#### 🖥️ Desktop Controls
- **WASD/Arrow Keys**: Movement
- **Mouse**: Aim attacks
- **SPACE/ENTER**: Start game or restart after game over

#### 📱 Mobile Controls
- **Device Tilt**: Move your character by tilting your phone
  - Tilt left/right for horizontal movement
  - Tilt forward/back for vertical movement
- **Auto-Aim**: Aiming follows your movement direction automatically
- **Touch**: Tap to start game or restart after game over

## 🔥 Elemental Mastery System

**🎯 NEW PROGRESSION**: Choose up to **3 elements** for levels 1-5, then select **2 for Ultimate Mastery** (levels 6-10)!

### ⚡ Progression Overview
- **Levels 1-5**: Experiment with up to 3 different elements
- **Level 6**: **Ultimate Mastery Choice** - Choose 2 elements to continue (requires Mastery Rings)
- **Levels 7-10**: Only your 2 chosen ultimate elements can progress  
- **Level 10**: **Fusion Ultimates** unlock combining both ultimate elements

## 🌟 Global Elemental Bonuses

**NEW SYSTEM**: Each elemental level provides consistent +10% bonuses that affect ALL compatible abilities:

### Fire Mastery 🔥 - **DAMAGE**
- **Global Effect**: +10% damage per level to **ALL attacks** (weapons, abilities, projectiles)
- **Level 3 Ability**: **Fireball** - Explosive projectiles with area damage & DOT
- **Level 6 Ultimate**: **🌋 Inferno Wave** - Chain explosions from fireballs
- **Synergy**: Works with all damage-dealing abilities across elements

### Water Mastery 💧 - **HEALTH & REGENERATION**
- **Global Effect**: +10% max health + 1 HP/sec regeneration per level
- **Level 3 Ability**: **Water Globes** - Orbiting protective spheres (size affected by Earth)
- **Level 6 Ultimate**: **❄️ Freezing Touch** - Freeze nearby enemies when taking damage
- **Unique**: Only element that doesn't affect other elements' abilities

### Earth Mastery 🌍 - **RADIUS**
- **Global Effect**: +10% radius per level to **ALL area effects** (explosions, tremors, storms, globes)
- **Level 3 Ability**: **Tremors** - Pulsing AOE damage field around player
- **Level 6 Ultimate**: **🌍 Earthquake Stomp** - Massive earthquake every 8 seconds
- **Synergy**: Makes Fire explosions, Lightning storms, and Water globes bigger

### Air Mastery 🌪️ - **RANGE**
- **Global Effect**: +10% range per level to **ALL projectiles and abilities**
- **Level 3 Ability**: **Wind Blades** - Seeking projectiles that curve toward enemies
- **Level 6 Ultimate**: **🌪️ Tornado Vortex** - Moving tornadoes spawn every 2.5 seconds
- **Synergy**: Extends range of all weapons, fireballs, chain lightning, etc.

### Lightning Mastery ⚡ - **ATTACK SPEED**
- **Global Effect**: +10% attack speed per level to **ALL weapons and abilities** (reduces cooldowns)
- **Level 3 Ability**: **Chain Lightning** - 1 base target + 1 per Lightning level
- **Level 6 Ultimate**: **⛈️ Thunder Storm** - 8 targeted lightning strikes every 6 seconds
- **Synergy**: Makes everything fire/activate faster - weapons, fireballs, storms, etc.

## 🔥⚡🌍 Element Synergy Examples

### **Fire + Earth** = Massive Explosions
- Fire provides damage, Earth provides explosion radius
- Fireball with Earth 3: 25px → 32.5px explosion radius (+30%)
- Inferno Wave with Earth 5: 200px → 300px chain radius (+50%)

### **Lightning + Air** = Machine Gun Mode  
- Lightning provides fire rate, Air provides range
- Wind Blades with Lightning 3: 0.5s → 0.365s cooldown (+37% faster)
- All projectiles with Air 4: 200px → 280px range (+40%)

### **Fire + Lightning** = Glass Cannon
- Highest DPS build: maximum damage at maximum speed
- Basic weapon with Fire 5 + Lightning 5: 30 damage every 0.295s = 102 DPS

### **Earth + Water** = Tank Build
- Large defensive globes with high survivability  
- Water globes with Earth 2: 5px → 6px radius, further orbit distance
- Player with Water 5: 150 max HP + 5 HP/sec regeneration

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
- **Mobile Support**: Device Orientation API, Touch Events
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
- **Gold Border Shimmer**: Level 6 ultimate choices get special visual treatment
- **💍 Ring Icons**: Animated ring indicators in left sidebar show equipped mastery rings

## 🛠️ Development & Testing Tools

### Testing Features
- **Diamond Testing Button**: Located in left sidebar, adds +100 diamonds for shop testing
- **Console Debugging**: Use `window.game` for runtime debugging and inspection
- **Element Progress Tracking**: Monitor `game.player.chosenElements` and `game.player.ultimateElements`
- **Ring Icon System**: Visual feedback for equipped mastery rings with shimmer animation

### New Debugging Utilities
- **`window.game.player.debugModifiers()`**: Shows detailed breakdown of all current elemental bonuses
  - **Global modifiers**: Current Fire/Water/Earth/Air/Lightning levels and their effects
  - **Weapon impact**: Exact damage, range, cooldown, radius for basic weapons
  - **Ability details**: Stats for all active abilities (Fireball, Wind Blades, Chain Lightning, etc.)
  - **Synergy analysis**: Shows how different elements combine (e.g., Fire damage + Earth radius on explosions)
  - **DPS calculations**: Real-time damage-per-second for complex abilities like Wind Blades

### Deployment Workflow
1. Edit source files in root directory
2. Test locally at `http://localhost:8080`
3. Sync changes to `public/` directory:
   ```bash
   cp -r js public/js
   cp index.html public/index.html
   ```
4. Deploy: `firebase deploy`

---

**🌐 Play Online**: [elemental-fury.web.app](https://elemental-fury.web.app)

**🎮 Master the elements. Survive the fury. Become legendary.**