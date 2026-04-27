const mongoose = require("mongoose");
const Question = require("./models/Question");

const seedData = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/hiresense");
        await Question.deleteMany({});

        // ─── Driver code generators ──────────────────────────────────────
        const wrap = (fnName, argsConfig) => {
            let js, py, cpp, c, java;

            if (argsConfig === "2_ints") {
                js = `// __USER_CODE__\nconst fs=require('fs');const d=fs.readFileSync(0,'utf-8').trim().split(/\\s+/);\nconsole.log(${fnName}(parseInt(d[0]),parseInt(d[1])));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    d=sys.stdin.read().split()\n    print(${fnName}(int(d[0]),int(d[1])))`;
                cpp = `#include<iostream>\nusing namespace std;\n// __USER_CODE__\nint main(){long long a,b;cin>>a>>b;cout<<${fnName}(a,b)<<endl;return 0;}`;
                c = `#include<stdio.h>\n// __USER_CODE__\nint main(){long long a,b;scanf("%lld %lld",&a,&b);printf("%lld\\n",${fnName}(a,b));return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.println(${fnName}(s.nextLong(),s.nextLong()));}\n}`;
            } else if (argsConfig === "1_int") {
                js = `// __USER_CODE__\nconst fs=require('fs');const d=fs.readFileSync(0,'utf-8').trim();\nconsole.log(${fnName}(parseInt(d)));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    print(${fnName}(int(sys.stdin.read().strip())))`;
                cpp = `#include<iostream>\nusing namespace std;\n// __USER_CODE__\nint main(){long long n;cin>>n;cout<<${fnName}(n)<<endl;return 0;}`;
                c = `#include<stdio.h>\n// __USER_CODE__\nint main(){long long n;scanf("%lld",&n);printf("%lld\\n",${fnName}(n));return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.println(${fnName}(s.nextLong()));}\n}`;
            } else if (argsConfig === "1_string") {
                js = `// __USER_CODE__\nconst fs=require('fs');const s=fs.readFileSync(0,'utf-8').trim();\nconsole.log(${fnName}(s));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    print(${fnName}(sys.stdin.read().strip()))`;
                cpp = `#include<iostream>\n#include<string>\nusing namespace std;\n// __USER_CODE__\nint main(){string s;cin>>s;cout<<${fnName}(s)<<endl;return 0;}`;
                c = `#include<stdio.h>\n#include<string.h>\n// __USER_CODE__\nint main(){char s[100001];scanf("%s",s);printf("%d\\n",${fnName}(s));return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.println(${fnName}(s.next()));}\n}`;
            } else if (argsConfig === "array") {
                js = `// __USER_CODE__\nconst fs=require('fs');const d=fs.readFileSync(0,'utf-8').trim().split(/\\s+/);\nconst n=parseInt(d[0]);const arr=d.slice(1,n+1).map(Number);\nconsole.log(${fnName}(arr));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    d=sys.stdin.read().split()\n    n=int(d[0]);arr=[int(x) for x in d[1:n+1]]\n    print(${fnName}(arr))`;
                cpp = `#include<iostream>\n#include<vector>\nusing namespace std;\n// __USER_CODE__\nint main(){int n;cin>>n;vector<int>a(n);for(int i=0;i<n;i++)cin>>a[i];cout<<${fnName}(a)<<endl;return 0;}`;
                c = `#include<stdio.h>\n#include<stdlib.h>\n// __USER_CODE__\nint main(){int n;scanf("%d",&n);int*a=(int*)malloc(n*sizeof(int));for(int i=0;i<n;i++)scanf("%d",&a[i]);printf("%d\\n",${fnName}(a,n));free(a);return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);int n=s.nextInt();int[]arr=new int[n];for(int i=0;i<n;i++)arr[i]=s.nextInt();System.out.println(${fnName}(arr));}\n}`;
            } else if (argsConfig === "array_target") {
                js = `// __USER_CODE__\nconst fs=require('fs');const d=fs.readFileSync(0,'utf-8').trim().split(/\\s+/);\nconst n=parseInt(d[0]);const arr=d.slice(1,n+1).map(Number);const t=parseInt(d[n+1]);\nconsole.log(${fnName}(arr,t));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    d=sys.stdin.read().split()\n    n=int(d[0]);arr=[int(x) for x in d[1:n+1]];t=int(d[n+1])\n    print(${fnName}(arr,t))`;
                cpp = `#include<iostream>\n#include<vector>\nusing namespace std;\n// __USER_CODE__\nint main(){int n,t;cin>>n;vector<int>a(n);for(int i=0;i<n;i++)cin>>a[i];cin>>t;cout<<${fnName}(a,t)<<endl;return 0;}`;
                c = `#include<stdio.h>\n#include<stdlib.h>\n// __USER_CODE__\nint main(){int n,t;scanf("%d",&n);int*a=(int*)malloc(n*sizeof(int));for(int i=0;i<n;i++)scanf("%d",&a[i]);scanf("%d",&t);printf("%d\\n",${fnName}(a,n,t));free(a);return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);int n=s.nextInt();int[]arr=new int[n];for(int i=0;i<n;i++)arr[i]=s.nextInt();int t=s.nextInt();System.out.println(${fnName}(arr,t));}\n}`;
            } else if (argsConfig === "2_strings") {
                js = `// __USER_CODE__\nconst fs=require('fs');const d=fs.readFileSync(0,'utf-8').trim().split('\\n');\nconsole.log(${fnName}(d[0],d[1]));`;
                py = `import sys\n# __USER_CODE__\nif __name__=='__main__':\n    d=sys.stdin.read().strip().split('\\n')\n    print(${fnName}(d[0],d[1]))`;
                cpp = `#include<iostream>\n#include<string>\nusing namespace std;\n// __USER_CODE__\nint main(){string a,b;cin>>a>>b;cout<<${fnName}(a,b)<<endl;return 0;}`;
                c = `#include<stdio.h>\n#include<string.h>\n// __USER_CODE__\nint main(){char a[10001],b[10001];scanf("%s %s",a,b);printf("%d\\n",${fnName}(a,b));return 0;}`;
                java = `import java.util.Scanner;\npublic class Main{\n    // __USER_CODE__\n    public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.println(${fnName}(s.next(),s.next()));}\n}`;
            }

            return { javascript: js, python: py, cpp, c, java };
        };

        // ─── 10 Real DSA Questions ───────────────────────────────────────

        const questions = [
            // ──── Q1: Two Sum ────
            {
                title: "Two Sum",
                description: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as two space-separated indices (0-indexed).\n\nInput format: First line is N (array size), second line is N space-separated integers, third line is the target.\nOutput: Two space-separated indices.",
                difficulty: "Easy",
                topicTags: ["Arrays", "Hash Map"],
                companyTags: ["Google", "Amazon", "Meta"],
                acceptance: 52.4,
                templates: {
                    javascript: `function twoSum(arr, target) {\n    // Return "i j" (space separated indices)\n    \n}`,
                    python: `def twoSum(arr, target):\n    # Return "i j" (space separated indices)\n    pass`,
                    cpp: `int twoSum(vector<int>& arr, int target) {\n    // Print "i j" and return 0\n    \n    return 0;\n}`,
                    c: `int twoSum(int* arr, int n, int target) {\n    // Print "i j" and return 0\n    \n    return 0;\n}`,
                    java: `public static int twoSum(int[] arr, int target) {\n    // Print "i j" and return 0\n    \n    return 0;\n}`
                },
                driverCode: wrap("twoSum", "array_target"),
                testCases: [
                    // 3 visible
                    { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isHidden: false },
                    { input: "3\n3 2 4\n6", expectedOutput: "1 2", isHidden: false },
                    { input: "2\n3 3\n6", expectedOutput: "0 1", isHidden: false },
                    // 10 hidden
                    { input: "5\n1 5 3 7 2\n8", expectedOutput: "0 3", isHidden: true },
                    { input: "4\n-1 -2 -3 -4\n-7", expectedOutput: "2 3", isHidden: true },
                    { input: "6\n0 4 3 0 1 2\n0", expectedOutput: "0 3", isHidden: true },
                    { input: "3\n1 2 3\n5", expectedOutput: "1 2", isHidden: true },
                    { input: "5\n10 20 30 40 50\n70", expectedOutput: "1 4", isHidden: true },
                    { input: "4\n100 200 300 400\n500", expectedOutput: "0 3", isHidden: true },
                    { input: "3\n-5 0 5\n0", expectedOutput: "0 2", isHidden: true },
                    { input: "6\n1 3 5 7 9 11\n14", expectedOutput: "1 5", isHidden: true },
                    { input: "4\n2 2 2 2\n4", expectedOutput: "0 1", isHidden: true },
                    { input: "5\n5 75 25 50 100\n125", expectedOutput: "1 3", isHidden: true },
                ]
            },

            // ──── Q2: Valid Parentheses ────
            {
                title: "Valid Parentheses",
                description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nReturn 'true' if valid, 'false' otherwise.",
                difficulty: "Easy",
                topicTags: ["Stack", "Strings"],
                companyTags: ["Amazon", "Microsoft", "Bloomberg"],
                acceptance: 40.1,
                templates: {
                    javascript: `function isValid(s) {\n    // Return "true" or "false"\n    \n}`,
                    python: `def isValid(s):\n    # Return "true" or "false"\n    pass`,
                    cpp: `string isValid(string s) {\n    // Return "true" or "false"\n    \n}`,
                    c: `int isValid(char* s) {\n    // Return 1 for true, 0 for false\n    \n}`,
                    java: `public static String isValid(String s) {\n    // Return "true" or "false"\n    return "false";\n}`
                },
                driverCode: wrap("isValid", "1_string"),
                testCases: [
                    { input: "()", expectedOutput: "true", isHidden: false },
                    { input: "()[]{}", expectedOutput: "true", isHidden: false },
                    { input: "(]", expectedOutput: "false", isHidden: false },
                    { input: "((()))", expectedOutput: "true", isHidden: true },
                    { input: "{[]}", expectedOutput: "true", isHidden: true },
                    { input: "([)]", expectedOutput: "false", isHidden: true },
                    { input: " ", expectedOutput: "true", isHidden: true },
                    { input: "(", expectedOutput: "false", isHidden: true },
                    { input: ")", expectedOutput: "false", isHidden: true },
                    { input: "((({{}})()))", expectedOutput: "true", isHidden: true },
                    { input: "{{{{", expectedOutput: "false", isHidden: true },
                    { input: "(((())))", expectedOutput: "true", isHidden: true },
                    { input: "[{({})}]", expectedOutput: "true", isHidden: true },
                ]
            },

            // ──── Q3: Maximum Subarray (Kadane's) ────
            {
                title: "Maximum Subarray",
                description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.\n\nInput: First line is N, second line is N space-separated integers.\nOutput: A single integer — the maximum subarray sum.",
                difficulty: "Medium",
                topicTags: ["Arrays", "Dynamic Programming", "Divide and Conquer"],
                companyTags: ["Amazon", "Apple", "Microsoft", "Google"],
                acceptance: 50.3,
                templates: {
                    javascript: `function maxSubArray(arr) {\n    // Return the maximum subarray sum\n    \n}`,
                    python: `def maxSubArray(arr):\n    # Return the maximum subarray sum\n    pass`,
                    cpp: `int maxSubArray(vector<int>& arr) {\n    // Return the maximum subarray sum\n    \n}`,
                    c: `int maxSubArray(int* arr, int n) {\n    // Return the maximum subarray sum\n    \n}`,
                    java: `public static int maxSubArray(int[] arr) {\n    // Return the maximum subarray sum\n    return 0;\n}`
                },
                driverCode: wrap("maxSubArray", "array"),
                testCases: [
                    { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false },
                    { input: "1\n1", expectedOutput: "1", isHidden: false },
                    { input: "5\n5 4 -1 7 8", expectedOutput: "23", isHidden: false },
                    { input: "1\n-1", expectedOutput: "-1", isHidden: true },
                    { input: "3\n-2 -1 -3", expectedOutput: "-1", isHidden: true },
                    { input: "6\n1 2 3 4 5 6", expectedOutput: "21", isHidden: true },
                    { input: "5\n-1 0 -2 0 -3", expectedOutput: "0", isHidden: true },
                    { input: "4\n100 -1 100 -1", expectedOutput: "198", isHidden: true },
                    { input: "7\n-5 4 6 -3 4 -1 2", expectedOutput: "12", isHidden: true },
                    { input: "3\n0 0 0", expectedOutput: "0", isHidden: true },
                    { input: "8\n-1 2 3 -4 5 -6 7 -8", expectedOutput: "7", isHidden: true },
                    { input: "6\n3 -1 -1 -1 -1 5", expectedOutput: "5", isHidden: true },
                ]
            },

            // ──── Q4: Climbing Stairs ────
            {
                title: "Climbing Stairs",
                description: "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nInput: A single integer n.\nOutput: The number of distinct ways.",
                difficulty: "Easy",
                topicTags: ["Dynamic Programming", "Math"],
                companyTags: ["Amazon", "Google", "Adobe"],
                acceptance: 52.7,
                templates: {
                    javascript: `function climbStairs(n) {\n    // Return number of distinct ways\n    \n}`,
                    python: `def climbStairs(n):\n    # Return number of distinct ways\n    pass`,
                    cpp: `long long climbStairs(long long n) {\n    // Return number of distinct ways\n    \n}`,
                    c: `long long climbStairs(long long n) {\n    // Return number of distinct ways\n    \n}`,
                    java: `public static long climbStairs(long n) {\n    // Return number of distinct ways\n    return 0;\n}`
                },
                driverCode: wrap("climbStairs", "1_int"),
                testCases: [
                    { input: "2", expectedOutput: "2", isHidden: false },
                    { input: "3", expectedOutput: "3", isHidden: false },
                    { input: "5", expectedOutput: "8", isHidden: false },
                    { input: "1", expectedOutput: "1", isHidden: true },
                    { input: "4", expectedOutput: "5", isHidden: true },
                    { input: "6", expectedOutput: "13", isHidden: true },
                    { input: "7", expectedOutput: "21", isHidden: true },
                    { input: "8", expectedOutput: "34", isHidden: true },
                    { input: "10", expectedOutput: "89", isHidden: true },
                    { input: "15", expectedOutput: "987", isHidden: true },
                    { input: "20", expectedOutput: "10946", isHidden: true },
                    { input: "30", expectedOutput: "1346269", isHidden: true },
                ]
            },

            // ──── Q5: Best Time to Buy and Sell Stock ────
            {
                title: "Best Time to Buy and Sell Stock",
                description: "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve. If no profit is possible, return 0.\n\nInput: First line is N, second line is N space-separated prices.\nOutput: The maximum profit.",
                difficulty: "Easy",
                topicTags: ["Arrays", "Greedy"],
                companyTags: ["Amazon", "Meta", "Goldman Sachs"],
                acceptance: 54.2,
                templates: {
                    javascript: `function maxProfit(arr) {\n    // Return the maximum profit\n    \n}`,
                    python: `def maxProfit(arr):\n    # Return the maximum profit\n    pass`,
                    cpp: `int maxProfit(vector<int>& arr) {\n    // Return the maximum profit\n    \n}`,
                    c: `int maxProfit(int* arr, int n) {\n    // Return the maximum profit\n    \n}`,
                    java: `public static int maxProfit(int[] arr) {\n    // Return the maximum profit\n    return 0;\n}`
                },
                driverCode: wrap("maxProfit", "array"),
                testCases: [
                    { input: "6\n7 1 5 3 6 4", expectedOutput: "5", isHidden: false },
                    { input: "5\n7 6 4 3 1", expectedOutput: "0", isHidden: false },
                    { input: "4\n2 4 1 7", expectedOutput: "6", isHidden: false },
                    { input: "1\n5", expectedOutput: "0", isHidden: true },
                    { input: "2\n1 2", expectedOutput: "1", isHidden: true },
                    { input: "2\n2 1", expectedOutput: "0", isHidden: true },
                    { input: "6\n3 3 3 3 3 3", expectedOutput: "0", isHidden: true },
                    { input: "5\n1 2 3 4 5", expectedOutput: "4", isHidden: true },
                    { input: "7\n10 8 2 9 1 3 7", expectedOutput: "7", isHidden: true },
                    { input: "4\n1 100 1 100", expectedOutput: "99", isHidden: true },
                    { input: "6\n100 90 80 70 60 50", expectedOutput: "0", isHidden: true },
                    { input: "5\n3 1 4 8 2", expectedOutput: "7", isHidden: true },
                ]
            },

            // ──── Q6: Container With Most Water ────
            {
                title: "Container With Most Water",
                description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\nInput: First line is N, second line is N space-separated heights.\nOutput: The maximum area.",
                difficulty: "Medium",
                topicTags: ["Arrays", "Two Pointers", "Greedy"],
                companyTags: ["Amazon", "Google", "Meta", "Goldman Sachs"],
                acceptance: 55.1,
                templates: {
                    javascript: `function maxArea(arr) {\n    // Return the maximum water area\n    \n}`,
                    python: `def maxArea(arr):\n    # Return the maximum water area\n    pass`,
                    cpp: `int maxArea(vector<int>& arr) {\n    // Return the maximum water area\n    \n}`,
                    c: `int maxArea(int* arr, int n) {\n    // Return the maximum water area\n    \n}`,
                    java: `public static int maxArea(int[] arr) {\n    // Return the maximum water area\n    return 0;\n}`
                },
                driverCode: wrap("maxArea", "array"),
                testCases: [
                    { input: "9\n1 8 6 2 5 4 8 3 7", expectedOutput: "49", isHidden: false },
                    { input: "2\n1 1", expectedOutput: "1", isHidden: false },
                    { input: "4\n4 3 2 1", expectedOutput: "4", isHidden: false },
                    { input: "5\n1 2 3 4 5", expectedOutput: "6", isHidden: true },
                    { input: "3\n1 1 1", expectedOutput: "2", isHidden: true },
                    { input: "6\n1 8 6 2 5 8", expectedOutput: "32", isHidden: true },
                    { input: "5\n2 3 10 5 7", expectedOutput: "14", isHidden: true },
                    { input: "4\n10 10 10 10", expectedOutput: "30", isHidden: true },
                    { input: "7\n1 3 2 5 25 24 5", expectedOutput: "24", isHidden: true },
                    { input: "3\n5 1 5", expectedOutput: "10", isHidden: true },
                    { input: "2\n100 100", expectedOutput: "100", isHidden: true },
                    { input: "6\n2 1 3 1 2 1", expectedOutput: "6", isHidden: true },
                ]
            },

            // ──── Q7: House Robber ────
            {
                title: "House Robber",
                description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint is that adjacent houses have security systems connected — if two adjacent houses are broken into on the same night, the police will be alerted.\n\nGiven an integer array nums representing the amount of money at each house, return the maximum amount of money you can rob tonight without alerting the police.\n\nInput: First line is N, second line is N space-separated amounts.\nOutput: The maximum amount.",
                difficulty: "Medium",
                topicTags: ["Dynamic Programming", "Arrays"],
                companyTags: ["Amazon", "Cisco", "Google"],
                acceptance: 49.8,
                templates: {
                    javascript: `function rob(arr) {\n    // Return the maximum amount you can rob\n    \n}`,
                    python: `def rob(arr):\n    # Return the maximum amount you can rob\n    pass`,
                    cpp: `int rob(vector<int>& arr) {\n    // Return the maximum amount you can rob\n    \n}`,
                    c: `int rob(int* arr, int n) {\n    // Return the maximum amount you can rob\n    \n}`,
                    java: `public static int rob(int[] arr) {\n    // Return the maximum amount you can rob\n    return 0;\n}`
                },
                driverCode: wrap("rob", "array"),
                testCases: [
                    { input: "4\n1 2 3 1", expectedOutput: "4", isHidden: false },
                    { input: "5\n2 7 9 3 1", expectedOutput: "12", isHidden: false },
                    { input: "3\n2 1 1", expectedOutput: "3", isHidden: false },
                    { input: "1\n5", expectedOutput: "5", isHidden: true },
                    { input: "2\n1 2", expectedOutput: "2", isHidden: true },
                    { input: "6\n1 2 3 4 5 6", expectedOutput: "12", isHidden: true },
                    { input: "4\n10 1 1 10", expectedOutput: "20", isHidden: true },
                    { input: "5\n100 1 1 100 1", expectedOutput: "200", isHidden: true },
                    { input: "3\n0 0 0", expectedOutput: "0", isHidden: true },
                    { input: "7\n6 7 1 30 8 2 4", expectedOutput: "41", isHidden: true },
                    { input: "4\n5 5 5 5", expectedOutput: "10", isHidden: true },
                    { input: "6\n20 10 30 10 20 10", expectedOutput: "70", isHidden: true },
                ]
            },

            // ──── Q8: Product of Array Except Self ────
            {
                title: "Product of Array Except Self",
                description: "Given an integer array nums, return a string of space-separated integers where each element is equal to the product of all other elements.\n\nYou must solve it in O(n) time WITHOUT using the division operation.\n\nInput: First line is N, second line is N space-separated integers.\nOutput: Space-separated products.",
                difficulty: "Medium",
                topicTags: ["Arrays", "Prefix Sum"],
                companyTags: ["Amazon", "Apple", "Meta", "Microsoft"],
                acceptance: 66.5,
                templates: {
                    javascript: `function productExceptSelf(arr) {\n    // Return space-separated products as a string\n    \n}`,
                    python: `def productExceptSelf(arr):\n    # Return space-separated products as a string\n    pass`,
                    cpp: `int productExceptSelf(vector<int>& arr) {\n    // Print space-separated products, return 0\n    \n    return 0;\n}`,
                    c: `int productExceptSelf(int* arr, int n) {\n    // Print space-separated products, return 0\n    \n    return 0;\n}`,
                    java: `public static int productExceptSelf(int[] arr) {\n    // Print space-separated products, return 0\n    \n    return 0;\n}`
                },
                driverCode: wrap("productExceptSelf", "array"),
                testCases: [
                    { input: "4\n1 2 3 4", expectedOutput: "24 12 8 6", isHidden: false },
                    { input: "5\n-1 1 0 -3 3", expectedOutput: "0 0 9 0 0", isHidden: false },
                    { input: "3\n2 3 4", expectedOutput: "12 8 6", isHidden: false },
                    { input: "2\n5 3", expectedOutput: "3 5", isHidden: true },
                    { input: "4\n0 0 0 0", expectedOutput: "0 0 0 0", isHidden: true },
                    { input: "3\n1 1 1", expectedOutput: "1 1 1", isHidden: true },
                    { input: "4\n-1 -1 -1 -1", expectedOutput: "-1 -1 -1 -1", isHidden: true },
                    { input: "5\n1 2 3 4 5", expectedOutput: "120 60 40 30 24", isHidden: true },
                    { input: "3\n10 20 30", expectedOutput: "600 300 200", isHidden: true },
                    { input: "4\n2 0 3 4", expectedOutput: "0 24 0 0", isHidden: true },
                    { input: "3\n-2 -3 5", expectedOutput: "-15 -10 6", isHidden: true },
                    { input: "5\n1 -1 1 -1 1", expectedOutput: "1 -1 1 -1 1", isHidden: true },
                ]
            },

            // ──── Q9: Reverse String ────
            {
                title: "Reverse String",
                description: "Write a function that reverses a string. The input string is given as a single string.\n\nReturn the reversed string.\n\nInput: A single string.\nOutput: The reversed string.",
                difficulty: "Easy",
                topicTags: ["Strings", "Two Pointers"],
                companyTags: ["Google", "Microsoft", "Apple"],
                acceptance: 76.2,
                templates: {
                    javascript: `function reverseString(s) {\n    // Return the reversed string\n    \n}`,
                    python: `def reverseString(s):\n    # Return the reversed string\n    pass`,
                    cpp: `string reverseString(string s) {\n    // Return the reversed string\n    \n}`,
                    c: `int reverseString(char* s) {\n    // Print reversed string, return 0\n    \n}`,
                    java: `public static String reverseString(String s) {\n    // Return the reversed string\n    return "";\n}`
                },
                driverCode: wrap("reverseString", "1_string"),
                testCases: [
                    { input: "hello", expectedOutput: "olleh", isHidden: false },
                    { input: "world", expectedOutput: "dlrow", isHidden: false },
                    { input: "ab", expectedOutput: "ba", isHidden: false },
                    { input: "a", expectedOutput: "a", isHidden: true },
                    { input: "racecar", expectedOutput: "racecar", isHidden: true },
                    { input: "abcdef", expectedOutput: "fedcba", isHidden: true },
                    { input: "12345", expectedOutput: "54321", isHidden: true },
                    { input: "aabb", expectedOutput: "bbaa", isHidden: true },
                    { input: "xyZ", expectedOutput: "Zyx", isHidden: true },
                    { input: "abcba", expectedOutput: "abcba", isHidden: true },
                    { input: "programming", expectedOutput: "gnimmargorp", isHidden: true },
                    { input: "OpenAI", expectedOutput: "IAnepO", isHidden: true },
                ]
            },

            // ──── Q10: Find Minimum in Rotated Sorted Array ────
            {
                title: "Find Minimum in Rotated Sorted Array",
                description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times.\n\nGiven the sorted rotated array nums of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.\n\nInput: First line is N, second line is N space-separated integers.\nOutput: The minimum element.",
                difficulty: "Medium",
                topicTags: ["Binary Search", "Arrays"],
                companyTags: ["Amazon", "Microsoft", "Meta", "Bloomberg"],
                acceptance: 49.1,
                templates: {
                    javascript: `function findMin(arr) {\n    // Return the minimum element\n    \n}`,
                    python: `def findMin(arr):\n    # Return the minimum element\n    pass`,
                    cpp: `int findMin(vector<int>& arr) {\n    // Return the minimum element\n    \n}`,
                    c: `int findMin(int* arr, int n) {\n    // Return the minimum element\n    \n}`,
                    java: `public static int findMin(int[] arr) {\n    // Return the minimum element\n    return 0;\n}`
                },
                driverCode: wrap("findMin", "array"),
                testCases: [
                    { input: "5\n3 4 5 1 2", expectedOutput: "1", isHidden: false },
                    { input: "7\n4 5 6 7 0 1 2", expectedOutput: "0", isHidden: false },
                    { input: "4\n11 13 15 17", expectedOutput: "11", isHidden: false },
                    { input: "1\n42", expectedOutput: "42", isHidden: true },
                    { input: "2\n2 1", expectedOutput: "1", isHidden: true },
                    { input: "2\n1 2", expectedOutput: "1", isHidden: true },
                    { input: "5\n2 3 4 5 1", expectedOutput: "1", isHidden: true },
                    { input: "6\n5 6 1 2 3 4", expectedOutput: "1", isHidden: true },
                    { input: "3\n3 1 2", expectedOutput: "1", isHidden: true },
                    { input: "8\n6 7 8 9 10 1 2 3", expectedOutput: "1", isHidden: true },
                    { input: "4\n100 200 1 50", expectedOutput: "1", isHidden: true },
                    { input: "5\n50 60 70 10 20", expectedOutput: "10", isHidden: true },
                ]
            },
        ];

        await Question.insertMany(questions);
        console.log(`✅ Seeded ${questions.length} questions with visible + hidden test cases!`);
        questions.forEach((q, i) => {
            const vis = q.testCases.filter(t => !t.isHidden).length;
            const hid = q.testCases.filter(t => t.isHidden).length;
            console.log(`   ${i+1}. ${q.title} [${q.difficulty}] — ${vis} visible, ${hid} hidden`);
        });
    } catch(err) {
        console.error("Seed Error:", err);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
