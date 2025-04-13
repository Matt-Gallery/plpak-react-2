// queens.js - ES6 Module Version for No Queens Round

// --- Constants (Module-scoped) ---
const deck_queens = [
  { value: "7", suit: "♥" }, { value: "8", suit: "♥" }, { value: "9", suit: "♥" }, { value: "10", suit: "♥" }, { value: "J", suit: "♥" }, { value: "Q", suit: "♥" }, { value: "K", suit: "♥" }, { value: "A", suit: "♥" },
  { value: "7", suit: "♦" }, { value: "8", suit: "♦" }, { value: "9", suit: "♦" }, { value: "10", suit: "♦" }, { value: "J", suit: "♦" }, { value: "Q", suit: "♦" }, { value: "K", suit: "♦" }, { value: "A", suit: "♦" },
  { value: "7", suit: "♣" }, { value: "8", suit: "♣" }, { value: "9", suit: "♣" }, { value: "10", suit: "♣" }, { value: "J", suit: "♣" }, { value: "Q", suit: "♣" }, { value: "K", suit: "♣" }, { value: "A", suit: "♣" },
  { value: "7", suit: "♠" }, { value: "8", suit: "♠" }, { value: "9", suit: "♠" }, { value: "10", suit: "♠" }, { value: "J", suit: "♠" }, { value: "Q", suit: "♠" }, { value: "K", suit: "♠" }, { value: "A", suit: "♠" },
];
const cardStyle_queens = { "♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades" };
const cardRanks_queens = { 7: 1, 8: 2, 9: 3, 10: 4, J: 5, Q: 6, K: 7, A: 8 };
const players_queens = ["player1", "player2", "player3", "player4"];

// --- Module State (References to Controller State/Functions) ---
let playerHands = {};
let inPlay = [];
let uiElements = {};
let controllerUpdateState = () => {};
let controllerUpdateScores = () => {}; // Keep for potential future use?
let controllerShowNotification = () => {};
let controllerDelay = () => {};
let controllerActiveGameRef = {};

// --- Module-Specific State ---
let roundScore_queens = [0, 0, 0, 0];
let currentStarter_queens = null; // Will be set from controller
let roundOver_queens = false;
let isFirstTrick_queens = true;
let humanPlayerTurn_queens = false;
let humanCardSelectionResolver_queens = null;
let totalQueensPlayed = 0;
let queensRoundStarted = false;
let trickInProgress_queens = false;

// Helper function to format player names
function formatPlayerName(playerId) {
    if (playerId === 'player1') return 'Human';
    return `Player ${playerId.replace('player', '')}`;
}

