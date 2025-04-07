// Emre's project presentation notes
// - Do not use alerts()! 
// - Is there a win/lose state? 
// - Leave comments in your code! 
/*-------------------------------- Constants --------------------------------*/
const deck = [
  { value: "7", suit: "♥" },
  { value: "8", suit: "♥" },
  { value: "9", suit: "♥" },
  { value: "10", suit: "♥" },
  { value: "J", suit: "♥" },
  { value: "Q", suit: "♥" },
  { value: "K", suit: "♥" },
  { value: "A", suit: "♥" },
  { value: "7", suit: "♦" },
  { value: "8", suit: "♦" },
  { value: "9", suit: "♦" },
  { value: "10", suit: "♦" },
  { value: "J", suit: "♦" },
  { value: "Q", suit: "♦" },
  { value: "K", suit: "♦" },
  { value: "A", suit: "♦" },
  { value: "7", suit: "♣" },
  { value: "8", suit: "♣" },
  { value: "9", suit: "♣" },
  { value: "10", suit: "♣" },
  { value: "J", suit: "♣" },
  { value: "Q", suit: "♣" },
  { value: "K", suit: "♣" },
  { value: "A", suit: "♣" },
  { value: "7", suit: "♠" },
  { value: "8", suit: "♠" },
  { value: "9", suit: "♠" },
  { value: "10", suit: "♠" },
  { value: "J", suit: "♠" },
  { value: "Q", suit: "♠" },
  { value: "K", suit: "♠" },
  { value: "A", suit: "♠" },
];

const cardStyle = {
  "♥": "hearts",
  "♦": "diamonds",
  "♣": "clubs",
  "♠": "spades",
};

const winnerStyle = {
  player1: "Player 1",
  player2: "Player 2",
  player3: "Player 3",
  player4: "Player 4",
};

const cardRanks = { 7: 1, 8: 2, 9: 3, 10: 4, J: 5, Q: 6, K: 7, A: 8 };
const players = ["player1", "player2", "player3", "player4"];

/*---------------------------- Variables (state) ----------------------------*/
let playerHands = { player1: [], player2: [], player3: [], player4: [] };
let inPlay = [];
let score = [0, 0, 0, 0];
let currentStarter = "player2"; 
let gameOver = false; 
let isFirstTrick = true; // Added state for first trick

/*------------------------ Cached Element References ------------------------*/
const dealButtonEl = document.querySelector(".deal");
const nextRoundButtonEl = document.querySelector(".next");
const scoreboardEls = document.querySelectorAll(".score");
const playAreas = {
  player1: document.querySelector(".board .player1"),
  player2: document.querySelector(".board .player2"),
  player3: document.querySelector(".board .player3"),
  player4: document.querySelector(".board .player4"),
};
const hands = {
  player1: document.querySelector(".human"),
  player2: document.querySelector(".hand-2"),
  player3: document.querySelector(".tophand"),
  player4: document.querySelector(".hand-4"),
};

/*-------------------------------- Functions --------------------------------*/

// Shuffle and deal cards
function dealCards() {
  if (playerHands.player1.length !== 0) return;
  clearBoard();
  resetGameState(); // Resets gameOver and isFirstTrick

  // Shuffle deck (existing code)
  for (let i = deck.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Deal cards (existing code)
  let cardIndex = 0;
  while (cardIndex < deck.length) {
    for (let player of players) {
      if (cardIndex < deck.length && playerHands[player].length < 8) {
        deck[cardIndex].player = player;
        playerHands[player].push(deck[cardIndex]);
        cardIndex++;
      }
    }
  }

  renderHands();
  currentStarter = "player2"; // Always start with Player 2 for this game
  startRound(currentStarter);
  
  // Ensure buttons are correctly enabled/disabled at start
  dealButtonEl.disabled = true;
  nextRoundButtonEl.disabled = false; 
}

// Function to clear the board of previously played cards
function clearBoard() {
  players.forEach((player) => {
    playAreas[player].innerHTML = ""; // Removes any displayed cards from the board
  });
  inPlay = []; // Reset the in-play array
}

// Reset player hands and game over status
function resetGameState() {
  playerHands = { player1: [], player2: [], player3: [], player4: [] };
  gameOver = false; // Use gameOver
  isFirstTrick = true; // Reset first trick flag
}

// Render all players' hands and update UI
function renderHands() {
  players.forEach((player) => {
    hands[player].innerHTML = "";
    playerHands[player].forEach((card) => {
      let cardHTML =
        player === "player1"
          ? `<div class="card ${cardStyle[card.suit]}" data-value="${
              card.value
            }" data-suit="${card.suit}"><span>${card.value}</span>${
              card.suit
            }</div>`
          : `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`;
      hands[player].insertAdjacentHTML("beforeend", cardHTML);
    });
  });

  hands.player1.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", handleClick);
  });
}

