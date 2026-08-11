import { currentLevel, evaluatePlay, canBeat, rankStrength, setCurrentLevel } from "./comparison-logic.js";
import { generateDeck, fisherYatesShuffle } from "./deck.js";

export const gameState = {
  players: [[], [], [], []],
  trickPile: [],
  activePlayerIndex: 0,
  passCount: 0,
  gameOver: false,
  teamLevels: [2, 2], // you and p3 & p2 and p4
  finishingOrder: [],
  declarerTeam: null,
  tableController: null,
  consecutiveControlCount: 0,
  lastFinishingOrder: [],
  isTributePhase: false,
  pendingReturns: [],

  currentTrick: {
    cards: [],
    details: null,
    winnerIndex: null
  },

  passTurn() {
    console.log(`Player ${this.activePlayerIndex + 1} passed`);
    this.passCount++;

    const winnerIndex = this.currentTrick.winnerIndex;
    // everyone except winner needs to pass
    const passesNeeded = this.players.filter((hand, i) => i !== winnerIndex && hand.length > 0).length;

    if (this.passCount >= passesNeeded) {
      console.log(`Player ${this.currentTrick.winnerIndex + 1} wins this turn`);

      if (this.tableController === winnerIndex) {
        this.consecutiveControlCount++;
      } else {
        this.tableController = winnerIndex;
        this.consecutiveControlCount = 1;
      }

      this.activePlayerIndex = this.currentTrick.winnerIndex;

      if (this.players[this.activePlayerIndex].length == 0) {
        const partnerIndex = getPartnerIndex(this.activePlayerIndex);

        if (this.players[partnerIndex].length > 0) {
          console.log(`Table control passes to partner: Player ${partnerIndex + 1}`);
          this.activePlayerIndex = partnerIndex;
        } else {
          this.advanceTurn();
        }
      }

      this.currentTrick = {cards: [], details: null, winnerIndex: null};
      this.passCount = 0;
    } else {
      this.advanceTurn();
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

    console.log(`Player ${this.activePlayerIndex + 1} played a ${playDetails.name} of rank ${playDetails.topRank}`);

    this.currentTrick = {
      cards: cards,
      details: playDetails,
      winnerIndex: this.activePlayerIndex
    };

    this.players[this.activePlayerIndex] = this.players[this.activePlayerIndex].filter(
      handCard => !cards.includes(handCard)
    );

    if (this.players[this.activePlayerIndex].length === 0 && !this.finishingOrder.includes(this.activePlayerIndex)) {
      this.finishingOrder.push(this.activePlayerIndex);
      console.log(`Player ${this.activePlayerIndex + 1} finished in position ${this.finishingOrder.length}`);
    }

    this.passCount = 0;
    this.advanceTurn();

    return true;
  },

  advanceTurn() {
    let roundOver = false;

    if (this.finishingOrder.length >= 3) {
      roundOver = true;
    } else if (this.finishingOrder.length === 2) {
      const first = this.finishingOrder[0];
      const second = this.finishingOrder[1];
      if (getPartnerIndex(first) === second) {
        roundOver = true;
      }
    }

    if (roundOver) {
      this.calculateLevelUp();
      return;
    }

    // if (this.firstPlayerOut !== null) {
    //   const partnerIndex = getPartnerIndex(this.firstPlayerOut);
    //   if (this.players[partnerIndex].length === 0) {
    //     console.log(`Game Over! Team ${this.firstPlayerOut % 2 === 0 ? '1 & 3' : '2 & 4'} wins!`);
    //     this.gameOver = true;
    //     return;
    //   }
    // }

    // const activePlayersCount = this.players.filter(hand => hand.length > 0).length;
    // if (activePlayersCount <= 1) {
    //   console.log('Game over');
    //   this.gameOver = true;
    //   return;
    // }

    let nextIndex = (this.activePlayerIndex + 1) % 4;
    while (this.players[nextIndex].length === 0) {
      nextIndex = (nextIndex + 1) % 4;
    }
    this.activePlayerIndex = nextIndex;
  },

  calculateLevelUp() {
    const banker = this.finishingOrder[0];
    const winningTeam = banker % 2;
    const partner = getPartnerIndex(banker);

    let partnerPosition = this.finishingOrder.indexOf(partner);
    if (partnerPosition === -1) {
      partnerPosition = 3;
    }

    let levelsGained = 0;
    if (partnerPosition === 1) levelsGained = 3;
    else if (partnerPosition === 2) levelsGained = 2;
    else if (partnerPosition === 3) levelsGained = 1;

    this.teamLevels[winningTeam] += levelsGained;
    
    // top level is ace (14)
    if (this.teamLevels[winningTeam] > 14) {
      this.teamLevels[winningTeam] = 14;
    }

    this.declarerTeam = winningTeam;
    this.gameOver = true;

    setCurrentLevel(this.teamLevels[winningTeam]);

    console.log(`Team ${winningTeam + 1} wins the round and gains ${levelsGained} level(s)!`);
    console.log(`New levels: team 1 is at ${this.teamLevels[0]}, team 2 is at ${this.teamLevels[1]}`);
    console.log(`The next round will be played at level: ${currentLevel}`);
    document.dispatchEvent(new CustomEvent('levelUpdated', {
      detail: {
        winningTeam: winningTeam + 1,
        levelsGained: levelsGained,
        newLevel: this.teamLevels[winningTeam]
      }
    }));
  },

  handleTributes() {
    const tributes = evaluateTribute(this.lastFinishingOrder);
    if (!tributes || tributes.length === 0) {
      this.endTributePhase();
      return;
    }

    this.isTributePhase = true;
    this.pendingReturns = [];

    tributes.forEach(t => {
      const giver = t.from;
      const receiver = t.to;

      let highestCard = this.players[giver][0];
      let highestStrength = rankStrength(highestCard.rank);
      let highestIndex = 0;

      this.players[giver].forEach((card, index) => {
        const strength = rankStrength(card.rank);
        if (strength > highestStrength) {
          highestStrength = strength;
          highestCard = card;
          highestIndex = index;
        }
      });

      this.players[giver].splice(highestIndex, 1);
      this.players[receiver].push(highestCard);
      sortHand(this.players[receiver]);

      this.pendingReturns.push({ from: receiver, to: giver });
      console.log(`Player ${giver + 1} pays tribute to Player ${receiver + 1}`);
    });

    this.processBotReturns();
  },

  processBotReturns() {
    // bots return weakest non-wild card
    this.pendingReturns = this.pendingReturns.filter(ret => {
      const receiver = ret.from;
      if (receiver === 0) return true; // humans return manually

      let lowestCardIndex = 0;
      let lowestStrength = Infinity;
      
      this.players[receiver].forEach((card, i) => {
         const strength = rankStrength(card.rank);
         if (strength < lowestStrength && !card.isWild) {
           lowestStrength = strength;
           lowestCardIndex = i;
         }
      });
      
      const returnedCard = this.players[receiver].splice(lowestCardIndex, 1)[0];
      this.players[ret.to].push(returnedCard);
      sortHand(this.players[ret.to]);
      
      console.log(`Player ${receiver + 1} returns a card to Player ${ret.to + 1}`);
      return false;
    });

    if (this.pendingReturns.length === 0) {
       this.endTributePhase();
    }
  },

  returnCardFromHuman(cardIndex) {
    const retIndex = this.pendingReturns.findIndex(r => r.from === 0);
    if (retIndex === -1) return false;

    const ret = this.pendingReturns[retIndex];
    const returnedCard = this.players[0].splice(cardIndex, 1)[0];
    this.players[ret.to].push(returnedCard);
    sortHand(this.players[ret.to]);

    console.log(`You returned a card to Player ${ret.to + 1}`);
    this.pendingReturns.splice(retIndex, 1);

    if (this.pendingReturns.length === 0) {
       this.endTributePhase();
    }
    return true;
  },

  endTributePhase() {
    this.isTributePhase = false;
    this.activePlayerIndex = this.lastFinishingOrder.length > 0 ? this.lastFinishingOrder[0] : 0;
    document.dispatchEvent(new CustomEvent('tributePhaseEnded'));
  }
}

function initGame() {
  console.log("Initializing game");

  let deck = generateDeck();
  deck = fisherYatesShuffle(deck);

  dealCards(deck);
  console.log("Player 1 Hand: ", gameState.players[0]);
  console.log("Player 2 Hand: ", gameState.players[1]);
  console.log("Player 3 Hand: ", gameState.players[2]);
  console.log("Player 4 Hand: ", gameState.players[3]);
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

export function findValidPlayForBot(botIndex) {
  const hand = gameState.players[botIndex];
  if (hand.length === 0) {
    return null;
  }

  const currentTrick = gameState.currentTrick;

  const rankCounts = {};
  hand.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  })

  if (currentTrick.cards.length === 0) {
    return findLeadPlay(hand);
  }

  // don't sabotage partners unless there's a good reason
  if (isPartnerInControl(botIndex) && !shouldOverridePartner(botIndex, hand)) {
    return null;
  }

  const trickName = currentTrick.details.name;
  let standardPlay;

  if (trickName === 'Single') {
    standardPlay = tryContestPlayOfSize(hand, 1);
  } else if (trickName === 'Pair') {
    standardPlay = tryContestPlayOfSize(hand, 2);
  } else if (trickName === 'Triple') {
    standardPlay = tryContestPlayOfSize(hand, 3);
  } else if (trickName === 'Full-House') {
    standardPlay = tryContestFullHouse(hand);
  } else if (trickName === 'Straight') {
    standardPlay = tryContestSequence(hand, 5, 1, botIndex);
  } else if (trickName === 'Tube') {
    standardPlay = tryContestSequence(hand, 3, 2, botIndex);
  } else if (trickName === 'Plate') {
    standardPlay = tryContestSequence(hand, 2, 3, botIndex);
  }
  if (standardPlay) {
    return standardPlay;
  }

  if (shouldUseBomb(botIndex)) {
    return findBomb(hand);
  }
  return null;
}

