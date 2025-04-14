// solitaire.js - Logic for the "Solitaire"-style round

// --- Constants ---
const deck_solitaire = [
    { value: "7", suit: "♥" }, { value: "8", suit: "♥" }, { value: "9", suit: "♥" }, { value: "10", suit: "♥" }, { value: "J", suit: "♥" }, { value: "Q", suit: "♥" }, { value: "K", suit: "♥" }, { value: "A", suit: "♥" },
    { value: "7", suit: "♦" }, { value: "8", suit: "♦" }, { value: "9", suit: "♦" }, { value: "10", suit: "♦" }, { value: "J", suit: "♦" }, { value: "Q", suit: "♦" }, { value: "K", suit: "♦" }, { value: "A", suit: "♦" },
    { value: "7", suit: "♣" }, { value: "8", suit: "♣" }, { value: "9", suit: "♣" }, { value: "10", suit: "♣" }, { value: "J", suit: "♣" }, { value: "Q", suit: "♣" }, { value: "K", suit: "♣" }, { value: "A", suit: "♣" },
    { value: "7", suit: "♠" }, { value: "8", suit: "♠" }, { value: "9", suit: "♠" }, { value: "10", suit: "♠" }, { value: "J", suit: "♠" }, { value: "Q", suit: "♠" }, { value: "K", suit: "♠" }, { value: "A", suit: "♠" },
];
const cardStyle_solitaire = { "♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades" };
// Card ranks needed for building sequences upwards/downwards
const cardSequence = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const players_solitaire = ["player1", "player2", "player3", "player4"];

// --- Game State ---
let playerHands = { player1: [], player2: [], player3: [], player4: [] };
// Board state: Stores the highest and lowest card value index played for each suit stack.
// Example: { '♠': { low: 3 ('10'), high: 5 ('Q') }, '♥': { low: 4 ('J'), high: 4 ('J') } }
// Indices refer to cardSequence array.
let boardStacks = {};
let currentPlayer = null;
let roundOver = false;
let finishOrder = []; // Tracks player IDs in the order they finish
let isHumanTurn = false;
let humanPlayResolver = null; // Promise resolver for human turn

// --- Controller Integration ---
let controllerUpdateState; // Function to update controller state
let controllerUpdateTotalScores; // Function to update total scores
let controllerShowNotification; // Function to show notifications
let controllerDelay; // Function for delays
let controllerActiveGameRef; // Reference to controller's activeGame object

// --- Cached UI Elements ---
let uiHands = {};
let uiBoard = null;
let uiNotifications = null;
let uiScores = {}; // Scoreboard elements

// --- Module Registration ---
export function register(activeGame, controllerState) {
    console.log("Solitaire: Registering with controller");
    
    // Store controller functions
    controllerUpdateState = controllerState.updateGameState;
    controllerUpdateTotalScores = controllerState.updateTotalScores;
    controllerShowNotification = controllerState.showNotification;
    controllerDelay = controllerState.delay;
    controllerActiveGameRef = activeGame;
    
    // Cache UI elements
    uiHands.player1 = controllerState.uiElements.handsEls.player1;
    uiHands.player2 = controllerState.uiElements.handsEls.player2;
    uiHands.player3 = controllerState.uiElements.handsEls.player3;
    uiHands.player4 = controllerState.uiElements.handsEls.player4;
    
    // Fix: Use the board element from the controller directly
    uiBoard = document.querySelector('.board');
    console.log("Solitaire: Board element found:", uiBoard);
    
    uiNotifications = controllerState.uiElements.notificationsEl;
    
    // Cache score elements
    if (controllerState.uiElements.scoreboardEls && controllerState.uiElements.scoreboardEls.length === 4) {
        uiScores.player1 = controllerState.uiElements.scoreboardEls[0];
        uiScores.player2 = controllerState.uiElements.scoreboardEls[1];
        uiScores.player3 = controllerState.uiElements.scoreboardEls[2];
        uiScores.player4 = controllerState.uiElements.scoreboardEls[3];
    }
    
    // Export functions to controller
    activeGame.name = "solitaire";
    activeGame.init = initSolitaireRound;
    activeGame.startTrick = null; // Not used in solitaire, but required by controller
    
    console.log("Solitaire: Registration complete");
}

// --- Core Functions ---

