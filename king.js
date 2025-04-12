// king.js - ES6 Module Version for No King of Hearts Round

// --- Constants (Module-scoped) ---
const deck_king = [
    { value: "7", suit: "♥" }, { value: "8", suit: "♥" }, { value: "9", suit: "♥" }, { value: "10", suit: "♥" }, { value: "J", suit: "♥" }, { value: "Q", suit: "♥" }, { value: "K", suit: "♥" }, { value: "A", suit: "♥" },
    { value: "7", suit: "♦" }, { value: "8", suit: "♦" }, { value: "9", suit: "♦" }, { value: "10", suit: "♦" }, { value: "J", suit: "♦" }, { value: "Q", suit: "♦" }, { value: "K", suit: "♦" }, { value: "A", suit: "♦" },
    { value: "7", suit: "♣" }, { value: "8", suit: "♣" }, { value: "9", suit: "♣" }, { value: "10", suit: "♣" }, { value: "J", suit: "♣" }, { value: "Q", suit: "♣" }, { value: "K", suit: "♣" }, { value: "A", suit: "♣" },
    { value: "7", suit: "♠" }, { value: "8", suit: "♠" }, { value: "9", suit: "♠" }, { value: "10", suit: "♠" }, { value: "J", suit: "♠" }, { value: "Q", suit: "♠" }, { value: "K", suit: "♠" }, { value: "A", suit: "♠" },
];
const cardStyle_king = { "♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades" };
const cardRanks_king = { 7: 1, 8: 2, 9: 3, 10: 4, J: 5, Q: 6, K: 7, A: 8 };
const players_king = ["player1", "player2", "player3", "player4"];
const KING_OF_HEARTS_PENALTY = 16; // Points for taking the King of Hearts

// --- Module State (References to Controller State/Functions) ---
let playerHands = {};
let inPlay = [];
let uiElements = {};
let controllerUpdateState = () => {};
let controllerUpdateScores = () => {};
let controllerShowNotification = () => {};
let controllerDelay = () => {};
let controllerActiveGameRef = {};

// --- Module-Specific State ---
let roundScore = [0, 0, 0, 0];
let currentStarter = "player2";
let roundOver = false;
let isFirstTrick = true;
let humanPlayerTurn = false;
let humanCardSelectionResolver = null;
let kingOfHeartsTaken = false;
let kingRoundStarted = false;
let trickInProgress = false;