function findLeadPlay(hand) {
  const naturals = hand.filter(card => !card.isWild);
  const cardsByRank = {};
  const rankCounts = {};

  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const uniqueRanks = [...new Set(naturals.map(card => card.rank))]
    .filter(rank => rank < 15)
    .sort((a, b) => rankStrength(a) - rankStrength(b));

  const jokerRanks = [...new Set(naturals.filter(c => c.rank >= 15).map(c => c.rank))];

  const findNaturalSequence = (seqLength, groupSize) => {
    const localCounts = { ...rankCounts };
    const localCards = { ...cardsByRank };

    if (localCards[14]) {
      localCards[1] = localCards[14];
      localCounts[1] = localCounts[14];
    }
    
    const maxStartRank = 14 - seqLength + 1;
    let bestCandidate;
    let bestLeftoverCost = Infinity;

    for (let startRank = 1; startRank <= maxStartRank; startRank++) {
      let validSequence = true;
      let testPlay = [];
      let leftoverCost = 0;

      for (let offset = 0; offset < seqLength; offset++) {
        const currentRank = startRank + offset;
        const count = localCounts[currentRank] || 0;
        if (count < groupSize || count >= 4) {
          validSequence = false;
          break;
        }
        leftoverCost += (count - groupSize);
        testPlay.push(...localCards[currentRank].slice(0, groupSize));
      }
      if (validSequence && leftoverCost < bestLeftoverCost) {
        bestCandidate = testPlay;
        bestLeftoverCost = leftoverCost;
        if (bestLeftoverCost === 0) break;
      }
    }
    return bestCandidate;
  };

  for (const rank of uniqueRanks) {
    if (rankCounts[rank] === 1) return [cardsByRank[rank][0]];
  }

  for (const tripRank of uniqueRanks) {
    if (rankCounts[tripRank] === 3) {
      for (const pairRank of uniqueRanks) {
        if (pairRank !== tripRank && (rankCounts[pairRank] === 2 || rankCounts[pairRank] === 3)) {
          return [
            ...cardsByRank[tripRank].slice(0, 3),
            ...cardsByRank[pairRank].slice(0, 2)
          ];
        }
      }
    }
  }

  for (const rank of uniqueRanks) {
    if (rankCounts[rank] === 2) return cardsByRank[rank].slice(0, 2);
  }

  for (const rank of uniqueRanks) {
    if (rankCounts[rank] === 3) return cardsByRank[rank].slice(0, 3);
  }

  const straight = findNaturalSequence(5, 1);
  if (straight) return straight;

  const tube = findNaturalSequence(3, 2);
  if (tube) return tube;

  const plate = findNaturalSequence(2, 3);
  if (plate) return plate;

  for (const rank of uniqueRanks) {
    if (rankCounts[rank] >= 4) return cardsByRank[rank].slice(0, 4);
  }

  if (jokerRanks.length > 0) {
    const targetJoker = jokerRanks[0];
    if (rankCounts[targetJoker] === 2) {
      return cardsByRank[targetJoker].slice(0, 2);
    }
    return [cardsByRank[targetJoker][0]];
  }

  return [hand[0]];
}

