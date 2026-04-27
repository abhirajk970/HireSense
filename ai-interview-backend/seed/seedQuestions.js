/**
 * seed/seedQuestions.js — Seeds 3 starter DSA questions into MongoDB
 *
 * Run: node seed/seedQuestions.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose    = require("mongoose");
const DSAQuestion = require("../models/DSAQuestion");

const QUESTIONS = [
  {
    title:       "Two Sum",
    difficulty:  "Easy",
    tags:        ["array", "hash-map", "two-pointers"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
  Input:  nums = [2, 7, 11, 15], target = 9
  Output: [0, 1]  (because nums[0] + nums[1] = 2 + 7 = 9)`,

    hints: [
      "Think about how you could avoid checking every pair of numbers.",
      "What data structure lets you look up a value in O(1) time?",
      "Store each number you've seen along with its index. For each new number, check if its complement already exists.",
      "For each nums[i], check if (target - nums[i]) is already in your hash map. If yes, return [map[complement], i]."
    ],

    testCases: [
      { input: "[2, 7, 11, 15], 9",    expectedOutput: "[0,1]",  description: "Basic case" },
      { input: "[3, 2, 4], 6",          expectedOutput: "[1,2]",  description: "Non-adjacent" },
      { input: "[3, 3], 6",             expectedOutput: "[0,1]",  description: "Duplicates" },
      { input: "[1, 2, 3, 4, 5], 9",   expectedOutput: "[3,4]",  description: "Last two elements", isHidden: true },
      { input: "[-1, -2, -3, -4], -7", expectedOutput: "[2,3]",  description: "Negatives", isHidden: true }
    ],

    functionName:  "twoSum",
    referenceComplexity: { time: "O(n)", space: "O(n)" }
  },

  {
    title:       "Valid Parentheses",
    difficulty:  "Easy",
    tags:        ["stack", "string"],
    description: `Given a string \`s\` containing only the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if:
  1. Open brackets must be closed by the same type of bracket.
  2. Open brackets must be closed in the correct order.
  3. Every close bracket has a corresponding open bracket.

Example:
  Input:  s = "()"     → Output: true
  Input:  s = "()[]{}" → Output: true
  Input:  s = "(]"     → Output: false
  Input:  s = "([)]"   → Output: false`,

    hints: [
      "Think about what data structure naturally handles 'last in, first out' matching.",
      "A stack is perfect here. Push opening brackets; pop when you see a closing bracket.",
      "When you encounter a closing bracket, check if the top of the stack is its matching opener. If not, it's invalid.",
      "Push opening brackets. For each closing bracket, pop the stack and check if it matches. At the end, the stack should be empty."
    ],

    testCases: [
      { input: '"()"',     expectedOutput: "true",  description: "Single pair" },
      { input: '"()[]{}"', expectedOutput: "true",  description: "Multiple types" },
      { input: '"(]"',     expectedOutput: "false", description: "Wrong type" },
      { input: '"([)]"',   expectedOutput: "false", description: "Wrong order" },
      { input: '"{[]}"',   expectedOutput: "true",  description: "Nested" },
      { input: '""',       expectedOutput: "true",  description: "Empty string", isHidden: true },
      { input: '"((("',    expectedOutput: "false", description: "Unclosed", isHidden: true }
    ],

    functionName:  "isValid",
    referenceComplexity: { time: "O(n)", space: "O(n)" }
  },

  {
    title:       "First Non-Repeating Character",
    difficulty:  "Medium",
    tags:        ["string", "hash-map", "frequency-count"],
    description: `Given a string \`s\`, find and return the index of the first non-repeating character.
If no such character exists, return -1.

Example:
  Input:  s = "leetcode"  → Output: 0  ('l' at index 0 is non-repeating)
  Input:  s = "loveleet"  → Output: 2  ('v' at index 2)
  Input:  s = "aabb"      → Output: -1 (no non-repeating character)`,

    hints: [
      "Think about how you could count how many times each character appears.",
      "A frequency map (hash map from character to count) will tell you which characters are unique.",
      "First pass: count frequencies of all characters. Second pass: find the first char with frequency = 1.",
      "Build a Map where key is the character and value is its count. Then iterate the string again and return the index of the first character whose count is 1."
    ],

    testCases: [
      { input: '"leetcode"', expectedOutput: "0",  description: "First char" },
      { input: '"loveleet"', expectedOutput: "2",  description: "Middle char" },
      { input: '"aabb"',     expectedOutput: "-1", description: "No unique" },
      { input: '"z"',        expectedOutput: "0",  description: "Single char" },
      { input: '"aabcbd"',   expectedOutput: "3",  description: "Later unique", isHidden: true },
      { input: '"aaa"',      expectedOutput: "-1", description: "All same", isHidden: true }
    ],

    functionName:  "firstUniqChar",
    referenceComplexity: { time: "O(n)", space: "O(1)" }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Upsert — don't duplicate on re-run
    for (const q of QUESTIONS) {
      await DSAQuestion.findOneAndUpdate(
        { title: q.title },
        q,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✔ Seeded: ${q.title}`);
    }

    console.log(`\n✅ Seeded ${QUESTIONS.length} questions successfully.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
