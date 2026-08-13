import { evaluatePlay, canBeat, currentLevel } from "./comparison-logic.js";
import { gameState, findValidPlayForBot, startNewRound, startNewGame } from "./game.js";

const PLAYER_NAMES = ['You', 'Player 2', 'Player 3', 'Player 4'];
let isAutoplay = false;

const getColoredName = (index) => {
  const color = index % 2 === 0 ? '#259be9' : '#e74c3c';
  const name = index === 0 ? 'you' : `Player ${index + 1}`;
  return `<span style="color: ${color};">${name}</span>`; 
};

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

function getCardDisplayName(card) {
  const rankMap = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace', 15: 'Small Joker', 16: 'Big Joker' };
  const suitMap = { 'S': 'Spades', 'H': 'Hearts', 'C': 'Clubs', 'D': 'Diamonds' };
  const rankStr = rankMap[card.rank] || card.rank;
  const suitStr = card.rank >= 15 ? '' : ` of ${suitMap[card.suit]}`;
  return `${rankStr}${suitStr}`;
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
  });
  renderCardCounts();
  fixRowStarts(document.getElementById('hand-container'));
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
  if (gameState.gameOver) return;

  const stagedCards = document.querySelectorAll('.card.staged');
  if (stagedCards.length === 0) {
    return;
  }
  const stagedIndices = Array.from(stagedCards)
    .map(card => parseInt(card.dataset.index));

  if (gameState.isTributePhase) {
    if (stagedIndices.length !== 1) {
      const trickInfoElement = document.getElementById('trick-info');
      const lastText = trickInfoElement.textContent;
      trickInfoElement.textContent = 'Select exactly 1 card to return!';
      setTimeout(() => trickInfoElement.textContent = lastText, 2000);
      return;
    }

    const success = gameState.returnCardFromHuman(stagedIndices[0]);
    if (success) {
       document.querySelectorAll('.card.staged').forEach(card => card.classList.remove('staged'));
       renderHumanHand(); 
    }
    return;
  }

  const actualCardsToPlay = stagedIndices.map(index => gameState.players[0][index]);

  const isSuccess = gameState.playCards(actualCardsToPlay);

  const trickInfoElement = document.getElementById('trick-info');

  if (isSuccess) {
    const trickPlayerElement = document.getElementById('trick-player');

    gameState.trickPile = [...actualCardsToPlay];
    trickInfoElement.textContent = gameState.currentTrick.details.name;
    trickPlayerElement.textContent = PLAYER_NAMES[gameState.currentTrick.winnerIndex];

    trickPlayerElement.style.color = gameState.currentTrick.winnerIndex % 2 === 0 ? '#2980b9' : '#c0392b';

    document.querySelectorAll('.card.staged').forEach(card => card.classList.remove('staged'));

    clearPassIndicators();

    renderHumanHand();
    renderTrickPile();
    renderRankIndicators();

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
  if (gameState.gameOver) return;

  if (gameState.activePlayerIndex === 0 && !isAutoplay) {
    if (gameState.currentTrick.cards.length === 0) {
      const hasMessage = gameState.humanTributeLog || gameState.tributeResistedMessage || (gameState.botTributeLogs && gameState.botTributeLogs.length > 0);
      const delay = hasMessage ? 8000 : 1000;
      setTimeout(() => {
        clearPassIndicators();
        document.getElementById('trick-pile').innerHTML = '';
        document.getElementById('trick-info').textContent = '';
        document.getElementById('trick-player').textContent = '';
        gameState.humanTributeLog = null;
        gameState.tributeResistedMessage = null;
        gameState.botTributeLogs = [];

        renderRankIndicators();
      }, delay);
    }
    return;
  }
  const botIndex = gameState.activePlayerIndex;
  let delay = isAutoplay ? 400 : 1500;

  const hasMessage = gameState.humanTributeLog || gameState.tributeResistedMessage || (gameState.botTributeLogs && gameState.botTributeLogs.length > 0);

  if (hasMessage && gameState.currentTrick.cards.length === 0) {
     delay = 8000; 
     gameState.humanTributeLog = null;
     gameState.tributeResistedMessage = null;
     gameState.botTributeLogs = [];
  }

  setTimeout(() => {
    const cardsToPlay = findValidPlayForBot(botIndex);

    if (cardsToPlay) {
      const success = gameState.playCards(cardsToPlay);

      if (!success) {
        console.error(`Bot ${botIndex + 1} produced an invalid play:`, cardsToPlay);
        gameState.passTurn();
        showPassIndicator(botIndex);
      } else {
        clearPassIndicators();
        gameState.trickPile = [...cardsToPlay];

        const trickPlayerElement = document.getElementById('trick-player');
        trickPlayerElement.textContent = PLAYER_NAMES[gameState.currentTrick.winnerIndex];

        trickPlayerElement.style.color = gameState.currentTrick.winnerIndex % 2 === 0 ? '#239ff1' : '#ed3621';

        document.getElementById('trick-info').textContent = gameState.currentTrick.details.name;
      }
    } else {
      gameState.passTurn();
      showPassIndicator(botIndex);
    }

    renderHumanHand();
    renderOpponentHands();
    renderTrickPile();
    renderRankIndicators();

    executeOpponentTurn();
  }, delay);
}

