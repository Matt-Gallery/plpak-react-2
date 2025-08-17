// hearts.js - ES6 Module Version for No Hearts Round

// --- Constants (Module-scoped) ---
const deck_hearts = [
    { value: "7", suit: "♥" }, { value: "8", suit: "♥" }, { value: "9", suit: "♥" }, { value: "10", suit: "♥" }, { value: "J", suit: "♥" }, { value: "Q", suit: "♥" }, { value: "K", suit: "♥" }, { value: "A", suit: "♥" },
    { value: "7", suit: "♦" }, { value: "8", suit: "♦" }, { value: "9", suit: "♦" }, { value: "10", suit: "♦" }, { value: "J", suit: "♦" }, { value: "Q", suit: "♦" }, { value: "K", suit: "♦" }, { value: "A", suit: "♦" },
    { value: "7", suit: "♣" }, { value: "8", suit: "♣" }, { value: "9", suit: "♣" }, { value: "10", suit: "♣" }, { value: "J", suit: "♣" }, { value: "Q", suit: "♣" }, { value: "K", suit: "♣" }, { value: "A", suit: "♣" },
    { value: "7", suit: "♠" }, { value: "8", suit: "♠" }, { value: "9", suit: "♠" }, { value: "10", suit: "♠" }, { value: "J", suit: "♠" }, { value: "Q", suit: "♠" }, { value: "K", suit: "♠" }, { value: "A", suit: "♠" },
];
const cardStyle_hearts = { "♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades" };
const cardRanks_hearts = { 7: 1, 8: 2, 9: 3, 10: 4, J: 5, Q: 6, K: 7, A: 8 };
const players_hearts = ["player1", "player2", "player3", "player4"];

// --- Module State (References to Controller State/Functions) ---
let playerHands = {}; // Reference to controller state
let inPlay = [];      // Reference to controller state
let uiElements = {};  // Reference to controller UI elements (playAreas, handsEls, notificationsEl, scoreboardEls)
let controllerUpdateState = () => {};
let controllerUpdateScores = () => {};
let controllerShowNotification = () => {};
let controllerDelay = () => {};
let controllerActiveGameRef = {}; // Reference to controller's activeGame object

// --- Module-Specific State ---
let roundScore_hearts = [0, 0, 0, 0];
let currentStarter_hearts = null; // Will be set from controller
let roundOver_hearts = false;
let isFirstTrick_hearts = true;
let humanPlayerTurn_hearts = false;
let humanCardSelectionResolver_hearts = null;
let totalHeartsPlayed = 0;
let heartsRoundStarted = false;
let trickInProgress_hearts = false; // Track if a trick async operation is running

