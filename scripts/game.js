import { currentLevel, evaluatePlay, canBeat } from "./comparison-logic.js";
import { generateDeck, fisherYatesShuffle } from "./deck.js";

export const gameState = {
  players: [[], [], [], []],
  trickPile: [],
  activePlayerIndex: 0,
  passCount: 0,

  currentTrick: {
    cards: [],
    details: null,
    winnerIndex: null
  },

  passTurn() {
    console.log(`Player ${this.activePlayerIndex + 1} passed`);
    this.passCount++;
    if (this.passCount === 3) {
      console.log(`Player ${this.currentTrick.winnerIndex + 1} wins this turn`);
      this.activePlayerIndex = this.currentTrick.winnerIndex;
      this.currentTrick = {cards: [], details: null, winnerIndex: null};
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
  const currentTrick = gameState.currentTrick;

  const rankCounts = {};
  hand.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  })

  if (currentTrick.cards.length === 0) {
    // tries to look for lowest singleton card to play
    for (let i = 0; i < hand.length; i++) {
      if (rankCounts[hand[i].rank] === 1) {
        return [hand[i]];
      }
    }
    // if no singletons, play lowest card
    return [hand[0]];
  }

  const trickName = currentTrick.details.name;

  if (trickName === 'Single') {
    return findPlayOfSize(hand, rankCounts, 1);
  }
  if (trickName === 'Pair') {
    return findPlayOfSize(hand, rankCounts, 2);
  }
  if (trickName === 'Triple') {
    return findPlayOfSize(hand, rankCounts, 3);
  }
  if (trickName === 'Full-House') {
    return findFullHouse(hand, rankCounts);
  }
  if (trickName === 'Straight') {
    return findSequencePlay(hand, rankCounts, 5, 1);
  }
  if (trickName === 'Tube') {
    return findSequencePlay(hand, rankCounts, 3, 2);
  }
  if (trickName === 'Plate') {
    return findSequencePlay(hand, rankCounts, 2, 3);
  }
  return null;
}

function findPlayOfSize(hand, rankCounts, playSize) {
  const wilds = hand.filter(c => c.rank === currentLevel && c.suit === 'H');
  const naturals = hand.filter(c => !(c.rank === currentLevel && c.suit === 'H'));

  const cardsByRank = {};
  const currentTrickCards = gameState.currentTrick.cards;
  naturals.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
  });

  const uniqueRanks = [...new Set(hand.map(card => card.rank))];

  for (let wildsToSpend = 0; wildsToSpend <= wilds.length; wildsToSpend++) {
    const requiredNaturals = playSize - wildsToSpend;
    if (requiredNaturals < 0) {
      continue;
    }
    for (let targetCount = playSize; targetCount <= 4; targetCount++) {
      for (const rank of uniqueRanks) {
        const count = rankCounts[rank];
        if (count === targetCount || (targetCount === 4 && count >= 4)) {
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
  }
  return null;
}

function findFullHouse(hand, rankCounts) {
  const cardsByRank = {};
  const currentTrickCards = gameState.currentTrick.cards;
  hand.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
  });

  const uniqueRanks = [...new Set(hand.map(card => card.rank))];
  let candidateTriple;
  let candidatePair;
  let testPlay;

  // try to look for exact groups of 3 before breaking up bombs (at least 4 of a kind)
  for (let tripleTarget = 3; tripleTarget <= 4; tripleTarget++) {
    for (const tripleRank of uniqueRanks) {
      const tripleCount = rankCounts[tripleRank];

      if (tripleCount === tripleTarget || (tripleTarget === 4 && tripleCount >= 4)) {
        candidateTriple = cardsByRank[tripleRank].slice(0, 3);

        // try to look for groups of 2, then 3, then 4
        for (let pairTarget = 2; pair <= 4; pairTarget++) {
          for (const pairRank of uniqueRanks) {
            if (pairRank === tripleRank) {
              continue;
            }
            const pairCount = rankCounts[pairRank];
            if (pairCount === pairTarget || (pairTarget === 4 && pairCount >= 4)) {
              candidatePair = cardsByRank[pairRank].slice(0, 2);
              testPlay = [...candidateTriple, ...candidatePair];
              if (canBeat(testPlay, currentTrickCards)) {
                return testPlay;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function findSequencePlay(hand, rankCounts, seqLength, groupSize) {
  const cardsByRank = {};
  const currentTrickCards = gameState.currentTrick.cards;
  hand.forEach(card => {
    if (!cardsByRank[card.rank]) cardsByRank[card.rank] = [];
    cardsByRank[card.rank].push(card);
  });

  if (cardsByRank[14]) {
    cardsByRank[1] = cardsByRank[14];
    rankCounts[1] = rankCounts[14];
  }

  const maxStartRank = 14 - seqLength + 1;

  for (let maxAllowedCount = groupSize; maxAllowedCount <= 4; maxAllowedCount++) {
    for (let startRank = 1; startRank <= maxStartRank; startRank++) {
      let validSequence = true;
      let testPlay = [];

      for (let offset = 0; offset < seqLength; offset++) {
        const currentRank = startRank + offset;
        const count = rank[currentRank];

        // are there enough cards for the group size
        if (!cardsByRank[currentRank] || cardsByRank[currentRank].length < groupSize) {
          validSequence = false;
          break;
        }

        // is this group count larger that the maxAllowedCount we are allowed to break apart
        if (count > maxAllowedCount && maxAllowedCount < 4) {
          validSequence = false;
          break;
        }

        testPlay.push(...cardsByRank[currentRank].slice(0, groupSize));
      }
      if (validSequence && canBeat(testPlay, currentTrickCards)) {
        return testPlay;
      }
    }
  }

  return null;
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