// Initialize the solitaire round (called by controller's Deal button)
function initSolitaireRound() {
    console.log("Solitaire: Initializing round");
    
    // Reset game state
    playerHands = { player1: [], player2: [], player3: [], player4: [] };
    boardStacks = {};
    finishOrder = [];
    roundOver = false;
    currentPlayer = null;
    isHumanTurn = false;
    humanPlayResolver = null;
    
    // Add CSS to center cards on the board
    const style = document.createElement('style');
    style.textContent = `
        .board {
            position: relative;
        }
        .board .card.board-card {
            transform-origin: center center;
        }
        
        /* Fix board positioning in solitaire mode */
        .play {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .board, #solitaire-board {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0 auto;
        }
    `;
    document.head.appendChild(style);
    
    // Hide the Next Round button in solitaire mode
    const nextButton = document.querySelector('.next');
    if (nextButton) {
        nextButton.style.display = 'none';
    }
    
    // Center the Deal button
    const dealButton = document.querySelector('.deal');
    const buttonsContainer = document.querySelector('.buttons');
    
    if (dealButton && buttonsContainer) {
        // Add a class to the buttons container for solitaire-specific styling
        buttonsContainer.classList.add('buttons-solitaire-mode');
    }
    
    // Update controller state
    controllerUpdateState({
        gameStarted: true,
        roundOver: false,
        trickInProgress: true // Mark as in progress to disable Next button
    });
    
    // Note: While other rounds use the starting player from the cycle,
    // Solitaire must start with the player who has the Jack of Spades
    // We'll inform the user about this special rule
    
    // Deal cards and start the game
    dealCardsSolitaire();
    
    // Find player with Jack of Spades
    const jackPlayer = findJackOfSpadesPlayer();
    if (jackPlayer) {
        showNotificationSolitaire(`Solitaire Round: ${formatPlayerName(jackPlayer)} has the Jack of Spades and starts.`);
    } else {
        showNotificationSolitaire("Error: Jack of Spades not found! Cannot start round.");
    }
    
    playRoundSolitaire();
}

function dealCardsSolitaire() {
    console.log("Solitaire: Dealing cards...");
    playerHands = { player1: [], player2: [], player3: [], player4: [] };
    boardStacks = {}; // Reset board
    finishOrder = [];
    roundOver = false;
    currentPlayer = null;
    isHumanTurn = false;
    humanPlayResolver = null;

    let deck = [...deck_solitaire];
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // Deal
    let cardIndex = 0;
    while (cardIndex < deck.length) {
        for (let player of players_solitaire) {
            if (cardIndex < deck.length && playerHands[player].length < 8) {
                playerHands[player].push(deck[cardIndex]);
                cardIndex++;
            }
        }
    }
    console.log("Solitaire: Hands dealt.");
    // console.log(playerHands); // Optional: Log dealt hands
    renderHandsSolitaire();
    renderBoardSolitaire(); // Render empty board initially
}

function findJackOfSpadesPlayer() {
    for (let player of players_solitaire) {
        if (playerHands[player].some(card => card.value === 'J' && card.suit === '♠')) {
            console.log(`Solitaire: ${player} has J♠ and starts.`);
            return player;
        }
    }
    console.error("Solitaire: J♠ not found in any hand! Cannot start round.");
    return null;
}

function renderHandsSolitaire() {
    console.log("Solitaire: Rendering hands...");
    if (!uiHands.player1) {
        console.error("UI elements for hands not ready.");
        return;
    }
    players_solitaire.forEach(player => {
        const handEl = uiHands[player];
        if (!handEl) {
            console.error(`UI element for ${player} hand not found.`);
            return;
        }
        handEl.innerHTML = ''; // Clear previous

        // Sort player 1 hand for better display
        if (player === 'player1') {
             playerHands[player].sort((a, b) => {
                const suitOrder = ['♠', '♥', '♦', '♣']; // Example sort order
                if (suitOrder.indexOf(a.suit) < suitOrder.indexOf(b.suit)) return -1;
                if (suitOrder.indexOf(a.suit) > suitOrder.indexOf(b.suit)) return 1;
                const rankA = cardSequence.indexOf(a.value);
                const rankB = cardSequence.indexOf(b.value);
                return rankA - rankB;
             });
        }

        playerHands[player].forEach(card => {
            let cardHTML;
            // --- CHANGE: Implement face down cards for AI --- 
            if (player === 'player1') {
                 // Always show human hand face up
                 cardHTML = `<div class="card ${cardStyle_solitaire[card.suit]}" data-value="${card.value}" data-suit="${card.suit}"><span>${card.value}</span>${card.suit}</div>`;
            } else {
                 // Show card backs for AI players (Players 2, 3, 4)
                 // Use the same image path as other rounds for consistency
                 cardHTML = `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`; 
            }
            // --- END CHANGE ---

            handEl.insertAdjacentHTML('beforeend', cardHTML);
        });
    });
    // Listeners are attached/removed in handlePlayerTurn / waitForHumanPlay
}