// Get the next players' order
function getNextPlayers(startingPlayer) {
  let order = ["player1", "player2", "player3", "player4"];
  let startIndex = order.indexOf(startingPlayer);
  return [...order.slice(startIndex), ...order.slice(0, startIndex)];
}

// Utility delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Updated startRound function
async function startRound(startingPlayer) {
  if (gameOver) return; 
  inPlay = []; 
  players.forEach((player) => (playAreas[player].innerHTML = "")); 

  let turnOrder = getNextPlayers(startingPlayer);

  for (let i = 0; i < turnOrder.length; i++) {
    let player = turnOrder[i];
    if (gameOver) return; 

    if (player === "player1") {
      await waitForPlayer1();
    } else {
      await delay(600); 
      // Pass isFirstTrick to selectCard
      let playedCard = selectCard(player, inPlay[0]?.suit || null, currentStarter, isFirstTrick);
      playCardToBoard(playedCard, player);
    }
  }

  if (inPlay.length === 4 && !gameOver) { 
    let winner = determineTrickWinner(); 
    currentStarter = winner; 
    // Set isFirstTrick to false *after* the first trick completes
    // Important: This happens *after* the winner is determined and scores updated for the first trick.
    isFirstTrick = false; 
  }
}

// Play a card
function playCardToBoard(card, player) {
  if (!card) return;
  
  // Assign player to the card *before* adding to inPlay (important for logic)
  card.player = player; 
  
  playerHands[player] = playerHands[player].filter(c => !(c.value === card.value && c.suit === card.suit));
  inPlay.push(card);

  // Update Computer player hand visuals (remove one card back)
  if (player !== 'player1') {
      if (hands[player].firstChild) {
          hands[player].removeChild(hands[player].firstChild);
      }
  }

  // Update the play area for the player
  playAreas[player].innerHTML = `<div class="card ${cardStyle[card.suit]}">${
    card.value
  } ${card.suit}</div>`;
}

