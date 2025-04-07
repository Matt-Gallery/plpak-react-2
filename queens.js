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
// Could this be an object? :D 
// const gameState = {
//   playerHands: {},
//   inPlay: [],
//   score: [],
//   ...etc
// }
let playerHands = { player1: [], player2: [], player3: [], player4: [] };
let inPlay = [];
let score = [0, 0, 0, 0];
let currentStarter = "player2"; // Player 2 starts first round
let gameOver = false; // Renamed from roundComplete

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

  // Clear the board and reset game state
  clearBoard();
  resetGameState();

  for (let i = deck.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

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

  // Always start the round with Player 2
  currentStarter = "player2";
  startRound(currentStarter);
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

// Start the round
// Utility delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Updated startRound function
async function startRound(startingPlayer) {
  if (gameOver) return; // Check if game ended
  inPlay = []; // Clear cards from previous trick
  players.forEach((player) => (playAreas[player].innerHTML = "")); // Clear board visuals

  let turnOrder = getNextPlayers(startingPlayer);

  for (let i = 0; i < turnOrder.length; i++) {
    let player = turnOrder[i];
    if (gameOver) return; // Check again in case game ended mid-trick

    if (player === "player1") {
      await waitForPlayer1();
    } else {
      await delay(600); 
      let playedCard = selectCard(player, inPlay[0]?.suit || null, currentStarter);
      playCardToBoard(playedCard, player);
    }
  }

  // After all 4 players have played...
  if (inPlay.length === 4 && !gameOver) { // Ensure game didn't end on the last card
    let winner = determineTrickWinner(); // This determines winner, calculates score, AND checks for game over (4 Queens)
    currentStarter = winner; // Set starter for the *next* round
    // determineTrickWinner will set gameOver if needed
  }
}

// Play a card
function playCardToBoard(card, player) {
  if (!card) return;
  playerHands[player] = playerHands[player].filter((c) => c !== card);
  inPlay.push(card);

  if (hands[player].firstChild) {
    hands[player].removeChild(hands[player].firstChild);
  }

  playAreas[player].innerHTML = `<div class="card ${cardStyle[card.suit]}">${
    card.value
  } ${card.suit}</div>`;
}

// Updated selectCard function with provided logic
function selectCard(player, leadSuit, currentStarter) {
  const playerCards = playerHands[player];
  
  // Define helper variables based on the provided logic's needs
  const isFourthPlayer = inPlay.length === 3;
  const queensInHand = playerCards.filter((card) => card.value === "Q");
  const hasLeadSuit = playerCards.some((card) => card.suit === leadSuit);
  const cardsOfLeadSuit = playerCards.filter((card) => card.suit === leadSuit);
  const inPlayLeadSuitCards = inPlay.filter((card) => card.suit === leadSuit);
  const queenPlayedThisTrick = inPlay.some((card) => card.value === "Q");

  // --- Start of provided logic --- 

  // Rule 0: If starter is leading (no leadSuit), and has non-Queens, don't lead with a Queen
  if (!leadSuit && player === currentStarter) {
    const nonQueenCards = playerCards.filter((card) => card.value !== "Q");
    if (nonQueenCards.length > 0) {
      // Play the lowest non-queen card
      return nonQueenCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    }
    // If only Queens are left, the starter must play one (handled by default logic later)
  }

  // Rule 1: Player doesn't have the lead suit & has a Queen => play a Queen
  // (Modified slightly to handle multiple queens: plays the first one found)
  if (leadSuit && !hasLeadSuit && queensInHand.length > 0) {
     return queensInHand[0]; // Play the first Queen found
  }

  // Rule 2: Has Queen of lead suit and K or A of that suit has been played => play Queen
  const hasQueenOfLeadSuit = playerCards.find(
    (card) => card.value === "Q" && card.suit === leadSuit
  );
  const kingOrAcePlayed = inPlayLeadSuitCards.some(
    (card) => card.value === "K" || card.value === "A"
  );

  if (hasQueenOfLeadSuit && kingOrAcePlayed) {
    return hasQueenOfLeadSuit;
  }

  // Rule 3: 4th player, no queen played yet in trick, has lead suit => play highest of lead suit
  if (isFourthPlayer && !queenPlayedThisTrick && cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit.reduce((highest, card) =>
      cardRanks[card.value] > cardRanks[highest.value] ? card : highest
    );
  }

  // Rule 4: Player must follow suit if they can
  if (leadSuit && hasLeadSuit) {
      // Default within following suit: play lowest card of lead suit
      return cardsOfLeadSuit.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
  }
  
  // Rule 5: Cannot follow suit (and Rule 1 didn't apply/no Queens) => play highest card (dumping)
  // This covers the case where leadSuit exists but player !hasLeadSuit and has no Queens.
  if (leadSuit && !hasLeadSuit) { 
      return playerCards.reduce((highest, card) =>
          cardRanks[card.value] > cardRanks[highest.value] ? card : highest
      );
  }

  // Default case (Should cover starting player having only Queens, or other edge cases)
  // Play the lowest card in hand if no other rule applies
  if (playerCards.length > 0) { // Ensure hand is not empty
      return playerCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
  } else {
      // Should not happen in normal play, but return null if hand is somehow empty
      return null; 
  }
  // --- End of provided logic integration --- 
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

  const queensCount = inPlay.filter(card => card.value === "Q").length;
  score[players.indexOf(winner)] += queensCount * 2;
  updateScores();

  // Check if all Queens have been played
  const totalQueensPlayed = deck.reduce((count, card) => {
      if (card.value === 'Q') {
          const isStillInHand = players.some(player =>
              playerHands[player].some(handCard => handCard.value === 'Q' && handCard.suit === card.suit)
          );
          const isInCurrentTrick = inPlay.some(playedCard => playedCard.value === 'Q' && playedCard.suit === card.suit);
          if (!isStillInHand || isInCurrentTrick) {
              return count + 1;
          }
      }
      return count;
  }, 0);

  if (totalQueensPlayed === 4) {
    gameOver = true; // Set game over flag
    dealButtonEl.disabled = false; 
    nextRoundButtonEl.disabled = true; 
    document.querySelector(".tophand").innerHTML = '<div class="end-message">All queens have been played! Game Over.</div>';
     setTimeout(() => {
        clearBoard();
        resetGameState(); // This will set gameOver back to false for a new game
        clearHands(); 
      }, 3000); 
    showNotification("All Queens played! Deal a new game.");
  }

  return winner; // Return the winner of the trick
}

// Update scores
function updateScores() {
  scoreboardEls.forEach((el, i) => (el.textContent = `${score[i]}`));
}

// Event Listeners
dealButtonEl.addEventListener("click", dealCards);

nextRoundButtonEl.addEventListener("click", () => {
  // 1. Check if the previous trick actually finished
  if (inPlay.length < 4) {
    showNotification("All players must play a card before proceeding...");
    return;
  }

  // 2. Check if the game is *already* marked as over (all Queens played)
  if (gameOver) {
    showNotification("Game is over. Please Deal a new game.");
    return;
  }

  // 3. Check if hands are empty (alternative round end condition)
  // This condition signifies the end of the dealt hand if not all Queens were captured.
  if (players.every((player) => playerHands[player].length === 0)) {
      // The game over message due to Queens takes precedence if gameOver is already true.
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
      gameOver = true; // Mark game as over since the hand ended
      return; // Prevent starting a new round
  }

  // 4. If trick finished, game not over by Queens, and hands not empty, start the next round
  startRound(currentStarter);
});

// Utility function to clear hands visually (optional enhancement)
function clearHands() {
  players.forEach((player) => {
    hands[player].innerHTML = "";
  });
}