// --- Initialization Function (Called by Controller via activeGame.init) ---
function initRound() {
    console.log("King.js: initRound called.");
    if (kingRoundStarted) {
        console.log("King.js: initRound called but already started.");
        return;
    }
    kingRoundStarted = true;
    roundOver = false;
    isFirstTrick = true;
    trickInProgress = false;
    kingOfHeartsTaken = false; // Reset for the round
    humanPlayerTurn = false;
    humanCardSelectionResolver = null;
    roundScore = [0, 0, 0, 0];
    currentStarter = "player2"; // Confirm starting player rule for King round
    controllerActiveGameRef.updateStarter(currentStarter);

    // Deal cards
    let shuffledDeck = [...deck_king];
    for (let i = shuffledDeck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    for (let player of players_king) {
         if (!playerHands[player]) playerHands[player] = [];
         playerHands[player] = []; // Clear existing
    }
    let cardIndex = 0;
    while (cardIndex < shuffledDeck.length) {
        for (let player of players_king) {
            if (!playerHands[player]) playerHands[player] = [];
            if (cardIndex < shuffledDeck.length && playerHands[player].length < 8) {
                playerHands[player].push(shuffledDeck[cardIndex]);
                cardIndex++;
            }
        }
    }

    renderHands();
    clearBoard();
    controllerShowNotification(`King of Hearts Round Started!`);
    // Update controller state: round is ready, waiting for first "Next Trick"
    controllerUpdateState({ gameStarted: true, roundOver: false, trickInProgress: false });
    console.log("King.js: Round initialized and dealt. Waiting for 'Next Trick' click.");
}

// --- Game Logic Functions ---
// Called by Controller via activeGame.startTrick
async function startTrick(startingPlayer) {
    console.log(`King.js: Starting trick, leader: ${startingPlayer}`);
    if (roundOver || trickInProgress) {
        console.warn(`King.js: startTrick called unexpectedly (roundOver=${roundOver}, trickInProgress=${trickInProgress})`);
        controllerUpdateState({ trickInProgress: false, roundOver: roundOver });
        return;
    }

    trickInProgress = true;
    inPlay = [];
    players_king.forEach((player) => {
        if (uiElements.playAreas && uiElements.playAreas[player]) {
            uiElements.playAreas[player].innerHTML = "";
        } else { console.error(`UI element playAreas[${player}] not found!`); }
    });
    humanPlayerTurn = false;
    let turnOrder = getNextPlayers(startingPlayer);
    console.log(`King.js: Turn order: ${turnOrder.join(', ')}`);

    try {
        for (let i = 0; i < turnOrder.length; i++) {
            let player = turnOrder[i];
            console.log(`King.js: Current turn: ${player}`);
            if (roundOver) {
                console.log(`King.js: Round ended mid-trick (player ${player}'s turn).`);
                break;
            }
            let leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
            let playedCard = null;

            if (player === "player1") {
                humanPlayerTurn = true;
                console.log("King.js: Waiting for human player...");
                playedCard = await waitForPlayer1(leadSuit);
                humanPlayerTurn = false;
                if (!playedCard) throw new Error("Human player action failed.");
                console.log(`King.js: Human played: ${playedCard.value}${playedCard.suit}`);
            } else {
                console.log(`King.js: AI ${player} thinking...`);
                await controllerDelay(600);
                playedCard = selectCard_AI(player, leadSuit, startingPlayer, isFirstTrick);
                 if (!playedCard) throw new Error(`AI player ${player} failed to select a card.`);
                 console.log(`King.js: AI ${player} played: ${playedCard.value}${playedCard.suit}`);
            }

            if (playedCard && typeof playedCard === 'object') {
                 playedCard.player = player;
                 inPlay.push(playedCard);
                 playCardToBoard(playedCard, player);
             } else {
                 throw new Error(`Invalid card from player ${player}.`);
             }
        }

        // --- Trick Resolution --- 
        console.log("King.js: Trick loop finished. Processing outcome...");
        if (inPlay.length === 4 && !roundOver) {
            let trickWinner = determineTrickWinner(inPlay);
            let points = determineTrickScore(inPlay); // Score based on K of Hearts

            if (trickWinner && points > 0) { // Only update score if K of Hearts was taken
                let winnerIndex = players_king.indexOf(trickWinner);
                if (winnerIndex !== -1) {
                    roundScore[winnerIndex] += points;
                    kingOfHeartsTaken = true; // Mark that the King was taken
                    console.log(`King.js: Trick winner: ${trickWinner}. Points: ${points}. Round Score: ${roundScore.join(',')}`);
                } else { console.error(`King.js: Trick winner ${trickWinner} not found!`); }
            } else if (trickWinner) {
                 console.log(`King.js: Trick winner: ${trickWinner}. Points: 0.`);
            } else { console.log("King.js: No trick winner determined."); }

            currentStarter = trickWinner || startingPlayer;
            controllerActiveGameRef.updateStarter(currentStarter);
            // Check if round over (King taken OR hands empty)
            roundOver = checkRoundOver(playerHands, kingOfHeartsTaken);

            if (roundOver) {
                console.log("King.js: Round Over condition met after trick.");
                controllerShowNotification(`King of Hearts Round Over! Click Deal.`);
            }

        } else if (roundOver) {
             console.log("King.js: Trick processing skipped as round ended mid-trick.");
        } else {
             console.warn(`King.js: Trick ended with ${inPlay.length} cards. Not processing score.`);
        }

    } catch (error) {
        console.error("King.js: Error during trick execution:", error);
        roundOver = true; // Mark round over on error
    } finally {
        // --- Signal Trick Completion --- 
        isFirstTrick = false;
        trickInProgress = false;
        console.log(`King.js: Trick attempt finished. Updating controller state (trickInProgress=false, roundOver=${roundOver}, currentRoundScore=${roundScore.join(',')})`);
        controllerUpdateState({ 
            trickInProgress: false, 
            roundOver: roundOver, 
            currentRoundScore: [...roundScore] // Send score copy
        });
    }
}

// --- UI Functions ---
function clearBoard() {
    players_king.forEach((player) => {
        if(uiElements.playAreas && uiElements.playAreas[player]) {
            uiElements.playAreas[player].innerHTML = "";
        } else { console.error(`UI element playAreas[${player}] not found!`); }
    });
}

function renderHands() {
     players_king.forEach((player) => {
         if (!uiElements.handsEls || !uiElements.handsEls[player]) {
             console.error(`UI element handsEls[${player}] not found!`);
             return;
         }
         uiElements.handsEls[player].innerHTML = "";
         if (playerHands[player] && Array.isArray(playerHands[player])) {
             if (player === 'player1') {
                  playerHands[player].sort((a, b) => {
                      if (a.suit < b.suit) return -1; if (a.suit > b.suit) return 1;
                      return cardRanks_king[a.value] - cardRanks_king[b.value];
                  });
              }
             playerHands[player].forEach((card) => {
                 let cardHTML = player === "player1"
                     ? `<div class="card ${cardStyle_king[card.suit]}" data-value="${card.value}" data-suit="${card.suit}"><span>${card.value}</span>${card.suit}</div>`
                     : `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`;
                 uiElements.handsEls[player].insertAdjacentHTML("beforeend", cardHTML);
             });
         } else { console.warn(`Player hand for ${player} invalid.`); }
     });
     console.log("King.js: renderHands completed.");
}

function playCardToBoard(card, player) {
    if (!card || !card.player) {
        console.error("playCardToBoard called with invalid card/player:", player, card);
        return;
    }
     if (!playerHands[player]) {
        console.error(`Player hand for ${player} does not exist.`);
        return;
    }
    const initialLength = playerHands[player].length;
    playerHands[player] = playerHands[player].filter(c => !(c.value === card.value && c.suit === card.suit));
    if (playerHands[player].length === initialLength) console.warn(`Card ${card.value}${card.suit} not found in ${player}'s hand.`);

    if (player !== 'player1') {
        if (uiElements.handsEls && uiElements.handsEls[player] && uiElements.handsEls[player].firstChild) {
            uiElements.handsEls[player].removeChild(uiElements.handsEls[player].firstChild);
        }
    } else {
        renderHands();
    }
    if(uiElements.playAreas && uiElements.playAreas[player]) {
        uiElements.playAreas[player].innerHTML = `<div class="card ${cardStyle_king[card.suit]}">${card.value} ${card.suit}</div>`;
    } else { console.error(`UI element playAreas[${player}] not found!`); }
}

// --- AI Logic ---
// AI Strategy: Avoid taking the King of Hearts!
function selectCard_AI(player, leadSuit, starter, isFirstTrick) { 
  const playerCards = playerHands[player];
  if (!playerCards || playerCards.length === 0) return null;

  const isLeading = !leadSuit;
  const hasLeadSuit = leadSuit ? playerCards.some((card) => card.suit === leadSuit) : false;
  const cardsOfLeadSuit = leadSuit ? playerCards.filter((card) => card.suit === leadSuit) : [];
  const heartsInHand = playerCards.filter((card) => card.suit === '♥');
  const kingOfHearts = playerCards.find(card => card.value === 'K' && card.suit === '♥');
  const nonKingHearts = heartsInHand.filter(card => card.value !== 'K');

  // --- Rule: First trick logic --- 
  if (isFirstTrick && isLeading) {
      console.log(`King.js AI (${player}): Leading first trick.`);
      // 1. Cannot lead with a heart (unless only hearts are held)
      const nonHearts = playerCards.filter(card => card.suit !== '♥');
      if (nonHearts.length === 0) {
          // Only has hearts, lead lowest heart (must be non-king if possible)
          console.log(`King.js AI (${player}): Only has hearts, leading lowest.`);
          if (nonKingHearts.length > 0) {
              return nonKingHearts.reduce((lowest, card) => cardRanks_king[card.value] < cardRanks_king[lowest.value] ? card : lowest);
          }
          return kingOfHearts; // Must lead King if it's the only heart
      }

      // 2. Check for singleton K or A in non-heart suits
      const suitsInHand = [...new Set(nonHearts.map(card => card.suit))];
      for (const suit of suitsInHand) {
          const cardsInSuit = nonHearts.filter(card => card.suit === suit);
          if (cardsInSuit.length === 1) {
              const card = cardsInSuit[0];
              if (card.value === 'K' || card.value === 'A') {
                  console.log(`King.js AI (${player}): Leading singleton ${card.value}${card.suit}.`);
                  return card; // Play the singleton King or Ace
              }
          }
      }

      // 3. Else, play highest non-heart card
      console.log(`King.js AI (${player}): Leading highest non-heart.`);
      return nonHearts.reduce((highest, card) => cardRanks_king[card.value] > cardRanks_king[highest.value] ? card : highest);
  }
  // --- End First trick logic ---

  // --- Must Follow Suit --- (Not first trick or not leading)
  if (leadSuit && hasLeadSuit) {
      console.log(`King.js AI (${player}): Following suit ${leadSuit}.`);
      // If lead suit is Hearts, try to play highest non-King heart
      if (leadSuit === '♥') {
          if (nonKingHearts.length > 0) {
               console.log(`King.js AI (${player}): Playing highest non-King heart.`);
               return nonKingHearts.reduce((highest, card) => cardRanks_king[card.value] > cardRanks_king[highest.value] ? card : highest);
          }
          // If only King of Hearts left in suit, must play it (falls through)
          console.log(`King.js AI (${player}): Must play King of Hearts (only heart left in suit).`);
      }
      // Default for following suit: Play the lowest card of the lead suit
      console.log(`King.js AI (${player}): Playing lowest of lead suit ${leadSuit}.`);
      return cardsOfLeadSuit.reduce((lowest, card) => cardRanks_king[card.value] < cardRanks_king[lowest.value] ? card : lowest);
  }

  // --- Cannot Follow Suit --- 
  if (leadSuit && !hasLeadSuit) {
      console.log(`King.js AI (${player}): Cannot follow suit ${leadSuit}. Discarding.`);
      // Discard King of Hearts first if possible
      if (kingOfHearts) {
          console.log(`King.js AI (${player}): Discarding King of Hearts.`);
          return kingOfHearts;
      }
      // Then discard highest other heart
      if (heartsInHand.length > 0) { // heartsInHand here implies nonKingHearts
          console.log(`King.js AI (${player}): Discarding highest non-King heart.`);
          return heartsInHand.reduce((highest, card) => cardRanks_king[card.value] > cardRanks_king[highest.value] ? card : highest);
      }
      // Otherwise, discard highest card overall
      console.log(`King.js AI (${player}): Discarding highest overall card.`);
      return playerCards.reduce((highest, card) => cardRanks_king[card.value] > cardRanks_king[highest.value] ? card : highest);
  }
  
  // --- Leading a Trick (NOT First Trick) --- 
  if (isLeading) { // Note: isFirstTrick condition handled above
      console.log(`King.js AI (${player}): Leading trick (not first).`);
       // Try to lead lowest non-heart
      const nonHearts = playerCards.filter(card => card.suit !== '♥');
      if(nonHearts.length > 0) {
         console.log(`King.js AI (${player}): Leading lowest non-heart.`);
         return nonHearts.reduce((lowest, card) => cardRanks_king[card.value] < cardRanks_king[lowest.value] ? card : lowest);
      }
      // If only hearts left, lead lowest non-King heart
      if(nonKingHearts.length > 0) {
         console.log(`King.js AI (${player}): Leading lowest non-King heart.`);
         return nonKingHearts.reduce((lowest, card) => cardRanks_king[card.value] < cardRanks_king[lowest.value] ? card : lowest);
      }
      // Must lead King of Hearts if it's the only card left
      console.log(`King.js AI (${player}): Must lead King of Hearts (only card left?).`);
      return kingOfHearts; // Assumes kingOfHearts is the only card if others are empty
  }
  
  // Fallback (should not be reached in standard play)
  console.warn(`King.js AI (${player}): Reached fallback card selection.`);
  return playerCards[0]; // Play first available card
}


// --- Trick/Round Logic Utilities ---
function getNextPlayers(startingPlayer) {
    let order = [...players_king];
    let startIndex = order.indexOf(startingPlayer);
    if (startIndex === -1) {
        console.warn(`Starting player ${startingPlayer} not found, defaulting.`);
        startIndex = 0;
    }
    return [...order.slice(startIndex), ...order.slice(0, startIndex)];
}

function determineTrickWinner(trickCards) {
    if (!trickCards || trickCards.length !== 4) return null;
    const leadSuit = trickCards[0].suit;
    const cardsOfLeadSuit = trickCards.filter(card => card.suit === leadSuit);
    let winningCard = null;
    if (cardsOfLeadSuit.length > 0) {
        winningCard = cardsOfLeadSuit.reduce((highest, card) => cardRanks_king[card.value] > cardRanks_king[highest.value] ? card : highest);
    } else {
        winningCard = trickCards[0];
        console.warn(`King.js: No cards of lead suit ${leadSuit}. First card wins.`);
    }
    if (!winningCard || !winningCard.player) {
         console.error("Winning card determined but has no player assigned!", winningCard);
         const originalCard = trickCards.find(c => c.value === winningCard.value && c.suit === winningCard.suit && c.player);
         return originalCard ? originalCard.player : null;
    }
    return winningCard.player;
}

// Score KING_OF_HEARTS_PENALTY points if the King of Hearts is in the trick
function determineTrickScore(trickCards) {
    const hasKingOfHearts = trickCards.some(card => card.value === "K" && card.suit === "♥");
    return hasKingOfHearts ? KING_OF_HEARTS_PENALTY : 0;
}

// Round ends when hands are empty OR the King of Hearts has been taken
function checkRoundOver(currentHands, kingTaken) {
    if (kingTaken) {
        console.log("King.js: King of Hearts taken. Round OVER.");
        return true;
    }
    const handsEmpty = players_king.every((player) => !currentHands[player] || currentHands[player].length === 0);
    if (handsEmpty) {
        console.log("King.js: Hands empty. Round OVER.");
        return true;
    }
    return false;
}

// --- Human Interaction ---
 function attachHumanCardListeners() {
    if (!uiElements.handsEls || !uiElements.handsEls.player1) return;
    const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
    cardElements.forEach((cardEl) => {
        cardEl.removeEventListener("click", handleHumanClick);
        cardEl.addEventListener("click", handleHumanClick);
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
    if (!humanPlayerTurn || !humanCardSelectionResolver) return;
    const clickedCardEl = event.target.closest(".card");
    if (!clickedCardEl) return;

    const leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
    const cardValue = clickedCardEl.dataset.value;
    const cardSuit = clickedCardEl.dataset.suit;
    const playedCard = playerHands.player1.find(card => card.value === cardValue && card.suit === cardSuit);

    if (!playedCard) {
        console.error(`King.js: Clicked card (${cardValue}${cardSuit}) not found!`);
        return;
    }

    // --- Validation Rules --- 
    const hasLeadSuitOnHand = playerHands.player1.some(card => card.suit === leadSuit);
    // Rule: Must follow suit if possible
    if (leadSuit && hasLeadSuitOnHand && playedCard.suit !== leadSuit) {
        controllerShowNotification(`You must play a ${leadSuit} card!`);
        return; // Wait for valid play
    }
    
    // Rule: Can't lead hearts on first trick unless only hearts are held
    if (isFirstTrick && inPlay.length === 0 && playedCard.suit === '♥') {
        const onlyHasHearts = playerHands.player1.every(card => card.suit === '♥');
        if (!onlyHasHearts) {
           console.log("King.js: Invalid play - Cannot lead Hearts on first trick.");
           controllerShowNotification(`You cannot lead Hearts on the first trick!`);
           return; // Wait for valid play
        }
   }
   // --- End Validation --- 

    // Valid play
    console.log(`King.js: Human selected: ${playedCard.value}${playedCard.suit}`);
    humanPlayerTurn = false;
    removeHumanCardListeners();
    if (uiElements.handsEls && uiElements.handsEls.player1) {
        uiElements.handsEls.player1.classList.remove('active-turn');
    }
    humanCardSelectionResolver(playedCard);
    humanCardSelectionResolver = null;
}

function waitForPlayer1(leadSuit) {
    console.log(`King.js: Waiting for Player 1 (lead: ${leadSuit || 'None'})...`);
    return new Promise((resolve, reject) => {
       if (humanCardSelectionResolver) {
            console.warn("King.js: waitForPlayer1 resolver already active!");
       }
      humanCardSelectionResolver = resolve;
      attachHumanCardListeners();
      if (uiElements.handsEls && uiElements.handsEls.player1) {
        uiElements.handsEls.player1.classList.add('active-turn');
      }
    }).finally(() => {
         console.log("King.js: Player 1 promise finished.");
         if (humanCardSelectionResolver) humanCardSelectionResolver = null;
         if (uiElements.handsEls && uiElements.handsEls.player1) {
            uiElements.handsEls.player1.classList.remove('active-turn');
         }
         removeHumanCardListeners();
    });
}

// --- Registration Function (Exported) ---
export function register(controllerGameObj, sharedState) {
    console.log("King.js: Registering with controller.");
    if (!sharedState) {
         console.error("King.js: Invalid sharedState provided.");
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

    // Populate the controller's activeGame object
    controllerGameObj.name = 'king';
    controllerGameObj.init = initRound;
    controllerGameObj.startTrick = startTrick;

    console.log("King.js module registered successfully.");
    // Reset internal state on registration
    kingRoundStarted = false;
    roundOver = false;
    isFirstTrick = true;
    trickInProgress = false;
    kingOfHeartsTaken = false;
    roundScore = [0, 0, 0, 0];
}

console.log("King.js module loaded.");