// When the game starts, the card with highest level below jokers
// These are wild cards

// ranks:
// 2-10: 2-10
// J, Q, K, A: 11, 12, 13, 14
// Small/Big Joker: 15, 16

let currentLevel = 2;

class Card {
  rank;
  suit;
  isWild;

  constructor(cardInfo) {
    this.rank = cardInfo.rank;
    this.suit = cardInfo.suit;
    this.isWild = (this.rank === currentLevel);
    console.log(this);
  }
}

function isSingle(cards) {
  return cards.length === 1;
}

function isPair(cards) {
  if (cards.length !== 2) {
    return false;
  }

  const wilds = cards.filter(card => card.isWild).length;
  const naturals = cards.filter(card => !card.isWild);

  if (wilds) {
    return true;
  }

  return cards[0].rank === cards[1].rank;
}

function isTriple(cards) {
  if (cards.length !== 3) {
    return false;
  }

  const hasJokers = cards.some(c => c.rank >= 15);
  if (hasJokers) {
    return false;
  }

  const naturals = cards.filter(c => !c.isWild);

  if (naturals.length === 0) {
    return true;
  }

  const targetRank = naturals[0].rank;
  return naturals.every(c => c.rank === targetRank);
}

function isFullHouse(cards) {
  if (cards.length !== 5) {
    return false;
  }

  const hasJokers = cards.some(c => c.rank >= 15);
  if (hasJokers) {
    return false;
  }

  const wilds = cards.filter(card => card.isWild).length;
  const naturals = cards.filter(card => !card.isWild);
  
  const counts = {};
  naturals.forEach(card => { 
    counts[card.rank] = (counts[card.rank] || 0) + 1; 
  });
  const uniqueRanks = Object.keys(counts);

  if (uniqueRanks.length > 2) {
    return false;
  }

  if (uniqueRanks.length <= 1) {
    return true;
  }

  const [rankA, rankB] = uniqueRanks;
  const maxCount = Math.max(counts[rankA], counts[rankB]);
  const minCount = Math.min(counts[rankA], counts[rankB]);

  if (wilds === 0) {
    return maxCount === 3 && minCount === 2;
  }
  if (wilds === 1) {
    return (maxCount === 3 && minCount === 1) || (maxCount === 2 && minCount === 2);
  }
  
  return wilds >= 2;
}

// basic testing

const card = new Card({
  rank: 3,
  suit: 'hearts'
});

const card2 = new Card({
  rank: 3,
  suit: 'spade'
});
const card3 = new Card({
  rank: 4,
  suit: 'spade'
});

console.log(isSingle([card]));

console.log(isPair([card, card2]));
console.log(isPair([card2, card3]));

console.log(isTriple([card, card2, card3]));