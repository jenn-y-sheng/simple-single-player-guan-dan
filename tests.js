import { Card, isSingle, isPair, isTriple, isFullHouse, isStraight, isTube, isPlate, evalBomb } from "./comparison-logic.js";

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

test("Single: Valid single card", isSingle([c(4)]));
test("Single: Invalid two cards", !isSingle([c(4), c(5)]));

test("Pair: Natural pair is valid", isPair([c(4), c(4)]));
test("Pair: Natural + Wild is valid", isPair([c(4), c(2, 'H')]));
test("Pair: Wild + Wild is valid", isPair([c(2, 'H'), c(2, 'H')]));
test("Pair: Mismatched naturals are invalid", !isPair([c(4), c(5)]));
test("Pair: Black and Red Joker cannot pair", !isPair([blackJoker(), redJoker()]));

test("Triple: 3 Naturals is valid", isTriple([c(7), c(7), c(7)]));
test("Triple: 1 Natural + 2 Wilds is valid", isTriple([c(7), c(2, 'H'), c(2, 'H')]));
test("Triple: Jokers cannot be in a triple", !isTriple([blackJoker(), blackJoker(), blackJoker()]));
test("Triple: Mismatched cards are invalid", !isTriple([c(7), c(7), c(8)]));

test("Full House: Standard 3+2 is valid", isFullHouse([c(4), c(4), c(4), c(5), c(5)]));
test("Full House: 2 Naturals of rank A, 2 Naturals of rank B + 1 Wild", isFullHouse([c(4), c(4), c(5), c(5), c(2, 'H')]));
test("Full House: Jokers invalidate the hand", !isFullHouse([c(4), c(4), c(4), blackJoker(), redJoker()]));
test("Full House: 3 distinct natural ranks is invalid", !isFullHouse([c(4), c(4), c(5), c(6), c(2, 'H')]));

test("Straight: Standard 5-card sequence", isStraight([c(4,'S'), c(5,'H'), c(6,'C'), c(7,'D'), c(8,'S')]));
test("Straight: Ace Low (A-2-3-4-5) is valid", isStraight([c(14,'S'), c(2,'H'), c(3,'C'), c(4,'D'), c(5,'S')]));
test("Straight: Ace High (10-J-Q-K-A) is valid", isStraight([c(10,'S'), c(11,'H'), c(12,'C'), c(13,'D'), c(14,'S')]));
test("Straight: Wrap-around (Q-K-A-2-3) is INVALID", !isStraight([c(12,'S'), c(13,'H'), c(14,'C'), c(2,'D'), c(3,'S')]));
test("Straight: With 2 Wild Cards bridging a gap", isStraight([c(4,'S'), c(2,'H'), c(2,'H'), c(7,'D'), c(8,'S')]));
test("Straight: Rejected if all same suit (Straight Flush)", !isStraight([c(4,'S'), c(5,'S'), c(6,'S'), c(7,'S'), c(8,'S')]));

test("Tube: Standard 3 pairs", isTube([c(4), c(4), c(5), c(5), c(6), c(6)]));
test("Tube: Ace Low (A-A-2-2-3-3)", isTube([c(14), c(14), c(2), c(2), c(3), c(3)]));
test("Tube: With 1 Wild Card replacing a 5", isTube([c(4), c(4), c(5), c(2, 'H'), c(6), c(6)]));
test("Tube: Spread too wide (4, 4, 5, 5, 7, 7) is INVALID", !isTube([c(4), c(4), c(5), c(5), c(7), c(7)]));
test("Tube: Wrap-around (K-K-A-A-2-2) is INVALID", !isTube([c(13), c(13), c(14), c(14), c(2), c(2)]));

test("Plate: Standard 2 triples", isPlate([c(7), c(7), c(7), c(8), c(8), c(8)]));
test("Plate: Ace Low (A-A-A-2-2-2)", isPlate([c(14), c(14), c(14), c(2), c(2), c(2)]));
test("Plate: With 2 Wild Cards", isPlate([c(7), c(7), c(2,'H'), c(8), c(8), c(2,'H')]));
test("Plate: Non-consecutive triples (7s and 9s) are INVALID", !isPlate([c(7), c(7), c(7), c(9), c(9), c(9)]));

console.log("\n--- RUNNING BOMB TESTS ---");

test("Bomb: 4 Jokers is highest tier", 
  evalBomb([redJoker(), redJoker(), blackJoker(), blackJoker()]).tier === 9
);
test("Bomb: Jokers fail if mismatched", 
  evalBomb([redJoker(), blackJoker(), blackJoker(), c(4)]) === null
);

test("Bomb: Quadruple (4 of a kind)", evalBomb([c(4), c(4), c(4), c(4)]).tier === 1);
test("Bomb: Quintuple (5 of a kind)", evalBomb([c(8), c(8), c(8), c(8), c(8)]).tier === 2);
test("Bomb: Sextuple (6 of a kind)", evalBomb([c(9), c(9), c(9), c(9), c(9), c(9)]).tier === 4);
test("Bomb: Decuple (10 of a kind) using wilds", 
  evalBomb([c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(3), c(2,'H'), c(2,'H')]).tier === 8
);

test("Bomb: Standard Straight Flush", 
  evalBomb([c(4,'S'), c(5,'S'), c(6,'S'), c(7,'S'), c(8,'S')]).tier === 3
);
test("Bomb: Straight Flush with Wilds", 
  evalBomb([c(4,'S'), c(2,'H'), c(6,'S'), c(7,'S'), c(8,'S')]).tier === 3
);
test("Bomb: Mixed suits is NOT a Straight Flush", 
  evalBomb([c(4,'S'), c(5,'H'), c(6,'S'), c(7,'S'), c(8,'S')]) === null
);

test("All wilds",
  evalBomb([c(2,'H'), c(2,'H'), c(2,'H'), c(2,'H')]).topRank === 2
);

printSummary();