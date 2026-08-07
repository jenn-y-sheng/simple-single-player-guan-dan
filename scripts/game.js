import { currentLevel, evaluatePlay, canBeat } from "./comparison-logic.js";
import { generateDeck, fisherYatesShuffle } from "./deck.js";

const gameState = {
  players: [[], [], [], []],
  activePlayerIndex: 0,
  passCount: 0,

  currentTrick: {
    cards: [],
    details: null,
    winnerIndex: null
  }
}

function initGame() {
  console.log("Initializing game");

  let deck = generateDeck();
  deck = fisherYatesShuffle(deck);

  dealCards(deck);
  console.log("Player 1 Hand: ", players[0]);
}

function dealCards(deck) {
  for (let i = 0; i < deck.length; i++) {
    players[i % 4].push(deck[i]);
  }
  for (let i = 0; i < 4; i++) {
    sortHand(players[i]);
  }
}

function sortHand(hand) {
  hand.sort((a, b) => {
    let weightA = a.rank;
    let weightB = b.rank;

    if (a.rank === currentLevel) weightA = a.suit === 'H' ? 14.5 : 14.1;
    if (b.rank === currentLevel) weightB = b.suit === 'H' ? 14.5 : 14.1;

    if (weightA !== weightB) {
      return weightA - weightB;
    }
    
    return b.suit.localeCompare(a.suit);
  })
}

initGame();