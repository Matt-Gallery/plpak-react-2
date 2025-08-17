// controller.js - ES6 Module Version

// --- Constants --- 
const gameRounds = ['tricks', 'hearts', 'queens', 'king', 'solitaire'];
const roundTitles = {
    tricks: "No Tricks!",
    hearts: "No Hearts!",
    queens: "No Queens!",
    king: "No King of Hearts!",
    solitaire: "Solitaire Round"
};
const players = ["player1", "player2", "player3", "player4"]; // Needed globally for now
const winnerStyle = { player1: "Player 1", player2: "Player 2", player3: "Player 3", player4: "Player 4" };

// --- Game Cycle Management ---
// Define 4 cycles with different starting players
const gameCycles = [
    { startingPlayer: "player2", cycleCompleted: false, scores: [0, 0, 0, 0] },
    { startingPlayer: "player3", cycleCompleted: false, scores: [0, 0, 0, 0] },
    { startingPlayer: "player4", cycleCompleted: false, scores: [0, 0, 0, 0] },
    { startingPlayer: "player1", cycleCompleted: false, scores: [0, 0, 0, 0] }
];
let currentCycleIndex = 0; // Track which cycle we're in

// --- Shared State & Interface for Active Game --- 
// Keep state in controller, pass refs/callbacks to modules
let playerHands = { player1: [], player2: [], player3: [], player4: [] };
let inPlay = [];
let totalScores = [0, 0, 0, 0]; 
let currentRoundScore = [0, 0, 0, 0]; // NEW: Score accumulated in the current round module
let roundOver = false; 
let gameStarted = false; 
let trickInProgress = false;

let activeGame = {
    name: null,
    init: () => { console.error("No game init function loaded!"); },
    startTrick: () => { console.error("No game startTrick function loaded!"); },
    // No longer need checkRoundOver here, controller reads internal module state via updateGameState
    updateStarter: (starter) => { activeGame.currentStarter = starter; },
    currentStarter: "player2" // Will be set based on current cycle
};

// --- Cached UI Elements --- 
let roundTitleEl, dealButton, nextButton, scoreboardEls, playAreas, handsEls, notificationsEl;

// --- Initialization Check --- 
(function checkLoadType() {
    console.log("Controller: checkLoadType running...");
    const urlParams = new URLSearchParams(window.location.search);
    const isAdvancing = urlParams.get('advancing') === 'true';
    const isGameComplete = urlParams.get('gameComplete') === 'true';
    const existingIndex = localStorage.getItem('plpakRoundIndex');
    const existingCycleIndex = localStorage.getItem('plpakCycleIndex') || '0';
    const storedGameComplete = localStorage.getItem('plpakGameComplete') === 'true';
    
    console.log(`Controller: isAdvancing=${isAdvancing}, isGameComplete=${isGameComplete}, existingIndex=${existingIndex}, existingCycleIndex=${existingCycleIndex}, storedGameComplete=${storedGameComplete}`);

    // Clean URL regardless of parameters for cleaner browser history
    if (isAdvancing || isGameComplete) {
        history.replaceState(null, '', window.location.pathname);
    }
    
    // Check if we're loading directly into game complete state
    if (isGameComplete || storedGameComplete) {
        console.log("Controller: Game complete state detected.");
        // No need to reset - we want to keep the scores for display
        // But we do need to ensure we stay in game over state
        if (currentCycleIndex < gameCycles.length) {
            currentCycleIndex = gameCycles.length;
            localStorage.setItem('plpakCycleIndex', currentCycleIndex.toString());
        }
        // Don't return early, continue initialization but in game over state
    }
    // Only reset if not in game complete state and not advancing
    else if (!isAdvancing && existingIndex !== null && existingIndex !== '0') {
        console.log("Controller: Resetting sequence due to refresh/non-zero index.");
        resetGameSequence(); 
    } else if (isAdvancing) {
         console.log("Controller: Programmatic advance detected. URL already cleaned.");
    } else {
        console.log("Controller: Very first load or index is already 0. No reset needed.");
        if (existingIndex === null) {
             localStorage.setItem('plpakRoundIndex', '0');
             localStorage.setItem('plpakCycleIndex', '0');
             // Initialize cycle scores in localStorage
             localStorage.setItem('plpakCycleScores', JSON.stringify([
                 [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]
             ]));
             console.log("Controller: Set initial round index to 0 and cycle index to 0.");
        }
    }
    
    // Set current cycle index based on localStorage
    currentCycleIndex = parseInt(localStorage.getItem('plpakCycleIndex') || '0');
    
    // Load cycle scores from localStorage if available
    const storedCycleScores = localStorage.getItem('plpakCycleScores');
    if (storedCycleScores) {
        try {
            const parsedCycleScores = JSON.parse(storedCycleScores);
            if (Array.isArray(parsedCycleScores) && parsedCycleScores.length === 4) {
                // Update each cycle's scores
                parsedCycleScores.forEach((scores, index) => {
                    if (Array.isArray(scores) && scores.length === 4) {
                        gameCycles[index].scores = scores;
                    } else {
                        console.warn(`Controller: Invalid cycle scores format for cycle ${index}:`, scores);
                        gameCycles[index].scores = [0, 0, 0, 0]; // Reset to default
                    }
                });
                console.log("Controller: Loaded cycle scores from localStorage:", parsedCycleScores);
            } else {
                console.warn("Controller: Invalid cycle scores array format:", parsedCycleScores);
                // Reset all cycle scores
                gameCycles.forEach(cycle => cycle.scores = [0, 0, 0, 0]);
                // Re-save the corrected format
                localStorage.setItem('plpakCycleScores', JSON.stringify(gameCycles.map(c => c.scores)));
            }
        } catch (e) {
            console.error("Controller: Error loading cycle scores", e);
            // Reset all cycle scores
            gameCycles.forEach(cycle => cycle.scores = [0, 0, 0, 0]);
            // Re-save the corrected format
            localStorage.setItem('plpakCycleScores', JSON.stringify(gameCycles.map(c => c.scores)));
        }
    } else {
        // No cycle scores in localStorage, initialize to zeros
        console.log("Controller: No cycle scores in localStorage, initializing to zeros");
        gameCycles.forEach(cycle => cycle.scores = [0, 0, 0, 0]);
        localStorage.setItem('plpakCycleScores', JSON.stringify(gameCycles.map(c => c.scores)));
    }
    
    // Set active game starter based on current cycle
    if (currentCycleIndex < gameCycles.length) {
        activeGame.currentStarter = gameCycles[currentCycleIndex].startingPlayer;
    }
    
    const finalIndex = localStorage.getItem('plpakRoundIndex') || '0';
    console.log(`Controller: checkLoadType finished. Final index in localStorage: ${finalIndex}, Current cycle: ${currentCycleIndex}`);
})(); 

