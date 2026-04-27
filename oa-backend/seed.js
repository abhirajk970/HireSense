const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: String,
  initialCode: {
    javascript: String,
    python: String
  },
  testCases: [
    { input: String, expectedOutput: String }
  ]
});
const Question = mongoose.model("Question", QuestionSchema);

const seedDB = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/hiresense");
        
        await Question.deleteMany({});
        
        const qList = [
            {
                title: "Two Sum",
                description: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou should log the array of the two indices.",
                difficulty: "Easy",
                initialCode: { javascript: "function twoSum(nums, target) {\n  // write your code here\n}\n\n// Read from process.argv\nconst nums = JSON.parse(process.argv[2]);\nconst target = parseInt(process.argv[3]);\nconsole.log(JSON.stringify(twoSum(nums, target)));", python: "import sys\nimport json\n\ndef two_sum(nums, target):\n    # write your code here\n    pass\n\nif __name__ == '__main__':\n    nums = json.loads(sys.argv[1])\n    target = int(sys.argv[2])\n    print(json.dumps(two_sum(nums, target)))" },
                testCases: [
                    { input: "\"[2,7,11,15]\" \"9\"", expectedOutput: "[0,1]" },
                    { input: "\"[3,2,4]\" \"6\"", expectedOutput: "[1,2]" },
                    { input: "\"[3,3]\" \"6\"", expectedOutput: "[0,1]" }
                ]
            },
            {
                title: "Valid Parentheses",
                description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if: Open brackets must be closed by the same type of brackets, and in the correct order. Return true if valid, false otherwise.",
                difficulty: "Easy",
                initialCode: { javascript: "function isValid(s) {\n  // write your code here\n}\n\nconst s = process.argv[2];\nconsole.log(isValid(s));", python: "import sys\n\ndef is_valid(s):\n    # code here\n    pass\n\nif __name__ == '__main__':\n    print(is_valid(sys.argv[1]))" },
                testCases: [
                    { input: "\"()\"", expectedOutput: "true" },
                    { input: "\"()[]{}\"", expectedOutput: "true" },
                    { input: "\"(]\"", expectedOutput: "false" }
                ]
            },
            {
                title: "Maximum Subarray",
                description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
                difficulty: "Medium",
                initialCode: { javascript: "function maxSubArray(nums) {\n  // write your code here\n}\n\nconst nums = JSON.parse(process.argv[2]);\nconsole.log(maxSubArray(nums));", python: "import sys\nimport json\n\ndef max_sub_array(nums):\n    pass\n\nif __name__ == '__main__':\n    print(max_sub_array(json.loads(sys.argv[1])))" },
                testCases: [
                    { input: "\"[-2,1,-3,4,-1,2,1,-5,4]\"", expectedOutput: "6" },
                    { input: "\"[1]\"", expectedOutput: "1" },
                    { input: "\"[-1]\"", expectedOutput: "-1" }
                ]
            },
            {
                title: "Merge Sorted Arrays",
                description: "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order. Merge `nums1` and `nums2` into a single array sorted in non-decreasing order. Return the merged array.",
                difficulty: "Easy",
                initialCode: { javascript: "function mergeArrays(nums1, nums2) {\n  // code here\n}\n\nconst nums1 = JSON.parse(process.argv[2]);\nconst nums2 = JSON.parse(process.argv[3]);\nconsole.log(JSON.stringify(mergeArrays(nums1, nums2)));", python: "import sys\nimport json\n\ndef merge_arrays(nums1, nums2):\n    pass\n\nif __name__ == '__main__':\n    n1 = json.loads(sys.argv[1])\n    n2 = json.loads(sys.argv[2])\n    print(json.dumps(merge_arrays(n1, n2)))" },
                testCases: [
                    { input: "\"[1,2,3]\" \"[2,5,6]\"", expectedOutput: "[1,2,2,3,5,6]" },
                    { input: "\"[1]\" \"[]\"", expectedOutput: "[1]" }
                ]
            },
            {
                title: "Find Minimum in Rotated Sorted Array",
                description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.",
                difficulty: "Medium",
                initialCode: { javascript: "function findMin(nums) {\n  // code here\n}\n\nconst nums = JSON.parse(process.argv[2]);\nconsole.log(findMin(nums));", python: "import sys\nimport json\n\ndef find_min(nums):\n    pass\n\nif __name__ == '__main__':\n    print(find_min(json.loads(sys.argv[1])))" },
                testCases: [
                    { input: "\"[3,4,5,1,2]\"", expectedOutput: "1" },
                    { input: "\"[4,5,6,7,0,1,2]\"", expectedOutput: "0" },
                    { input: "\"[11,13,15,17]\"", expectedOutput: "11" }
                ]
            },
            {
                title: "Container With Most Water",
                description: "You are given an integer array `height` of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
                difficulty: "Medium",
                initialCode: { javascript: "function maxArea(height) {\n  // code here\n}\n\nconst height = JSON.parse(process.argv[2]);\nconsole.log(maxArea(height));", python: "import sys\nimport json\n\ndef max_area(height):\n    pass\n\nif __name__ == '__main__':\n    print(max_area(json.loads(sys.argv[1])))" },
                testCases: [
                    { input: "\"[1,8,6,2,5,4,8,3,7]\"", expectedOutput: "49" },
                    { input: "\"[1,1]\"", expectedOutput: "1" }
                ]
            },
            {
                title: "Climbing Stairs",
                description: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
                difficulty: "Easy",
                initialCode: { javascript: "function climbStairs(n) {\n  // code here\n}\n\nconst n = parseInt(process.argv[2]);\nconsole.log(climbStairs(n));", python: "import sys\n\ndef climb_stairs(n):\n    pass\n\nif __name__ == '__main__':\n    print(climb_stairs(int(sys.argv[1])))" },
                testCases: [
                    { input: "\"2\"", expectedOutput: "2" },
                    { input: "\"3\"", expectedOutput: "3" },
                    { input: "\"4\"", expectedOutput: "5" }
                ]
            },
            {
                title: "Product of Array Except Self",
                description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.",
                difficulty: "Medium",
                initialCode: { javascript: "function productExceptSelf(nums) {\n  // code here\n}\n\nconst nums = JSON.parse(process.argv[2]);\nconsole.log(JSON.stringify(productExceptSelf(nums)));", python: "import sys\nimport json\n\ndef product_except_self(nums):\n    pass\n\nif __name__ == '__main__':\n    print(json.dumps(product_except_self(json.loads(sys.argv[1]))))" },
                testCases: [
                    { input: "\"[1,2,3,4]\"", expectedOutput: "[24,12,8,6]" },
                    { input: "\"[-1,1,0,-3,3]\"", expectedOutput: "[0,0,9,0,0]" }
                ]
            },
            {
                title: "House Robber",
                description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
                difficulty: "Medium",
                initialCode: { javascript: "function rob(nums) {\n  // code here\n}\n\nconst nums = JSON.parse(process.argv[2]);\nconsole.log(rob(nums));", python: "import sys\nimport json\n\ndef rob(nums):\n    pass\n\nif __name__ == '__main__':\n    print(rob(json.loads(sys.argv[1])))" },
                testCases: [
                    { input: "\"[1,2,3,1]\"", expectedOutput: "4" },
                    { input: "\"[2,7,9,3,1]\"", expectedOutput: "12" }
                ]
            },
            {
                title: "Best Time to Buy and Sell Stock",
                description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
                difficulty: "Easy",
                initialCode: { javascript: "function maxProfit(prices) {\n  // code here\n}\n\nconst prices = JSON.parse(process.argv[2]);\nconsole.log(maxProfit(prices));", python: "import sys\nimport json\n\ndef max_profit(prices):\n    pass\n\nif __name__ == '__main__':\n    print(max_profit(json.loads(sys.argv[1])))" },
                testCases: [
                    { input: "\"[7,1,5,3,6,4]\"", expectedOutput: "5" },
                    { input: "\"[7,6,4,3,1]\"", expectedOutput: "0" }
                ]
            }
        ];

        await Question.insertMany(qList);
        console.log("Database Seeded Successfully width 10 real questions!");
    } catch(err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
}
seedDB();
