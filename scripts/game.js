import { generateDeck, fisherYatesShuffle } from "./deck.js";

let players = [[], [], [], []];

function initGame() {
  console.log("Initializing game");

  let deck = generateDeck();
  deck = fisherYatesShuffle(deck);

  dealCards(deck);
  console.log("Player 1 Hand: ", players[0]);
}

function dealCards(deck) {
  for (let i = 0; i < deck.length; i++) {
    players[i % 4].push(deck[i]);
  }
}

initGame();