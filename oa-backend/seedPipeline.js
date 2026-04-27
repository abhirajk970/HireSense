const mongoose = require("mongoose");
const Question = require("./models/Question");

const seedData = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/hiresense");
        await Question.deleteMany({});
        
        const generateWrappers = (fnName, retType, argsConfig, isArray = false) => {
            // Very simplified driver generators for basic competitive programming types
            let jsDriver = `// __USER_CODE__\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif(input.length) {\n`;
            let pyDriver = `import sys\n# __USER_CODE__\nif __name__ == '__main__':\n    data = sys.stdin.read().split()\n    if data:\n`;
            let cppDriver = `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n// __USER_CODE__\nint main() {\n`;
            let cDriver = `#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n// __USER_CODE__\nint main() {\n`;
            let javaDriver = `import java.util.Scanner;\npublic class Main {\n    // __USER_CODE__\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n`;

            if (argsConfig === "2_ints") {
                jsDriver += `  console.log(${fnName}(parseInt(input[0]), parseInt(input[1])));\n}`;
                pyDriver += `        print(${fnName}(int(data[0]), int(data[1])))`;
                cppDriver += `    long long a, b;\n    if(cin >> a >> b) cout << ${fnName}(a, b) << endl;\n    return 0;\n}`;
                cDriver += `    long long a, b;\n    if(scanf("%lld %lld", &a, &b) == 2) printf("%lld\\n", ${fnName}(a, b));\n    return 0;\n}`;
                javaDriver += `        if(sc.hasNextLong()) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            System.out.println(${fnName}(a, b));\n        }\n    }\n}`;
            } else if (argsConfig === "1_int") {
                jsDriver += `  console.log(${fnName}(parseInt(input[0])));\n}`;
                pyDriver += `        print(${fnName}(int(data[0])))`;
                cppDriver += `    long long a;\n    if(cin >> a) cout << ${fnName}(a) << endl;\n    return 0;\n}`;
                cDriver += `    long long a;\n    if(scanf("%lld", &a) == 1) printf("%lld\\n", ${fnName}(a));\n    return 0;\n}`;
                javaDriver += `        if(sc.hasNextLong()) {\n            long a = sc.nextLong();\n            System.out.println(${fnName}(a));\n        }\n    }\n}`;
            } else if (argsConfig === "1_string") {
                jsDriver += `  console.log(${fnName}(input[0]));\n}`;
                pyDriver += `        print(${fnName}(data[0]))`;
                cppDriver += `    string s;\n    if(cin >> s) cout << ${fnName}(s) << endl;\n    return 0;\n}`;
                cDriver += `    char s[10000];\n    if(scanf("%s", s) == 1) printf("%d\\n", ${fnName}(s));\n    return 0;\n}`;
                javaDriver += `        if(sc.hasNext()) {\n            String s = sc.next();\n            System.out.println(${fnName}(s));\n        }\n    }\n}`;
            } else if (argsConfig === "array") {
                // array means N followed by N integers
                jsDriver += `  const N = parseInt(input[0]);\n  const arr = input.slice(1, N+1).map(Number);\n  console.log(${fnName}(arr));\n}`;
                pyDriver += `        N = int(data[0])\n        arr = [int(x) for x in data[1:N+1]]\n        print(${fnName}(arr))`;
                cppDriver += `    int n;\n    if(cin >> n) {\n        vector<int> arr(n);\n        for(int i=0; i<n; i++) cin >> arr[i];\n        cout << ${fnName}(arr) << endl;\n    }\n    return 0;\n}`;
                cDriver += `    int n;\n    if(scanf("%d", &n) == 1) {\n        int *arr = (int*)malloc(n * sizeof(int));\n        for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n        printf("%d\\n", ${fnName}(arr, n));\n        free(arr);\n    }\n    return 0;\n}`;
                javaDriver += `        if(sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] arr = new int[n];\n            for(int i=0; i<n; i++) arr[i] = sc.nextInt();\n            System.out.println(${fnName}(arr));\n        }\n    }\n}`;
            }

            return {
                javascript: jsDriver,
                python: pyDriver,
                cpp: cppDriver,
                c: cDriver,
                java: javaDriver
            };
        };

        const questions = [
            {
                title: "Add Two Numbers",
                description: "Write a function that receives two integer numbers and returns their sum.",
                testCases: [ { input: "5 10", expectedOutput: "15" }, { input: "-3 3", expectedOutput: "0" }, { input: "999 1", expectedOutput: "1000" } ],
                templates: {
                    javascript: `function addTwoNumbers(a, b) {\n    // Write your code here\n    \n}`,
                    python: `def addTwoNumbers(a, b):\n    # Write your code here\n    pass`,
                    cpp: `long long addTwoNumbers(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    c: `long long addTwoNumbers(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    java: `public static long addTwoNumbers(long a, long b) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("addTwoNumbers", "long long", "2_ints")
            },
            {
                title: "Multiply Numbers",
                description: "Write a function that receives two integer numbers and returns their product.",
                testCases: [ { input: "5 10", expectedOutput: "50" }, { input: "-3 3", expectedOutput: "-9" }, { input: "0 99", expectedOutput: "0" } ],
                templates: {
                    javascript: `function multiply(a, b) {\n    // Write your code here\n    \n}`,
                    python: `def multiply(a, b):\n    # Write your code here\n    pass`,
                    cpp: `long long multiply(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    c: `long long multiply(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    java: `public static long multiply(long a, long b) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("multiply", "long long", "2_ints")
            },
            {
                title: "Find Maximum Element",
                description: "Write a function that receives an array of integers (first line is size N, second line is elements) and returns the maximum element.",
                testCases: [ { input: "5\n1 9 -2 4 3", expectedOutput: "9" }, { input: "3\n-1 -5 -2", expectedOutput: "-1" } ],
                templates: {
                    javascript: `function findMax(arr) {\n    // Write your code here\n    \n}`,
                    python: `def findMax(arr):\n    # Write your code here\n    pass`,
                    cpp: `int findMax(vector<int>& arr) {\n    // Write your code here\n    \n}`,
                    c: `int findMax(int* arr, int n) {\n    // Write your code here\n    \n}`,
                    java: `public static int findMax(int[] arr) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("findMax", "int", "array")
            },
            {
                title: "Factorial",
                description: "Write a function that returns the factorial of a given non-negative integer n. (Compute using large number capable types / recursion)",
                testCases: [ { input: "5", expectedOutput: "120" }, { input: "0", expectedOutput: "1" }, { input: "10", expectedOutput: "3628800" } ],
                templates: {
                    javascript: `function factorial(n) {\n    // Write your code here\n    \n}`,
                    python: `def factorial(n):\n    # Write your code here\n    pass`,
                    cpp: `long long factorial(long long n) {\n    // Write your code here\n    \n}`,
                    c: `long long factorial(long long n) {\n    // Write your code here\n    \n}`,
                    java: `public static long factorial(long n) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("factorial", "long long", "1_int")
            },
            {
                title: "Absolute Difference",
                description: "Write a function to return the absolute difference between two given numbers a and b.",
                testCases: [ { input: "5 10", expectedOutput: "5" }, { input: "10 5", expectedOutput: "5" }, { input: "-5 5", expectedOutput: "10" } ],
                templates: {
                    javascript: `function getDifference(a, b) {\n    // Write your code here\n    \n}`,
                    python: `def getDifference(a, b):\n    # Write your code here\n    pass`,
                    cpp: `long long getDifference(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    c: `long long getDifference(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    java: `public static long getDifference(long a, long b) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("getDifference", "long long", "2_ints")
            },
            {
                title: "Print Power",
                description: "Write a function that given a base and an exponent, returns base^exponent.",
                testCases: [ { input: "2 3", expectedOutput: "8" }, { input: "5 2", expectedOutput: "25" }, { input: "2 10", expectedOutput: "1024" } ],
                templates: {
                    javascript: `function power(a, b) {\n    // Write your code here\n    \n}`,
                    python: `def power(a, b):\n    # Write your code here\n    pass`,
                    cpp: `long long power(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    c: `long long power(long long a, long long b) {\n    // Write your code here\n    \n}`,
                    java: `public static long power(long a, long b) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("power", "long long", "2_ints")
            },
            {
                title: "Square Area",
                description: "Write a function that calculates the area of a square given the side length.",
                testCases: [ { input: "5", expectedOutput: "25" }, { input: "10", expectedOutput: "100" } ],
                templates: {
                    javascript: `function squareArea(n) {\n    // Write your code here\n    \n}`,
                    python: `def squareArea(n):\n    # Write your code here\n    pass`,
                    cpp: `long long squareArea(long long n) {\n    // Write your code here\n    \n}`,
                    c: `long long squareArea(long long n) {\n    // Write your code here\n    \n}`,
                    java: `public static long squareArea(long n) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("squareArea", "long long", "1_int")
            },
            {
                title: "Calculate Perimeter",
                description: "Given the length and width of a rectangle, return its perimeter.",
                testCases: [ { input: "5 10", expectedOutput: "30" }, { input: "1 1", expectedOutput: "4" } ],
                templates: {
                    javascript: `function perimeter(l, w) {\n    // Write your code here\n    \n}`,
                    python: `def perimeter(l, w):\n    # Write your code here\n    pass`,
                    cpp: `long long perimeter(long long l, long long w) {\n    // Write your code here\n    \n}`,
                    c: `long long perimeter(long long l, long long w) {\n    // Write your code here\n    \n}`,
                    java: `public static long perimeter(long l, long w) {\n    // Write your code here\n    return 0;\n}`
                },
                driverCode: generateWrappers("perimeter", "long long", "2_ints")
            }
        ];

        await Question.insertMany(questions);
        console.log("Successfully seeded 8 fully wrapped questions!");
    } catch(err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
