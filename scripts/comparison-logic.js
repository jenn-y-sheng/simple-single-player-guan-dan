// When the game starts, the card with highest level below jokers
// These are wild cards

// ranks:
// 2-10: 2-10
// J, Q, K, A: 11, 12, 13, 14
// Small/Big Joker: 15, 16

export let currentLevel = 2;

export function rankStrength(rank) {
  if (rank >= 15) return 100 + rank;
  if (rank === currentLevel) return 99;
  return rank;
}

class Classification {
  name;
  topRank;

  constructor(classificationInfo) {
    this.name = classificationInfo.name;
    this.topRank = classificationInfo.topRank;
  }
}

class BombClassification extends Classification {
  tier;

  constructor(classificationInfo) {
    super(classificationInfo);
    this.tier = classificationInfo.tier
  }
}

export function evalSingle(cards) {
  if (cards.length !== 1) return null;
  return new Classification({ 
    name: 'Single',
    topRank: cards[0].rank
  });
}

export function evalPair(cards) {
  if (cards.length !== 2) {
    return null;
  }

  const hasJokers = cards.some(card => card.rank >= 15);

  //wilds can't stand in for jokers
  if (hasJokers) {
    const wildsCount = cards.filter(card => card.isWild).length;
    if (wildsCount > 0 || cards[0].rank !== cards[1].rank) {
      return null;
    }
    return new Classification({
      name: 'Pair',
      topRank: cards[0].rank
    });
  }

  const naturals = cards.filter(card => !card.isWild);

  if (naturals.length === 2 && naturals[0].rank !== naturals[1].rank) {
    return null;
  }

  let topRank;
  if (naturals.length === 0) {
    topRank = currentLevel;
  } else {
    topRank = naturals[0].rank;
  }

  return new Classification({
    name: 'Pair',
    topRank: topRank
  });
}

export function evalTriple(cards) {
  if (cards.length !== 3) {
    return null;
  }

  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return null;
  }

  const naturals = cards.filter(card => !card.isWild);

  const targetRank = naturals[0].rank;
  if (naturals.every(card => card.rank === targetRank)) {
    return new Classification({
      name: 'Triple',
      topRank: targetRank
    });
  }
  return null;
}

export function evalFullHouse(cards) {
  if (cards.length !== 5) {
    return null;
  }

  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return null;
  }

  const wildsCount = cards.filter(card => card.isWild).length;
  const naturals = cards.filter(card => !card.isWild);
  
  const counts = {};
  naturals.forEach(card => { 
    counts[card.rank] = (counts[card.rank] || 0) + 1; 
  });
  const uniqueRanks = Object.keys(counts).map(Number);

  if (uniqueRanks.length > 2) {
    return null;
  }

  let topRank;
  if (uniqueRanks.length === 1) {
    const rankA = uniqueRanks[0];
    if (wildsCount === 2 && counts[rankA] === 3) {
      topRank = rankA;
    } else {
      return null; 
    }
  } else {
    const rankA = uniqueRanks[0];
    const rankB = uniqueRanks[1];
    const countA = counts[rankA];
    const countB = counts[rankB];

    if (wildsCount === 0) {
      if (countA === 3 && countB === 2) {
        topRank = rankA;
      } else if (countB === 3 && countA === 2) {
        topRank = rankB;
      } else {
        return null;
      }
    } 
    else if (wildsCount === 1) {
      if (countA === 3 && countB === 1) {
        topRank = rankA;
      } else if (countB === 3 && countA === 1) {
        topRank = rankB;
      } else if (countA === 2 && countB === 2) {
        topRank = rankStrength(rankA) >= rankStrength(rankB) ? rankA : rankB;
      } else {
        return null; 
      }
    } 
    else if (wildsCount === 2) {
      topRank = rankStrength(rankA) >= rankStrength(rankB) ? rankA : rankB;
    }
  }
  return new Classification({
    name: 'Full-House',
    topRank: topRank
  });
}

// function isValidSequence(naturals, wildsCount, seqLength, groupSize) {
//   if (naturals.length === 0) {
//     return true;
//   }

//   const ranks = naturals.map(card => card.rank);
//   const minRank = Math.min(...ranks);
//   const maxRank = Math.max(...ranks);

//   // e.g. 2 3 4 5 7, seqLength = 5
//   // 7 - 2 = 5, but this isn't a straight
//   if (maxRank - minRank >= seqLength) {
//     return false;
//   }

//   const counts = {};
//   ranks.forEach(r => {
//     counts[r] = (counts[r] || 0) + 1;
//   });

//   let deficit = 0;
//   for (let r = minRank; r < minRank + seqLength; r++) {
//     const count = counts[r] || 0;
    
//     if (count > groupSize) {
//       return false;
//     }
    
//     // If the count is less than groupsize, we can fill it up with wild cards if there are any
//     // Record deficits to see if we have exactly enough wilds to make it up
//     // Also prevents wraparounds
//     deficit += (groupSize - count);
//   }