// Renders the board based on the boardStacks state
function renderBoardSolitaire() {
    console.log("Solitaire: Rendering board...", JSON.stringify(boardStacks));
    if (!uiBoard) {
        console.error("UI element for board not ready.");
        return;
    }
    uiBoard.innerHTML = ''; // Clear board

    // Evenly space stacks across the board
    // Shifted 42px left (increased by 3px) and 90px up
    const jackPositions = { 
        '♠': { x: 'calc(15% - 42px)', y: 'calc(50% - 90px)' }, 
        '♥': { x: 'calc(38% - 42px)', y: 'calc(50% - 90px)' }, 
        '♦': { x: 'calc(62% - 42px)', y: 'calc(50% - 90px)' }, 
        '♣': { x: 'calc(85% - 42px)', y: 'calc(50% - 90px)' } 
    };
    
    const cardWidth = 60; // Example width, should match CSS if possible
    const cardHeight = 90; // Example height

    for (const suit of ['♠', '♥', '♦', '♣']) {
        if (boardStacks[suit]) {
            const stack = boardStacks[suit];
            const jackIndex = cardSequence.indexOf('J');
            const lowIndex = stack.low; // boardStacks now stores indices
            const highIndex = stack.high;
            const jackPos = jackPositions[suit];

            // Render cards from low up to high
            for (let i = lowIndex; i <= highIndex; i++) {
                const value = cardSequence[i];
                const card = { value: value, suit: suit };
                const offsetPercent = (i - jackIndex) * -55; // Increased by another 20% from -46 to -55
                let cardEl = createCardElement(card, jackPos.x, jackPos.y, offsetPercent, cardWidth, cardHeight);
                uiBoard.appendChild(cardEl);
            }
        }
    }
}

// Function to create a card element for the board
function createCardElement(card, x, y, yOffsetPercent, cardW, cardH) {
    const el = document.createElement('div');
    el.className = `card ${cardStyle_solitaire[card.suit]} board-card`;
    el.innerHTML = `<span>${card.value}</span>${card.suit}`;
    
    // Position card
    el.style.position = 'absolute';
    el.style.left = x;
    
    // Use calc for vertical positioning
    el.style.top = `calc(${y} + ${yOffsetPercent * (cardH / 100)}px)`;
    
    // Simple z-index based on card rank: 7 (front) to A (back)
    const cardRankIndex = cardSequence.indexOf(card.value);
    // Invert the index: 7 (index 0) should have highest z-index, A (index 7) lowest
    const zIndex = 200 - (cardRankIndex * 10); // Start high, decrease for each rank
    el.style.zIndex = zIndex;
    
    return el;
}


// Checks if a card is a valid play based on current board state
function isValidPlaySolitaire(card) {
    const { value, suit } = card;
    const rankIndex = cardSequence.indexOf(value);
    if (rankIndex === -1) return false; // Should not happen

    // Rule 1: Can play any Jack if its suit stack hasn't started
    if (value === 'J' && !boardStacks[suit]) {
        return true;
    }

    // Rule 2 & 3: Can play if stack exists and card is adjacent to current range
    if (boardStacks[suit]) {
        // Check if it's the next card lower than the current low
        if (rankIndex === boardStacks[suit].low - 1) {
            return true;
        }
        // Check if it's the next card higher than the current high
        if (rankIndex === boardStacks[suit].high + 1) {
            return true;
        }
    }

    return false;
}

// Plays a card: updates board state, removes card from hand
function playCardSolitaire(card, player) {
    const { value, suit } = card;
    console.log(`Solitaire: ${player} plays ${value}${suit}`);

    const rankIndex = cardSequence.indexOf(value);

    // Update board state
    if (value === 'J') {
        // Store index of 'J' for low and high
        boardStacks[suit] = { low: rankIndex, high: rankIndex };
    } else {
        // Update existing stack's low or high index
        if (rankIndex < boardStacks[suit].low) {
            boardStacks[suit].low = rankIndex;
        } else if (rankIndex > boardStacks[suit].high) {
            boardStacks[suit].high = rankIndex;
        }
    }

    // Remove card from player's hand
    const initialHandSize = playerHands[player].length;
    playerHands[player] = playerHands[player].filter(c => !(c.value === value && c.suit === suit));
    if (playerHands[player].length === initialHandSize) {
         console.warn(`Card ${value}${suit} not found in ${player}'s hand during filter.`);
    }

    // Check if player finished
    if (playerHands[player].length === 0 && !finishOrder.includes(player)) {
        console.log(`Solitaire: ${player} finished!`);
        finishOrder.push(player);
        
        // Update score immediately when a player finishes
        const playerScore = getPlayerScoreForFinishPosition(finishOrder.indexOf(player));
        updatePlayerScore(player, playerScore);
        
        // Notify about player finishing
        showNotificationSolitaire(`${formatPlayerName(player)} finished in position ${finishOrder.length} with score ${playerScore}.`);
        
        // Check if round ended because 3 players finished
        roundOver = checkRoundOverSolitaire();
    }

    // Re-render hand and board
    renderHandsSolitaire();
    renderBoardSolitaire();
}

// Helper to get the score for a finish position
function getPlayerScoreForFinishPosition(position) {
    // Return score based on finish position
    switch(position) {
        case 0: return -5; // First place
        case 1: return -3; // Second place
        case 2: return -1; // Third place
        default: return 0; // Last place (doesn't finish)
    }
}

