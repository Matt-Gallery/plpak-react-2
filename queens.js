// TODOs
// 1. Implement the selectCard function to play the "Q" when a player does not have a card matching the lead suit.
// 2. Add logic to selectCard to always play a "Q" if a higher card has been played and you're allowed to play a "Q"
// 3. Change all alerts to be displayed in the UI instead of using the alert function.
// 4. Fix bug where other players don't wait for human to play after they click a card of the wrong suit.
// 5. Move buttons and info hover to the sides for better fit.

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
let currentStarter = "player2"; // Player 2 starts first round
let roundComplete = false;

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
  resetGameState();

  // Shuffle deck
  for (let i = deck.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Deal cards
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

  renderHands(); // ✅ Move here

  currentStarter = "player2";
  startRound(currentStarter);
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

// Reset player hands and round completion status
function resetGameState() {
  playerHands = { player1: [], player2: [], player3: [], player4: [] };
  roundComplete = false;
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
      let playedCard = selectCard(
        player,
        inPlay[0]?.suit || null,
        currentStarter
      );
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

  if (player !== "player1") {
    // Re-render back-of-card images
    hands[player].innerHTML = "";
    for (let i = 0; i < playerHands[player].length; i++) {
      hands[player].insertAdjacentHTML(
        "beforeend",
        `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`
      );
    }
  }

  playAreas[player].innerHTML = `<div class="card ${cardStyle[card.suit]}">${
    card.value
  } ${card.suit}</div>`;
}

// Updated selectCard function with requested logic
function selectCard(player, leadSuit, currentStarter) {
  const playerCards = playerHands[player];
  const isFourthPlayer = inPlay.length === 3;
  const queensInHand = playerCards.filter((card) => card.value === "Q");
  const hasLeadSuit = playerCards.some((card) => card.suit === leadSuit);
  const cardsOfLeadSuit = playerCards.filter((card) => card.suit === leadSuit);
  const inPlayLeadSuitCards = inPlay.filter((card) => card.suit === leadSuit);
  const queenPlayedThisTrick = inPlay.some((card) => card.value === "Q");

  // Rule 0: If starter is leading (no leadSuit), and has non-Queens, don't lead with a Queen
  if (!leadSuit && player === currentStarter) {
    const nonQueenCards = playerCards.filter((card) => card.value !== "Q");
    if (nonQueenCards.length > 0) {
      // Play the lowest non-queen card
      return nonQueenCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    }
  }

  // Rule 1: No lead suit & has a Queen => play Queen
  if (!hasLeadSuit && queensInHand.length > 0) {
    return queensInHand[0];
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

  // Rule 3: 4th player, no queen played yet, has lead suit => play highest of lead suit
  if (isFourthPlayer && !queenPlayedThisTrick && cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit.reduce((highest, card) =>
      cardRanks[card.value] > cardRanks[highest.value] ? card : highest
    );
  }

  // Rule 4: No lead suit => play highest card
  if (!hasLeadSuit) {
    return playerCards.reduce((highest, card) =>
      cardRanks[card.value] > cardRanks[highest.value] ? card : highest
    );
  }

  // Default: play lowest of lead suit
  return cardsOfLeadSuit.reduce((lowest, card) =>
    cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
  );
}

// Wait for Player 1 to pick a card
function waitForPlayer1() {
  return new Promise((resolve) => {
    function playerMoveHandler(event) {
      handleClick(event);
      hands.player1.removeEventListener("click", playerMoveHandler);
      resolve();
    }
    hands.player1.addEventListener("click", playerMoveHandler);
  });
}

// Handle Player 1 clicking a card
function handleClick(event) {
  const clickedCard = event.target.closest(".card"); // Ensure we get the card element
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
    showNotification(`You must play a ${leadSuit} !`);
    return;
  }

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
}

// Ensure clicks are enabled again when it's Player 1's turn
function waitForPlayer1() {
  return new Promise((resolve) => {
    function playerMoveHandler(event) {
      handleClick(event);
      hands.player1.removeEventListener("click", playerMoveHandler);
      resolve();
    }

    // Re-enable clicks only at the start of Player 1's turn
    hands.player1.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", handleClick);
    });

    hands.player1.addEventListener("click", playerMoveHandler);
  });
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

  const queensCount = inPlay.filter((card) => card.value === "Q").length;
  score[players.indexOf(winner)] += queensCount * 2;
  updateScores();

  const totalQueensPlayed =
    deck.filter((card) => card.value === "Q").length -
    players.reduce(
      (acc, player) =>
        acc + playerHands[player].filter((card) => card.value === "Q").length,
      0
    );

  if (totalQueensPlayed === 4) {
    document.querySelector(".tophand").innerHTML =
      '<div class="end-message">All queens have been played</div>';
      setTimeout(() => {
        roundComplete = true;
        clearBoard();
        resetGameState();
        clearHands();
        nextRoundButtonEl.disabled = true;
        dealButtonEl.disabled = false;
      }, 3000);
    }
  
  return winner; // 👈 Ensure this line is always executed
}

function clearHands() {
  players.forEach((player) => {
    playAreas[player].innerHTML = "";
  });
  playerHands = {
    player1: [],
    player2: [],
    player3: [],
    player4: [],
  };
  setTimeout(() => {
    document.querySelector(".tophand").innerHTML = "";
    document.querySelector(".hand-2").innerHTML = "";
    document.querySelector(".hand-4").innerHTML = "";
    document.querySelector(".human").innerHTML = "";
  }, 3000);
}

// Update scores
function updateScores() {
  scoreboardEls.forEach((el, i) => (el.textContent = `${score[i]}`));
}

// Event Listeners
dealButtonEl.addEventListener("click", dealCards);
nextRoundButtonEl.addEventListener("click", () => {
  if (inPlay.length < 4) {
    showNotification(
      "All players must play a card before proceeding to the next round!"
    );
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

// Utility functions
function showNotification(message, duration = 2500) {
  const container = document.querySelector(".notifications");

  if (!container) return; // safety check

  // Remove any existing notification
  const existing = container.querySelector(".notification");
  if (existing) existing.remove();

  // Create new notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  container.appendChild(notification);

  // Auto-remove after delay
  setTimeout(() => {
    notification.remove();
  }, duration);
}
