// Main entry point for the modular Elemental Fury game
import { Game } from './core/Game.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Make game globally accessible for debugging (optional)
    window.game = game;
});

// Export for potential external use
export { Game };