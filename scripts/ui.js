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
  const suitStr = suitNames[card.suit];

  let rankStr = card.rank;
  if (card.rank === 11) rankStr = 'jack';
  if (card.rank === 12) rankStr = 'queen';
  if (card.rank === 13) rankStr = 'king';
  if (card.rank === 14) rankStr = 'ace';

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

document.addEventListener('DOMContentLoaded', () => {
  renderHumanHand();
});