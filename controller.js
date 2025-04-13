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
    currentStarter: "player2"
};

// --- Cached UI Elements --- 
let roundTitleEl, dealButton, nextButton, scoreboardEls, playAreas, handsEls, notificationsEl;

// --- Initialization Check --- 
(function checkLoadType() {
    console.log("Controller: checkLoadType running...");
    const urlParams = new URLSearchParams(window.location.search);
    const isAdvancing = urlParams.get('advancing') === 'true';
    const existingIndex = localStorage.getItem('plpakRoundIndex');
    console.log(`Controller: isAdvancing=${isAdvancing}, existingIndex=${existingIndex}`);

    if (!isAdvancing && existingIndex !== null && existingIndex !== '0') {
        console.log("Controller: Resetting sequence due to refresh/non-zero index.");
        resetGameSequence(); 
    } else if (isAdvancing) {
         console.log("Controller: Programmatic advance detected. Cleaning URL.");
         history.replaceState(null, '', window.location.pathname); 
    } else {
        console.log("Controller: Very first load or index is already 0. No reset needed.");
        if (existingIndex === null) {
             localStorage.setItem('plpakRoundIndex', '0');
             console.log("Controller: Set initial round index to 0.");
        }
    }
    const finalIndex = localStorage.getItem('plpakRoundIndex') || '0';
    console.log(`Controller: checkLoadType finished. Final index in localStorage: ${finalIndex}`);
})(); 

// --- Core Controller Functions ---

function getCurrentRoundName() {
    const roundIndex = parseInt(localStorage.getItem('plpakRoundIndex') || '0');
    return gameRounds[roundIndex] || null; 
}

function getCurrentRoundTitle() {
    const roundName = getCurrentRoundName();
    return roundName ? roundTitles[roundName] : "Game Over";
}

function advanceToNextRound() {
    let currentIndex = parseInt(localStorage.getItem('plpakRoundIndex') || '-1');
    console.log(`Controller: Advancing from round index ${currentIndex}`);
    currentIndex++;

    // IMPORTANT: Update totalScores by adding the just-completed round's score
    totalScores = getTotalScores(); // Get latest total from storage
    for(let i=0; i<4; i++) {
        totalScores[i] += currentRoundScore[i] || 0;
    }
    console.log(`Controller: Added round score ${currentRoundScore.join(',')}. New total: ${totalScores.join(',')}`);
    currentRoundScore = [0, 0, 0, 0]; // Reset for next round

    // Save the UPDATED total scores
    localStorage.setItem('plpakTotalScores', JSON.stringify(totalScores));
    localStorage.setItem('plpakRoundIndex', currentIndex.toString());
    console.log(`Controller: Set round index to ${currentIndex}.`);
    if (currentIndex >= gameRounds.length) {
        console.log("Controller: All rounds completed. Reloading for Game Over state.");
    } else {
        console.log(`Controller: Reloading for round ${gameRounds[currentIndex]}`);
    }
    window.location.href = window.location.pathname + '?advancing=true'; 
}

