const mongoose = require("mongoose");
const Question = require("./models/Question");

const questions = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "Easy",
    topicTags: ["Arrays", "Hash Map"],
    companyTags: ["Google", "Amazon", "Facebook"],
    acceptance: 85,
    templates: {
      javascript: "function twoSum(nums, target) {\n    // __USER_CODE__\n}",
      python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    # __USER_CODE__\n    pass",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // __USER_CODE__\n}"
    },
    driverCode: {
      javascript: "function twoSum(nums, target) {\n    // __USER_CODE__\n}\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst nums = JSON.parse(input[0]);\nconst target = parseInt(input[1]);\nconsole.log(JSON.stringify(twoSum(nums, target)));",
      python: "import sys, json\n# __USER_CODE__\ninput_data = sys.stdin.read().trim().split('\\n')\nnums = json.loads(input_data[0])\ntarget = int(input_data[1])\nprint(json.dumps(twoSum(nums, target)))"
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true }
    ]
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
    difficulty: "Easy",
    topicTags: ["Stack", "Strings"],
    companyTags: ["Microsoft", "Google"],
    acceptance: 75,
    templates: {
      javascript: "function isValid(s) {\n    // __USER_CODE__\n}",
      python: "def isValid(s: str) -> bool:\n    # __USER_CODE__\n    pass"
    },
    driverCode: {
      javascript: "function isValid(s) {\n    // __USER_CODE__\n}\nconst fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(isValid(s));",
      python: "import sys\n# __USER_CODE__\ns = sys.stdin.read().trim()\nprint(str(isValid(s)).lower())"
    },
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true }
    ]
  },
  {
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    topicTags: ["Dynamic Programming", "Math"],
    companyTags: ["Google", "Adobe"],
    acceptance: 60,
    templates: {
      javascript: "function climbStairs(n) {\n    // __USER_CODE__\n}",
      python: "def climbStairs(n: int) -> int:\n    # __USER_CODE__\n    pass"
    },
    driverCode: {
      javascript: "function climbStairs(n) {\n    // __USER_CODE__\n}\nconst fs = require('fs');\nconst n = parseInt(fs.readFileSync(0, 'utf-8').trim());\nconsole.log(climbStairs(n));",
      python: "import sys\n# __USER_CODE__\nn = int(sys.stdin.read().trim())\nprint(climbStairs(n))"
    },
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false },
      { input: "4", expectedOutput: "5", isHidden: true }
    ]
  }
];

mongoose.connect("mongodb://127.0.0.1:27017/hiresense")
  .then(async () => {
    console.log("Seeding Practice Questions...");
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log("Successfully seeded 3 standard DSA questions!");
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Seeding Failed:", err);
  });
