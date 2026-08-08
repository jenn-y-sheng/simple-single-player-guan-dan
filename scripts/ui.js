import { evaluatePlay } from "./comparison-logic.js";
import { gameState } from "./game.js";

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
    container.innerHTML = '';

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
}

function handlePlayCards() {
  const stagedCards = document.querySelectorAll('.card.staged');
  if (stagedCards.length === 0) {
    return;
  }
  const stagedIndices = Array.from(stagedCards)
    .map(card => parseInt(card.dataset.index));
  const actualCardsToPlay = stagedIndices.map(index => gameState.players[0][index]);

  const playClass = evaluatePlay(actualCardsToPlay);

  const trickInfoElement = document.getElementById('trick-info');

  if (playClass) {
    const indicesToRemove = stagedIndices.sort((a, b) => b - a);

    gameState.trickPile = [];

    indicesToRemove.forEach(index => {
      const playedCard = gameState.players[0].splice(index, 1)[0];
      gameState.trickPile.unshift(playedCard);
    });

    trickInfoElement.textContent = playClass.name;

    renderHumanHand();
    renderTrickPile();
  } else {
    trickInfoElement.textContent = 'Invalid Play';
    setTimeout(() => {
      trickInfoElement.textContent = '';
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

document.addEventListener('DOMContentLoaded', () => {
  renderHumanHand();
  renderOpponentHands();
});

document.getElementById('button-play').addEventListener('click', () => {
  handlePlayCards();
});