// --- Core Controller Functions ---

function getCurrentRoundName() {
    // Check if game is complete first
    const isGameComplete = localStorage.getItem('plpakGameComplete') === 'true';
    const cycleIndex = parseInt(localStorage.getItem('plpakCycleIndex') || '0');
    const isLastCycle = cycleIndex >= gameCycles.length;
    
    if (isGameComplete || isLastCycle) {
        console.log("Controller: Game complete detected in getCurrentRoundName");
        return null; // null indicates game over state
    }
    
    const roundIndex = parseInt(localStorage.getItem('plpakRoundIndex') || '0');
    const roundName = gameRounds[roundIndex % gameRounds.length];
    console.log(`Controller: Current round name: ${roundName}, index: ${roundIndex}, cycle: ${cycleIndex}`);
    return roundName || null; 
}

function getCurrentRoundTitle() {
    const roundName = getCurrentRoundName();
    const cycleIndex = parseInt(localStorage.getItem('plpakCycleIndex') || '0');
    
    if (!roundName) return "Game Complete!";
    
    const safeIndex = cycleIndex < gameCycles.length ? cycleIndex : gameCycles.length - 1;
    const startingPlayer = gameCycles[safeIndex].startingPlayer;
    
    // Determine the dealer (previous player)
    let dealerNumber = parseInt(startingPlayer.replace('player', '')) - 1;
    if (dealerNumber === 0) dealerNumber = 4; // Wrap around from player1 to player4
    
    const dealerName = `Player ${dealerNumber}`;
    
    // Replace Player 1 with saved player name if it exists
    let displayName = dealerName;
    if (dealerNumber === 1) {
        const savedName = localStorage.getItem('plpakPlayerName');
        if (savedName) displayName = savedName;
    }
    
    return `${roundTitles[roundName]} - ${displayName} Dealing`;
}

function advanceToNextRound() {
    let currentIndex = parseInt(localStorage.getItem('plpakRoundIndex') || '-1');
    console.log(`Controller: Advancing from round index ${currentIndex}`);
    currentIndex++;

    // IMPORTANT: Update totalScores by adding the just-completed round's score
    totalScores = getTotalScores(); // Get latest total from storage
    
    // Add current round score to current cycle's scores
    for(let i=0; i<4; i++) {
        gameCycles[currentCycleIndex].scores[i] += currentRoundScore[i] || 0;
        totalScores[i] += currentRoundScore[i] || 0;
    }
    console.log(`Controller: Added round score ${currentRoundScore.join(',')} to cycle ${currentCycleIndex+1}. Updated cycle scores: ${gameCycles[currentCycleIndex].scores.join(',')}`);
    console.log(`Controller: New total scores: ${totalScores.join(',')}`);
    currentRoundScore = [0, 0, 0, 0]; // Reset for next round

    // Save the UPDATED total scores
    localStorage.setItem('plpakTotalScores', JSON.stringify(totalScores));
    // Save cycle scores
    localStorage.setItem('plpakCycleScores', JSON.stringify(gameCycles.map(c => c.scores)));
    
    // Check if we need to advance to the next cycle
    if (currentIndex % gameRounds.length === 0 && currentIndex > 0) {
        // Mark current cycle as completed
        gameCycles[currentCycleIndex].cycleCompleted = true;
        
        // Advance to next cycle
        currentCycleIndex++;
        localStorage.setItem('plpakCycleIndex', currentCycleIndex.toString());
        console.log(`Controller: Advanced to cycle ${currentCycleIndex}`);
        
        // Update starter based on new cycle
        if (currentCycleIndex < gameCycles.length) {
            activeGame.currentStarter = gameCycles[currentCycleIndex].startingPlayer;
            console.log(`Controller: New starting player: ${activeGame.currentStarter}`);
        }
    }
    
    localStorage.setItem('plpakRoundIndex', currentIndex.toString());
    console.log(`Controller: Set round index to ${currentIndex}.`);
    
    // Check if all cycles are completed
    if (currentCycleIndex >= gameCycles.length) {
        console.log("Controller: All cycles completed. Game is over!");
        
        // Save the game over state so it persists until explicitly reset
        localStorage.setItem('plpakGameComplete', 'true');
        
        // Reload to game over state
        window.location.href = window.location.pathname + '?gameComplete=true';
    } else {
        console.log(`Controller: Reloading for round ${currentIndex % gameRounds.length} in cycle ${currentCycleIndex}`);
        window.location.href = window.location.pathname + '?advancing=true';
    }
}

