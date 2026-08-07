import { evalSingle, evalPair, evalTriple, evalFullHouse, evalStraight, evalTube, evalPlate, evalBomb, canBeat } from "../scripts/comparison-logic.js";
import { Card } from "../scripts/deck.js";

const c = (rank, suit = 'S') => new Card({ rank, suit });

const blackJoker = () => c(15, 'none', false);
const redJoker = () => c(16, 'none', false);

let passed = 0;
let failed = 0;

function test(description, condition) {
  if (condition) {
    console.log(`PASS: ${description}`);
    passed++;
  } else {
    console.error(`FAIL: ${description}`);
    failed++;
  }
}

function printSummary() {
  console.log(`\n--- TEST SUMMARY ---`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) console.log("All tests passed!");
}

console.log("--- RUNNING GUAN DAN LOGIC TESTS ---\n");

// 1. SINGLES
const singleRes = evalSingle([c(4)]);
test("Single: Valid and returns correct topRank", singleRes && singleRes.topRank === 4);
test("Single: Invalid two cards returns null", evalSingle([c(4), c(5)]) === null);
const wildSingleRes = evalSingle([c(2, 'H')]);
test("Single: Wild card assumes current level rank", wildSingleRes && wildSingleRes.topRank === 2);

// 2. PAIRS
const pairRes = evalPair([c(4), c(4)]);
test("Pair: Natural pair is valid", pairRes && pairRes.topRank === 4);
const wildPairRes = evalPair([c(2, 'H'), c(2, 'H')]);
test("Pair: 2 Wilds assume current level rank", wildPairRes && wildPairRes.topRank === 2);
const mixedPairRes = evalPair([c(9), c(2, 'H')]);
test("Pair: 1 Natural + 1 Wild takes rank of natural", mixedPairRes && mixedPairRes.topRank === 9);
test("Pair: Mismatched naturals are invalid", evalPair([c(4), c(5)]) === null);

// 3. TRIPLES
const tripleRes = evalTriple([c(7), c(7), c(7)]);
test("Triple: 3 Naturals is valid", tripleRes && tripleRes.topRank === 7);
const mixedTripleRes = evalTriple([c(9), c(2, 'H'), c(2, 'H')]);
test("Triple: 1 Natural + 2 Wilds is valid", mixedTripleRes && mixedTripleRes.topRank === 9);
test("Triple: Jokers cannot be in a triple", evalTriple([blackJoker(), blackJoker(), blackJoker()]) === null);

// 4. FULL HOUSES
const fhRes = evalFullHouse([c(4), c(4), c(4), c(5), c(5)]);
test("Full House: Rank is determined by the Triple (4-4-4-5-5)", fhRes && fhRes.topRank === 4);
const fhRes2 = evalFullHouse([c(8), c(8), c(9), c(9), c(2, 'H')]);
test("Full House: 2 pairs + 1 Wild assigns wild to highest pair (8-8-9-9-W)", fhRes2 && fhRes2.topRank === 9);
const fhRes3 = evalFullHouse([c(7), c(7), c(7), c(2, 'H'), c(2, 'H')]);
test("Full House: 3 Naturals + 2 Wilds is valid (7-7-7-W-W)", fhRes3 && fhRes3.topRank === 7);
test("Full House: 4 Naturals + 1 Wild is INVALID", evalFullHouse([c(7), c(7), c(7), c(7), c(2, 'H')]) === null);

// 5. STRAIGHTS
const strRes = evalStraight([c(4,'S'), c(5,'H'), c(6,'C'), c(7,'D'), c(8,'S')]);
test("Straight: Standard 5-card sequence (4-8)", strRes && strRes.topRank === 8);
const strLow = evalStraight([c(14,'S'), c(2,'H'), c(3,'C'), c(4,'D'), c(5,'S')]);
test("Straight: Ace Low (A-2-3-4-5) has topRank of 5", strLow && strLow.topRank === 5);
const strHigh = evalStraight([c(10,'S'), c(11,'H'), c(12,'C'), c(13,'D'), c(14,'S')]);
test("Straight: Ace High (10-J-Q-K-A) has topRank of 14", strHigh && strHigh.topRank === 14);
const strWild = evalStraight([c(6,'S'), c(7,'H'), c(8,'C'), c(2,'H'), c(2,'H')]);
test("Straight: Sliding window maximizes wild cards (6-7-8-W-W becomes topRank 10)", strWild && strWild.topRank === 10);
test("Straight: Wrap-around (Q-K-A-2-3) is INVALID", evalStraight([c(12,'S'), c(13,'H'), c(14,'C'), c(2,'D'), c(3,'S')]) === null);

// 6. TUBES
const tubeRes = evalTube([c(4), c(4), c(5), c(5), c(6), c(6)]);
test("Tube: Standard 3 pairs", tubeRes && tubeRes.topRank === 6);
const tubeWild = evalTube([c(6), c(6), c(7), c(2, 'H'), c(2, 'H'), c(2, 'H')]);
test("Tube: Sliding window maximizes wilds in Tube", tubeWild && tubeWild.topRank === 8);

// 7. PLATES
const plateRes = evalPlate([c(7), c(7), c(7), c(8), c(8), c(8)]);
test("Plate: Standard 2 triples", plateRes && plateRes.topRank === 8);
const plateLow = evalPlate([c(14), c(14), c(14), c(2), c(2), c(2)]);
test("Plate: Ace Low (A-A-A-2-2-2) has topRank 2", plateLow && plateLow.topRank === 2);

