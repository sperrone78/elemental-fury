// Main entry point for the modular Elemental Fury game
import { Game } from './core/Game.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Make game globally accessible for debugging (optional)
    window.game = game;
    
    // Testing: Add diamonds button handler
    const testDiamondsBtn = document.getElementById('testDiamondsBtn');
    if (testDiamondsBtn) {
        testDiamondsBtn.addEventListener('click', () => {
            console.log('Diamond button clicked!');
            console.log('Current available diamonds:', game.playerProfile.getAvailableDiamonds());
            console.log('Total earned before:', game.playerProfile.statistics.totalDiamondsEarned);
            
            // Add 100 diamonds to totalDiamondsEarned (the correct property)
            if (!game.playerProfile.statistics.totalDiamondsEarned) {
                game.playerProfile.statistics.totalDiamondsEarned = 0;
            }
            game.playerProfile.statistics.totalDiamondsEarned += 100;
            
            console.log('Total earned after:', game.playerProfile.statistics.totalDiamondsEarned);
            console.log('Available diamonds after:', game.playerProfile.getAvailableDiamonds());
            
            // Save and update display
            game.playerProfile.save();
            game.updateDiamondDisplay();
            
            console.log('Profile saved and display updated');
            
            // Visual feedback
            testDiamondsBtn.textContent = '💎 Added!';
            setTimeout(() => {
                testDiamondsBtn.textContent = '💎 +100 Test Diamonds';
            }, 1000);
        });
    }
});

// Export for potential external use
export { Game };