// --- Initialization Function (Called by Controller via activeGame.init) ---
function initQueensRound() {
    console.log("Queens.js: initQueensRound called.");
    if (queensRoundStarted) {
        console.log("Queens.js: Round already started.");
        return;
    }
    queensRoundStarted = true;
    roundOver_queens = false;
    trickInProgress_queens = false;
    isFirstTrick_queens = true;
    humanPlayerTurn_queens = false;
    humanCardSelectionResolver_queens = null;
    roundScore_queens = [0, 0, 0, 0];
    totalQueensPlayed = 0;

    // Get the starting player from the controller
    currentStarter_queens = controllerActiveGameRef.currentStarter;
    console.log(`Queens.js: Using starting player from controller: ${currentStarter_queens}`);
    
    // Confirm the starter with the controller
    controllerActiveGameRef.updateStarter(currentStarter_queens);

    // Deal cards
    let shuffledDeck = [...deck_queens];
    for (let i = shuffledDeck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    for (let player of players_queens) {
         if (!playerHands[player]) playerHands[player] = [];
         playerHands[player] = []; // Clear existing
    }
    let cardIndex = 0;
    while (cardIndex < shuffledDeck.length) {
        for (let player of players_queens) {
            if (!playerHands[player]) playerHands[player] = [];
            if (cardIndex < shuffledDeck.length && playerHands[player].length < 8) {
                playerHands[player].push(shuffledDeck[cardIndex]);
                cardIndex++;
            }
        }
    }

    renderHands();
    clearBoard();
    controllerShowNotification(`Queens Round Started! ${formatPlayerName(currentStarter_queens)} starts.`);

    // Update controller state
    console.log("Queens.js: Round initialized, updating controller state.");
    controllerUpdateState({
        gameStarted: true,
        roundOver: false,
        trickInProgress: false // Controller will now handle auto-starting first trick
    });
}

// --- Game Logic Functions ---
// Called by Controller via activeGame.startTrick
async function startTrick(startingPlayer) {
  console.log(`Queens.js: Starting trick, leader: ${startingPlayer}`);
  if (roundOver_queens || trickInProgress_queens) {
      console.warn(`Queens.js: startTrick called unexpectedly (roundOver=${roundOver_queens}, trickInProgress=${trickInProgress_queens})`);
      controllerUpdateState({ trickInProgress: false, roundOver: roundOver_queens });
      return;
  }

  trickInProgress_queens = true; // Mark trick as running *within this module*
  inPlay = [];
  players_queens.forEach((player) => {
      if (uiElements.playAreas && uiElements.playAreas[player]) {
          uiElements.playAreas[player].innerHTML = "";
      } else { console.error(`UI element playAreas[${player}] not found!`); }
  });
  humanPlayerTurn_queens = false;
  let turnOrder = getNextPlayers(startingPlayer);
  console.log(`Queens.js: Turn order: ${turnOrder.join(', ')}`);

  try {
      for (let i = 0; i < turnOrder.length; i++) {
          let player = turnOrder[i];
          console.log(`Queens.js: Current turn: ${player}`);
          if (roundOver_queens) {
              console.log(`Queens.js: Round ended mid-trick (player ${player}'s turn).`);
              break;
          }
          let leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
          let playedCard = null;

          if (player === "player1") {
              humanPlayerTurn_queens = true;
              console.log("Queens.js: Waiting for human player...");
              playedCard = await waitForPlayer1(leadSuit);
              humanPlayerTurn_queens = false; // Ensure this is set even if promise rejects? (Handled in finally)
              if (!playedCard) throw new Error("Human player action failed.");
              console.log(`Queens.js: Human played: ${playedCard.value}${playedCard.suit}`);
          } else {
              console.log(`Queens.js: AI ${player} thinking...`);
              await controllerDelay(600);
              // Pass currentStarter for AI context if needed by its logic
              playedCard = selectCard_AI(player, leadSuit, startingPlayer);
               if (!playedCard) throw new Error(`AI player ${player} failed to select a card.`);
               console.log(`Queens.js: AI ${player} played: ${playedCard.value}${playedCard.suit}`);
          }

          // Assign player property and update state/UI
          if (playedCard && typeof playedCard === 'object') {
               playedCard.player = player;
               inPlay.push(playedCard);
               playCardToBoard(playedCard, player);
           } else {
               // Should not happen if errors are thrown above
               throw new Error(`Invalid card obtained from player ${player}.`);
           }
      }

      // --- Trick Resolution (only if loop completed) ---
      console.log("Queens.js: Trick loop finished. Processing outcome...");
      if (inPlay.length === 4 && !roundOver_queens) { // Ensure exactly 4 cards and round didn't end prematurely
          let trickWinner = determineTrickWinner(inPlay);
          let points = determineTrickScore(inPlay); // Score based on Queens
          let queensInTrick = inPlay.filter(c => c.value === 'Q').length;
          totalQueensPlayed += queensInTrick;

          if (trickWinner) {
              let winnerIndex = players_queens.indexOf(trickWinner);
              if (winnerIndex !== -1 && points > 0) {
                  roundScore_queens[winnerIndex] += points;
                  console.log(`Queens.js: Trick winner: ${trickWinner}. Points: ${points}. Round Score: ${roundScore_queens.join(',')}. Total Queens: ${totalQueensPlayed}`);
              } else if (winnerIndex !== -1) {
                   console.log(`Queens.js: Trick winner: ${trickWinner}. Points: 0.`);
              } else {
                   console.error(`Trick winner ${trickWinner} not found!`);
              }
          } else {
               console.log("Queens.js: No trick winner determined.");
          }

          currentStarter_queens = trickWinner || startingPlayer; // Winner leads next
          controllerActiveGameRef.updateStarter(currentStarter_queens);
          roundOver_queens = checkRoundOver(playerHands, totalQueensPlayed); // Check if round ends

          // Check if round over and determine the notification message
          if (roundOver_queens) {
              console.log("Queens.js: Round Over condition met after trick.");
              if (totalQueensPlayed >= 4) {
                  // Specific message if all queens were played
                  controllerShowNotification("All queens have been played. Click Deal.");
              } else {
                  // Generic message if round ended due to empty hands before 4 queens
                  controllerShowNotification(`Queens Round Over! Click Deal.`);
              }
          }

      } else if (roundOver_queens) {
           console.log("Queens.js: Trick processing skipped as round ended mid-trick.");
      } else {
           console.warn(`Queens.js: Trick ended with ${inPlay.length} cards. Not processing score.`);
      }

  } catch (error) {
      console.error("Queens.js: Error during trick execution:", error);
      roundOver_queens = true; // Mark round over on error to prevent getting stuck
  } finally {
      // --- Signal Trick Completion ---
      isFirstTrick_queens = false; // Whether successful or not, first attempt is done
      trickInProgress_queens = false; // Mark trick as no longer running *within this module*

      // Update controller: trick attempt is finished, send final state
      console.log(`Queens.js: Trick attempt finished. Updating controller state (trickInProgress=false, roundOver=${roundOver_queens}, currentRoundScore=${roundScore_queens.join(',')})`);
      // Send a copy of the score array to prevent mutation issues
      controllerUpdateState({
          trickInProgress: false,
          roundOver: roundOver_queens,
          currentRoundScore: [...roundScore_queens]
      });
  }
}

// --- UI Functions ---\
function clearBoard() {
  players_queens.forEach((player) => {
      if(uiElements.playAreas && uiElements.playAreas[player]) {
          uiElements.playAreas[player].innerHTML = "";
      } else { console.error(`UI element playAreas[${player}] not found during clearBoard!`); }
  });
}

function renderHands() {
   players_queens.forEach((player) => {
       if (!uiElements.handsEls || !uiElements.handsEls[player]) {
           console.error(`UI element handsEls[${player}] not found during renderHands!`);
           return;
       }
       uiElements.handsEls[player].innerHTML = "";
       if (playerHands[player] && Array.isArray(playerHands[player])) {
           if (player === 'player1') {
                playerHands[player].sort((a, b) => {
                    if (a.suit < b.suit) return -1; if (a.suit > b.suit) return 1;
                    return cardRanks_queens[a.value] - cardRanks_queens[b.value];
                });
            }
           playerHands[player].forEach((card) => {
               let cardHTML = player === "player1"
                   ? `<div class="card ${cardStyle_queens[card.suit]}" data-value="${card.value}" data-suit="${card.suit}"><span>${card.value}</span>${card.suit}</div>`
                   : `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`;
               uiElements.handsEls[player].insertAdjacentHTML("beforeend", cardHTML);
           });
       } else { console.warn(`Player hand for ${player} is invalid during render.`); }
   });
   console.log("Queens.js: renderHands completed.");
   // Listeners are attached only when needed in waitForPlayer1
}

function playCardToBoard(card, player) {
  // Assumes card.player has been set before calling
  if (!card || !card.player) {
      console.error("playCardToBoard called with invalid card/player:", player, card);
      return;
  }
   if (!playerHands[player]) {
      console.error(`Player hand for ${player} does not exist.`);
      return;
  }
  // Remove card from logical hand
  const initialLength = playerHands[player].length;
  playerHands[player] = playerHands[player].filter(c => !(c.value === card.value && c.suit === card.suit));
  if (playerHands[player].length === initialLength) console.warn(`Card ${card.value}${card.suit} not found in ${player}'s hand.`);

  // Update UI
  if (player !== 'player1') {
      if (uiElements.handsEls && uiElements.handsEls[player] && uiElements.handsEls[player].firstChild) {
          uiElements.handsEls[player].removeChild(uiElements.handsEls[player].firstChild);
      }
  } else {
      renderHands(); // Re-render human hand
  }
  if(uiElements.playAreas && uiElements.playAreas[player]) {
      uiElements.playAreas[player].innerHTML = `<div class="card ${cardStyle_queens[card.suit]}">${card.value} ${card.suit}</div>`;
  } else { console.error(`UI element playAreas[${player}] not found!`); }
}

// --- AI Logic ---
// AI Strategy: Avoid taking Queens!
function selectCard_AI(player, leadSuit, currentStarter) { // Added currentStarter
  const playerCards = playerHands[player];
  if (!playerCards || playerCards.length === 0) {
      console.error(`AI ${player} has no cards.`);
      return null;
  }

  const isLeading = !leadSuit;
  const queensInHand = playerCards.filter((card) => card.value === "Q");
  const hasLeadSuit = leadSuit ? playerCards.some((card) => card.suit === leadSuit) : false;
  const cardsOfLeadSuit = leadSuit ? playerCards.filter((card) => card.suit === leadSuit) : [];
  const nonQueensOfLeadSuit = cardsOfLeadSuit.filter(c => c.value !== 'Q');

  // 1. Must follow suit if possible
  if (leadSuit && hasLeadSuit) {
      // If have non-Queens of lead suit, play the lowest safe one
      if (nonQueensOfLeadSuit.length > 0) {
           // Simple: Play lowest non-queen of lead suit
           return nonQueensOfLeadSuit.reduce((lowest, card) => cardRanks_queens[card.value] < cardRanks_queens[lowest.value] ? card : lowest);
           // TODO: More advanced: Check if playing highest non-queen is safe (won't win if a Queen is out there?)
      }
      // If only have Queens of lead suit, must play one (play lowest rank Queen)
      else { // cardsOfLeadSuit contains only Queens
           return cardsOfLeadSuit.reduce((lowest, card) => cardRanks_queens[card.value] < cardRanks_queens[lowest.value] ? card : lowest);
      }
  }

  // 2. Cannot follow suit (or leading)
  // A. Leading the trick
  if (isLeading) {
       // Try to lead with lowest non-Queen card
       const nonQueens = playerCards.filter(c => c.value !== 'Q');
       if (nonQueens.length > 0) {
           return nonQueens.reduce((lowest, card) => cardRanks_queens[card.value] < cardRanks_queens[lowest.value] ? card : lowest);
       }
       // If only Queens left, must lead with one (lowest)
       return queensInHand.reduce((lowest, card) => cardRanks_queens[card.value] < cardRanks_queens[lowest.value] ? card : lowest);
  }
  // B. Cannot follow suit, discarding
  else {
      // Discard highest Queen first (get rid of liability)
      if (queensInHand.length > 0) {
          return queensInHand.reduce((highest, card) => cardRanks_queens[card.value] > cardRanks_queens[highest.value] ? card : highest);
      }
      // If no Queens, discard highest other card
      return playerCards.reduce((highest, card) => cardRanks_queens[card.value] > cardRanks_queens[highest.value] ? card : highest);
  }
}


// --- Trick/Round Logic Utilities ---
function getNextPlayers(startingPlayer) {
  let order = [...players_queens];
  let startIndex = order.indexOf(startingPlayer);
  if (startIndex === -1) {
      console.warn(`Starting player ${startingPlayer} not found, defaulting.`);
      startIndex = 0;
  }
  return [...order.slice(startIndex), ...order.slice(0, startIndex)];
}

function determineTrickWinner(trickCards) {
  if (!trickCards || trickCards.length !== 4) {
      console.error("determineTrickWinner: Invalid trickCards length");
      return null;
  }
  const leadSuit = trickCards[0].suit;
  const cardsOfLeadSuit = trickCards.filter(card => card.suit === leadSuit);
  let winningCard = null;
  if (cardsOfLeadSuit.length > 0) {
      winningCard = cardsOfLeadSuit.reduce((highest, card) => cardRanks_queens[card.value] > cardRanks_queens[highest.value] ? card : highest);
  } else {
      winningCard = trickCards[0]; // First card wins if no one followed suit
      console.warn(`Queens.js: No cards of lead suit ${leadSuit}. First card wins.`);
  }
  // Ensure player property exists
  if (!winningCard || !winningCard.player) {
       console.error("Winning card determined but has no player assigned!", winningCard);
       // Try to find original card with player prop (less reliable fallback)
       const originalCard = trickCards.find(c => c.value === winningCard.value && c.suit === winningCard.suit && c.player);
       return originalCard ? originalCard.player : null;
  }
  return winningCard.player;
}

// Score 2 points for each Queen taken in the trick
function determineTrickScore(trickCards) {
  const queensCount = trickCards.filter(card => card.value === "Q").length;
  return queensCount * 2;
}

// Round ends when hands are empty OR all 4 Queens have been played
function checkRoundOver(currentHands, queensPlayedCount) {
  const handsEmpty = players_queens.every((player) => !currentHands[player] || currentHands[player].length === 0);
  if (handsEmpty) {
      console.log("Queens.js: Hands empty. Round OVER.");
      return true;
  }
  // Check based on total Queens captured during the round
  if (queensPlayedCount >= 4) {
      console.log(`Queens.js: ${queensPlayedCount} queens played. Round OVER.`);
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
}

function removeHumanCardListeners() {
   if (!uiElements.handsEls || !uiElements.handsEls.player1) return;
   const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
   cardElements.forEach((cardEl) => {
      cardEl.removeEventListener("click", handleHumanClick);
  });
}

function handleHumanClick(event) {
  if (!humanPlayerTurn_queens || !humanCardSelectionResolver_queens) return;
  const clickedCardEl = event.target.closest(".card");
  if (!clickedCardEl) return;

  const leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
  const cardValue = clickedCardEl.dataset.value;
  const cardSuit = clickedCardEl.dataset.suit;
  const playedCard = playerHands.player1.find(card => card.value === cardValue && card.suit === cardSuit);

  if (!playedCard) {
      console.error(`Queens.js: Clicked card (${cardValue}${cardSuit}) not found!`);
      return;
  }

  // Validation
  const hasLeadSuitOnHand = playerHands.player1.some(card => card.suit === leadSuit);
  if (leadSuit && hasLeadSuitOnHand && playedCard.suit !== leadSuit) {
      controllerShowNotification(`You must play a ${leadSuit} card!`);
      return; // Wait for valid play
  }
  // No other specific rules for human in Queens?

  // Valid play
  console.log(`Queens.js: Human selected: ${playedCard.value}${playedCard.suit}`);
  humanPlayerTurn_queens = false;
  removeHumanCardListeners(); // Prevent further clicks immediately
  if (uiElements.handsEls && uiElements.handsEls.player1) {
      uiElements.handsEls.player1.classList.remove('active-turn');
  }

  // Resolve the promise AFTER UI updates
  humanCardSelectionResolver_queens(playedCard);
  humanCardSelectionResolver_queens = null; // Clear resolver
}

function waitForPlayer1(leadSuit) {
  console.log(`Queens.js: Waiting for Player 1 (lead: ${leadSuit || 'None'})...`);
  return new Promise((resolve, reject) => { // Add reject
     // Clear any lingering resolver
     if (humanCardSelectionResolver_queens) {
          console.warn("Queens.js: waitForPlayer1 resolver already active! Clearing.");
          // Potentially reject the old promise if that makes sense?
          // humanCardSelectionResolver_queens(null); // Or reject(new Error("New turn started"));
     }
    humanCardSelectionResolver_queens = resolve;
    attachHumanCardListeners(); // Ensure listeners are attached
    if (uiElements.handsEls && uiElements.handsEls.player1) {
      uiElements.handsEls.player1.classList.add('active-turn');
    }
    // Add a timeout?
    // setTimeout(() => reject(new Error("Player 1 timed out")), 30000);

  }).finally(() => {
       console.log("Queens.js: Player 1 promise finished.");
       // Ensure resolver is cleared
       if (humanCardSelectionResolver_queens) humanCardSelectionResolver_queens = null;
       // Ensure UI cleanup
       if (uiElements.handsEls && uiElements.handsEls.player1) {
          uiElements.handsEls.player1.classList.remove('active-turn');
       }
       removeHumanCardListeners(); // Ensure listeners are removed
  });
}

// --- Registration Function (Exported) ---
export function register(controllerGameObj, sharedState) {
  console.log("Queens.js: Registering with controller.");
  if (!sharedState) {
       console.error("Queens.js: Invalid sharedState provided.");
       return;
  }
  // Store references
  playerHands = sharedState.playerHands;
  inPlay = sharedState.inPlay;
  uiElements = sharedState.uiElements;
  controllerUpdateState = sharedState.updateGameState;
  controllerUpdateScores = sharedState.updateTotalScores; // Check if needed
  controllerShowNotification = sharedState.showNotification;
  controllerDelay = sharedState.delay;
  controllerActiveGameRef = controllerGameObj;

  // Populate the controller's activeGame object
  controllerGameObj.name = 'queens';
  controllerGameObj.init = initQueensRound;
  controllerGameObj.startTrick = startTrick;

  console.log("Queens.js module registered successfully.");
  // Reset internal state on registration
  queensRoundStarted = false;
  roundOver_queens = false;
  isFirstTrick_queens = true;
  trickInProgress_queens = false;
  totalQueensPlayed = 0;
  roundScore_queens = [0, 0, 0, 0];

  // Get the starting player from controller
  currentStarter_queens = controllerGameObj.currentStarter;
  console.log(`Queens.js: Starting player from controller registration: ${currentStarter_queens}`);
}

console.log("Queens.js module loaded.");