function getCandidateGroups(uniqueRanks, cardsByRank, rankCounts, requiredNaturals, excludeRank = null) {
  const candidates = [];

  for (const rank of uniqueRanks) {
    if (rank === excludeRank) {
      continue;
    }
    const count = rankCounts[rank] || 0;
    if (count < requiredNaturals) {
      continue;
    }

    const usableCount = Math.min(count, 4);
    const leftoverCost = usableCount - requiredNaturals;

    candidates.push({
      rank,
      cards: requiredNaturals > 0 ? cardsByRank[rank].slice(0, requiredNaturals) : [],
      leftoverCost
    });
  }

  candidates.sort((a, b) => a.leftoverCost - b.leftoverCost || rankStrength(a.rank) - rankStrength(b.rank));

  // for (let targetCount = requiredNaturals; targetCount <= 4; targetCount++) {
  //   if (requiredNaturals > 0 && targetCount === 0) continue; 
    
  //   for (const rank of uniqueRanks) {
  //     if (rank === excludeRank) {
  //       continue;
  //     }
      
  //     const count = rankCounts[rank] || 0;
  //     if (count === targetCount || (targetCount === 4 && count >= 4)) {
  //       candidates.push({
  //         rank: rank,
  //         cards: requiredNaturals > 0 ? cardsByRank[rank].slice(0, requiredNaturals) : []
  //       });
  //     }
  //   }
  // }
  
  return candidates;
}