function resetGameSequence() {
    console.log("Controller: RESETTING sequence to index 0.");
    localStorage.setItem('plpakRoundIndex', '0');
    localStorage.setItem('plpakTotalScores', JSON.stringify([0, 0, 0, 0]));
    totalScores = [0, 0, 0, 0];
    currentRoundScore = [0, 0, 0, 0]; // Reset current round score too
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
    console.log("Controller: updateGameState received:", newState);

    if (newState.hasOwnProperty('roundOver')) {
        if(roundOver !== newState.roundOver) stateChanged = true;
        roundOver = newState.roundOver;
        console.log(`Controller: roundOver state updated to ${roundOver}`);
    }
    if (newState.hasOwnProperty('gameStarted')) {
        if(gameStarted !== newState.gameStarted) stateChanged = true;
        gameStarted = newState.gameStarted;
        console.log(`Controller: gameStarted state updated to ${gameStarted}`);
    }
    if (newState.hasOwnProperty('trickInProgress')) {
        if(trickInProgress !== newState.trickInProgress) stateChanged = true;
        trickInProgress = newState.trickInProgress;
        console.log(`Controller: trickInProgress state updated to ${trickInProgress}`);
    }
    // NEW: Handle updates to the current round's score from the module
    if (newState.hasOwnProperty('currentRoundScore')) {
        if (JSON.stringify(currentRoundScore) !== JSON.stringify(newState.currentRoundScore)) {
             currentRoundScore = newState.currentRoundScore;
             console.log(`Controller: currentRoundScore updated to ${currentRoundScore.join(',')}`);
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
    if (!scoreboardEls) cacheDOMElements();
    // Get base total scores from storage (scores from previous rounds)
    const baseTotalScores = getTotalScores();
    if (scoreboardEls.length === 4) {
        console.log(`Controller: Displaying scores. Base Total: ${baseTotalScores.join(',')}, Current Round: ${currentRoundScore.join(',')}`);
        scoreboardEls.forEach((el, i) => {
            // Display is sum of previous totals + current round's accumulation
            const displayValue = (baseTotalScores[i] || 0) + (currentRoundScore[i] || 0);
            el.textContent = `${displayValue}`;
        });
    }
}

function updateButtonStates() {
     if (!dealButton || !nextButton) cacheDOMElements(); 
     console.log(`Controller: Updating buttons based on state -> gameStarted=${gameStarted}, roundOver=${roundOver}`);
     if (roundOver) {
         console.log("Controller: Setting Deal=ENABLED, Next=DISABLED (Round Over)");
         dealButton.disabled = false;
         nextButton.disabled = true;
     } else if (gameStarted) {
          console.log("Controller: Setting Deal=DISABLED, Next=ENABLED (Game Started)");
          dealButton.disabled = true;
          nextButton.disabled = false;
     } else { // Not started yet (gameStarted is false, roundOver is false)
          console.log("Controller: Setting Deal=ENABLED, Next=DISABLED (Initial/Ready State)"); 
          dealButton.disabled = false; // <<< Ensure Deal is ENABLED here
          nextButton.disabled = true;
     }
}

// Cache DOM elements 
function cacheDOMElements() {
     roundTitleEl = document.querySelector(".round");
     dealButton = document.querySelector(".deal");
     nextButton = document.querySelector(".next");
     scoreboardEls = document.querySelectorAll(".score");
     playAreas = {
        player1: document.querySelector(".board .player1"),
        player2: document.querySelector(".board .player2"),
        player3: document.querySelector(".board .player3"),
        player4: document.querySelector(".board .player4"),
     };
     handsEls = {
        player1: document.querySelector(".human"),
        player2: document.querySelector(".hand-2"),
        player3: document.querySelector(".tophand"),
        player4: document.querySelector(".hand-4"),
     };
     notificationsEl = document.querySelector(".notifications");
     if(!roundTitleEl || !dealButton || !nextButton) {
         console.error("Failed to cache essential UI elements!");
     }
}

// --- Dynamic Script Loading & UI Setup --- 
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Controller: DOM Loaded.");
    cacheDOMElements(); 
    
    roundTitleEl.textContent = getCurrentRoundTitle();
    // Initial display: Show total scores from storage (currentRoundScore is 0 initially)
    displayScores(); 

    // Attach central listeners ONCE
    dealButton.addEventListener('click', handleDealClick); 
    nextButton.addEventListener('click', handleNextTrickClick); 

    const currentRoundName = getCurrentRoundName();
    if (currentRoundName) {
        // Initial button state before script loads
        dealButton.disabled = true; // Disable until script registers
        nextButton.disabled = true;
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
                     showNotification: (msg, dur) => { /* Controller could handle this */ notificationsEl.innerHTML = `<div class="notification">${msg}</div>`; setTimeout(()=>{ if (notificationsEl.firstChild && notificationsEl.firstChild.textContent === msg) notificationsEl.innerHTML = ""; }, dur || 3000); },
                     delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)) // Provide delay
                 });
                 console.log("Controller: Game module registered.");
                 dealButton.disabled = false; // Enable deal now that script is ready
            } else {
                 console.error(`Controller: Module ${currentRoundName}.js loaded but has no register function.`);
            }
        } catch (err) {
             console.error(`Controller: Failed to load or register module for round ${currentRoundName}:`, err);
             roundTitleEl.textContent = "Error Loading Game!";
             dealButton.disabled = true;
             nextButton.disabled = true;
        }
    } else {
        // Game Over state
        console.log("Controller: Game sequence finished (loaded into game over state).");
         roundTitleEl.textContent = "Game Over!";
         dealButton.textContent = "Play Again?";
         dealButton.disabled = false;
         nextButton.disabled = true;
         dealButton.replaceWith(dealButton.cloneNode(true)); 
         document.querySelector(".deal").addEventListener('click', () => { 
             resetGameSequence();
             window.location.href = window.location.pathname;
         });
         displayScores();
    }
});

