import { isSingle, isPair, isTriple, isFullHouse, isStraight, isTube, isPlate } from "./comparison-logic.js";

const c = (rank, suit = 'S', isWild = false) => ({ rank, suit, isWild });

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
test("Pair: Natural + Wild is valid", isPair([c(4), c(9, 'H', true)]));
test("Pair: Wild + Wild is valid", isPair([c(9, 'H', true), c(9, 'H', true)]));
test("Pair: Mismatched naturals are invalid", !isPair([c(4), c(5)]));
test("Pair: Black and Red Joker cannot pair", !isPair([blackJoker(), redJoker()]));

test("Triple: 3 Naturals is valid", isTriple([c(7), c(7), c(7)]));
test("Triple: 1 Natural + 2 Wilds is valid", isTriple([c(7), c(2, 'H', true), c(2, 'H', true)]));
test("Triple: Jokers cannot be in a triple", !isTriple([blackJoker(), blackJoker(), blackJoker()]));
test("Triple: Mismatched cards are invalid", !isTriple([c(7), c(7), c(8)]));

test("Full House: Standard 3+2 is valid", isFullHouse([c(4), c(4), c(4), c(5), c(5)]));
test("Full House: 2 Naturals of rank A, 2 Naturals of rank B + 1 Wild", isFullHouse([c(4), c(4), c(5), c(5), c(2, 'H', true)]));
test("Full House: Jokers invalidate the hand", !isFullHouse([c(4), c(4), c(4), blackJoker(), redJoker()]));
test("Full House: 3 distinct natural ranks is invalid", !isFullHouse([c(4), c(4), c(5), c(6), c(2, 'H', true)]));

test("Straight: Standard 5-card sequence", isStraight([c(4,'S'), c(5,'H'), c(6,'C'), c(7,'D'), c(8,'S')]));
test("Straight: Ace Low (A-2-3-4-5) is valid", isStraight([c(14,'S'), c(2,'H'), c(3,'C'), c(4,'D'), c(5,'S')]));
test("Straight: Ace High (10-J-Q-K-A) is valid", isStraight([c(10,'S'), c(11,'H'), c(12,'C'), c(13,'D'), c(14,'S')]));
test("Straight: Wrap-around (Q-K-A-2-3) is INVALID", !isStraight([c(12,'S'), c(13,'H'), c(14,'C'), c(2,'D'), c(3,'S')]));
test("Straight: With 2 Wild Cards bridging a gap", isStraight([c(4,'S'), c(2,'H',true), c(2,'H',true), c(7,'D'), c(8,'S')]));
test("Straight: Rejected if all same suit (Straight Flush)", !isStraight([c(4,'S'), c(5,'S'), c(6,'S'), c(7,'S'), c(8,'S')]));

test("Tube: Standard 3 pairs", isTube([c(4), c(4), c(5), c(5), c(6), c(6)]));
test("Tube: Ace Low (A-A-2-2-3-3)", isTube([c(14), c(14), c(2), c(2), c(3), c(3)]));
test("Tube: With 1 Wild Card replacing a 5", isTube([c(4), c(4), c(5), c(2, 'H', true), c(6), c(6)]));
test("Tube: Spread too wide (4, 4, 5, 5, 7, 7) is INVALID", !isTube([c(4), c(4), c(5), c(5), c(7), c(7)]));
test("Tube: Wrap-around (K-K-A-A-2-2) is INVALID", !isTube([c(13), c(13), c(14), c(14), c(2), c(2)]));

test("Plate: Standard 2 triples", isPlate([c(7), c(7), c(7), c(8), c(8), c(8)]));
test("Plate: Ace Low (A-A-A-2-2-2)", isPlate([c(14), c(14), c(14), c(2), c(2), c(2)]));
test("Plate: With 2 Wild Cards", isPlate([c(7), c(7), c(2,'H',true), c(8), c(8), c(2,'H',true)]));
test("Plate: Non-consecutive triples (7s and 9s) are INVALID", !isPlate([c(7), c(7), c(7), c(9), c(9), c(9)]));

printSummary();