function findPlayOfSize(hand, playSize) {
  const wilds = hand.filter(card => card.isWild);
  const naturals = hand.filter(card => !card.isWild);

  const cardsByRank = {};
  const rankCounts = {};
  const currentTrickCards = gameState.currentTrick.cards;
  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const uniqueRanks = [...new Set(naturals.map(card => card.rank))];

  for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
    const requiredNaturals = playSize - wildsToSpend;
    if (requiredNaturals < 0) {
      continue;
    }
    const candidates = getCandidateGroups(uniqueRanks, cardsByRank, rankCounts, requiredNaturals);
    for (const candidate of candidates) {
      const testPlay = [...candidate.cards, ...wilds.slice(0, wildsToSpend)];
      if (canBeat(testPlay, currentTrickCards)) {
        return {
          cards: testPlay,
          leftoverCost: candidate.leftoverCost,
          usesJoker: candidate.rank >= 15
        };
      }
    }
  }
  return null;
}

function tryContestPlayOfSize(hand, playSize) {
  const result = findPlayOfSize(hand, playSize);
  if (!result) return null;

  if (result.leftoverCost > 0 && gameState.players[gameState.currentTrick.winnerIndex].length > 5) {
    return null;
  }

  // only use joker if someone's close to winning
  if (result.usesJoker) {
    const winnerHandLength = gameState.players[gameState.currentTrick.winnerIndex].length;
    if (winnerHandLength > 3 && hand.length > 3) {
      return null;
    }
  }

  return result.cards;
}