// Update a player's score in the UI
function updatePlayerScore(playerId, score) {
    const playerIndex = players_solitaire.indexOf(playerId);
    if (playerIndex !== -1) {
        // Create a scores array with the current player's score
        const currentScores = [0, 0, 0, 0]; // Initialize with zeros
        // Convert playerId (player1, player2, etc.) to array index (0, 1, etc.)
        const scoreIndex = parseInt(playerId.replace('player', '')) - 1;
        // Set the score for the specific player
        currentScores[scoreIndex] = score;
        
        console.log(`Solitaire: Updating score for ${playerId} to ${score}`);
        
        // Update the UI score using the controller's function
        if (controllerUpdateTotalScores) {
            // Call the controller's update scores function
            controllerUpdateTotalScores(currentScores, true); // true = partial update
        } else {
            console.error("Cannot update score: controllerUpdateTotalScores not available");
        }
        
        // Also update the UI element if available
        if (uiScores[playerId]) {
            uiScores[playerId].textContent = score;
        }
    }
}

// Finds the best card for an AI player to play based on strategic priorities
function findAIPlay(player) {
    // 1. Find all valid plays
    const validPlays = [];
    for (let i = 0; i < playerHands[player].length; i++) {
        const card = playerHands[player][i];
        if (isValidPlaySolitaire(card)) {
            validPlays.push(card);
        }
    }
    
    if (validPlays.length === 0) return null; // No valid plays
    if (validPlays.length === 1) return validPlays[0]; // Only one option
    
    // Check if this is the first move (Jack of Spades)
    const isFirstMove = Object.keys(boardStacks).length === 0;
    if (isFirstMove) {
        // Must play Jack of Spades to start
        const jackOfSpades = validPlays.find(card => card.value === 'J' && card.suit === '♠');
        if (jackOfSpades) return jackOfSpades;
    }
    
    // 2. Priority: Avoid playing Jacks unless necessary
    const nonJackPlays = validPlays.filter(card => card.value !== 'J');
    if (nonJackPlays.length > 0 && !isFirstMove) {
        validPlays.length = 0; // Clear the array
        nonJackPlays.forEach(card => validPlays.push(card)); // Replace with non-Jack options
    }
    
    // 3. Priority: Play cards that would block other cards (identify sequence dependencies)
    const cardRankIndex = {};
    playerHands[player].forEach(card => {
        cardRankIndex[`${card.value}${card.suit}`] = cardSequence.indexOf(card.value);
    });
    
    const blockingCards = validPlays.filter(card => {
        const currentRank = cardSequence.indexOf(card.value);
        // Check if we have adjacent cards in our hand that would be blocked
        const hasAdjacentHigher = playerHands[player].some(c => 
            c.suit === card.suit && 
            cardSequence.indexOf(c.value) === currentRank + 1);
        
        const hasAdjacentLower = playerHands[player].some(c => 
            c.suit === card.suit && 
            cardSequence.indexOf(c.value) === currentRank - 1);
        
        return hasAdjacentHigher || hasAdjacentLower;
    });
    
    if (blockingCards.length > 0) {
        return blockingCards[0]; // Play the first blocking card found
    }
    
    // 4. Priority: Prefer playing 7s or Aces if possible
    const sevenOrAcePlays = validPlays.filter(card => card.value === '7' || card.value === 'A');
    if (sevenOrAcePlays.length > 0) {
        return sevenOrAcePlays[0];
    }
    
    // If no strategic play found, just play the first valid card
    return validPlays[0];
}

// Helper function to format player IDs for display
function formatPlayerName(playerId) {
    if (playerId === 'player1') {
        // Get the saved player name from localStorage, default to 'Human' if not found
        const storedName = localStorage.getItem('plpakPlayerName');
        return storedName || 'Human';
    }
    return `Player ${playerId.replace('player', '')}`;
}

// Highlights the current player's hand area
function highlightCurrentPlayer(player) {
    Object.values(uiHands).forEach(el => el.classList.remove('active-turn'));
    if (uiHands[player]) uiHands[player].classList.add('active-turn');
}

// Handles turn logic for the human player
async function handleHumanTurnSolitaire(player) {
    console.log(`Solitaire: Turn for ${player}`);
    showNotificationSolitaire(`${formatPlayerName(player)}'s turn...`);
    
    isHumanTurn = true;
    attachHumanListeners(); // Make cards clickable if valid
    const selectedCard = await waitForHumanPlay(); // Waits for click or auto-pass
    isHumanTurn = false;
    removeHumanListeners();
    
    uiHands[player].classList.remove('active-turn'); // Remove highlight
    
    if (selectedCard) {
        playCardSolitaire(selectedCard, player);
        showNotificationSolitaire(`${formatPlayerName(player)} played ${selectedCard.value}${selectedCard.suit}.`);
        await delaySolitaire(750);
        return true; // Player made a move
    } else {
        console.log(`Solitaire: ${player} has no valid moves and passes.`);
        showNotificationSolitaire(`${formatPlayerName(player)} passes.`);
        await delaySolitaire(750);
        return false; // Player passed
    }
}

