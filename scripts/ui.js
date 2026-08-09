import { evaluatePlay, canBeat } from "./comparison-logic.js";
import { gameState, findValidPlayForBot } from "./game.js";

const PLAYER_NAMES = ['You', 'Player 2', 'Player 3', 'Player 4'];

function getSvgFileName(card) {
  if (card.rank === 15) return 'black_joker.svg';
  if (card.rank === 16) return 'red_joker.svg';

  const suitNames = {
    'S': 'spades',
    'H': 'hearts',
    'C': 'clubs',
    'D': 'diamonds'
  };
  let suitStr = suitNames[card.suit];

  let rankStr = card.rank;
  if (card.rank === 11) {
    rankStr = 'jack';
    suitStr += '2';
  }
  if (card.rank === 12) {
    rankStr = 'queen';
    suitStr += '2';
  }
  if (card.rank === 13) {
    rankStr = 'king';
    suitStr += '2';
  }
  if (card.rank === 14) {
    rankStr = 'ace';
  }

  return `${rankStr}_of_${suitStr}.svg`
}

function renderHumanHand() {
  const handContainer = document.getElementById('hand-container');
  handContainer.innerHTML = '';

  const humanHand = gameState.players[0];

  humanHand.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    const svgName = getSvgFileName(card);
    cardElement.style.backgroundImage = `url('../images/SVG-cards-1.3/${svgName}')`;

    cardElement.dataset.rank = card.rank;
    cardElement.dataset.suit = card.suit;
    cardElement.dataset.index = index;

    cardElement.addEventListener('click', () => {
      cardElement.classList.toggle('staged');
    });

    handContainer.appendChild(cardElement);
  })
}

function renderOpponentHands() {
  const opponents = [
    {id: 'player-right', index: 1, layoutClass: 'vertical-hand-right'},
    {id: 'player-top', index: 2, layoutClass: 'horizontal-hand'},
    {id: 'player-left', index: 3, layoutClass: 'vertical-hand-left'}
  ];

  opponents.forEach((opp) => {
    const container = document.getElementById(opp.id);
    const existingHand = container.querySelector(`.${opp.layoutClass}`);
    if (existingHand) {
      existingHand.remove();
    }

    const handDiv = document.createElement('div');
    handDiv.classList.add(opp.layoutClass);

    const cardCount = gameState.players[opp.index].length;

    for (let i = 0; i < cardCount; i++) {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card-back');
      if (opp.layoutClass.includes('vertical-hand')) {
        cardElement.classList.add('card-back-vertical');
      }
      handDiv.appendChild(cardElement);
    }
    container.appendChild(handDiv);
  });
  renderCardCounts();
}

const playerContainers = ['player-bottom', 'player-right', 'player-top', 'player-left'];

function showPassIndicator(playerIndex) {
  const containerId = playerContainers[playerIndex];
  const container = document.getElementById(containerId);

  const indicator = document.createElement('div');
  indicator.classList.add('pass-indicator');
  indicator.textContent = 'PASS';
  container.appendChild(indicator);
}

function clearPassIndicators() {
  document.querySelectorAll('.pass-indicator').forEach(el => el.remove());
}

function handlePlayCards() {
  const stagedCards = document.querySelectorAll('.card.staged');
  if (stagedCards.length === 0) {
    return;
  }
  const stagedIndices = Array.from(stagedCards)
    .map(card => parseInt(card.dataset.index));
  const actualCardsToPlay = stagedIndices.map(index => gameState.players[0][index]);

  const isSuccess = gameState.playCards(actualCardsToPlay);

  const trickInfoElement = document.getElementById('trick-info');

  if (isSuccess) {
    const trickPlayerElement = document.getElementById('trick-player');

    gameState.trickPile = [...actualCardsToPlay];
    trickInfoElement.textContent = gameState.currentTrick.details.name;
    trickPlayerElement.textContent = PLAYER_NAMES[gameState.currentTrick.winnerIndex];

    document.querySelectorAll('.card.staged').forEach(card => card.classList.remove('staged'));

    clearPassIndicators();

    renderHumanHand();
    renderTrickPile();

    executeOpponentTurn();
  } else {
    const lastTrick = trickInfoElement.textContent;
    trickInfoElement.textContent = 'Invalid Play';
    setTimeout(() => {
      trickInfoElement.textContent = lastTrick;
    }, 2000);
  }
}

function renderTrickPile() {
  const trickContainer = document.getElementById('trick-pile');
  trickContainer.innerHTML = '';

  gameState.trickPile.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.classList.add('played-card');

    const svgName = getSvgFileName(card);
    cardElement.style.backgroundImage = `url('../images/SVG-cards-1.3/${svgName}')`;

    trickContainer.appendChild(cardElement);
  });
}

function handlePass() {
  if (gameState.currentTrick.cards.length === 0) {
    console.log('Must play a card');
    return;
  }
  gameState.passTurn();

  document.querySelectorAll('.card.staged').forEach(card => card.classList.remove('staged'));

  showPassIndicator(0);

  executeOpponentTurn();
}

function executeOpponentTurn() {
  if (gameState.activePlayerIndex === 0) {
    if (gameState.currentTrick.cards.length === 0) {
      setTimeout(() => {
        clearPassIndicators();
        document.getElementById('trick-pile').innerHTML = '';
        document.getElementById('trick-info').textContent = '';
        document.getElementById('trick-player').textContent = '';
      }, 1000);
    }
    return;
  }
  const botIndex = gameState.activePlayerIndex;
  setTimeout(() => {
    const cardsToPlay = findValidPlayForBot(botIndex);

    if (cardsToPlay) {
      gameState.playCards(cardsToPlay);
      clearPassIndicators();
      gameState.trickPile = [...cardsToPlay];

      const trickPlayerElement = document.getElementById('trick-player');
      trickPlayerElement.textContent = PLAYER_NAMES[gameState.currentTrick.winnerIndex];

      document.getElementById('trick-info').textContent = gameState.currentTrick.details.name;

      renderOpponentHands();
      renderTrickPile();
    } else {
      gameState.passTurn();
      renderOpponentHands();
      showPassIndicator(botIndex);
    }
    executeOpponentTurn();
  }, 1500);
}

function renderCardCounts() {
  const counts = [
    { id: 'count-right', index: 1 },
    { id: 'count-top', index: 2 },
    { id: 'count-left', index: 3 }
  ];

  counts.forEach(player => {
    const el = document.getElementById(player.id);
    if (el) {
      el.textContent = `${gameState.players[player.index].length}`;
    }
  });
}

function fixRowStarts(container) {
  const cards = Array.from(container.children);
  let lastTop = null;

  cards.forEach(card => {
    const top = card.offsetTop;
    if (top !== lastTop) {
      card.classList.add('row-start');
    } else {
      card.classList.remove('row-start');
    }
    lastTop = top;
  });
}

window.addEventListener('resize', () => {
  fixRowStarts(document.getElementById('hand-container'));
  fixRowStarts(document.querySelector('.horizontal-hand'));
});

document.addEventListener('DOMContentLoaded', () => {
  renderHumanHand();
  renderOpponentHands();
  executeOpponentTurn();
});

document.getElementById('button-play').addEventListener('click', () => {
  handlePlayCards();
});

document.getElementById('button-pass').addEventListener('click', () => {
  handlePass();
});