function resetGameSequence() {
    console.log("Controller: RESETTING sequence to index 0, cycle 0.");
    localStorage.setItem('plpakRoundIndex', '0');
    localStorage.setItem('plpakCycleIndex', '0');
    localStorage.setItem('plpakTotalScores', JSON.stringify([0, 0, 0, 0]));
    localStorage.removeItem('plpakGameComplete'); // Clear game complete flag
    totalScores = [0, 0, 0, 0];
    currentRoundScore = [0, 0, 0, 0]; // Reset current round score too
    currentCycleIndex = 0;
    
    // Reset cycle completion status and scores
    gameCycles.forEach(cycle => {
        cycle.cycleCompleted = false;
        cycle.scores = [0, 0, 0, 0];
    });
    localStorage.setItem('plpakCycleScores', JSON.stringify(gameCycles.map(c => c.scores)));
    
    // Set starter based on first cycle
    activeGame.currentStarter = gameCycles[currentCycleIndex].startingPlayer;
}

function getTotalScores() {
    const storedScores = localStorage.getItem('plpakTotalScores');
    let currentTotalScores = [0,0,0,0]; 
    if (storedScores) {
        try {
            let parsedScores = JSON.parse(storedScores);
            if (Array.isArray(parsedScores) && parsedScores.length === 4) {
                 currentTotalScores = parsedScores; 
            } 
        } catch (e) { /* Use default */ }
    }
    totalScores = currentTotalScores; 
    return [...totalScores]; 
}

// Make this available for modules to call
// Note: This function now primarily handles state updates from the module
window.updateGameState = function(newState) {
    let stateChanged = false;

    if (newState.hasOwnProperty('roundOver')) {
        if(roundOver !== newState.roundOver) stateChanged = true;
        roundOver = newState.roundOver;
    }
    if (newState.hasOwnProperty('gameStarted')) {
        if(gameStarted !== newState.gameStarted) stateChanged = true;
        gameStarted = newState.gameStarted;
    }
    if (newState.hasOwnProperty('trickInProgress')) {
        if(trickInProgress !== newState.trickInProgress) stateChanged = true;
        trickInProgress = newState.trickInProgress;
    }
    // NEW: Handle updates to the current round's score from the module
    if (newState.hasOwnProperty('currentRoundScore')) {
        if (JSON.stringify(currentRoundScore) !== JSON.stringify(newState.currentRoundScore)) {
             currentRoundScore = newState.currentRoundScore;
             // Need to update display immediately when round score changes
             displayScores();
             stateChanged = true; // Mark change to update buttons if needed (though display already updated)
        }
    }

    if (stateChanged) updateButtonStates();
    // If only score changed, button state might not need update, but display does (handled above)
}

// Note: updateTotalScores is now only used by modules when the ROUND ends
// We might rename/refactor this later, but keep for now for compatibility with tricks.js
window.updateTotalScores = function(roundScoreToAdd) {
     console.warn("Controller: window.updateTotalScores called directly. This should only happen at round end.", roundScoreToAdd);
     if (Array.isArray(roundScoreToAdd) && roundScoreToAdd.length === 4) {
        // This function assumes it's called AT THE END of a round
        // It's somewhat redundant now that advanceToNextRound handles adding the score
        // Let's keep it for now but log a warning
        // NO - Let's just have it update the internal currentRoundScore, advanceToNextRound will handle totals
        currentRoundScore = roundScoreToAdd;
        console.log("Controller: updateTotalScores updated internal currentRoundScore to:", currentRoundScore);
        displayScores(); // Update display with final round score
        // The actual addition to totalScores happens in advanceToNextRound
    } else {
        console.error("Invalid roundScoreToAdd format:", roundScoreToAdd);
    }
}

function displayScores() {
    try {
        if (!scoreboardEls) cacheDOMElements();
        
        // Get base total scores from storage (scores from previous rounds)
        const baseTotalScores = getTotalScores();
        
        // Calculate totals with current round
        const displayTotals = baseTotalScores.map((base, i) => base + (currentRoundScore[i] || 0));
        
        // Group by player (every 5 elements: 4 cycles + 1 total)
        const allScoreEls = document.querySelectorAll('.score');
        if (allScoreEls && allScoreEls.length > 0) {
            // Group by player (every 5 elements: 4 cycles + 1 total)
            for (let player = 0; player < 4; player++) {
                // Update each cycle score
                for (let cycle = 0; cycle < 4; cycle++) {
                    const scoreIndex = player * 5 + cycle; // 5 cells per player (4 cycles + total)
                    if (allScoreEls[scoreIndex]) {
                        // Get the cycle score
                        let cycleScore = gameCycles[cycle].scores[player];
                        
                        // For the current active cycle, add the current round's score
                        if (cycle === currentCycleIndex) {
                            cycleScore += currentRoundScore[player] || 0;
                        }
                        
                        // Show cycle score if it has any value
                        allScoreEls[scoreIndex].textContent = cycleScore !== 0 ? cycleScore : '';
                        
                        // Highlight current cycle
                        if (cycle === currentCycleIndex) {
                            allScoreEls[scoreIndex].classList.add('current-cycle');
                        } else {
                            allScoreEls[scoreIndex].classList.remove('current-cycle');
                        }
                    }
                }
                
                // Update total score (5th element for each player)
                const totalScoreIndex = player * 5 + 4;
                if (allScoreEls[totalScoreIndex]) {
                    allScoreEls[totalScoreIndex].textContent = displayTotals[player];
                }
            }
        } else {
            console.warn("Controller: Could not find score elements for granular display");
            
            // Fallback to old method
            if (scoreboardEls && scoreboardEls.length === 4) {
                scoreboardEls.forEach((el, i) => {
                    if (el) {
                        const displayValue = displayTotals[i];
                        el.textContent = `${displayValue}`;
                    }
                });
            } else {
                console.warn("Controller: No score elements found for display");
            }
        }
    } catch (err) {
        console.error("Error in displayScores:", err);
    }
}