// Handles turn logic for AI players
async function handleAITurnSolitaire(player) {
    console.log(`Solitaire: Turn for ${player}`);
    showNotificationSolitaire(`${formatPlayerName(player)}'s turn...`);
    
    await delaySolitaire(1200);
    const selectedCard = findAIPlay(player);
    
    uiHands[player].classList.remove('active-turn'); // Remove highlight
    
    if (selectedCard) {
        playCardSolitaire(selectedCard, player);
        showNotificationSolitaire(`${formatPlayerName(player)} played ${selectedCard.value}${selectedCard.suit}.`);
        await delaySolitaire(750);
        return true; // Player made a move
    } else {
        console.log(`Solitaire: ${player} has no valid moves and passes.`);
        showNotificationSolitaire(`${formatPlayerName(player)} passes.`);
        await delaySolitaire(750);
        return false; // Player passed
    }
}

// Helper function to get a player's hand
function getPlayerHandSolitaire(player) {
    return playerHands[player] || [];
}

// Handles a single turn for any player
async function handlePlayerTurnSolitaire(player) {
    // Skip immediately if player has no cards or has already finished
    if (getPlayerHandSolitaire(player).length === 0 || finishOrder.includes(player)) {
        return false;
    }
    
    // Highlight current player
    highlightCurrentPlayer(player);
    
    // Clear notification area if it contains a pass message
    const notificationElement = document.getElementById('notification-solitaire');
    if (notificationElement && notificationElement.textContent && notificationElement.textContent.includes('passes')) {
        notificationElement.textContent = '';
    }
    
    // Handle human player turn
    if (player === "player1") {
        return await handleHumanTurnSolitaire(player);
    } 
    // Handle AI player turn
    else {
        return await handleAITurnSolitaire(player);
    }
}

// Main game loop
async function playRoundSolitaire() {
    console.log("Solitaire: Starting round loop...");
    let starter = findJackOfSpadesPlayer();
    if (!starter) {
        showNotificationSolitaire("ERROR: Jack of Spades not found!");
        return;
    }

    // Show who has the Jack of Spades
    showNotificationSolitaire(`${formatPlayerName(starter)} has the Jack of Spades.`);
    await delaySolitaire(1500); // Initial delay to see the starting state

    // Handle the Jack of Spades start differently for human vs AI players
    if (starter === 'player1') {
        // For human player, prompt them to play the Jack of Spades
        showNotificationSolitaire(`${formatPlayerName(starter)} has the Jack of Spades. Click it to start the game.`);
        currentPlayer = starter;
        
        // Use the human player turn flow to let them select the Jack
        isHumanTurn = true;
        attachJackOfSpadesOnlyListener(); // Special listener that only allows Jack of Spades
        await waitForHumanJackOfSpades();
        isHumanTurn = false;
        
        // At this point, they've played the Jack of Spades, which will have updated the board
    } else {
        // For AI players, automatically play the Jack of Spades
        const jackOfSpades = { value: 'J', suit: '♠' };
        playCardSolitaire(jackOfSpades, starter);
        showNotificationSolitaire(`${formatPlayerName(starter)} starts with J♠.`);
        await delaySolitaire(1500); // Delay after playing Jack of Spades
    }

    // Player who had Jack of Spades goes first, then we move to the next player
    let playerIndex = players_solitaire.indexOf(starter);
    let consecutivePasses = 0; // To detect stuck game
    let skippedPlayers = new Set(); // Keep track of skipped players for logging

    while (!roundOver) {
        // First check if current player has cards to play
        currentPlayer = players_solitaire[playerIndex];
        
        // Skip player if they already finished - do this without any delay
        if (getPlayerHandSolitaire(currentPlayer).length === 0 || finishOrder.includes(currentPlayer)) {
            // Only log if we haven't already logged this player being skipped
            if (!skippedPlayers.has(currentPlayer)) {
                console.log(`Solitaire: Skipping finished player ${currentPlayer} for the rest of the game`);
                skippedPlayers.add(currentPlayer);
            }
            
            // Move to next player and continue
            playerIndex = (playerIndex + 1) % players_solitaire.length;
            continue; // Immediately go to the next player with absolutely no delay
        }

        let playerMoved = await handlePlayerTurnSolitaire(currentPlayer);

        if (!playerMoved) {
            consecutivePasses++;
        } else {
            consecutivePasses = 0; // Reset pass counter on a successful move
        }

        // Check if round is over (3 players finished OR game stuck)
        roundOver = checkRoundOverSolitaire();
        if (consecutivePasses >= players_solitaire.length) {
             console.warn("Solitaire: Game stuck! All players passed consecutively.");
             showNotificationSolitaire("Game Over! No more possible moves.");
             roundOver = true; // End the round if stuck
        }
        
        // Update controller state if round is over
        if (roundOver) {
            // Handle the fourth player who didn't finish
            if (finishOrder.length === 3) {
                // Find the player who didn't finish
                const lastPlayer = players_solitaire.find(p => !finishOrder.includes(p));
                if (lastPlayer) {
                    showNotificationSolitaire(`${formatPlayerName(lastPlayer)} didn't finish and gets a score of 0.`);
                }
            }
            
            // Call the endSolitaireRound function
            endSolitaireRound();
            
            // Log that the round is over
            console.log("Solitaire: Round is over with scores:", getScoresArray());
            
            // Break out of the game loop - round is over
            break;
        }
        
        // Move to next player
        playerIndex = (playerIndex + 1) % players_solitaire.length;
    } // End while loop

    console.log("Solitaire: Round loop finished.");
    
    // Return the scores for the controller
    return getScoresArray();
}

