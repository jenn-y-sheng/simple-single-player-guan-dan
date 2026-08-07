// When the game starts, the card with highest level below jokers
// These are wild cards

// ranks:
// 2-10: 2-10
// J, Q, K, A: 11, 12, 13, 14
// Small/Big Joker: 15, 16

let currentLevel = 2;

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

export function isSingle(cards) {
  return cards.length === 1;
}

export function isPair(cards) {
  if (cards.length !== 2) {
    return false;
  }

  const wildsCount = cards.filter(card => card.isWild).length;
  const naturals = cards.filter(card => !card.isWild);

  if (wildsCount) {
    return true;
  }

  return cards[0].rank === cards[1].rank;
}

export function isTriple(cards) {
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

export function isFullHouse(cards) {
  if (cards.length !== 5) {
    return false;
  }

  const hasJokers = cards.some(c => c.rank >= 15);
  if (hasJokers) {
    return false;
  }

  const wildsCount = cards.filter(card => card.isWild).length;
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

  if (wildsCount === 0) {
    return maxCount === 3 && minCount === 2;
  }
  if (wildsCount === 1) {
    return (maxCount === 3 && minCount === 1) || (maxCount === 2 && minCount === 2);
  }
  
  return wildsCount >= 2;
}

function isValidSequence(naturals, wildsCount, seqLength, groupSize) {
  if (naturals.length === 0) {
    return true;
  }

  const ranks = naturals.map(card => card.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  // e.g. 2 3 4 5 7, seqLength = 5
  // 7 - 2 = 5, but this isn't a straight
  if (maxRank - minRank >= seqLength) {
    return false;
  }

  const counts = {};
  ranks.forEach(r => {
    counts[r] = (counts[r] || 0) + 1;
  });

  let deficit = 0;
  for (let r = minRank; r < minRank + seqLength; r++) {
    const count = counts[r] || 0;
    
    if (count > groupSize) {
      return false;
    }
    
    // If the count is less than groupsize, we can fill it up with wild cards if there are any
    // Record deficits to see if we have exactly enough wilds to make it up
    // Also prevents wraparounds
    deficit += (groupSize - count);
  }

  return deficit === wildsCount;
}

// Aces can be low (1) or high (14)
function checkSequenceWithAces(cards, seqLength, groupSize) {
  const wildsCount = cards.filter(card => card.isWild).length;
  const naturals = cards.filter(c => !c.isWild);

  if (isValidSequence(naturals, wildsCount, seqLength, groupSize)) {
    return true;
  }

  // Check if there was a high ace if failed, then try again with low ace
  const hasAce = naturals.some(card => card.rank === 14);
  if (hasAce) {
    const lowAceNaturals = naturals.map(card => 
      card.rank === 14 ? { ...card, rank: 1 } : card
    );
    return isValidSequence(lowAceNaturals, wildsCount, seqLength, groupSize);
  }
}

export function isStraight(cards) {
  if (cards.length != 5) {
    return false;
  }
  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return false;
  }

  const naturals = cards.filter(card => !card.isWild);
  // If only 1 unique suit, it's a bomb (straight flush)
  const uniqueSuits = new Set(naturals.map(card => card.suit));
  if (uniqueSuits.size <= 1) {
    return false;
  }

  return checkSequenceWithAces(cards, 5, 1); // sequence of 5 distinct ranks, 1 per rank
}

export function isTube(cards) {
  if (cards.length != 6) {
    return false;
  }
  const hasJokers = cards.some(c => c.rank >= 15);
  if (hasJokers) {
    return false;
  }

  return checkSequenceWithAces(cards, 3, 2); // sequence of 3 distinct ranks, 2 per rank
}

export function isPlate(cards) {
  if (cards.length != 6) {
    return false;
  }
  const hasJokers = cards.some(c => c.rank >= 15);
  if (hasJokers) {
    return false;
  }

  return checkSequenceWithAces(cards, 2, 3); // sequence of 2 distinct ranks, 3 per rank
}

// Bomb tiers (lowest to highest)
// 1: 4 of a kind
// 2: 5 of a kind
// 3: Straight flush (straight with same suit)
// 4: 6 of a kind
// 5: 7 of a kind
// 6: 8 of a kind
// 7: 9 of a kind
// 8: 10 of a kind
// 9: All 4 jokers
export function evalBomb(cards) {
  if (cards.length < 4 || cards.length > 10) {
    return null;
  }

  const naturals = cards.filter(card => !card.isWild);
  const uniqueRanks = new Set(naturals.map(card => card.rank));
  const len = cards.length;

  // Joker bomb with 2 small and 2 big jokers (biggest bomb)
  const smallJokers = cards.filter(card => card.rank === 15).length;
  const bigJokers = cards.filter(card => card.rank === 16).length;
  const hasJokers = smallJokers > 0 || bigJokers > 0;
  
  if (len === 4 && smallJokers === 2 && bigJokers === 2) {
    return { name: "Four-Joker", tier: 9, topRank: 16 }; 
  }

  // if has jokers but not joker bomb, it's not a bomb
  if (hasJokers) {
    return null;
  }

  if (len === 5) {
    const uniqueSuits = new Set(naturals.map(card => card.suit));
    if (uniqueSuits.size <= 1 && checkSequenceWithAces(cards, 5, 1)) {
      const hasAce = uniqueRanks.has(14);
      const hasTwo = uniqueRanks.has(2);
      let topRank;
      // A 2 3 4 5
      if (hasAce && hasTwo) {
        topRank = 5;
      } else {
        const minRank = Math.min(...uniqueRanks);
        topRank = minRank + 4;
      }

      return { name: "Straight Flush", tier: 3, topRank: topRank };
    }
  }

  if (naturals.length <= 1 || uniqueRanks.size === 1) {
    let tier;
    if (len === 4) {
      tier = 1;
    } else if (len === 5) {
      tier = 2;
    } else {
      tier = len - 2;
    }

    let topRank;
    if (naturals.length === 0) { // all wilds
      topRank = currentLevel;
    } else {
      topRank = naturals[0].rank;
    }

    return { name: `${len}-of-a-Kind`, tier, topRank };
  }

  return null;
}