console.log("\n--- RUNNING BOMB TESTS ---");

const jokerBomb = evalBomb([redJoker(), redJoker(), blackJoker(), blackJoker()]);
test("Bomb: 4 Jokers is Tier 9", jokerBomb && jokerBomb.tier === 9);

const quadBomb = evalBomb([c(4), c(4), c(4), c(4)]);
test("Bomb: Quadruple (4 of a kind) is Tier 1", quadBomb && quadBomb.tier === 1);

const decupleBomb = evalBomb([c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(2,'H'), c(2,'H')]);
test("Bomb: Decuple (10 of a kind) with 2 Wilds is Tier 8", decupleBomb && decupleBomb.tier === 8);

const sfBomb = evalBomb([c(4,'S'), c(5,'S'), c(6,'S'), c(7,'S'), c(8,'S')]);
test("Bomb: Standard Straight Flush is Tier 3", sfBomb && sfBomb.tier === 3);

console.log("\n--- RUNNING CANBEAT COMPARISON TESTS ---");

// 1. Ordinary vs Ordinary (Same Type)
test("Combat: Higher Single beats Lower Single", 
  canBeat([c(8)], [c(4)])
);
test("Combat: Lower Single fails against Higher Single", 
  !canBeat([c(4)], [c(8)])
);
test("Combat: Higher Pair beats Lower Pair", 
  canBeat([c(10), c(10)], [c(4), c(4)])
);
test("Combat: Higher Triple beats Lower Triple", 
  canBeat([c(14), c(14), c(14)], [c(10), c(10), c(10)])
);

// Full House comparisons (Rank is strictly determined by the Triple)
test("Combat: Full House (8s full of 3s) beats Full House (7s full of Aces)",
  canBeat([c(8), c(8), c(8), c(3), c(3)], [c(7), c(7), c(7), c(14), c(14)])
);

// Sequence comparisons
test("Combat: Higher Straight beats Lower Straight",
  canBeat([c(5,'S'), c(6,'H'), c(7,'C'), c(8,'D'), c(9,'S')], [c(4,'S'), c(5,'H'), c(6,'C'), c(7,'D'), c(8,'S')])
);
test("Combat: Normal Straight beats Ace-Low Straight",
  canBeat([c(6,'S'), c(7,'H'), c(8,'C'), c(9,'D'), c(10,'S')], [c(14,'S'), c(2,'H'), c(3,'C'), c(4,'D'), c(5,'S')])
);

// 2. Ordinary vs Ordinary (Different Types - Should Fail)
test("Combat: Pair cannot beat Single (Mismatched types)", 
  !canBeat([c(4), c(4)], [c(8)])
);
test("Combat: Full House cannot beat Straight (Mismatched types)",
  !canBeat([c(8), c(8), c(8), c(3), c(3)], [c(4,'S'), c(5,'H'), c(6,'C'), c(7,'D'), c(8,'S')])
);

// 3. Bombs vs Ordinary Plays
test("Combat: Quadruple Bomb beats High Pair", 
  canBeat([c(4), c(4), c(4), c(4)], [c(14), c(14)])
);
test("Combat: Straight Flush beats Full House",
  canBeat([c(4,'S'), c(5,'S'), c(6,'S'), c(7,'S'), c(8,'S')], [c(14), c(14), c(14), c(3), c(3)])
);

// 4. Bombs vs Bombs
test("Combat: Higher Tier Bomb (5-of-a-Kind) beats Lower Tier (4-of-a-Kind)",
  canBeat([c(3), c(3), c(3), c(3), c(3)], [c(14), c(14), c(14), c(14)])
);
test("Combat: Same Tier Bomb, Higher Rank beats Lower Rank",
  canBeat([c(8), c(8), c(8), c(8)], [c(4), c(4), c(4), c(4)])
);
test("Combat: Same Tier Bomb, Lower Rank fails",
  !canBeat([c(4), c(4), c(4), c(4)], [c(8), c(8), c(8), c(8)])
);
test("Combat: Four-Joker Bomb beats Decuple (Tier 9 vs Tier 8)",
  canBeat(
    [redJoker(), redJoker(), blackJoker(), blackJoker()],
    [c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(2,'H'), c(2,'H')]
  )
);

// 5. Invalid Plays
test("Combat: Invalid attempted play fails to beat valid play", 
  !canBeat([c(4), c(5)], [c(8)])
);

console.log("\n--- RUNNING LEVEL CARD TESTS ---");

test("Level Card: Level Single beats Ace Single", 
  canBeat([c(2, 'S')], [c(14, 'S')])
);
test("Level Card: Level Single loses to Small Joker", 
  !canBeat([c(2, 'S')], [blackJoker()])
);
test("Level Card: Level Pair beats Ace Pair", 
  canBeat([c(2, 'D'), c(2, 'C')], [c(14, 'H'), c(14, 'S')])
);
test("Level Card: Level Bomb (4-of-a-Kind) beats Ace Bomb",
  canBeat([c(2), c(2), c(2), c(2)], [c(14), c(14), c(14), c(14)])
);
test("Level Card (Sequence): Straight retains natural rank (Level card does NOT beat Ace in sequences)",
  !canBeat([c(14,'S'), c(2,'H'), c(3,'C'), c(4,'D'), c(5,'S')], [c(10,'S'), c(11,'H'), c(12,'C'), c(13,'D'), c(14,'S')])
);

printSummary();