import { currentLevel } from "./comparison-logic.js";

export class Card {
  rank;
  suit;
  isWild;

  constructor(cardInfo) {
    this.rank = cardInfo.rank;
    this.suit = cardInfo.suit;
    this.isWild = (this.rank === currentLevel && this.suit === 'H');
  }
}

function generateDeck() {
  const deck = [];
  const suits = ['S', 'H', 'C', 'D'];
  for (let i = 0; i < 2; i++) {
    for (const suit of suits) {
      for (let rank = 2; rank <= 14; rank++) {
        deck.push(new Card({rank, suit}));
      }
    }
    deck.push(new Card({
      rank: 15,
      suit: 'none'
    }));
    deck.push(new Card({
      rank: 16,
      suit: 'none'
    }));
  }
  return deck;
}

function fisherYatesShuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const deck = generateDeck();
console.log(fisherYatesShuffle(deck));