// Updated selectCard function for King of Hearts logic
function selectCard(player, leadSuit, starter, isFirstTrick) { 
  const playerCards = playerHands[player];
  if (!playerCards || playerCards.length === 0) return null; // Safety check: return null if hand is empty

  // Helper variables
  const isFourthPlayer = inPlay.length === 3;
  const hasLeadSuit = leadSuit ? playerCards.some((card) => card.suit === leadSuit) : false;
  const cardsOfLeadSuit = leadSuit ? playerCards.filter((card) => card.suit === leadSuit) : [];
  const heartsInHand = playerCards.filter((card) => card.suit === '♥');
  const kingOfHearts = playerCards.find(card => card.value === 'K' && card.suit === '♥');
  const lowHeartsInHand = heartsInHand.filter(card => card.value === '7' || card.value === '8');

  // --- AI Logic based on rules --- 

  // Rule 1: First trick, starter cannot lead with a heart (if they have other suits)
  if (isFirstTrick && player === starter && !leadSuit) {
    const nonHearts = playerCards.filter(card => card.suit !== '♥');
    if (nonHearts.length > 0) {
      // Play lowest non-heart card
      return nonHearts.reduce((lowest, card) => 
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    }
    // If only hearts, must play one (falls through to default lead logic)
  }

  // --- Must Follow Suit --- (leadSuit exists and player has it)
  if (leadSuit && hasLeadSuit) {
      // Rule 6 (Following Suit): 50% chance to play low heart (7/8) if they are of the lead suit and not first trick
      if (!isFirstTrick && lowHeartsInHand.length > 0 && Math.random() < 0.5) {
          const playableLowHearts = lowHeartsInHand.filter(lh => lh.suit === leadSuit); // Ensure the low heart matches lead suit
          if (playableLowHearts.length > 0) {
              return playableLowHearts.reduce((lowest, card) => // Play lowest of the 7s or 8s
                cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
              );
          }
          // If no low heart matches lead suit, fall through
      }
      
      // Specific logic when the lead suit IS Hearts
      if (leadSuit === '♥') {
          // Rule 4: 4th player, lead is Hearts => play highest heart in hand of that suit
          if (isFourthPlayer) {
             // cardsOfLeadSuit here *are* the hearts in hand
             return cardsOfLeadSuit.reduce((highest, card) => 
                cardRanks[card.value] > cardRanks[highest.value] ? card : highest
             );
          }
          
          // Rule 5: Not 4th player, lead is Hearts => play highest heart lower than King
          const heartsLowerThanKing = cardsOfLeadSuit.filter(card => card.value !== 'K');
          if (heartsLowerThanKing.length > 0) {
              return heartsLowerThanKing.reduce((highest, card) =>
                  cardRanks[card.value] > cardRanks[highest.value] ? card : highest
              );
          }
          // If only King of Hearts is left in suit, must play it (falls through to default lowest)
      }
      
      // Default for Following Suit (lead suit exists, player has it, not hearts or special rules didn't apply):
      // Play the lowest card of the lead suit
      return cardsOfLeadSuit.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
  }

  // --- Cannot Follow Suit --- (leadSuit exists but player doesn't have it)
  if (leadSuit && !hasLeadSuit) {
      // Rule 2: Cannot follow suit, has King of Hearts => play King of Hearts
      if (kingOfHearts) {
          return kingOfHearts;
      }

      // Rule 3: Cannot follow suit, has Hearts (but not K♥ from above rule) => play highest Heart
      if (heartsInHand.length > 0) {
          return heartsInHand.reduce((highest, card) =>
              cardRanks[card.value] > cardRanks[highest.value] ? card : highest
          );
      }
      
      // Default when cannot follow suit (no K♥, no other hearts): Play highest value card overall (dump)
      return playerCards.reduce((highest, card) =>
          cardRanks[card.value] > cardRanks[highest.value] ? card : highest
      );
  }

  // --- Leading a Trick --- (!leadSuit and Rule 1 didn't apply/return)
  if (!leadSuit) {
      // Rule 6 (Leading): 50% chance to lead low heart (7/8) if not first trick
      // Note: Rule 1 already handled the case of *not* leading hearts on first trick if possible.
      if (!isFirstTrick && lowHeartsInHand.length > 0 && Math.random() < 0.5) {
          return lowHeartsInHand.reduce((lowest, card) => // Play lowest of the 7s or 8s
            cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
          );
      }
      
      // Default Lead strategy: Play lowest card overall
      // (Ensures hearts aren't led first trick if Rule 1 applied and non-hearts were available)
      return playerCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
  }
  
  // Absolute Fallback (Should ideally not be reached if logic covers all cases):
  // Play the lowest card in hand.
  return playerCards.reduce((lowest, card) => 
    cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
  );
}

// Wait for Player 1 to pick a card
function waitForPlayer1() {
  return new Promise((resolve) => {
    // Re-enable clicks only at the start of Player 1's turn
    hands.player1.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", handleClick);
    });
    
    function playerMoveHandler(event) {
      const clickedCard = event.target.closest(".card");
      if (!clickedCard) return; // Exit if no valid card is clicked
      
      const leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
      
      // Find the clicked card in player1's hand
      let playedCardIndex = playerHands.player1.findIndex(
        (card) =>
          card.value === clickedCard.dataset.value &&
          card.suit === clickedCard.dataset.suit
      );
      
      if (playedCardIndex === -1) return; // If the card is not found, exit function
      
      let playedCard = playerHands.player1[playedCardIndex];
      
      // Check if Player 1 has a valid card of the leading suit
      let validCards = playerHands.player1.filter((card) => card.suit === leadSuit);
      
      if (leadSuit && validCards.length > 0 && playedCard.suit !== leadSuit) {
        // Show notification but don't resolve the promise
        showNotification(`You must play a ${leadSuit} card!`);
        return;
      }
      
      // If we get here, a valid card was played
      // Remove the played card from Player 1's hand array
      playerHands.player1.splice(playedCardIndex, 1);
      
      // Play the selected card
      playCardToBoard(playedCard, "player1");
      
      // Re-render the hand to reflect the removal
      renderHands();
      
      // Disable further clicks until next round
      hands.player1.querySelectorAll(".card").forEach((card) => {
        card.removeEventListener("click", handleClick);
      });
      
      // Remove the event listener and resolve the promise
      hands.player1.removeEventListener("click", playerMoveHandler);
      resolve();
    }
    
    hands.player1.addEventListener("click", playerMoveHandler);
  });
}

