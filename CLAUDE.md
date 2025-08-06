# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Start local development server (preferred)
python -m http.server 8080

# Alternative: use Node.js if available
npx http-server . -p 8080

# Game runs directly in browser at http://localhost:8080
```

### Deployment to Production
```bash
# IMPORTANT: Always sync files to public/ before deploying
# Copy all game files to public directory (required for Firebase)
cp index.html public/index.html
cp -r js public/js

# Deploy to Firebase Hosting
firebase deploy

# Check deployment status
firebase hosting:sites:list

# View live site
firebase hosting:sites:get default --open
```

### Testing & Debugging
- **No automated test framework** - manual testing by loading `index.html` in browser
- Use **browser DevTools (F12)** for debugging
- Check browser console for errors and debug logs
- Use `window.game` global variable for runtime debugging
- Test on both desktop (mouse/keyboard) and mobile (touch/orientation) devices

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+ with HTML5 Canvas
- **Module System**: ES6 imports/exports
- **Mobile Support**: Device Orientation API and Touch Events
- **Hosting**: Firebase Hosting
- **Dependencies**: Firebase SDK v12.0.0

### File Structure
```
/
├── js/                     # Main source code
│   ├── core/              # Core game classes
│   │   ├── Game.js        # Main game loop and state management
│   │   └── Player.js      # Player entity and abilities
│   ├── elements/          # Elemental magic system
│   │   ├── Fire.js        # Fire mastery abilities
│   │   ├── Water.js       # Water mastery abilities  
│   │   └── Air.js         # Air mastery abilities
│   ├── entities/          # Game objects
│   │   ├── enemies/       # Enemy types and AI
│   │   ├── weapons/       # Projectiles and weapon systems
│   │   ├── effects/       # Particle effects and visual systems
│   │   └── pickups/       # XP and item collection
│   ├── systems/           # Game subsystems
│   │   ├── WaveManager.js # Enemy spawning and difficulty scaling
│   │   ├── UpgradeSystem.js # Level-up and progression
│   │   └── PlayerProfile.js # Save data and statistics
│   ├── utils/             # Utilities
│   │   ├── Constants.js   # Game configuration
│   │   └── MathUtils.js   # Mathematical helpers
│   └── main.js           # Entry point
├── public/               # Deployed files (mirror of root)
└── game.js              # Bundled game file (legacy)
```

### Core Architecture Patterns

#### Class-Based Entity System
- All game objects inherit from base classes with `update()` and `render()` methods
- Component-like systems for upgrades, waves, and effects
- Delta-time based physics for consistent frame rates across devices

#### Game State Management
```javascript
gameState: 'waiting' | 'playing' | 'gameOver' | 'shop'
```

#### Frame Rate Independence
- Uses delta-time calculations for all movement and timing
- Maintains consistent gameplay at 30fps, 60fps, 120fps, and 144fps+
- All timing multiplied by `deltaTime * 60` to preserve original game feel

### Key Systems

#### Elemental Mastery System
- 5 elements: Fire, Water, Earth, Air, Lightning
- 6 levels per element (10 with Mastery Ring)
- Level 3: Special abilities unlock
- Level 6: Ultimate abilities (requires Mastery Ring)
- Level progression affects: damage, health, armor, speed, range, attack speed

#### Player Profile & Shop System
- Persistent save data using localStorage
- Diamond currency earned from gameplay performance
- Shop upgrades: XP Vortex, Mastery Rings
- Comprehensive statistics tracking

#### Wave Management & Enemy Scaling
- Dynamic enemy spawning based on player level and time
- 4 enemy types: Basic, Veteran, Elite, Boss
- 3 boss variants: Basic Boss, Veteran Boss, Elite Boss
- Specific boss spawns at certain levels + random spawns

#### Visual Effects System
- Canvas-based particle systems
- Screen shake effects
- Modern UI rendered directly on canvas
- Status effects: Frozen, Stunned, Burning

## Important Implementation Notes

### Canvas UI System
- Health, XP, Timer, and Score rendered directly on game canvas
- Auto-sizing pill-shaped backgrounds with gradients
- Fallback roundRect implementation for older browsers

### Mobile Device Support
- Device orientation controls (tilt to move)
- Touch event handling for game start/restart
- Auto-aim system follows movement direction

### Performance Considerations
- Particle cleanup with `shouldRemove` flag system
- Efficient collision detection using circle-to-circle distance
- Memory management through array splicing for expired objects
- Frame time capping prevents lag when tab loses focus

### Save System
- PlayerProfile class manages localStorage persistence
- Statistics tracking for all gameplay metrics
- Shop purchases and mastery ring equipment persist between sessions

### Development Workflow
1. **Edit files in root directory** (`js/`, `index.html`, etc.) - never edit files in `public/`
2. **Test locally** by opening `index.html` or using local server
3. **Sync changes to `public/`** directory before deployment:
   - `cp index.html public/index.html`
   - `cp -r js public/js`
4. **Deploy** using `firebase deploy` to publish changes
5. **Verify** deployment at https://elemental-fury.web.app

### Critical File Synchronization
- **Root directory**: Source files for development
- **`public/` directory**: Mirror of root files for Firebase deployment
- **NEVER edit `public/` files directly** - they get overwritten during sync
- **Always sync before deploying** to avoid deploying stale code

### Common Development Tasks

#### Adding New Enemies
1. Create class in `js/entities/enemies/`
2. Import in `Game.js`
3. Add spawn logic in `spawnEnemy()` method
4. Update enemy configuration in `Constants.js`

#### Adding New Abilities
1. Create projectile/effect class in appropriate `js/elements/` file
2. Add ability flag to `Player.specialAbilities`
3. Update ability logic in `Player.update()` method
4. Add upgrade option in `UpgradeSystem.js`

#### Debugging Common Issues
- **Import/Export Errors**: Check browser console for ES6 module import failures
- **File Path Issues**: Verify file paths are correct (case-sensitive on Linux/Firebase)
- **Runtime Debugging**: Use `window.game` global variable for live debugging
- **Firebase Deployment Issues**: 
  - Ensure `public/` directory is synced before deploying
  - Check Firebase console for deployment logs
  - Verify firebase.json hosting configuration
- **Mobile Issues**: Test device orientation and touch events on actual devices
- **Performance Issues**: Check for excessive console logging in production builds

### Code Style Conventions
- PascalCase for classes (`Player`, `FireballProjectile`)
- camelCase for methods and variables (`updateThunderStorm`, `gameTime`)
- ES6 imports/exports throughout
- Method order: constructor, update, render, utility methods
- Use `this.game` references for cross-system communication

## Key Gotchas & Important Notes

### File Structure Synchronization
- **CRITICAL**: Root and `public/` directories must stay in sync
- Files in `public/` are what actually get deployed to Firebase
- Always copy changes from root → `public/` before deploying
- The `game.js` file appears to be legacy/unused (game uses modular JS files)

### Game Architecture Insights
- **Entry Point**: `js/main.js` initializes the game and creates global `window.game` reference
- **State Management**: Game uses string-based states: `'waiting'`, `'playing'`, `'gameOver'`, `'shop'`
- **Module System**: Uses ES6 imports/exports throughout - no bundler needed
- **Canvas Rendering**: All UI elements (health, XP, etc.) rendered directly on game canvas
- **Mobile Support**: Device Orientation API for tilt controls, touch events for interaction
- **Save System**: localStorage-based with PlayerProfile class managing persistence
- **Live Site**: Game deployed at https://elemental-fury.web.app

### Performance Considerations
- Delta-time based physics for consistent gameplay across framerates
- Particle cleanup using `shouldRemove` flag system
- Circle-to-circle collision detection for efficiency
- Frame time capping prevents lag when browser tab loses focus

This is a complete, self-contained game with no external build tools required - just browser and Firebase CLI for deployment.