function renderCardCounts() {
  const counts = [
    { id: 'count-bottom', index: 0},
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

function renderLevelDisplay() {
  const rankMap = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A'};

  const displayCurrent = rankMap[currentLevel] || currentLevel;
  const displayTeam1 = rankMap[gameState.teamLevels[0]] || gameState.teamLevels[0];
  const displayTeam2 = rankMap[gameState.teamLevels[1]] || gameState.teamLevels[1];

  const currentLevelEl = document.getElementById('ui-current-level');
  const team1El = document.getElementById('ui-team1-level');
  const team2El = document.getElementById('ui-team2-level');

  if (currentLevelEl && team1El && team2El) {
    currentLevelEl.textContent = `Currently playing at Level: ${displayCurrent}`;
    team1El.textContent = `Team 1 Level: ${displayTeam1}`;
    team2El.textContent = `Team 2 Level: ${displayTeam2}`;
  }
}

function renderRankIndicators() {
  document.querySelectorAll('.rank-indicator').forEach(el => el.remove());

  const placements = ['1st', '2nd', '3rd', '4th'];
  const bgColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#2c3e50']; 
  const textColors = ['black', 'black', 'white', 'white'];

  gameState.finishingOrder.forEach((playerIndex, finishIndex) => {
    const containerId = playerContainers[playerIndex];
    const container = document.getElementById(containerId);

    const indicator = document.createElement('div');
    indicator.classList.add('rank-indicator');
    indicator.textContent = placements[finishIndex];

    indicator.style.backgroundColor = bgColors[finishIndex];
    indicator.style.color = textColors[finishIndex];

    container.appendChild(indicator);
  })
}

function restoreUIState() {
  // refreshed during a tribute phase that needs a human return
  if (gameState.isTributePhase && gameState.pendingReturns.some(r => r.from === 0)) {
    const playBtn = document.getElementById('button-play');
    playBtn.textContent = "Return Card";
    playBtn.style.backgroundColor = "#e74c3c";

    const returnData = gameState.pendingReturns.find(r => r.from === 0);
    const card = returnData.cardReceived;

    const rankMap = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace', 15: 'Small Joker', 16: 'Big Joker' };
    const suitMap = { 'S': 'Spades', 'H': 'Hearts', 'C': 'Clubs', 'D': 'Diamonds' };
     
    const rankStr = rankMap[card.rank] || card.rank;
    const suitStr = card.rank >= 15 ? '' : ` of ${suitMap[card.suit]}`;

    document.getElementById('trick-info').innerHTML = 
      `${getColoredName(returnData.to)} paid ${getColoredName(0)} the ${rankStr}${suitStr}!<br>Select 1 low card to return to them.`;
  }

  // if refreshed during a trick
  if (gameState.trickPile.length > 0) {
    renderTrickPile();
    const trickPlayerElement = document.getElementById('trick-player');
    trickPlayerElement.textContent = PLAYER_NAMES[gameState.currentTrick.winnerIndex];
    trickPlayerElement.style.color = gameState.currentTrick.winnerIndex % 2 === 0 ? '#2980b9' : '#c0392b';
    
    if (gameState.currentTrick.details) {
      document.getElementById('trick-info').textContent = gameState.currentTrick.details.name;
    }
  }
  renderRankIndicators();

  if (gameState.gameOver && !gameState.gameWon) {
    document.getElementById('button-next-round').style.display = 'block';
    document.getElementById('victory-title').textContent = `ROUND OVER`;
    document.getElementById('victory-subtitle').textContent = `Check the badges and start the next round!`;
    document.getElementById('victory-banner').style.display = 'block';
  } else if (gameState.gameWon) {
    document.getElementById('victory-title').textContent = `TEAM ${gameState.winningTeam} WINS THE GAME!`;
    document.getElementById('victory-subtitle').textContent = `Won as declarers at Level A!`;
    document.getElementById('victory-banner').style.display = 'block';
  }

  if (gameState.passedPlayers && gameState.passedPlayers.length > 0) {
    gameState.passedPlayers.forEach(playerIndex => {
      showPassIndicator(playerIndex);
    });
  }
}

window.addEventListener('resize', () => {
  fixRowStarts(document.getElementById('hand-container'));
  fixRowStarts(document.querySelector('.horizontal-hand'));
});

document.addEventListener('DOMContentLoaded', () => {
  renderHumanHand();
  renderOpponentHands();
  renderLevelDisplay();
  restoreUIState();
  executeOpponentTurn();
});

document.getElementById('button-play').addEventListener('click', () => {
  handlePlayCards();
});

document.getElementById('button-pass').addEventListener('click', () => {
  handlePass();
});

document.addEventListener('levelUpdated', (event) => {
  document.getElementById('button-next-round').style.display = 'block';

  const { winningTeam, levelsGained, newLevel, gameWon, demotedDeclarer, staleDeclarer } = event.detail;

  const titleEl = document.getElementById('victory-title');
  const subtitleEl = document.getElementById('victory-subtitle');

  if (gameWon) {
    titleEl.textContent = `TEAM ${winningTeam} WINS THE GAME!`;
    subtitleEl.textContent = `Won as declarers at Level A!`;
    document.getElementById('button-next-round').style.display = 'none';
  } else if (staleDeclarer) {
    if (newLevel === 2) {
      titleEl.textContent = `Team ${winningTeam} demoted to Level 2`;
      subtitleEl.textContent = `Failed 3 attempts to win at Level A — remain declarers at Level 2.`;
    } else {
      titleEl.textContent = `Team ${winningTeam} remains at Level A`;
      subtitleEl.textContent = `Won 1-4 — must win 1-2 or 1-3 next to take the game!`;
    }
  } else if (demotedDeclarer) {
    titleEl.textContent = `Team ${winningTeam} becomes Declarer!`;
    subtitleEl.textContent = newLevel >= 14
      ? `Promoted to Level A — win 1-2 or 1-3 next to take the game!`
      : `Former Level-A declarers demoted to Level 2! Promoted ${levelsGained} Level${levelsGained > 1 ? 's' : ''}!`;
  } else if (newLevel >= 14) {
    titleEl.textContent = `Team ${winningTeam} reaches Level A!`;
    subtitleEl.textContent = `Win 1-2 or 1-3 as declarer next to take the game!`;
  } else {
    titleEl.textContent = `TEAM ${winningTeam} WINS!`;
    subtitleEl.textContent = `Promoted ${levelsGained} Level${levelsGained > 1 ? 's' : ''}!`;
  }

  document.getElementById('victory-banner').style.display = 'block';
});

document.getElementById('button-next-round').addEventListener('click', (event) => {
  event.target.style.display = 'none';
  document.getElementById('victory-banner').style.display = 'none';
  document.getElementById('trick-pile').innerHTML = '';
  document.getElementById('trick-info').textContent = '';
  document.getElementById('trick-player').textContent = '';
  clearPassIndicators();
  startNewRound();
  renderLevelDisplay();
  renderRankIndicators();

  if (gameState.isTributePhase && gameState.pendingReturns.some(r => r.from === 0)) {
     const playBtn = document.getElementById('button-play');
     playBtn.textContent = "Return Card";
     playBtn.style.backgroundColor = "#e74c3c";

     const returnData = gameState.pendingReturns.find(r => r.from === 0);
     const card = returnData.cardReceived;

     const rankMap = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace', 15: 'Small Joker', 16: 'Big Joker' };
     const suitMap = { 'S': 'Spades', 'H': 'Hearts', 'C': 'Clubs', 'D': 'Diamonds' };
     
     const rankStr = rankMap[card.rank] || card.rank;
     const suitStr = card.rank >= 15 ? '' : ` of ${suitMap[card.suit]}`;

     document.getElementById('trick-info').innerHTML = 
       `${getColoredName(returnData.to)} paid ${getColoredName(0)} the ${rankStr}${suitStr}!<br>Select 1 low card to return to them.`;
     
     renderHumanHand();
     renderOpponentHands();
  } else {
     renderHumanHand();
     renderOpponentHands();
  }
});

document.addEventListener('tributePhaseEnded', () => {
  const playBtn = document.getElementById('button-play');
  playBtn.textContent = "Play Cards";
  playBtn.style.backgroundColor = "";
  
  if (gameState.tributeResistedMessage) {
    document.getElementById('trick-info').innerHTML = gameState.tributeResistedMessage;
  } else {
    let messages = [];

    if (gameState.humanTributeLog) {
      const log = gameState.humanTributeLog;
      const givenName = getCardDisplayName(log.givenCard);
      const receivedName = getCardDisplayName(log.receivedCard);
      messages.push(`${getColoredName(0)} paid ${getColoredName(log.paidTo)} the ${givenName}<br>and received the ${receivedName}!`);
    }
    
    if (gameState.botTributeLogs && gameState.botTributeLogs.length > 0) {
      gameState.botTributeLogs.forEach(log => {
        const givenName = getCardDisplayName(log.givenCard);
        const receivedName = getCardDisplayName(log.returnedCard);
        messages.push(`${getColoredName(log.giver)} paid ${getColoredName(log.receiver)} the ${givenName}<br>and received the ${receivedName}!`);
      });
    }

    if (messages.length > 0) {
      document.getElementById('trick-info').innerHTML = messages.join('<br><br>');
    } else {
      document.getElementById('trick-info').textContent = '';
    }
  }
  
  renderHumanHand();
  renderOpponentHands();
  executeOpponentTurn();
});

document.getElementById('button-autoplay').addEventListener('click', (event) => {
  isAutoplay = !isAutoplay;

  event.target.textContent = isAutoplay ? 'Autoplay: ON' : 'Autoplay: OFF';
  event.target.style.backgroundColor = isAutoplay ? '#e74c3c' : '#f1c40f'; 
  event.target.style.color = isAutoplay ? 'white' : '#333';

  if (isAutoplay && gameState.activePlayerIndex === 0 && !gameState.gameOver) {
    executeOpponentTurn(); 
  }
});

document.getElementById('button-new-game').addEventListener('click', () => {
  document.getElementById('victory-banner').style.display = 'none';
  document.getElementById('button-next-round').style.display = 'none';

  document.getElementById('trick-pile').innerHTML = '';
  document.getElementById('trick-info').textContent = '';
  document.getElementById('trick-player').textContent = '';
  clearPassIndicators();

  const playBtn = document.getElementById('button-play');
  playBtn.textContent = "Play Cards";
  playBtn.style.backgroundColor = "";

  isAutoplay = false;
  const autoBtn = document.getElementById('button-autoplay');
  autoBtn.textContent = 'Autoplay: OFF';
  autoBtn.style.backgroundColor = '#f1c40f'; 
  autoBtn.style.color = '#333';

  startNewGame();

  renderLevelDisplay();
  renderRankIndicators(); 
  renderHumanHand();
  renderOpponentHands();
});