function findFullHouse(hand) {
  const wilds = hand.filter(card => card.isWild);
  const naturals = hand.filter(card => !card.isWild);

  const cardsByRank = {};
  const rankCounts = {};
  const currentTrickCards = gameState.currentTrick.cards;
  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const uniqueRanks = [...new Set(naturals.map(card => card.rank))];

  for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
    for (let wildsForTriple = 0; wildsForTriple <= wildsToSpend; wildsForTriple++) {
      const wildsForPair = wildsToSpend - wildsForTriple;
      if (wildsForTriple > 3 || wildsForPair > 2) {
        continue;
      }
      const reqNatTriple = Math.max(0, 3 - wildsForTriple);
      const reqNatPair = Math.max(0, 2 - wildsForPair);

      const tripleCandidates = getCandidateGroups(uniqueRanks, cardsByRank, rankCounts, reqNatTriple);
      for (const triple of tripleCandidates) {
        const pairCandidates = getCandidateGroups(uniqueRanks, cardsByRank, rankCounts, reqNatPair, triple.rank);
        for (const pair of pairCandidates) {
          const testPlay = [
            ...triple.cards,
            ...pair.cards,
            ...wilds.slice(0, wildsToSpend)
          ];
          if (canBeat(testPlay, currentTrickCards)) {
            return {
              cards: testPlay,
              wildsUsed: wildsToSpend,
              leftoverCost: triple.leftoverCost + pair.leftoverCost
            }
          }
        }
      }
    }
  }
  return null;
}

function tryContestFullHouse(hand) {
  const result = findFullHouse(hand);
  if (!result) return null;

  const winnerIndex = gameState.currentTrick.winnerIndex;
  const winnerHandLength = gameState.players[winnerIndex].length;

  if (result.wildsUsed === 0 && result.leftoverCost === 0) {
    return result.cards;
  }

  if (winnerHandLength <= 4) {
    return result.cards;
  }

  if (hand.length <= 6) {
    return result.cards;
  }

  return null;
}

function findSequencePlay(hand, seqLength, groupSize) {
  const wilds = hand.filter(card => card.isWild);
  const naturals = hand.filter(card => !card.isWild);

  const cardsByRank = {};
  const rankCounts = {};
  const currentTrickCards = gameState.currentTrick.cards;
  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  if (cardsByRank[14]) {
    cardsByRank[1] = cardsByRank[14];
    rankCounts[1] = rankCounts[14];
  }

  const maxStartRank = 14 - seqLength + 1;

  for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
    for (let maxAllowedCount = groupSize; maxAllowedCount <= 4; maxAllowedCount++) {
      for (let startRank = 1; startRank <= maxStartRank; startRank++) {
        let validSequence = true;
        let testPlay = [];
        let currentWildsNeeded = 0;
        let leftoverCost = 0;

        for (let offset = 0; offset < seqLength; offset++) {
          const currentRank = startRank + offset;
          const count = rankCounts[currentRank] || 0;
          const missingCards = Math.max(0, groupSize - count);
          currentWildsNeeded += missingCards;

          if (currentWildsNeeded > wildsToSpend) {
            validSequence = false;
            break;
          }

          // is this group count larger that the maxAllowedCount we are allowed to break apart
          if (count > maxAllowedCount && maxAllowedCount < 4) {
            validSequence = false;
            break;
          }
          
          if (count > 0) {
            const cardsToTake = groupSize - missingCards;
            testPlay.push(...cardsByRank[currentRank].slice(0, cardsToTake));
            leftoverCost += Math.max(0, count - cardsToTake);
          }
        }
        if (validSequence && currentWildsNeeded === wildsToSpend) {
          testPlay.push(...wilds.slice(0, wildsToSpend));
          if (canBeat(testPlay, currentTrickCards)) {
            return { cards: testPlay, wildsUsed: wildsToSpend, leftoverCost };
          }
        }
      }
    }
  }

  return null;
}

