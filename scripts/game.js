import { currentLevel, evaluatePlay, canBeat } from "./comparison-logic.js";
import { generateDeck, fisherYatesShuffle } from "./deck.js";

export const gameState = {
  players: [[], [], [], []],
  activePlayerIndex: 0,
  passCount: 0,

  currentTrick: {
    cards: [],
    details: null,
    winnerIndex: null
  },

  passTurn() {
    console.log(`Player ${this.activePlayerIndex} passed`);
    this.passCount++;
    if (this.passCount === 3) {
      console.log(`Player ${this.currentTrick.winnerIndex + 1} wins this turn`);
      this.activePlayerIndex = this.currentTrick.winnerIndex;
      this.currentTrick = {cards: null, details: null, winnerIndex: null};
      this.passCount = 0;
    } else {
      this.activePlayerIndex = (this.activePlayerIndex + 1) % 4; // so we can wrap around
    }
  },

  playCards(cards) {
    const playDetails = evaluatePlay(cards);

    if (!playDetails) {
      console.log('Invalid move');
      return false;
    }

    if (this.currentTrick.cards.length > 0) {
      if (!canBeat(cards, this.currentTrick.cards)) {
        console.log('Valid move but can\'t beat current move');
        return false;
      }
    }

    console.log(`Player ${this.activePlayerIndex + 1} played a ${playDetails.name}`);

    this.currentTrick = {
      cards: cards,
      details: playDetails,
      winnerIndex: this.activePlayerIndex
    };

    this.players[this.activePlayerIndex] = this.players[this.activePlayerIndex].filter(
      handCard => !cards.includes(handCard)
    );

    this.passCount = 0;
    this.activePlayerIndex = (this.activePlayerIndex + 1) % 4;

    return true;
  }
}

function initGame() {
  console.log("Initializing game");

  let deck = generateDeck();
  deck = fisherYatesShuffle(deck);

  dealCards(deck);
  console.log("Player 1 Hand: ", gameState.players[0]);
}

function dealCards(deck) {
  for (let i = 0; i < deck.length; i++) {
    gameState.players[i % 4].push(deck[i]);
  }
  for (let i = 0; i < 4; i++) {
    sortHand(gameState.players[i]);
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

const p1Lead = [gameState.players[0][0]]; 
gameState.playCards(p1Lead);
console.log("Current Table:", gameState.currentTrick);
gameState.passTurn();
gameState.passTurn();
gameState.passTurn();
console.log("Next to act:", gameState.activePlayerIndex);
console.log("Current Table:", gameState.currentTrick.cards);