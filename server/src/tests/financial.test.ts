import { aedToFils, filsToAed, numberToAedWords } from "@immigra/shared";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

console.log("====================================================");
console.log(" Running Financial Engine & UAE Currency Tests ");
console.log("====================================================");

// Test 1: Precision conversion
const val1 = aedToFils(7857.91);
assert(val1 === 785791, `aedToFils(7857.91) expected 785791, got ${val1}`);

const val2 = filsToAed(785791);
assert(val2 === 7857.91, `filsToAed(785791) expected 7857.91, got ${val2}`);

// Test 2: Floating point safety (0.1 + 0.2)
const floatAdd = aedToFils(0.1) + aedToFils(0.2);
assert(floatAdd === 30, `0.10 + 0.20 AED in fils should be exactly 30, got ${floatAdd}`);
assert(filsToAed(floatAdd) === 0.3, `30 fils should convert to 0.30 AED, got ${filsToAed(floatAdd)}`);

// Test 3: Reference Invoice UAE Number to Words
const words1 = numberToAedWords(7857.91);
console.log("[Test] 7857.91 in words:", words1);
assert(
  words1 === "SEVEN THOUSAND EIGHT HUNDRED FIFTY-SEVEN DHS AND NINETY-ONE FILS",
  `Words mismatch: got '${words1}'`
);

const words2 = numberToAedWords(1240.00);
console.log("[Test] 1240.00 in words:", words2);
assert(
  words2 === "ONE THOUSAND TWO HUNDRED FORTY DHS AND ZERO FILS",
  `Words mismatch: got '${words2}'`
);

// Test 4: Partial Payment Math
const grandTotalFils = 785791;
const paidFils = 300000;
const dueFils = grandTotalFils - paidFils;
assert(dueFils === 485791, `Expected due 485791 fils, got ${dueFils}`);
assert(filsToAed(dueFils) === 4857.91, `Expected 4857.91 AED, got ${filsToAed(dueFils)}`);

console.log("All Financial Engine & UAE Currency Tests Passed Successfully!");
console.log("====================================================");
