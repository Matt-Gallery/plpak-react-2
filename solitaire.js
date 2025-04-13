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
    `;
    document.head.appendChild(style);
    
    // Update controller state
    controllerUpdateState({
        gameStarted: true,
        roundOver: false,
        trickInProgress: true, // Mark as in progress to disable Next button
        currentRoundScore: [0, 0, 0, 0]
    });
    
    // Deal cards and start the game
    dealCardsSolitaire();
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
    // Shifted 35px left (increased from 30px) and 40px up
    const jackPositions = { 
        '♠': { x: 'calc(15% - 35px)', y: 'calc(50% - 80px)' }, 
        '♥': { x: 'calc(38% - 35px)', y: 'calc(50% - 80px)' }, 
        '♦': { x: 'calc(62% - 35px)', y: 'calc(50% - 80px)' }, 
        '♣': { x: 'calc(85% - 35px)', y: 'calc(50% - 80px)' } 
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
                const offsetPercent = (i - jackIndex) * -40; 
                let cardEl = createCardElement(card, jackPos.x, jackPos.y, offsetPercent, cardWidth, cardHeight);
                uiBoard.appendChild(cardEl);
            }
        }
    }
}

// Helper to create and position card elements
function createCardElement(card, x, y, yOffsetPercent, cardW, cardH) {
    const el = document.createElement('div');
    el.className = `card ${cardStyle_solitaire[card.suit]} board-card`;
    el.innerHTML = `<span>${card.value}</span>${card.suit}`;
    
    // Position card
    el.style.position = 'absolute';
    el.style.left = x;
    
    // Use calc for vertical positioning
    el.style.top = `calc(${y} + ${yOffsetPercent * (cardH / 100)}px)`;
    
    // Different z-index logic based on whether card is above or below Jack
    const zIndexBase = 100; // Start with a higher base value
    const offsetSteps = Math.abs(yOffsetPercent / 40); // How many steps away from Jack
    
    // If offset is positive or zero, card is below Jack (going down - 10, 9, 8, 7)
    // If offset is negative, card is above Jack (going up - Q, K, A)
    if (yOffsetPercent >= 0) {
        // Cards below Jack (lower ranks) - appear IN FRONT of previous cards
        el.style.zIndex = zIndexBase + offsetSteps; 
    } else {
        // Cards above Jack (higher ranks) - appear BEHIND previous cards
        el.style.zIndex = zIndexBase - offsetSteps;
    }
    
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
    if (playerIndex !== -1 && uiScores[playerId]) {
        // Fix: Only update UI, but don't actually store the score here
        // We'll use the controller's score handling for that
        console.log(`Solitaire: Player ${playerId} earned score: ${score}`);
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
    const playerNum = playerId.replace('player', '');
    return `Player ${playerNum}`;
}

// Handles a single turn for any player
async function handlePlayerTurnSolitaire(player) {
    console.log(`Solitaire: Turn for ${player}`);
    let selectedCard = null;
    showNotificationSolitaire(`${formatPlayerName(player)}'s turn...`);

    // Highlight current player's hand area (optional)
    Object.values(uiHands).forEach(el => el.classList.remove('active-turn'));
    if (uiHands[player]) uiHands[player].classList.add('active-turn');


    if (player === 'player1') {
        isHumanTurn = true;
        attachHumanListeners(); // Make cards clickable if valid
        selectedCard = await waitForHumanPlay(); // Waits for click or auto-pass
        isHumanTurn = false;
        removeHumanListeners();
        // waitForHumanPlay resolves null if player passes/has no moves
    } else {
        // AI Logic
        await delaySolitaire(1200); // Increased from 800 to 1200
        selectedCard = findAIPlay(player);
    }

    if (uiHands[player]) uiHands[player].classList.remove('active-turn'); // Remove highlight

    if (selectedCard) {
        playCardSolitaire(selectedCard, player);
        showNotificationSolitaire(`${formatPlayerName(player)} played ${selectedCard.value}${selectedCard.suit}.`);
        await delaySolitaire(750); // Increased from 500 to 750
        return true; // Player made a move
    } else {
        console.log(`Solitaire: ${player} has no valid moves and passes.`);
        showNotificationSolitaire(`${formatPlayerName(player)} passes.`);
        await delaySolitaire(750); // Increased from 500 to 750
        return false; // Player passed
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
        let jackOfSpadesCard = await waitForHumanJackOfSpades();
        isHumanTurn = false;
        
        // At this point, they've played the Jack of Spades, which will have updated the board
    } else {
        // For AI players, automatically play the Jack of Spades
        const jackOfSpades = { value: 'J', suit: '♠' };
        playCardSolitaire(jackOfSpades, starter);
        showNotificationSolitaire(`${formatPlayerName(starter)} starts with J♠.`);
        await delaySolitaire(1500); // Delay after playing Jack of Spades
    }

    let playerIndex = players_solitaire.indexOf(starter);
    let consecutivePasses = 0; // To detect stuck game

    while (!roundOver) {
        // Move to next player
        playerIndex = (playerIndex + 1) % players_solitaire.length;
        currentPlayer = players_solitaire[playerIndex];

        // Skip player if they already finished
        if (finishOrder.includes(currentPlayer)) {
            console.log(`Solitaire: Skipping finished player ${currentPlayer}`);
            continue;
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
            
            // Notify that the round is over
            showNotificationSolitaire("Round over! Click Deal to advance to the next round.");
            
            // Convert our score object to the array format expected by the controller
            const finalScores = getScoresArray();
            
            // Fix: Explicitly use the controller's score update method
            console.log("Solitaire: Sending final scores to controller:", finalScores);
            controllerUpdateState({
                roundOver: true,
                trickInProgress: false,
                currentRoundScore: finalScores
            });
        }
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
        uiNotifications.textContent = message;
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
    
    // Play the card and resolve the promise
    playCardSolitaire(card, 'player1');
    showNotificationSolitaire(`${formatPlayerName('player1')} starts with J♠.`);
    
    // Clean up
    uiHands.player1.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('playable');
        cardEl.removeEventListener('click', handleStartingJackClick);
    });
    
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

console.log("solitaire.js module loaded");