//   return deficit === wildsCount;
// }

function getSequenceMaxTopRank(naturals, seqLength, groupSize, isLowAce = false) {
  const ranks = naturals.map(card => card.rank);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);

  if (Object.values(counts).some(count => count > groupSize)) {
    return null;
  }

  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  const absoluteMaxTop = isLowAce ? seqLength : 14;
  const absoluteMinTop = seqLength;

  for (let top = absoluteMaxTop; top >= absoluteMinTop; top--) {
    const bottom = top - seqLength + 1;
    if (minRank >= bottom && maxRank <= top) {
       return top; 
    }
  }

  return null;
}

// Aces can be low (1) or high (14)
function checkSequenceWithAces(cards, seqLength, groupSize) {
  const naturals = cards.filter(card => !card.isWild);

  let topRank = getSequenceMaxTopRank(naturals, seqLength, groupSize, false);
  if (topRank !== null) {
    return topRank;
  }

  // Check if there was a high ace if failed, then try again with low ace
  const hasAce = naturals.some(card => card.rank === 14);
  if (hasAce) {
    const lowAceNaturals = naturals.map(card => 
      card.rank === 14 ? { ...card, rank: 1 } : card
    );
    return getSequenceMaxTopRank(lowAceNaturals, seqLength, groupSize, true);
  }
}

export function evalStraight(cards) {
  if (cards.length != 5) {
    return null;
  }
  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return null;
  }

  const naturals = cards.filter(card => !card.isWild);
  // If only 1 unique suit, it's a bomb (straight flush)
  const uniqueSuits = new Set(naturals.map(card => card.suit));
  if (uniqueSuits.size <= 1) {
    return null;
  }

  const topRank = checkSequenceWithAces(cards, 5, 1); // sequence of 5 distinct ranks, 1 per rank
  if (!topRank) {
    return null
  }

  return new Classification({
    name: 'Straight',
    topRank: topRank
  });
}

export function evalTube(cards) {
  if (cards.length != 6) {
    return null;
  }
  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return null;
  }

  const topRank = checkSequenceWithAces(cards, 3, 2); // sequence of 3 distinct ranks, 2 per rank
  if (!topRank) {
    return null;
  }

  return new Classification({
    name: 'Tube',
    topRank: topRank
  });
}

export function evalPlate(cards) {
  if (cards.length != 6) {
    return null;
  }
  const hasJokers = cards.some(card => card.rank >= 15);
  if (hasJokers) {
    return null;
  }

  const topRank = checkSequenceWithAces(cards, 2, 3); // sequence of 2 distinct ranks, 3 per rank
  if (!topRank) {
    return null;
  }

  return new Classification({
    name: 'Plate',
    topRank: topRank
  });
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
    return new BombClassification({ 
      name: "Four-Joker Bomb",
      tier: 9,
      topRank: 16 }); 
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

      return new BombClassification({ 
        name: "Straight-Flush Bomb",
        tier: 3,
        topRank: topRank });
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

    return new BombClassification({ 
      name: `${len}-of-a-Kind Bomb`,
      tier: tier,
      topRank: naturals[0].rank });
  }

  return null;
}

export function evaluatePlay(cards) {
  const bomb = evalBomb(cards);
  if (bomb) {
    return bomb;
  }

  return evalSingle(cards)
    || evalPair(cards)
    || evalTriple(cards)
    || evalFullHouse(cards)
    || evalStraight(cards)
    || evalTube(cards)
    || evalPlate(cards);
}

function compareRanks(attemptedRank, currentRank, playType) {
  // sequences ignore strong level cards
  if (['Straight', 'Tube', 'Plate', 'Straight-Flush Bomb'].includes(playType)) {
    return attemptedRank > currentRank;
  }

  if (attemptedRank === currentRank) {
    return false
  }

  const attemptIsLevel = (attemptedRank === currentLevel);
  const currentIsLevel = (currentRank === currentLevel);
  const attemptIsJoker = (attemptedRank >= 15);
  const currentIsJoker = (currentRank >= 15);
  if (attemptIsLevel) {
    return !currentIsJoker;
  }
  if (currentIsLevel) {
    return attemptIsJoker;
  }

  return attemptedRank > currentRank;
}

export function canBeat(attemptedCards, currentCards) {
  const current = evaluatePlay(currentCards);
  const attempted = evaluatePlay(attemptedCards);

  if (!attempted) {
    return false;
  }

  if (current.tier && attempted.tier) {
    if (current.tier < attempted.tier) {
      return true;
    } else if (current.tier === attempted.tier) {
      return compareRanks(attempted.topRank, current.topRank, attempted.name);
    } else {
      return false;
    }
  }

  if (!current.tier && attempted.tier) {
    return true;
  }

  if (current.name === attempted.name) {
    return compareRanks(attempted.topRank, current.topRank, attempted.name);
  }

  return false;
}