// --- Initialization Function (Called by Controller via activeGame.init) ---
function initHeartsRound() {
    console.log("Hearts.js: initHeartsRound called.");
    if (heartsRoundStarted) {
        console.log("Hearts.js: Round already started.");
        return;
    }
    heartsRoundStarted = true;
    roundOver_hearts = false;
    trickInProgress_hearts = false;
    isFirstTrick_hearts = true;
    humanPlayerTurn_hearts = false;
    humanCardSelectionResolver_hearts = null;
    roundScore_hearts = [0, 0, 0, 0];
    totalHeartsPlayed = 0;

    // Get the starting player from the controller
    currentStarter_hearts = controllerActiveGameRef.currentStarter;
    console.log(`Hearts.js: Using starting player from controller: ${currentStarter_hearts}`);
    
    // Confirm the starter with the controller
    controllerActiveGameRef.updateStarter(currentStarter_hearts);

    // Deal cards (using shared playerHands reference)
    let shuffledDeck = [...deck_hearts];
    for (let i = shuffledDeck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    // Clear hands before dealing (accessing shared state)
    for (let player of players_hearts) {
         if (playerHands[player]) {
            playerHands[player] = [];
         } else {
            console.error(`initRound: playerHands[${player}] is undefined before clearing.`);
            playerHands[player] = []; // Initialize if missing
         }
    }
    let cardIndex = 0;
    while (cardIndex < shuffledDeck.length) {
        for (let player of players_hearts) {
            if (!playerHands[player]) playerHands[player] = []; // Ensure initialized
            if (cardIndex < shuffledDeck.length && playerHands[player].length < 8) {
                playerHands[player].push(shuffledDeck[cardIndex]);
                cardIndex++;
            }
        }
    }

    renderHands(); // Update UI based on new playerHands state
    clearBoard();  // Clear visual board
    controllerShowNotification(`Hearts Round Started! ${formatPlayerName(currentStarter_hearts)} starts.`);

    // Update controller state AFTER dealing and BEFORE starting the first trick
    // Mark game as started, round not over, and trick not yet in progress
    console.log("Hearts.js: Round initialized, updating controller state.");
    controllerUpdateState({
        gameStarted: true,
        roundOver: false,
        trickInProgress: false // Controller will now handle auto-starting first trick
    });
}

// Helper function to format player names
function formatPlayerName(playerId) {
    if (playerId === 'player1') return 'Human';
    return `Player ${playerId.replace('player', '')}`;
}

// --- Game Logic Functions ---
// Called by Controller via activeGame.startTrick when "Next Trick" is clicked
async function startTrick(startingPlayer) {
    console.log(`Hearts.js: Starting trick, leader: ${startingPlayer}`);
    if (roundOver_hearts) {
        console.log("Hearts.js: startTrick called but round is over.");
        // Signal back just in case controller state desynced
        controllerUpdateState({ trickInProgress: false, roundOver: true });
        return;
    }
     if (trickInProgress_hearts) {
         console.warn("Hearts.js: startTrick called while another trick is already in progress!");
         return; // Prevent overlapping tricks
     }

    trickInProgress_hearts = true; // Mark trick as started within the module
    inPlay = []; // Clear cards from previous trick
    players_hearts.forEach((player) => {
        if (uiElements.playAreas && uiElements.playAreas[player]) {
            uiElements.playAreas[player].innerHTML = "";
        } else {
            console.error(`UI element playAreas[${player}] not found during trick start!`);
        }
    });
    humanPlayerTurn_hearts = false;

    let turnOrder = getNextPlayers(startingPlayer);
    console.log(`Hearts.js: Turn order: ${turnOrder.join(', ')}`);

    try {
        for (let i = 0; i < turnOrder.length; i++) {
            let player = turnOrder[i];
            console.log(`Hearts.js: Current turn: ${player}`);
            if (roundOver_hearts) {
                console.log(`Hearts.js: Round ended mid-trick (player ${player}'s turn).`);
                break; // Exit loop if round ended due to score
            }
            let leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
            let playedCard = null;

            if (player === "player1") {
                humanPlayerTurn_hearts = true;
                console.log("Hearts.js: Waiting for human player...");
                playedCard = await waitForPlayer1(leadSuit);
                humanPlayerTurn_hearts = false;
                if (!playedCard) {
                    console.error("P1 failed to play (Hearts).waitForPlayer1 resolved without a card.");
                    // This indicates a potential issue in waitForPlayer1 or handleHumanClick logic
                    // For now, we have to stop the trick to avoid getting stuck.
                     throw new Error("Human player action failed."); // Throw error to stop trick
                }
                console.log(`Hearts.js: Human played: ${playedCard.value}${playedCard.suit}`);
            } else {
                console.log(`Hearts.js: AI ${player} thinking...`);
                await controllerDelay(600); // Use shared delay
                playedCard = selectCard_AI(player, leadSuit);
                 if (playedCard) {
                     console.log(`Hearts.js: AI ${player} played: ${playedCard.value}${playedCard.suit}`);
                 } else {
                      console.error(`AI ${player} returned null card.`);
                      // AI failed, stop the trick
                      throw new Error(`AI player ${player} failed to select a card.`);
                 }
            }

            // Add player property dynamically
            // Ensure playedCard is an object before assigning
            if (playedCard && typeof playedCard === 'object') {
                 playedCard.player = player;
                 inPlay.push(playedCard);    // Add to logical trick state
                 playCardToBoard(playedCard, player); // Update UI and hand state
             } else {
                 console.error(`Invalid playedCard object received for player ${player}.`);
                 throw new Error(`Invalid card from player ${player}.`);
             }
        }

        // --- Trick Resolution (only if loop completed naturally) ---
        console.log("Hearts.js: Trick loop finished. Processing outcome...");
        if (inPlay.length === 4 && !roundOver_hearts) {
            let trickWinner = determineTrickWinner(inPlay);
            let points = determineTrickScore(inPlay); // Score based on hearts taken
            totalHeartsPlayed += points;

            if (trickWinner) {
                let winnerIndex = players_hearts.indexOf(trickWinner);
                if (winnerIndex !== -1) {
                    roundScore_hearts[winnerIndex] += points;
                    console.log(`Hearts.js: Trick winner: ${trickWinner}. Points: ${points}. Round Score: ${roundScore_hearts.join(',')}. Total Hearts: ${totalHeartsPlayed}`);
                } else {
                     console.error(`Trick winner ${trickWinner} not found in players array!`);
                }
            } else {
                 console.log("Hearts.js: No trick winner determined."); // Could happen if determineTrickWinner fails
            }

            currentStarter_hearts = trickWinner || startingPlayer; // Winner starts next trick
            controllerActiveGameRef.updateStarter(currentStarter_hearts);
            roundOver_hearts = checkRoundOver(playerHands, totalHeartsPlayed); // Check if round ends

            // Check if round over and determine the notification message
            if (roundOver_hearts) {
                console.log("Hearts.js: Round Over condition met after trick.");
                if (totalHeartsPlayed >= 8) {
                    // Specific message if all hearts were played
                    controllerShowNotification("All hearts have been played. Click Deal."); 
                } else {
                    // Generic message if round ended due to empty hands before 8 hearts
                    controllerShowNotification(`Hearts Round Over! Click Next Round.`); 
                }
            } else {
                 // Log if trick finished but round continues
                 console.log(`Hearts.js: Trick complete. Next starter: ${currentStarter_hearts}. Waiting for next action.`);
            }
        } else if (roundOver_hearts) {
             console.log("Hearts.js: Trick processing skipped as round ended mid-trick.");
        } else {
            // This case (inPlay.length !== 4) should ideally not happen if loop completes
            console.warn(`Hearts.js: Trick ended with ${inPlay.length} cards. Not processing score normally.`);
        }

    } catch (error) {
        console.error("Hearts.js: Error during trick execution:", error);
        // If an error occurred (like player failing to play), we might be in an inconsistent state.
        // Mark the round as over to prevent getting stuck? Or maybe just mark trick failed?
        // For now, let's just ensure we signal the trick attempt is over.
        roundOver_hearts = true; // Mark round over to be safe if trick failed badly
    } finally {
        // --- Signal Trick Completion (Finally Block) ---
        isFirstTrick_hearts = false;
        trickInProgress_hearts = false;

        // Update controller: trick is no longer in progress, update roundOver status,
        // AND send the current accumulated round score for display.
        console.log(`Hearts.js: Trick attempt finished. Updating controller state (trickInProgress=false, roundOver=${roundOver_hearts}, currentRoundScore=${roundScore_hearts.join(',')})`);
        controllerUpdateState({ 
            trickInProgress: false, 
            roundOver: roundOver_hearts, 
            currentRoundScore: roundScore_hearts // Send current round score
        });
    }
}


function clearBoard() {
    players_hearts.forEach((player) => {
        if(uiElements.playAreas && uiElements.playAreas[player]) {
            uiElements.playAreas[player].innerHTML = "";
        } else {
             console.error(`UI element playAreas[${player}] not found during clearBoard!`);
        }
    });
    // inPlay is reset in startTrick
}

function renderHands() {
     players_hearts.forEach((player) => {
         if (!uiElements.handsEls || !uiElements.handsEls[player]) {
             console.error(`UI element handsEls[${player}] not found during renderHands!`);
             return;
         }
         uiElements.handsEls[player].innerHTML = "";
         if (playerHands[player] && Array.isArray(playerHands[player])) {
             if (player === 'player1') {
                  playerHands[player].sort((a, b) => {
                      if (a.suit < b.suit) return -1; if (a.suit > b.suit) return 1;
                      return cardRanks_hearts[a.value] - cardRanks_hearts[b.value];
                  });
              }
             playerHands[player].forEach((card) => {
                 let cardHTML = player === "player1"
                     ? `<div class="card ${cardStyle_hearts[card.suit]}" data-value="${card.value}" data-suit="${card.suit}"><span>${card.value}</span>${card.suit}</div>`
                     : `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`;
                 uiElements.handsEls[player].insertAdjacentHTML("beforeend", cardHTML);
             });
         } else {
              console.warn(`Player hand for ${player} is not ready or invalid during render.`);
         }
     });
     // We only attach listeners when it becomes the human's turn inside waitForPlayer1
     // attachHumanCardListeners();
     console.log("Hearts.js: renderHands completed.");
}

function getNextPlayers(startingPlayer) {
    let order = [...players_hearts];
    let startIndex = order.indexOf(startingPlayer);
    if (startIndex === -1) {
        console.warn(`Starting player ${startingPlayer} not found, defaulting to index 0.`);
        startIndex = 0;
    }
    return [...order.slice(startIndex), ...order.slice(0, startIndex)];
}

function playCardToBoard(card, player) {
    // Assumes card.player has been set before calling
    if (!card || !card.player) {
        console.error("playCardToBoard called with invalid card/player for player:", player, card);
        return;
    }
     if (!playerHands[player]) {
        console.error(`playCardToBoard: Player hand for ${player} does not exist.`);
        return;
    }

    // Remove card from logical hand state
    const initialLength = playerHands[player].length;
    playerHands[player] = playerHands[player].filter(c => !(c.value === card.value && c.suit === card.suit));
    if (playerHands[player].length === initialLength) {
         console.warn(`Card ${card.value}${card.suit} not found in ${player}'s hand during filter.`);
    }

    // Update UI
    if (player !== 'player1') {
        if (uiElements.handsEls && uiElements.handsEls[player] && uiElements.handsEls[player].firstChild) {
            uiElements.handsEls[player].removeChild(uiElements.handsEls[player].firstChild);
        }
    } else {
        // Re-render human hand to show remaining cards
        // Listeners are handled by waitForPlayer1/handleHumanClick now
        renderHands();
    }
    // Display the played card on the board
    if(uiElements.playAreas && uiElements.playAreas[player]) {
        uiElements.playAreas[player].innerHTML = `<div class="card ${cardStyle_hearts[card.suit]}">${card.value} ${card.suit}</div>`;
    } else {
         console.error(`UI element playAreas[${player}] not found! Cannot display played card.`);
    }
}

// --- AI Logic ---
function selectCard_AI(player, leadSuit) {
    const playerCards = playerHands[player];
    if (!playerCards || playerCards.length === 0) {
        console.error(`AI ${player} has no cards to play.`);
        return null;
    }

    const cardsOfLeadSuit = playerCards.filter(card => card.suit === leadSuit);
    const heartsInHand = playerCards.filter(card => card.suit === '♥');
    const nonHeartsInHand = playerCards.filter(card => card.suit !== '♥');

    // 1. Must follow suit if possible
    if (leadSuit && cardsOfLeadSuit.length > 0) {
        // console.log(`AI ${player}: Following suit ${leadSuit}.`);
        return cardsOfLeadSuit.reduce((lowest, card) =>
            cardRanks_hearts[card.value] < cardRanks_hearts[lowest.value] ? card : lowest
        );
    }

    // 2. Cannot follow suit (or no lead suit yet)
    // console.log(`AI ${player}: Cannot follow suit ${leadSuit} or is leading.`);
    if (!leadSuit) { // Leading the trick
        if (nonHeartsInHand.length > 0) {
            // console.log(`AI ${player}: Leading with lowest non-heart.`);
            return nonHeartsInHand.reduce((lowest, card) =>
                cardRanks_hearts[card.value] < cardRanks_hearts[lowest.value] ? card : lowest
            );
        } else {
            // console.log(`AI ${player}: Leading with lowest heart (only hearts left).`);
            return heartsInHand.reduce((lowest, card) =>
                cardRanks_hearts[card.value] < cardRanks_hearts[lowest.value] ? card : lowest
            );
        }
    } else { // Cannot follow suit, discarding
        if (nonHeartsInHand.length > 0) {
            // console.log(`AI ${player}: Discarding highest non-heart.`);
            return nonHeartsInHand.reduce((highest, card) =>
                cardRanks_hearts[card.value] > cardRanks_hearts[highest.value] ? card : highest
            );
        } else {
            // console.log(`AI ${player}: Discarding highest heart (only hearts left).`);
            return heartsInHand.reduce((highest, card) =>
                cardRanks_hearts[card.value] > cardRanks_hearts[highest.value] ? card : highest
            );
        }
    }
}

// --- Trick/Round Logic Utilities ---
function determineTrickWinner(trickCards) {
    if (!trickCards || trickCards.length !== 4) {
         console.error(`determineTrickWinner called with invalid trickCards (length ${trickCards ? trickCards.length : 0}).`);
         return null;
    }

    const leadSuit = trickCards[0].suit;
    let winningCard = null;
    const cardsOfLeadSuit = trickCards.filter(card => card.suit === leadSuit);

    if (cardsOfLeadSuit.length > 0) {
        winningCard = cardsOfLeadSuit.reduce((highest, card) => {
            return cardRanks_hearts[card.value] > cardRanks_hearts[highest.value] ? card : highest;
        });
    } else {
        winningCard = trickCards[0]; // First card wins if no one followed suit
        console.warn(`Hearts.js: No cards of lead suit ${leadSuit} found in trick. First card wins.`);
    }

    if (!winningCard || !winningCard.player) {
         console.error("Winning card determined but has no player assigned!", winningCard);
         return null;
    }
    return winningCard.player;
}

function determineTrickScore(trickCards) {
    return trickCards.filter(card => card.suit === '♥').length;
}

function checkRoundOver(currentHands, heartsPlayedCount) {
    const handsEmpty = players_hearts.every((player) => !currentHands[player] || currentHands[player].length === 0);
    if (handsEmpty) {
        return true;
    }
    if (heartsPlayedCount >= 8) {
        return true;
    }
    return false;
}

// --- Human Interaction ---
 function attachHumanCardListeners() {
    if (!uiElements.handsEls || !uiElements.handsEls.player1) {
        console.error("Cannot attach listeners: Human hand UI element not found.");
        return;
    }
    const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
    cardElements.forEach((cardEl) => {
        cardEl.removeEventListener("click", handleHumanClick); // Clean up old
        cardEl.addEventListener("click", handleHumanClick);    // Add new
    });
     // console.log(`Hearts.js: Attached listeners to ${cardElements.length} human cards.`);
}

function removeHumanCardListeners() {
     if (!uiElements.handsEls || !uiElements.handsEls.player1) return;
     const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
     cardElements.forEach((cardEl) => {
        cardEl.removeEventListener("click", handleHumanClick);
    });
     // console.log(`Hearts.js: Removed listeners from ${cardElements.length} human cards.`);
}

function handleHumanClick(event) {
    if (!humanPlayerTurn_hearts || !humanCardSelectionResolver_hearts) {
        // console.log("Hearts.js: Ignoring click, not human turn or resolver not set.");
        return;
    }
    const clickedCardEl = event.target.closest(".card");
    if (!clickedCardEl) return;

    const leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
    const cardValue = clickedCardEl.dataset.value;
    const cardSuit = clickedCardEl.dataset.suit;
    const playedCard = playerHands.player1.find(card => card.value === cardValue && card.suit === cardSuit);

    if (!playedCard) {
        console.error(`Hearts.js: Clicked card (${cardValue}${cardSuit}) not found in logical hand!`);
        return;
    }

    // Validation
    const hasLeadSuitOnHand = playerHands.player1.some(card => card.suit === leadSuit);
    if (leadSuit && hasLeadSuitOnHand && playedCard.suit !== leadSuit) {
        controllerShowNotification(`You must play a ${leadSuit} card!`);
        return; // Wait for valid play
    }
    if (isFirstTrick_hearts && inPlay.length === 0 && playedCard.suit === '♥') {
         const onlyHasHearts = playerHands.player1.every(card => card.suit === '♥');
         if (!onlyHasHearts) {
            controllerShowNotification(`You cannot lead Hearts on the first trick!`);
            return; // Wait for valid play
         }
    }

    // Valid play
    console.log(`Hearts.js: Human selected valid card: ${playedCard.value}${playedCard.suit}`);
    humanPlayerTurn_hearts = false; // Mark turn as logically over
    removeHumanCardListeners(); // Prevent further clicks
    if (uiElements.handsEls && uiElements.handsEls.player1) {
        uiElements.handsEls.player1.classList.remove('active-turn'); // Remove highlight
    }

    // IMPORTANT: Resolve the promise *after* UI updates/listener removal
    humanCardSelectionResolver_hearts(playedCard);
    humanCardSelectionResolver_hearts = null; // Clear resolver
}


function waitForPlayer1(leadSuit) {
    console.log(`Hearts.js: Waiting for Player 1 input (lead: ${leadSuit || 'None'})...`);
    return new Promise((resolve, reject) => { // Added reject
      // Ensure previous resolver is cleared if any
       if (humanCardSelectionResolver_hearts) {
            console.warn("waitForPlayer1 called while a previous resolver was active. Clearing old.");
            humanCardSelectionResolver_hearts = null; // Or potentially reject previous promise?
       }

      humanCardSelectionResolver_hearts = resolve; // Set the resolver for handleHumanClick
      attachHumanCardListeners(); // Ensure listeners are active on current cards
      if (uiElements.handsEls && uiElements.handsEls.player1) {
        uiElements.handsEls.player1.classList.add('active-turn'); // Highlight human hand
      }
      // Potential TODO: Add a timeout mechanism? What if user never clicks?
      // setTimeout(() => reject(new Error("Player 1 timed out")), 30000); // Example 30s timeout

    }).finally(() => {
         // Clean up happens within handleHumanClick upon valid selection
         console.log("Hearts.js: Player 1 promise finished.");
         // Ensure resolver is cleared if promise finished without a click (e.g., rejected by timeout)
         if (humanCardSelectionResolver_hearts) {
             humanCardSelectionResolver_hearts = null;
         }
         // Ensure highlight is removed
         if (uiElements.handsEls && uiElements.handsEls.player1) {
            uiElements.handsEls.player1.classList.remove('active-turn');
         }
         // Ensure listeners are removed if promise ends without click
         removeHumanCardListeners();
    });
}


// --- Registration Function (Exported) ---
export function register(controllerGameObj, sharedState) {
    console.log("Hearts.js: Registering with controller.");
    if (!sharedState || typeof sharedState !== 'object') {
         console.error("Hearts.js: Invalid sharedState received during registration.");
         return;
    }
    // Store references
    playerHands = sharedState.playerHands;
    inPlay = sharedState.inPlay;
    uiElements = sharedState.uiElements;
    controllerUpdateState = sharedState.updateGameState;
    controllerUpdateScores = sharedState.updateTotalScores;
    controllerShowNotification = sharedState.showNotification;
    controllerDelay = sharedState.delay;
    controllerActiveGameRef = controllerGameObj;

     // Verification (Optional)
     // ... (checks omitted for brevity) ...

    // Populate the controller's activeGame object
    controllerGameObj.name = 'hearts';
    controllerGameObj.init = initHeartsRound;     // Called by Deal button
    controllerGameObj.startTrick = startTrick; // Called by Next Trick button

    console.log("Hearts.js module registered successfully.");
    // Reset internal module state flags upon registration
    heartsRoundStarted = false;
    roundOver_hearts = false;
    isFirstTrick_hearts = true;
    trickInProgress_hearts = false;
    totalHeartsPlayed = 0;
    roundScore_hearts = [0, 0, 0, 0];

    // Get the starting player from controller
    currentStarter_hearts = controllerGameObj.currentStarter;
    console.log(`Hearts.js: Starting player from controller registration: ${currentStarter_hearts}`);
}

console.log("Hearts.js module loaded.");