function tryContestSequence(hand, seqLength, groupSize, botIndex) {
  const result = findSequencePlay(hand, seqLength, groupSize);
  if (!result) return null;

  const winnerIndex = gameState.currentTrick.winnerIndex;
  const winnerHand = gameState.players[winnerIndex];

  if (result.wildsUsed === 0 && result.leftoverCost === 0) {
    return result.cards;
  }

  if (winnerHand.length <= 10) {
    return result.cards;
  }

  if (hand.length <= 10) {
    return result.cards;
  }

  return null;
}

function findBomb(hand) {
  const wilds = hand.filter(card => card.isWild);
  const naturals = hand.filter(card => !card.isWild);

  const cardsByRank = {};
  const rankCounts = {};
  const currentTrickCards = gameState.currentTrick.cards;

  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const uniqueRanks = [...new Set(naturals.map(card => card.rank))].sort((a, b) => a - b);

  const findStandardBomb = (bombSize) => {
    for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
      const requiredNaturals = bombSize - wildsToSpend;
      if (requiredNaturals <= 0) {
        continue;
      }
      for (const rank of uniqueRanks) {
        const count = rankCounts[rank] || 0;
        if (count >= requiredNaturals) {
          const testPlay = [
            ...cardsByRank[rank].slice(0, requiredNaturals),
            ...wilds.slice(0, wildsToSpend)
          ];
          if (canBeat(testPlay, currentTrickCards)) {
            return testPlay;
          }
        }
      }
    }
    return null;
  };
  
  let play = findStandardBomb(4);
  if (play) return play;

  play = findStandardBomb(5);
  if (play) return play;

  play = findStraightFlushBomb(hand);
  if (play) return play;

  for (let size = 6; size <= 10; size++) {
    play = findStandardBomb(size);
    if (play) return play;
  }

  return findJokerBomb(hand);
}

function findStraightFlushBomb(hand) {
  const wilds = hand.filter(card => card.isWild);
  const naturals = hand.filter(card => !card.isWild);
  const currentTrickCards = gameState.currentTrick.cards;
  const suits = ['S', 'H', 'C', 'D'];

  for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
    for (const suit of suits) {
      const suitNaturals = naturals.filter(card => card.suit === suit);

      const cardsByRank = {};
      suitNaturals.forEach(card => {
        cardsByRank[card.rank] = card;
      });

      if (cardsByRank[14]) {
        cardsByRank[1] = cardsByRank[14];
      }

      for (let startRank = 1; startRank <= 10; startRank++) {
        let validSequence = true;
        let testPlay = [];
        let currentWildsNeeded = 0;
        for (let offset = 0; offset < 5; offset++) {
          const currentRank = startRank + offset;
          if (!cardsByRank[currentRank]) {
            currentWildsNeeded++;
          } else {
            testPlay.push(cardsByRank[currentRank]);
          }

          if (currentWildsNeeded > wildsToSpend) {
            validSequence = false;
            break;
          }
        }
        if (validSequence && currentWildsNeeded === wildsToSpend) {
          testPlay.push(...wilds.slice(0, wildsToSpend));
          if (canBeat(testPlay, currentTrickCards)) {
            return testPlay;
          }
        }
      }
    }
  }
  return null;
}