// Fix: Update function to handle scores correctly
function getScoresArray() {
    // Convert our player-indexed scores to the array format expected by the controller
    const scores = [0, 0, 0, 0]; // [player1, player2, player3, player4]
    
    // Log current finish order for debugging
    console.log("Solitaire: Current finish order:", finishOrder);
    
    finishOrder.forEach((player, index) => {
        const playerNum = parseInt(player.replace('player', '')) - 1;
        const scoreValue = getPlayerScoreForFinishPosition(index);
        scores[playerNum] = scoreValue;
        console.log(`Solitaire: ${player} (index ${playerNum}) gets score ${scoreValue}`);
    });
    
    // Find the player who didn't finish and assign them a score of 0
    if (finishOrder.length === 3) {
        const missingPlayer = players_solitaire.find(p => !finishOrder.includes(p));
        if (missingPlayer) {
            const playerNum = parseInt(missingPlayer.replace('player', '')) - 1;
            scores[playerNum] = 0;
            console.log(`Solitaire: ${missingPlayer} (index ${playerNum}) didn't finish, gets score 0`);
        }
    }
    
    console.log("Solitaire: Final scores array:", scores);
    return scores;
}

function checkRoundOverSolitaire() {
    // Check if 3 players have finished
    return finishOrder.length >= 3;
}

