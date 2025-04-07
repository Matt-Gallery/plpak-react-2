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
let kingOfHeartsPlayed = false;

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
const notificationsEl = document.querySelector(".notifications");

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
  kingOfHeartsPlayed = false;
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
      await delay(600); // Await a 600ms delay before computer plays
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

// Select a card for computer players
function selectCard(player, leadSuit) {
  const playerCards = playerHands[player];

  // If this is the first card of the trick
  if (!leadSuit) {
    // Try to avoid playing the King of Hearts
    const nonKingOfHeartsCards = playerCards.filter(
      (card) => !(card.value === "K" && card.suit === "♥")
    );
    
    if (nonKingOfHeartsCards.length > 0) {
      // Play the lowest non-King of Hearts card
      return nonKingOfHeartsCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    } else {
      // If all cards are King of Hearts, play the first card
      return playerCards[0];
    }
  }

  // If there's a lead suit, try to follow suit
  let validCards = playerCards.filter((card) => card.suit === leadSuit);
  
  if (validCards.length > 0) {
    // If we can follow suit, play the lowest card that will win the trick
    const highestCardInTrick = inPlay.reduce((highest, play) => {
      if (play.card.suit === leadSuit && cardRanks[play.card.value] > cardRanks[highest.value]) {
        return play.card;
      }
      return highest;
    }, inPlay[0].card);
    
    // Find the lowest card that can beat the highest card in the trick
    const winningCards = validCards.filter(
      (card) => cardRanks[card.value] > cardRanks[highestCardInTrick.value]
    );
    
    if (winningCards.length > 0) {
      // Play the lowest winning card
      return winningCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    } else {
      // If we can't win, play the lowest card
      return validCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      );
    }
  } else {
    // If we can't follow suit, play the highest card
    return playerCards.reduce((highest, card) =>
      cardRanks[card.value] > cardRanks[highest.value] ? card : highest
    );
  }
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
    showNotification(`You must play a ${leadSuit} card!`);
    return;
  }

  // Remove the played card from Player 1's hand array
  playerHands.player1.splice(playedCardIndex, 1);

  // Play the selected card
  playCardToBoard(playedCard, "player1");

  // Check if the King of Hearts was played
  if (playedCard.value === "K" && playedCard.suit === "♥") {
    kingOfHeartsPlayed = true;
  }

  // Re-render the hand to reflect the removal
  renderHands();

  // Disable further clicks until next round
  hands.player1.querySelectorAll(".card").forEach((card) => {
    card.removeEventListener("click", handleClick);
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
  
  // Check if the King of Hearts was played
  let kingOfHeartsInTrick = inPlay.some(
    (card) => card.value === "K" && card.suit === "♥"
  );
  
  if (kingOfHeartsInTrick) {
    score[players.indexOf(winner)] += 13;
    showNotification(`${winnerStyle[winner]} wins the trick and gets 13 points for playing the King of Hearts!`);
  } else {
    showNotification(`${winnerStyle[winner]} wins the trick!`);
  }
  
  updateScores();
  return winner;
}

// Update scores
function updateScores() {
  scoreboardEls.forEach((el, i) => (el.textContent = `${score[i]}`));
}

// Show notification
function showNotification(message) {
  notificationsEl.innerHTML = `<div class="notification">${message}</div>`;
  setTimeout(() => {
    notificationsEl.innerHTML = "";
  }, 3000);
}

// Event Listeners
dealButtonEl.addEventListener("click", dealCards);
nextRoundButtonEl.addEventListener("click", () => {
  if (inPlay.length < 4) {
    showNotification("All players must play a card before proceeding to the next round!");
    return;
  }

  function checkGameOver() {
    if (players.every((player) => playerHands[player].length === 0)) {
      let maxScore = Math.max(...score);
      let winners = players.filter((_, index) => score[index] === maxScore);

      let translatedWinners = winners.map((winner) => winnerStyle[winner]);

      let message =
        translatedWinners.length > 1
          ? `It's a tie between ${translatedWinners.join(
              " and "
            )} with ${maxScore} points!`
          : `${translatedWinners[0]} wins with ${maxScore} points!`;

      document.querySelector(
        ".tophand"
      ).innerHTML = `<div class="winner-message">${message}</div>`;
    }
  }

  checkGameOver();

  roundComplete = false;
  startRound(currentStarter);
});
