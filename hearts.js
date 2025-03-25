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
    document.querySelector(".deal").disabled = true;
    document.querySelector(".next").disabled = false;

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

// Updated selectCard function with requested logic
function selectCard(player, leadSuit) {
  const playerCards = playerHands[player];

  // Check if the computer is the first player in the round (no leadSuit)
  if (!leadSuit) {
    // Count occurrences of card values
    const valueCounts = playerCards.reduce((acc, card) => {
      acc[card.value] = (acc[card.value] || 0) + 1;
      return acc;
    }, {});

    // Find single card occurrences with rank < 11 (J or lower)
    const singleLowCards = playerCards.filter(
      (card) => valueCounts[card.value] === 1 && cardRanks[card.value] < 5 // ranks 7-10 (1-4)
    );

    if (singleLowCards.length === 1) {
      // Randomly decide between playing the single card or existing logic
      const randomChoice = Math.random() < 0.5;
      if (randomChoice) {
        return singleLowCards[0];
      } else {
        // Existing logic: Play lowest card of the suit they have most of
        const suitCounts = playerCards.reduce((acc, card) => {
          acc[card.suit] = (acc[card.suit] || 0) + 1;
          return acc;
        }, {});

        const mostCommonSuit = Object.keys(suitCounts).reduce((a, b) =>
          suitCounts[a] > suitCounts[b] ? a : b
        );

        const cardsOfMostCommonSuit = playerCards.filter(
          (card) => card.suit === mostCommonSuit
        );

        return cardsOfMostCommonSuit.reduce((lowest, card) =>
          cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
        );
      }
    }
  }

  // Ensure currentStarter never plays a card with value "Q" unless it is their last card
  if (player === currentStarter) {
    const nonQueenCards = playerCards.filter((card) => card.value !== "Q");
    if (nonQueenCards.length > 0) {
      playerCards = nonQueenCards;
    }
  }

  // Existing logic for cases not meeting the special condition
  let validCards = leadSuit
    ? playerCards.filter((card) => card.suit === leadSuit)
    : playerCards;

  return validCards.length > 0
    ? validCards.reduce((lowest, card) =>
        cardRanks[card.value] < cardRanks[lowest.value] ? card : lowest
      )
    : playerCards.reduce((highest, card) =>
        cardRanks[card.value] > cardRanks[highest.value] ? card : highest
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
    alert(`You must play a ${leadSuit} card!`);
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
  // Count the number of hearts played in this round
  const heartsCount = inPlay.filter((card) => card.suit === "♥").length;

  // Update the winner's score by the number of hearts
  score[players.indexOf(winner)] += heartsCount;

  updateScores();

  const totalHeartsPlayed =
    deck.filter((card) => card.suit === "♥").length -
    players.reduce(
      (acc, player) =>
        acc + playerHands[player].filter((card) => card.suit === "♥").length,
      0
    );

  if (totalHeartsPlayed === 8) {
    document.querySelector(".tophand").innerHTML =
      '<div class="end-message">All hearts have been played</div>';
    roundComplete = true;
    dealButtonEl.disabled = false;
    nextRoundButtonEl.disabled = true; // Disable the next button
    clearBoard();
    resetGameState();
    return; // Ensure the function exits here
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
    alert("All players must play a card before proceeding to the next round!");
    return;
  }

  function checkGameOver() {
    const totalHeartsPlayed =
      deck.filter((card) => card.suit === "♥").length -
      players.reduce(
        (acc, player) =>
          acc + playerHands[player].filter((card) => card.suit === "♥").length,
        0
      );

    if (totalHeartsPlayed === 8) {
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
      nextRoundButtonEl.disabled = true; // Disable the next button
      clearBoard();
      resetGameState();
      return; // Ensure the function exits here
    }
  }

  checkGameOver();

  roundComplete = false;
  startRound(currentStarter);
});