function showNotificationSolitaire(message) {
    if (uiNotifications) {
        // Add solitaire-specific notification styling
        uiNotifications.innerHTML = `<div class="solitaire-notification">${message}</div>`;
        
        // Add inline styling for the solitaire notification
        const style = document.createElement('style');
        style.textContent = `
            .solitaire-notification {
                font-size: 191.25%; /* Reduced by 15% from 225% */
                color: white;
                font-weight: bold;
                width: auto;
                max-width: 100%;
                display: inline-block;
                padding: 10px 20px;
                white-space: normal;
                word-wrap: break-word;
                text-align: center;
                box-sizing: border-box;
                background-color: rgba(0, 0, 0, 0.8);
                border: 2px solid #ffcc00;
                border-radius: 10px;
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
        if (!document.querySelector('style[data-solitaire-notification]')) {
            style.setAttribute('data-solitaire-notification', 'true');
            document.head.appendChild(style);
        }
        
        // Make sure parent has proper layout
        uiNotifications.style.width = '100%';
        uiNotifications.style.display = 'flex';
        uiNotifications.style.justifyContent = 'center';
        uiNotifications.style.flexWrap = 'wrap';
        
        // Get the notification element we just created
        const notificationElement = uiNotifications.querySelector('.solitaire-notification');
        if (notificationElement) {
            // Ensure text is visible and container sized properly
            notificationElement.style.minWidth = 'fit-content';
            notificationElement.style.margin = '0 auto';
        }
        
        // For Game Complete messages, keep them visible indefinitely (don't auto-hide)
        if (message.startsWith("Game Complete!")) {
            console.log("Solitaire: Keeping Game Complete notification visible indefinitely");
            return; // Don't set timeout to clear
        }
        
        // Auto-clear after delay (for regular notifications)
        setTimeout(() => {
            // Only clear if this notification is still the one showing
            if (uiNotifications.innerHTML.includes(message)) {
                uiNotifications.innerHTML = "";
            }
        }, 5000); // Increased to 5 seconds for better readability
    } else {
        console.log("Notification:", message);
    }
}

function delaySolitaire(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Human Interaction ---
function attachHumanListeners() {
    console.log("Attaching human listeners...");
    if (!uiHands.player1) return;
    uiHands.player1.querySelectorAll('.card').forEach(cardEl => {
        cardEl.removeEventListener('click', handleCardClickSolitaire); // Prevent duplicates
        const card = {
            value: cardEl.dataset.value,
            suit: cardEl.dataset.suit
        };
        if (isValidPlaySolitaire(card)) {
             console.log(`  - Making ${card.value}${card.suit} clickable`);
             cardEl.classList.add('playable');
             cardEl.addEventListener('click', handleCardClickSolitaire);
        } else {
             cardEl.classList.remove('playable');
        }
    });
}

function removeHumanListeners() {
    console.log("Removing human listeners...");
    if (!uiHands.player1) return;
    uiHands.player1.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('playable');
        cardEl.removeEventListener('click', handleCardClickSolitaire);
    });
}

function handleCardClickSolitaire(event) {
    if (!isHumanTurn || !humanPlayResolver) {
        console.log("Ignoring click - not human turn or resolver missing.");
        return;
    }
    const cardEl = event.target.closest('.card');
    // Ensure it's the element with data attributes (might be span inside)
    if (!cardEl || !cardEl.dataset.value) return;

    const card = {
        value: cardEl.dataset.value,
        suit: cardEl.dataset.suit
    };

    // Double-check validity before resolving
    if (!isValidPlaySolitaire(card)) {
        console.warn(`Human clicked non-playable card: ${card.value}${card.suit}`);
        showNotificationSolitaire(`Cannot play ${card.value}${card.suit} now.`);
        // Re-attach listeners might be needed if invalid click removed them somehow
        attachHumanListeners();
        return;
    }


    console.log(`Solitaire: Human clicked valid card: ${card.value}${card.suit}`);
    // Don't set isHumanTurn=false here, handlePlayerTurnSolitaire does that
    removeHumanListeners(); // Remove listeners immediately after valid click
    humanPlayResolver(card); // Resolve the promise with the selected card
    humanPlayResolver = null;
}

function waitForHumanPlay() {
    return new Promise(resolve => {
        // Clear any previous resolver just in case
        if (humanPlayResolver) {
             console.warn("waitForHumanPlay: Resolver already active!");
             // Potentially resolve previous with null?
        }
        humanPlayResolver = resolve;
        // Check if human actually HAS a valid move. If not, auto-pass.
        const hasValidMove = playerHands.player1.some(isValidPlaySolitaire);
        if (!hasValidMove) {
            console.log("Solitaire: Human has no valid moves.");
            showNotificationSolitaire("You have no valid moves. Passing...");
            // Resolve with null after a short delay to indicate a pass
            setTimeout(() => {
                if (humanPlayResolver === resolve) { // Make sure it's still our resolver
                     resolve(null); // Resolve with null for pass
                     humanPlayResolver = null;
                }
            }, 2250); // Increased from 1500 to 2250
        } else {
             // Listeners should have been attached by handlePlayerTurn
             console.log("Solitaire: Waiting for human card click...");
        }
    });
}

// Special listener for starting the game with Jack of Spades
function attachJackOfSpadesOnlyListener() {
    console.log("Attaching Jack of Spades listener...");
    if (!uiHands.player1) return;
    
    uiHands.player1.querySelectorAll('.card').forEach(cardEl => {
        cardEl.removeEventListener('click', handleStartingJackClick); // Prevent duplicates
        
        const card = {
            value: cardEl.dataset.value,
            suit: cardEl.dataset.suit
        };
        
        // Only the Jack of Spades is clickable
        if (card.value === 'J' && card.suit === '♠') {
            console.log("  - Making Jack of Spades clickable");
            cardEl.classList.add('playable');
            cardEl.addEventListener('click', handleStartingJackClick);
        } else {
            cardEl.classList.remove('playable');
        }
    });
}

// Handle the Jack of Spades click to start the game
function handleStartingJackClick(event) {
    if (!isHumanTurn || !humanPlayResolver) {
        console.log("Ignoring click - not human turn or resolver missing.");
        return;
    }
    
    const cardEl = event.target.closest('.card');
    // Ensure it's the element with data attributes (might be span inside)
    if (!cardEl || !cardEl.dataset.value) return;

    const card = {
        value: cardEl.dataset.value,
        suit: cardEl.dataset.suit
    };

    // Make sure it's the Jack of Spades
    if (card.value !== 'J' || card.suit !== '♠') {
        console.warn("Human clicked non-Jack of Spades card at game start");
        showNotificationSolitaire("You must play the Jack of Spades to start the game.");
        return;
    }

    console.log("Solitaire: Human clicked Jack of Spades to start the game");
    
    // Play the card and properly update board state
    // First remove from hand
    const jackIndex = playerHands.player1.findIndex(c => c.value === 'J' && c.suit === '♠');
    if (jackIndex !== -1) {
        playerHands.player1.splice(jackIndex, 1);
    }
    
    // Update board state
    const jackRankIndex = cardSequence.indexOf('J');
    boardStacks['♠'] = { low: jackRankIndex, high: jackRankIndex };
    
    // Show notification and re-render the UI
    showNotificationSolitaire(`${formatPlayerName('player1')} starts with J♠.`);
    renderHandsSolitaire();
    renderBoardSolitaire();
    
    // Clean up
    uiHands.player1.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('playable');
        cardEl.removeEventListener('click', handleStartingJackClick);
    });
    
    // Resolve the promise
    humanPlayResolver(card);
    humanPlayResolver = null;
}

// Wait for human to play the Jack of Spades
function waitForHumanJackOfSpades() {
    return new Promise(resolve => {
        // Clear any previous resolver just in case
        if (humanPlayResolver) {
            console.warn("waitForHumanJackOfSpades: Resolver already active!");
        }
        humanPlayResolver = resolve;
        console.log("Solitaire: Waiting for human to play Jack of Spades...");
    });
}

// When round ends, restore the Next button (called at end of round)
function endSolitaireRound() {
    // Mark round as over
    roundOver = true;
    
    // Get final scores
    const finalScores = getScoresArray();
    
    // Show final scores in notification
    const scoreDisplay = players_solitaire.map(player => {
        const playerIndex = parseInt(player.replace('player', '')) - 1;
        const score = finalScores[playerIndex];
        return `${formatPlayerName(player)}: ${score}`;
    }).join(', ');
    
    // Check if this is the final cycle (cycle 4)
    const currentCycleIndex = parseInt(localStorage.getItem('plpakCycleIndex') || '0');
    const isFinalCycle = currentCycleIndex === 3; // Cycles are 0-indexed, so cycle 4 is index 3
    
    if (isFinalCycle) {
        console.log("Solitaire: Final cycle complete! Game Over!");
        
        // Use the localStorage flag to signal game completion to the controller
        localStorage.setItem('plpakGameComplete', 'true');
        
        // Get the overall scores to determine the winner
        const totalScoresStr = localStorage.getItem('plpakTotalScores');
        if (totalScoresStr) {
            try {
                // Parse stored total scores (up to but not including this final round)
                const storedTotalScores = JSON.parse(totalScoresStr);
                if (Array.isArray(storedTotalScores) && storedTotalScores.length === 4) {
                    // Add the current round's scores to get the true final scores
                    const trueFinaScores = storedTotalScores.map((score, idx) => score + finalScores[idx]);
                    console.log("Final round scores:", finalScores);
                    console.log("Stored total scores:", storedTotalScores);
                    console.log("True final scores:", trueFinaScores);
                    
                    // Find the lowest score (winner)
                    const lowestScore = Math.min(...trueFinaScores);
                    
                    // Find all players with the lowest score (in case of a tie)
                    const winnerIndices = trueFinaScores.map((score, index) => 
                        score === lowestScore ? index : -1).filter(index => index !== -1);
                    
                    // Create winner announcement message
                    let winnerMessage = "Game Complete! ";
                    
                    if (winnerIndices.length === 1) {
                        // Single winner
                        const winnerIndex = winnerIndices[0];
                        const winnerName = winnerIndex === 0 ? formatPlayerName('player1') : `Player ${winnerIndex + 1}`;
                        winnerMessage += `${winnerName} wins with ${lowestScore} points!`;
                    } else {
                        // Tie between multiple players
                        const winnerNames = winnerIndices.map(index => 
                            index === 0 ? formatPlayerName('player1') : `Player ${index + 1}`
                        );
                        
                        if (winnerNames.length === 2) {
                            winnerMessage += `Tie between ${winnerNames[0]} and ${winnerNames[1]} with ${lowestScore} points!`;
                        } else {
                            // Format list with proper comma separation and "and" for the last item
                            const lastWinner = winnerNames.pop();
                            winnerMessage += `Tie between ${winnerNames.join(', ')} and ${lastWinner} with ${lowestScore} points!`;
                        }
                    }
                    
                    // Show the game complete notification
                    showNotificationSolitaire(winnerMessage);
                    
                    // Update the round title element
                    const roundTitleEl = document.querySelector('.round');
                    if (roundTitleEl) {
                        roundTitleEl.textContent = "Game Complete!";
                        roundTitleEl.style.color = "#ffcc00";
                        roundTitleEl.style.fontWeight = "bold";
                        roundTitleEl.style.fontSize = "32px";
                    }
                }
            } catch (e) {
                console.error("Error parsing total scores:", e);
            }
        }
    } else {
        // Normal round end notification for cycles 1-3
        showNotificationSolitaire(`Final scores: ${scoreDisplay}`);
        showNotificationSolitaire("Solitaire Round complete! Click Next Hand.");
    }
    
    // Restore the Next Round button visibility for next rounds
    const nextButton = document.querySelector('.next');
    if (nextButton) {
        nextButton.style.display = ''; // Reset to default display
    }
    
    // Restore the buttons container to normal layout
    const buttonsContainer = document.querySelector('.buttons');
    if (buttonsContainer) {
        buttonsContainer.classList.remove('buttons-solitaire-mode');
    }
    
    // Change button text based on whether this is the final cycle
    const dealButton = document.querySelector('.deal');
    if (dealButton) {
        if (isFinalCycle) {
            dealButton.textContent = 'New Game';
            // Keep standard button styling - no custom styling so it matches the Next Round button
            
            // Remove existing event listeners by replacing with a clone
            const newDealButton = dealButton.cloneNode(true);
            dealButton.parentNode.replaceChild(newDealButton, dealButton);
            
            // Add a new game event listener
            newDealButton.addEventListener('click', () => {
                console.log("Solitaire: New Game button clicked, resetting game sequence");
                
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
            
            // Make sure the NEW button is enabled
            newDealButton.disabled = false;
        } else {
            dealButton.textContent = 'Next Hand';
            dealButton.disabled = false;
        }
    }
    
    // Update controller state with our scores
    controllerUpdateState({
        gameStarted: false,
        roundOver: true,
        trickInProgress: false,
        currentRoundScore: finalScores
    });
}

// TEMPORARY: Expose the endSolitaireRound function globally for the skip button
// TO REMOVE: Delete this line when removing the skip button
window.endSolitaireRound = endSolitaireRound;

console.log("solitaire.js module loaded");