// --- Button Handlers (Delegate to activeGame) ---
function handleDealClick() {
    console.log("Controller: Deal Clicked.");
    console.log(`Controller: Checking state -> gameStarted=${gameStarted}, roundOver=${roundOver}`);

    if (roundOver) { 
        // --- Action 1: Advance to next round --- 
        console.log("Controller: Round is marked over, advancing...");
        advanceToNextRound();

    } else if (!gameStarted && typeof activeGame.init === 'function') { 
        // --- Action 2: Initialize current round (Deal cards) --- 
        console.log("Controller: Round not started, calling activeGame.init()...");
        activeGame.init(); // This deals cards and should call updateGameState
        
        // --- NEW: Auto-start first trick for Hearts, Queens, King --- 
        // After init() runs, gameStarted should be true and trickInProgress false.
        // If so, immediately trigger the first trick, unless it's the Tricks round 
        // (Tricks round auto-starts its first trick within its own init function).
        if (gameStarted && !trickInProgress && activeGame.name !== 'tricks') {
             console.log(`Controller: Auto-starting first trick for round: ${activeGame.name}`);
             // Simulate clicking the "Next Trick" button
             handleNextTrickClick(); 
        }
        // For Tricks round, its init function already called controllerUpdateState 
        // with trickInProgress=true, so this block won't run, which is correct.

    } else if (gameStarted) {
         // Deal clicked mid-round
         console.log("Controller: Deal clicked but round already in progress.");
         controllerShowNotification("Round is already in progress."); 
    } else {
         // Unexpected state
         console.error(`Controller: Deal clicked, but activeGame.init is not ready or other unexpected state!`);
    }
}

function handleNextTrickClick() {
    console.log("Controller: Next Trick Clicked.");
     // Use controller's internal flags now
    // Prevent clicks if round is over, game not started, OR a trick is already running
    if (roundOver || !gameStarted || trickInProgress) {
         console.log(`Controller: Ignoring Next Trick click (roundOver=${roundOver}, gameStarted=${gameStarted}, trickInProgress=${trickInProgress}).`);
         return;
    }
    if (typeof activeGame.startTrick === 'function') {
        console.log("Controller: Setting trickInProgress = true and calling activeGame.startTrick...");
        trickInProgress = true;
        updateButtonStates();
        activeGame.startTrick(activeGame.currentStarter);
    } else {
         console.error(`Controller: Next Trick clicked, but activeGame.startTrick is not ready!`);
    }
}

// --- Initial Log --- 
console.log(`Controller initialized. Current round from storage: ${getCurrentRoundName()}`); 

// --- Function Called by Loaded Game Script --- 
function registerRound(gameName, functions) {
    console.log(`Controller: Registering functions for round: ${gameName}.`);
    // Log the type and name (if possible) of the received init function
    console.log(`Controller: Received functions.init is type: ${typeof functions.init}, name: ${functions.init ? functions.init.name : 'N/A'}`);
    
    if (gameName === getCurrentRoundName()) {
        activeGame.name = gameName;
        activeGame.init = functions.init; // Assign the init function
        activeGame.startTrick = functions.startTrick;
        // activeGame.isRoundOver = functions.isRoundOver; // Removed this pattern
        activeGame.updateStarter = functions.updateStarter || activeGame.updateStarter; 
        activeGame.currentStarter = functions.currentStarter || activeGame.currentStarter;
        
        // Log the activeGame object AFTER assignment
        console.log(`Controller: activeGame object updated for '${gameName}': init function name: ${activeGame.init ? activeGame.init.name : 'N/A'}`);
        
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