function updateButtonStates() {
     if (!dealButton || !nextButton) cacheDOMElements(); 
     if (roundOver) {
         dealButton.disabled = false;
         nextButton.disabled = true;
         dealButton.textContent = "Next Hand";
     } else if (gameStarted) {
          dealButton.disabled = true;
          nextButton.disabled = false;
          dealButton.textContent = "Deal";
     } else { // Not started yet (gameStarted is false, roundOver is false)
          dealButton.disabled = false; // <<< Ensure Deal is ENABLED here
          nextButton.disabled = true;
          dealButton.textContent = "Deal";
     }
}

// Cache DOM elements 
function cacheDOMElements() {
    try {
        roundTitleEl = document.querySelector(".round");
        dealButton = document.querySelector(".deal");
        nextButton = document.querySelector(".next");
        scoreboardEls = document.querySelectorAll(".score.total");
        
        // Initialize UI containers as empty objects if elements aren't found
        playAreas = {};
        handsEls = {};
        
        // Try to find each play area and hand element
        const player1PlayArea = document.querySelector(".board .player1");
        const player2PlayArea = document.querySelector(".board .player2");
        const player3PlayArea = document.querySelector(".board .player3");
        const player4PlayArea = document.querySelector(".board .player4");
        
        if (player1PlayArea) playAreas.player1 = player1PlayArea;
        if (player2PlayArea) playAreas.player2 = player2PlayArea;
        if (player3PlayArea) playAreas.player3 = player3PlayArea;
        if (player4PlayArea) playAreas.player4 = player4PlayArea;
        
        const player1Hand = document.querySelector(".human");
        const player2Hand = document.querySelector(".hand-2");
        const player3Hand = document.querySelector(".tophand");
        const player4Hand = document.querySelector(".hand-4");
        
        if (player1Hand) handsEls.player1 = player1Hand;
        if (player2Hand) handsEls.player2 = player2Hand;
        if (player3Hand) handsEls.player3 = player3Hand;
        if (player4Hand) handsEls.player4 = player4Hand;
        
        notificationsEl = document.querySelector(".notifications");
    } catch (err) {
        console.error("Error in cacheDOMElements:", err);
    }
}