function findJokerBomb(hand) {
  const jokers = hand.filter(card => card.rank >= 15);
  if (jokers.length === 4) {
    const testPlay = [...jokers];
    if (canBeat(testPlay, gameState.currentTrick.cards)) {
      return testPlay;
    }
  }
  return null;
}

function shouldUseBomb(botIndex) {
  const hand = gameState.players[botIndex];
  const winnerIndex = gameState.currentTrick.winnerIndex;
  const winnerHand = gameState.players[winnerIndex];

  // don't bomb your partner
  if (winnerIndex === getPartnerIndex(botIndex)) {
    return false;
  }

  const opponentPlayedBomb = gameState.currentTrick.details.tier !== undefined;

  // the player who put the current trick is close to winning
  if (winnerHand.length <= 10) {
    return true;
  }
  // this bot is close to winning
  if (hand.length <= 10) {
    return true;
  }

  let willingness = 1 - hand.length / 27;

  if (gameState.tableController === winnerIndex && gameState.consecutiveControlCount >= 2) {
    willingness += 0.40;
    console.log(`Player ${botIndex + 1} is getting impatient with Player ${winnerIndex + 1}'s table control`);
  }

  if (opponentPlayedBomb) {
    return Math.random() < willingness * 0.75;
  }

  return Math.random() < willingness * 0.4;
}

function getPartnerIndex(botIndex) {
  return (botIndex + 2) % 4;
}

function isPartnerInControl(botIndex) {
  const winnerIndex = gameState.currentTrick.winnerIndex;
  return winnerIndex !== null && winnerIndex === getPartnerIndex(botIndex);
}

function shouldOverridePartner(botIndex, hand) {
  const partnerIndex = getPartnerIndex(botIndex);
  const partnerHandLength = gameState.players[partnerIndex].length;

  if (partnerHandLength === 1) {
    return false;
  }
  if (hand.length <= 2) {
    return true;
  }
  return false;
}

export function startNewRound() {
  const nextLeader = gameState.finishingOrder.length > 0 ? gameState.finishingOrder[0] : 0;

  gameState.players = [[], [], [], []];
  gameState.trickPile = [];
  gameState.currentTrick = { cards: [], details: null, winnerIndex: null };
  gameState.passCount = 0;
  gameState.gameOver = false;
  gameState.tableController = null;
  gameState.consecutiveControlCount = 0;
  gameState.finishingOrder = [];

  gameState.activePlayerIndex = nextLeader;

  initGame();
}

function evaluateTribute(previousFinishingOrder) {
  if (previousFinishingOrder.length < 4) {
    return null;
  }

  const first = previousFinishingOrder[0];
  const second = previousFinishingOrder[1];
  const third = previousFinishingOrder[2];
  const fourth = previousFinishingOrder[3];

  const winningTeam = first % 2;
  const losingTeam = 1 - winningTeam;

  // does losing team have both red jokers
  let losingRedJokers = 0;
  let message = '';

  if (getPartnerIndex(first) === second) {
    for (let i = 0; i < 4; i++) {
      if (i % 2 === losingTeam) {
        losingRedJokers += gameState.players[i].filter(c => c.rank === 16).length;
      }
    }
    message = 'losing team';
  } else {
    losingRedJokers += gameState.players[fourth].filter(c => c.rank === 16).length;
    message = 'player in last'
  }

  if (losingRedJokers >= 2) {
    console.log(`Tribute resisted! The ${message} drew both big jokers.`);
    return null;
  }

  // if winning team got 1st and 2nd
  if (getPartnerIndex(first) === second) {
    return { type: 'double', first, second, third, fourth };
  } else {
    return { type: 'single', first, fourth };
  }
}

initGame();

// const p1Lead = [gameState.players[0][0]]; 
// gameState.playCards(p1Lead);
// console.log("Current Table:", gameState.currentTrick);
// gameState.passTurn();
// gameState.passTurn();
// gameState.passTurn();
// console.log("Next to act:", gameState.activePlayerIndex);
// console.log("Current Table:", gameState.currentTrick.cards);