// Show a notification message
function showNotification(message) {
  const notificationsEl = document.querySelector(".notifications");
  notificationsEl.innerHTML = `<div class="notification">${message}</div>`;
  
  // Clear the notification after 3 seconds
  setTimeout(() => {
    notificationsEl.innerHTML = "";
  }, 3000);
}

// Handle Player 1 clicking a card - this function is now only used for adding event listeners
function handleClick(event) {
  // This function is now just a placeholder for the event listener
  // The actual card playing logic is in the playerMoveHandler function in waitForPlayer1
}

// Determine the trick winner
function determineTrickWinner() {
  const leadingSuit = inPlay[0].suit;
  let winningCard = inPlay
    .filter((card) => card.suit === leadingSuit)
    .reduce((max, card) =>
      cardRanks[card.value] > cardRanks[max.value] ? card : max
    );
  let winner = winningCard.player;

  // Check if the King of Hearts was played in this trick
  const kingOfHeartsPlayed = inPlay.some(card => card.value === 'K' && card.suit === '♥');

  if (kingOfHeartsPlayed) {
    // Award 8 points to the winner of the trick
    score[players.indexOf(winner)] += 8;
    updateScores();

    // End the game because the King of Hearts was played
    gameOver = true; // Set game over flag
    dealButtonEl.disabled = false; 
    nextRoundButtonEl.disabled = true; 
    document.querySelector(".tophand").innerHTML = '<div class="end-message">King of Hearts captured! Game Over.</div>';
     setTimeout(() => {
        clearBoard();
        resetGameState(); // This will set gameOver back to false for a new game
        clearHands(); 
      }, 3000); 
    showNotification("King of Hearts played! Deal a new game.");

  } else {
    // --- Optional: Standard scoring --- 
    // If you wanted 1 point per trick won (when K♥ isn't played), you could add:
    // score[players.indexOf(winner)] += 1; 
    // updateScores();
    // For now, only K♥ gives points based on the request.
    updateScores(); // Update scores even if no points were added this trick
  }
  
  // --- Remove Queen-specific logic --- 
  /* 
  const queensCount = inPlay.filter(card => card.value === "Q").length;
  score[players.indexOf(winner)] += queensCount * 2;
  updateScores();

  // Check if all Queens have been played
  const totalQueensPlayed = deck.reduce((count, card) => { ... });

  if (totalQueensPlayed === 4) { ... game over logic for Queens ... }
  */

  return winner; // Return the winner of the trick
}

// Update scores
function updateScores() {
  scoreboardEls.forEach((el, i) => (el.textContent = `${score[i]}`));
}

// Event Listeners
dealButtonEl.addEventListener("click", dealCards);

nextRoundButtonEl.addEventListener("click", () => {
  if (inPlay.length < 4) {
    showNotification("All players must play a card before proceeding...");
    return;
  }
  if (gameOver) {
    showNotification("Game is over. Please Deal a new game.");
    return;
  }
  if (players.every((player) => playerHands[player].length === 0)) {
      // ... (empty hand game over logic - unchanged) ...
      let minScore = Math.min(...score);
      let winners = players.filter((_, index) => score[index] === minScore);
      let translatedWinners = winners.map((winner) => winnerStyle[winner]);
      let message = translatedWinners.length > 1
          ? `Hand End! Tie between ${translatedWinners.join(" and ")} with ${minScore} points!`
          : `Hand End! ${translatedWinners[0]} wins with ${minScore} points!`;

      document.querySelector(".tophand").innerHTML = `<div class="winner-message">${message}</div>`;
      dealButtonEl.disabled = false;
      nextRoundButtonEl.disabled = true;
      showNotification("Hand ended (no cards left). Deal a new game.");
      gameOver = true; 
      return; 
  }

  // If checks pass, start the next round
  // isFirstTrick is set to false inside startRound after the trick completes
  startRound(currentStarter);
});

// Utility function to clear hands visually (optional enhancement)
function clearHands() {
  players.forEach((player) => {
    hands[player].innerHTML = "";
  });
}