// --- Dynamic Script Loading & UI Setup --- 
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Controller: DOM Loaded.");
    
    // Wait for React to render the DOM elements
    const waitForElements = () => {
        const dealButton = document.querySelector(".deal");
        const nextButton = document.querySelector(".next");
        const roundTitle = document.querySelector(".round");
        
        if (dealButton && nextButton && roundTitle) {
            console.log("Controller: All required DOM elements found, proceeding with initialization");
            cacheDOMElements();
            initializeController();
        } else {
            console.log("Controller: Waiting for React to render DOM elements...");
            setTimeout(waitForElements, 100);
        }
    };
    
    const initializeController = async () => {
    
    // Add CSS to move the Total header right - using standard selectors
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* Target all header cells in the last column */
        th:last-child, .scores-header th:last-child {
            padding-left: 20px !important;
            text-indent: 20px !important;
        }
    `;
    document.head.appendChild(styleEl);
    
    // Direct DOM manipulation approach as backup - more reliable
    setTimeout(() => {
        // Look for any th containing exactly "Total"
        const allTableHeaders = document.querySelectorAll('th');
        let totalFound = false;
        
        allTableHeaders.forEach(th => {
            if (th.textContent.trim() === 'Total') {
                console.log("Found 'Total' header, applying direct style");
                totalFound = true;
                
                // Replace the text with a positioned span
                th.innerHTML = `<span style="position:relative; left:20px;">Total</span>`;
            }
        });
        
        if (!totalFound) {
            console.log("No 'Total' header found, trying last column headers");
            // Try last column headers as fallback
            const lastHeaders = document.querySelectorAll('tr th:last-child');
            lastHeaders.forEach(th => {
                console.log("Last column header:", th.textContent);
                // Shift the content right
                th.style.paddingLeft = '20px';
                th.style.textIndent = '20px';
            });
        }
    }, 500); // Short delay to ensure DOM is fully loaded
    
    // Set round title but first check if the element exists
    if (roundTitleEl) {
        roundTitleEl.textContent = getCurrentRoundTitle();
    } else {
        console.error("Controller: roundTitleEl not found!");
    }
    
    // Initial display: Show total scores from storage (currentRoundScore is 0 initially)
    displayScores(); 

    // Attach central listeners ONCE
    if (dealButton) dealButton.addEventListener('click', handleDealClick);
    if (nextButton) nextButton.addEventListener('click', handleNextTrickClick);
    
    // TEMPORARY: Add Skip Round button for testing
    addTemporarySkipButton();

    // Reset Name button is now handled by React components
    
    // Prompt for player name AFTER other UI elements are set up
    console.log("Controller: Prompting for player name...");
    promptForPlayerName();

    const currentRoundName = getCurrentRoundName();
    if (currentRoundName) {
        // Initial button state before script loads
        if (dealButton) dealButton.disabled = true; // Disable until script registers
        if (nextButton) nextButton.disabled = true;
        try {
            console.log(`Controller: Attempting to import module: ./${currentRoundName}.js`);
            const gameModule = await import(`./${currentRoundName}.js`);
            console.log(`Controller: Module for ${currentRoundName} loaded successfully.`);
            
            if (gameModule.register) {
                 // Pass shared state and necessary controller functions/refs
                 gameModule.register(activeGame, {  
                     playerHands, 
                     inPlay, 
                     uiElements: { playAreas, handsEls, notificationsEl, scoreboardEls },
                     // Make controller functions available to module
                     updateGameState: window.updateGameState, 
                     updateTotalScores: window.updateTotalScores,
                     showNotification: showNotification,
                     delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)) // Provide delay
                 });
                 console.log("Controller: Game module registered.");
                 if (dealButton) dealButton.disabled = false; // Enable deal now that script is ready
            } else {
                 console.error(`Controller: Module ${currentRoundName}.js loaded but has no register function.`);
            }
        } catch (err) {
             console.error(`Controller: Failed to load or register module for round ${currentRoundName}:`, err);
             if (roundTitleEl) roundTitleEl.textContent = "Error Loading Game!";
             if (dealButton) dealButton.disabled = true;
             if (nextButton) nextButton.disabled = true;
        }
    } else {
        // Game Over state
        console.log("Controller: Game sequence finished (loaded into game over state).");
        if (roundTitleEl) {
            roundTitleEl.textContent = "Game Complete!";
            roundTitleEl.style.color = "#ffcc00";
            roundTitleEl.style.fontWeight = "bold";
            roundTitleEl.style.fontSize = "32px";
        }
        
        if (dealButton) {
            dealButton.textContent = "New Game";
            dealButton.disabled = false;
            
            // Replace with a fresh button to avoid any stale event listeners
            dealButton.replaceWith(dealButton.cloneNode(true)); 
            const newDealButton = document.querySelector(".deal");
            if (newDealButton) {
                newDealButton.addEventListener('click', () => { 
                    console.log("Controller: New Game button clicked, resetting game");
                    
                    // Clear all game state
                    localStorage.setItem('plpakRoundIndex', '0');
                    localStorage.setItem('plpakCycleIndex', '0');
                    localStorage.setItem('plpakTotalScores', JSON.stringify([0, 0, 0, 0]));
                    localStorage.removeItem('plpakGameComplete'); // Clear game complete flag
                    
                    // Reset cycle scores
                    localStorage.setItem('plpakCycleScores', JSON.stringify([
                        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]
                    ]));
                    
                    // Also clear any other game state that might persist
                    localStorage.removeItem('plpakGameInProgress');
                    
                    // Force a clean browser reload with no parameters
                    window.location.href = window.location.pathname;
                    
                    // If that doesn't work, try a hard reload
                    setTimeout(() => {
                        console.log("Forcing hard reload...");
                        window.location.reload(true);
                    }, 100);
                });
            }
        }
        
        if (nextButton) nextButton.disabled = true;
        
        displayScores();
         
        // Show Game Complete notification with winner
        displayGameCompleteWithWinner();
    }
    };
    
    // Start waiting for React to render the DOM elements
    waitForElements();
});

// Function to display Game Complete notification with winner information
function displayGameCompleteWithWinner() {
    try {
        // Get the base scores from localStorage (scores from previous rounds)
        const baseScores = getTotalScores();
        
        // Calculate final scores by adding current round scores
        const finalScores = baseScores.map((score, idx) => score + (currentRoundScore[idx] || 0));
        
        console.log("Base scores:", baseScores);
        console.log("Current round scores:", currentRoundScore);
        console.log("Combined final scores:", finalScores);
        
        if (!finalScores || !Array.isArray(finalScores) || finalScores.length !== 4) {
            console.error("Controller: Invalid final scores:", finalScores);
            showNotification("Game Complete!", 0);
            return;
        }
        
        // Find the lowest score (winner)
        const lowestScore = Math.min(...finalScores);
        
        // Find all players with the lowest score (in case of a tie)
        const winnerIndices = finalScores.map((score, index) => score === lowestScore ? index : -1).filter(index => index !== -1);
        
        // Create winner announcement message
        let winnerMessage = "Game Complete! ";
        
        if (winnerIndices.length === 1) {
            // Single winner
            const winnerIndex = winnerIndices[0];
            const winnerName = winnerIndex === 0 ? (winnerStyle.player1 || "Player 1") : `Player ${winnerIndex + 1}`;
            winnerMessage += `${winnerName} wins with ${lowestScore} points!`;
        } else {
            // Tie between multiple players
            const winnerNames = winnerIndices.map(index => 
                index === 0 ? (winnerStyle.player1 || "Player 1") : `Player ${index + 1}`
            );
            
            if (winnerNames.length === 2) {
                winnerMessage += `Tie between ${winnerNames[0]} and ${winnerNames[1]} with ${lowestScore} points!`;
            } else {
                // Format list with proper comma separation and "and" for the last item
                const lastWinner = winnerNames.pop();
                winnerMessage += `Tie between ${winnerNames.join(', ')} and ${lastWinner} with ${lowestScore} points!`;
            }
        }
        
        // Display the notification for a longer duration (8 seconds)
        showNotification(winnerMessage, 8000);
        
        // Also update the round title with game complete
        if (roundTitleEl) {
            roundTitleEl.textContent = "Game Complete!";
            roundTitleEl.style.color = "#ffcc00";
            roundTitleEl.style.fontWeight = "bold";
            roundTitleEl.style.fontSize = "32px";
        }
        
        console.log("Controller: Game complete notification displayed:", winnerMessage);
    } catch (err) {
        console.error("Error in displayGameCompleteWithWinner:", err);
        // Fallback to a basic message
        showNotification("Game Complete!", 0);
    }
}

// TEMPORARY: Function to add a skip button for testing
function addTemporarySkipButton() {
    // Create the button
    const skipButton = document.createElement('button');
    skipButton.textContent = '⏭️ SKIP (testing only)';
    skipButton.style.backgroundColor = '#ff5722';
    skipButton.style.color = 'white';
    skipButton.style.border = '2px solid black';
    skipButton.style.borderRadius = '4px';
    skipButton.style.padding = '5px 10px';
    skipButton.style.cursor = 'pointer';
    skipButton.style.margin = '0 10px 0 0'; // Add right margin, no top/bottom margin
    skipButton.style.fontWeight = 'bold';
    skipButton.style.fontSize = '14px';
    skipButton.style.display = 'inline-block'; // Changed to inline-block
    
    // Add tooltip explaining what it does
    skipButton.title = 'Skip current round (for testing only)';
    
    // Add event listener
    skipButton.addEventListener('click', () => {
        console.log("TESTING: Skip button clicked - advancing to next round");
        
        // For standard rounds (tricks, hearts, queens, king)
        // we force their completion by setting scores and marking as over
        if (activeGame && activeGame.name) {
            const roundName = activeGame.name;
            
            if (roundName === 'solitaire' && typeof window.endSolitaireRound === 'function') {
                // Special handling for solitaire
                window.endSolitaireRound();
            } else {
                // For standard rounds, simulate the round ending by:
                // 1. Setting round scores
                // 2. Marking the round as over
                // 3. Calling the round advancement
                
                // Set dummy scores (everyone gets -1 for a quick test)
                currentRoundScore = [-1, -1, -1, -1];
                
                // Update state
                roundOver = true;
                gameStarted = true;
                trickInProgress = false;
                
                // Update button states 
                updateButtonStates();
                
                // Show notification
                if (notificationsEl) {
                    notificationsEl.innerHTML = `<div class="notification">Testing: Round skipped. Click Next Hand.</div>`;
                }
                
                // Since we've set roundOver = true, the next Deal button click
                // will trigger advanceToNextRound(), so we don't advance immediately
                
                // Force the deal button to show "Next Hand"
                if (dealButton) {
                    dealButton.textContent = "Next Hand";
                }
                
                // Display the scores we've set
                displayScores();
            }
        } else {
            // If no active game, just advance
            advanceToNextRound();
        }
    });
    
    // Find the Deal button and insert the skip button before it
    const dealBtn = document.querySelector('.deal');
    if (dealBtn && dealBtn.parentNode) {
        dealBtn.parentNode.insertBefore(skipButton, dealBtn);
        console.log("Controller: Added temporary skip button to the left of Deal button");
    } else {
        // Fallback to adding to body if we can't find the Deal button
        document.body.appendChild(skipButton);
        console.log("Controller: Added temporary skip button to document body (fallback)");
    }
}

// TEMPORARY: Function to add a name reset button
function addNameResetButton() {
    // Check if user is logged in - if so, don't show the reset button
    const loggedInUser = localStorage.getItem('plpakUser');
    if (loggedInUser) {
        console.log("Controller: User is logged in, skipping reset name button");
        return;
    }
    
    // Remove any existing reset button first
    const existingButton = document.querySelector('button[title="Change your player name"]');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create the button
    const resetButton = document.createElement('button');
    resetButton.textContent = '👤 Reset Name';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '20px';
    resetButton.style.right = '20px';
    resetButton.style.zIndex = '9999';
    resetButton.style.backgroundColor = '#3498db';
    resetButton.style.color = 'white';
    resetButton.style.border = '2px solid black';
    resetButton.style.borderRadius = '4px';
    resetButton.style.padding = '5px 10px';
    resetButton.style.cursor = 'pointer';
    
    // Add tooltip explaining what it does
    resetButton.title = 'Change your player name';
    
    // Add event listener
    resetButton.addEventListener('click', () => {
        console.log("Resetting player name...");
        localStorage.removeItem('plpakPlayerName');
        promptForPlayerName();
    });
    
    // Add to document
    document.body.appendChild(resetButton);
    
    console.log("Controller: Added name reset button");
}

// Make the function globally available for React to call
window.addNameResetButton = addNameResetButton;

// --- Button Handlers (Delegate to activeGame) ---
function handleDealClick() {
    if (roundOver) { 
        // --- Action 1: Advance to next round --- 
        advanceToNextRound();

    } else if (!gameStarted && typeof activeGame.init === 'function') { 
        // --- Action 2: Initialize current round (Deal cards) --- 
        activeGame.init(); // This deals cards and should call updateGameState
        
        // --- NEW: Auto-start first trick for Hearts, Queens, King --- 
        // After init() runs, gameStarted should be true and trickInProgress false.
        // If so, immediately trigger the first trick, unless it's the Tricks round 
        // (Tricks round auto-starts its first trick within its own init function).
        if (gameStarted && !trickInProgress && activeGame.name !== 'tricks') {
             // Simulate clicking the "Next Trick" button
             handleNextTrickClick(); 
        }
        // For Tricks round, its init function already called controllerUpdateState 
        // with trickInProgress=true, so this block won't run, which is correct.

    } else if (gameStarted) {
         // Deal clicked mid-round
         showNotification("Round is already in progress."); 
    } else {
         // Unexpected state
         console.error(`Controller: Deal clicked, but activeGame.init is not ready or other unexpected state!`);
    }
}

function handleNextTrickClick() {
    // Prevent clicks if round is over, game not started, OR a trick is already running
    if (roundOver || !gameStarted || trickInProgress) {
         return;
    }
    if (typeof activeGame.startTrick === 'function') {
        trickInProgress = true;
        updateButtonStates();
        activeGame.startTrick(activeGame.currentStarter);
    } else {
         console.error(`Controller: Next Trick clicked, but activeGame.startTrick is not ready!`);
    }
}

// --- Initial Log --- 
console.log(`Controller initialized. Current round from storage: ${getCurrentRoundName()}, Cycle: ${currentCycleIndex}`); 

// --- Function Called by Loaded Game Script --- 
function registerRound(gameName, functions) {
    console.log(`Controller: Registering functions for round: ${gameName}.`);
    // Log the type and name (if possible) of the received init function
    console.log(`Controller: Received functions.init is type: ${typeof functions.init}, name: ${functions.init ? functions.init.name : 'N/A'}`);
    
    if (gameName === getCurrentRoundName()) {
        activeGame.name = gameName;
        activeGame.init = functions.init; // Assign the init function
        activeGame.startTrick = functions.startTrick;
        // Set starting player based on current cycle
        activeGame.currentStarter = gameCycles[currentCycleIndex].startingPlayer;
        activeGame.updateStarter = functions.updateStarter || activeGame.updateStarter; 
        
        console.log(`Controller: activeGame object updated for '${gameName}': init function name: ${activeGame.init ? activeGame.init.name : 'N/A'}, starter: ${activeGame.currentStarter}`);
        
        // Reset controller flags for the new round
        gameStarted = false;
        roundOver = false;
        trickInProgress = false;
        currentRoundScore = [0, 0, 0, 0]; // Reset current round score on registration
        console.log(`Controller: Reset internal flags -> gameStarted=${gameStarted}, roundOver=${roundOver}, trickInProgress=${trickInProgress}, currentRoundScore=${currentRoundScore.join(',')}`);
        
        displayScores(); // Ensure display reflects reset score
        updateButtonStates(); // Update buttons (should enable Deal)
    } else {
        console.warn(`Controller: Script for ${gameName} loaded, but current round is ${getCurrentRoundName()}. Ignoring registration.`);
    }
}

function showNotification(msg, dur) {
    try {
        if (!notificationsEl) {
            console.warn("Controller: notificationsEl not found, attempting to locate it");
            notificationsEl = document.querySelector(".notifications");
        }
        
        // Replace "Human" with the user's saved name
        const playerName = localStorage.getItem('plpakPlayerName') || "Human";
        const updatedMsg = msg.replace(/Human/g, playerName);
        
        if (notificationsEl) {
            // Use solitaire-style notifications for all rounds
            notificationsEl.innerHTML = `<div class="solitaire-notification">${updatedMsg}</div>`;
            
            // Default duration is 3000ms if not specified
            const duration = dur || 3000;
            
            // Ensure consistent styling across all rounds
            const style = document.createElement('style');
            style.textContent = `
                .solitaire-notification {
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    font-size: 191.25%;
                    font-weight: bold;
                    padding: 10px 20px;
                    border: 2px solid #ffcc00;
                    border-radius: 10px;
                    width: auto;
                    max-width: 80%;
                    display: inline-block;
                    white-space: normal;
                    word-wrap: break-word;
                    text-align: center;
                    box-sizing: border-box;
                    box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
                }
                
                .notifications {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
            `;
            
            // Only add the style tag once
            if (!document.querySelector('style[data-notification-style]')) {
                style.setAttribute('data-notification-style', 'true');
                document.head.appendChild(style);
            }
            
            // For Game Complete messages, keep them visible indefinitely (don't auto-hide)
            if (msg.startsWith("Game Complete!")) {
                console.log("Controller: Keeping Game Complete notification visible indefinitely");
                return; // Don't set timeout to clear
            }
            
            // Clear after duration (but don't clear game complete messages)
            if (duration > 0) {
                setTimeout(() => {
                    if (notificationsEl && notificationsEl.innerHTML.includes(msg)) {
                        notificationsEl.innerHTML = '';
                    }
                }, duration);
            }
        } else {
            // Just log the message if no UI element is available
            console.log(`Notification (text only): ${msg}`);
        }
    } catch (err) {
        console.error("Error in showNotification:", err);
        // Fallback - just log the message
        console.log(`Notification (fallback): ${msg}`);
    }
}

// Function to prompt for player name
function promptForPlayerName() {
    // Check if name is already stored
    const storedName = localStorage.getItem('plpakPlayerName');
    console.log("Checking for stored player name:", storedName);
    
    if (!storedName) {
        console.log("No stored name found, showing dialog");
        // Create a modal dialog for name input
        createNameInputDialog();
    } else {
        console.log("Using stored name:", storedName);
        // Use stored name
        updatePlayerNameInUI(storedName);
        // Also update winnerStyle
        winnerStyle.player1 = storedName;
    }
}

// Make the function globally available for React to call
window.promptForPlayerName = promptForPlayerName;

// Function to create a name input dialog in the UI
function createNameInputDialog() {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'name-input-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'name-dialog';
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '8px';
    dialog.style.padding = '20px';
    dialog.style.width = '300px';
    dialog.style.maxWidth = '80%';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    dialog.style.textAlign = 'center';
    
    // Create dialog content
    const title = document.createElement('h2');
    title.textContent = 'Welcome to Card Game!';
    title.style.color = 'black';
    title.style.marginBottom = '15px';
    
    const label = document.createElement('p');
    label.textContent = 'Please enter your name:';
    label.style.color = 'black';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Human';
    input.value = '';
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.margin = '10px 0';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.boxSizing = 'border-box';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '15px';
    
    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.style.padding = '8px 16px';
    playButton.style.backgroundColor = 'green';
    playButton.style.color = 'white';
    playButton.style.border = 'none';
    playButton.style.borderRadius = '4px';
    playButton.style.cursor = 'pointer';
    
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Continue as Human';
    skipButton.style.padding = '8px 16px';
    skipButton.style.backgroundColor = '#ccc';
    skipButton.style.color = 'black';
    skipButton.style.border = 'none';
    skipButton.style.borderRadius = '4px';
    skipButton.style.cursor = 'pointer';
    
    // Add event listeners
    playButton.addEventListener('click', () => {
        const name = input.value.trim() || 'Human';
        savePlayerName(name);
        document.body.removeChild(modal);
    });
    
    skipButton.addEventListener('click', () => {
        savePlayerName('Human');
        document.body.removeChild(modal);
    });
    
    // Focus the input when the dialog appears
    setTimeout(() => input.focus(), 100);
    
    // Add enter key functionality
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playButton.click();
        }
    });
    
    // Assemble the dialog
    dialog.appendChild(title);
    dialog.appendChild(label);
    dialog.appendChild(input);
    buttonContainer.appendChild(skipButton);
    buttonContainer.appendChild(playButton);
    dialog.appendChild(buttonContainer);
    modal.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(modal);
}

// Function to save player name and update UI
function savePlayerName(name) {
    localStorage.setItem('plpakPlayerName', name);
    console.log("Saving player name:", name);
    
    // Update winnerStyle to use player name
    winnerStyle.player1 = name;
    
    // Force immediate UI update
    updatePlayerNameInUI(name);
}

// Function to update player name in UI
function updatePlayerNameInUI(name) {
    console.log("Updating UI with player name:", name);
    
    // Specifically target the first player's name element in the scoreboard
    const scoreRows = document.querySelectorAll('.score-row');
    if (scoreRows && scoreRows.length > 0) {
        const firstRowNameEl = scoreRows[0].querySelector('.score-name');
        if (firstRowNameEl) {
            console.log(`Changing first player name from "${firstRowNameEl.textContent}" to "${name}"`);
            firstRowNameEl.textContent = name;
        }
    }
}

// Function to toggle tooltip visibility
window.toggleTooltip = function(event) {
    event.stopPropagation(); // Prevent the event from bubbling up
    const tooltipTextEl = document.querySelector('.tooltiptext');
    if (tooltipTextEl) {
        // Special handling for mobile view
        if (window.innerWidth <= 768) {
            if (tooltipTextEl.style.visibility === 'visible') {
                tooltipTextEl.style.visibility = 'hidden';
                tooltipTextEl.style.opacity = '0';
            } else {
                tooltipTextEl.style.visibility = 'visible';
                tooltipTextEl.style.opacity = '1';
            }
        } else {
            // Desktop behavior
            tooltipTextEl.classList.toggle('visible');
        }
    }
};

// Function to update the tooltip text when hovering on the info-icon
function updateTooltipText() {
    // Remove console log statements
    const tooltipTextEl = document.querySelector('.tooltiptext');
    if (!tooltipTextEl) {
        return;
    }

    const generalRules = `
        <b>General Game Rules:</b>
        <li>The player to the left of the dealer starts</li>
        <li>The suit of the first card played in each round is the lead suit</li>
        <li>If you have a card of the lead suit you must play it</li>
        <li>The player with the highest card played of the lead suit takes each trick</li>
        <li>The player who takes the trick starts the next round</li>
        <li>The lowest score at the end of the game wins</li>
    `;

    const roundSpecificRules = {
        'Tricks': '<b>Tricks Round Scoring: Each trick is 1 point</b>',
        'Hearts': '<b>Hearts Round Scoring: Each heart is 1 point</b>',
        'Queens': '<b>Queens Round Scoring: Each queen is 2 points</b>',
        'King': '<b>King of Hearts Round Scoring: The king of hearts is 8 points</b><br><b>King of Hearts Round Special Rule: No heart can be played during the 1st trick</b>'
    };

    const currentRoundName = getCurrentRoundName();
    const specificRules = roundSpecificRules[currentRoundName] || '';

    tooltipTextEl.innerHTML = `${generalRules}${specificRules}`;
}

// Create responsive mobile scoreboard
function createMobileScoreboard() {
    const scoreboard = document.querySelector('.scoreboard');
    if (!scoreboard) return;
    
    // Clear any existing mobile elements
    const existingMobile = scoreboard.querySelectorAll('.mobile-player');
    existingMobile.forEach(el => el.remove());
    
    // Get player names and totals
    const playerNames = [];
    const playerScores = [];
    
    // Get saved player name for player 1
    const savedName = localStorage.getItem('plpakPlayerName') || "Human";
    playerNames.push(savedName);
    playerNames.push("Player 2");
    playerNames.push("Player 3");
    playerNames.push("Player 4");
    
    // Get total scores
    const baseTotalScores = getTotalScores();
    const displayTotals = baseTotalScores.map((base, i) => base + (currentRoundScore[i] || 0));
    
    // Create mobile player elements
    playerNames.forEach((name, index) => {
        const mobilePlayer = document.createElement('div');
        mobilePlayer.className = 'mobile-player';
        
        const playerName = document.createElement('div');
        playerName.className = 'mobile-player-name';
        playerName.textContent = name;
        
        const playerScore = document.createElement('div');
        playerScore.className = 'mobile-player-score';
        playerScore.textContent = displayTotals[index];
        
        mobilePlayer.appendChild(playerName);
        mobilePlayer.appendChild(playerScore);
        scoreboard.appendChild(mobilePlayer);
    });
}

// Call this function after scores are updated
const originalDisplayScores = displayScores;
displayScores = function() {
    originalDisplayScores.apply(this, arguments);
    
    // Check if we're in mobile view
    if (window.innerWidth <= 768) {
        createMobileScoreboard();
    }
};

// Also call on resize
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        createMobileScoreboard();
    }
}); 