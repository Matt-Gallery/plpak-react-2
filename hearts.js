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
let roundComplete = false;
let heartsPlayed = 0; // Track the total number of hearts played

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

// Reset player hands and round completion status
function resetGameState() {
  playerHands = { player1: [], player2: [], player3: [], player4: [] };
  roundComplete = false;
  heartsPlayed = 0; // Reset the hearts played counter
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

// Updated startRound function to include delay for computer players
async function startRound(startingPlayer) {
  if (roundComplete) return;
  inPlay = [];
  players.forEach((player) => (playAreas[player].innerHTML = ""));

  let turnOrder = getNextPlayers(startingPlayer);

  for (let i = 0; i < turnOrder.length; i++) {
    let player = turnOrder[i];

    if (player === "player1") {
      await waitForPlayer1();
    } else {
      await delay(600); // Await a 400ms delay before computer plays
      let playedCard = selectCard(player, inPlay[0]?.suit || null);
      playCardToBoard(playedCard, player);
    }
  }

  if (inPlay.length === 4) {
    roundComplete = true;
    let winner = determineTrickWinner();
    currentStarter = winner;
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

// Updated selectCard function with new logic
function selectCard(player, leadSuit) {
  const playerCards = playerHands[player];
  const cardsOfLeadSuit = playerCards.filter(card => card.suit === leadSuit);
  
  // New strategy logic
  // 1. If first player (no lead suit)
  if (!leadSuit) {
    const lowHearts = playerCards.filter(card => 
      card.suit === "♥" && (card.value === "7" || card.value === "8")
    );
    
    if (lowHearts.length > 0 && Math.random() < 0.33) {
      return lowHearts.reduce((lowest, card) => 
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    }
  }
  
  // 2. If lead suit is hearts, try to play a lower heart
  if (leadSuit === "♥" && cardsOfLeadSuit.length > 0) {
    const heartsPlayed = inPlay.filter(card => card.suit === "♥");
    if (heartsPlayed.length > 0) {
      const highestHeartPlayed = heartsPlayed.reduce((highest, card) => 
        cardRanks[card.value] > cardRanks[highest.value] ? card : highest
      );
      
      const lowerHearts = cardsOfLeadSuit.filter(card => 
        cardRanks[card.value] < cardRanks[highestHeartPlayed.value]
      );
      
      if (lowerHearts.length > 0) {
        return lowerHearts.reduce((highest, card) => 
          cardRanks[card.value] > cardRanks[highest.value] ? card : highest
        );
      }
    }
  }
  
  // 3. If 4th player and no hearts played, try to win the trick
  if (inPlay.length === 3 && !inPlay.some(card => card.suit === "♥")) {
    if (cardsOfLeadSuit.length > 0) {
      return cardsOfLeadSuit.reduce((highest, card) => 
        cardRanks[card.value] > cardRanks[highest.value] ? card : highest
      );
    }
  }
  
  // Default logic
  if (!leadSuit) {
    // Play lowest card of most common suit
    const suitCounts = playerCards.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonSuit = Object.keys(suitCounts).reduce((a, b) =>
      suitCounts[a] > suitCounts[b] ? a : b
    );
    
    const cardsOfMostCommonSuit = playerCards.filter(card => card.suit === mostCommonSuit);
    return cardsOfMostCommonSuit.reduce((lowest, card) =>
      cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
    );
  }
  
  if (cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit.reduce((lowest, card) =>
      cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
    );
  }
  
  // If no cards of lead suit, try to play highest heart
  const hearts = playerCards.filter(card => card.suit === "♥");
  if (hearts.length > 0) {
    return hearts.reduce((highest, card) =>
      cardRanks[card.value] > cardRanks[highest.value] ? card : highest
    );
  }
  
  // If no hearts, play highest card
  return playerCards.reduce((highest, card) =>
    cardRanks[card.value] > cardRanks[highest.value] ? card : highest
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
  
  // Count hearts in the trick
  let heartsInTrick = inPlay.filter(card => card.suit === "♥").length;
  
  // Update the total hearts played
  heartsPlayed += heartsInTrick;
  
  // Award points based on hearts taken (1 point per heart)
  score[players.indexOf(winner)] += heartsInTrick;
  
  updateScores();
  
  // Check if the game should end (8 hearts played)
  if (heartsPlayed >= 8) {
    roundComplete = true;
    dealButtonEl.disabled = false; // Enable the deal button
    nextRoundButtonEl.disabled = false; // Enable the next round button
    console.log("Game over! 8 hearts have been played.");
    
    // Display a simple message that all hearts have been played
    document.querySelector(".tophand").innerHTML = `<div class="winner-message">All hearts have been played</div>`;
    showNotification("Please deal next hand");
  }
  
  return winner;
}

// Update scores
function updateScores() {
  scoreboardEls.forEach((el, i) => (el.textContent = `${score[i]}`));
}

// Event Listeners
dealButtonEl.addEventListener("click", dealCards);
nextRoundButtonEl.addEventListener("click", () => {
  if (inPlay.length < 4) {
    showNotification("All players must play a card before proceeding to the next round!");
    return;
  }

  if (heartsPlayed >= 8) {
    showNotification("Please deal next hand");
    return;
  }

  function checkGameOver() {
    if (players.every((player) => playerHands[player].length === 0)) {
      let minScore = Math.min(...score);
      let winners = players.filter((_, index) => score[index] === minScore);

      let translatedWinners = winners.map((winner) => winnerStyle[winner]);

      let message =
        translatedWinners.length > 1
          ? `It's a tie between ${translatedWinners.join(
              " and "
            )} with ${minScore} points!`
          : `${translatedWinners[0]} wins with ${minScore} points!`;

      document.querySelector(
        ".tophand"
      ).innerHTML = `<div class="winner-message">${message}</div>`;
    }
  }

  checkGameOver();

  roundComplete = false;
  startRound(currentStarter);
});