/**
 * codeRunner.js — Sandboxed code execution using Node.js child_process
 *
 * Supports: JavaScript (node), Python (python / python3)
 * - 5 second timeout per execution
 * - Captures stdout, compares to expected output
 * - Wraps candidate function with test harness
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");

const TIMEOUT_MS = parseInt(process.env.CODE_TIMEOUT_MS) || 5000;

/**
 * Execute code with a single test case input.
 * @param {string} code - Candidate's full code (already wrapped with test harness)
 * @param {string} language - "javascript" | "python"
 * @param {string} input - Input to pass (used in the wrapper, already embedded)
 * @returns {Promise<{stdout:string, stderr:string, timedOut:boolean}>}
 */
function runProcess(code, language) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir();
    const ext = language === "python" ? "py" : "js";
    const tmpFile = path.join(tmpDir, `hiresense_${randomUUID()}.${ext}`);

    fs.writeFileSync(tmpFile, code, "utf8");

    const cmd = language === "python" ? (process.platform === "win32" ? "python" : "python3") : "node";
    const child = spawn(cmd, [tmpFile], {
      timeout: TIMEOUT_MS,
      env: {
        ...process.env,
        // Restrict network by unsetting proxy vars — lightweight isolation
        http_proxy: "", https_proxy: "", HTTP_PROXY: "", HTTPS_PROXY: ""
      }
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve({ stdout: "", stderr: "Time Limit Exceeded", timedOut: true });
    }, TIMEOUT_MS);

    child.on("close", () => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), timedOut: false });
    });
  });
}

/**
 * Build a self-contained test harness script that calls the candidate's function.
 *
 * For JavaScript, wraps code + appends test runner.
 * For Python, wraps code + appends test runner.
 */
function buildTestScript(code, language, testCase, functionName = "solution") {
  const input = testCase.input;

  if (language === "javascript") {
    // The candidate's code should define the function named `functionName`
    // We call it with eval'd input and print the result as JSON
    return `
${code}

try {
  const result = ${functionName}(${input});
  console.log(JSON.stringify(result));
} catch(e) {
  process.stderr.write("Runtime Error: " + e.message);
  process.exit(1);
}
`;
  }

  if (language === "python") {
    return `
${code}

import json, sys
try:
    result = ${functionName}(${input})
    print(json.dumps(result))
except Exception as e:
    sys.stderr.write("Runtime Error: " + str(e))
    sys.exit(1)
`;
  }

  throw new Error(`Unsupported language: ${language}`);
}

/**
 * Normalize output for comparison: parse JSON if possible, else trim string.
 */
function normalizeOutput(raw) {
  try {
    return JSON.stringify(JSON.parse(raw.trim()));
  } catch (_) {
    return raw.trim().toLowerCase();
  }
}

/**
 * Run candidate code against all test cases.
 *
 * @param {string} code - Candidate's function code
 * @param {string} language - "javascript" | "python"
 * @param {Array<{input, expectedOutput, description}>} testCases
 * @param {string} functionName - Name of the function to call
 * @returns {Promise<{passed, total, errors, timeTaken}>}
 */
async function runCode(code, language, testCases, functionName = "solution") {
  const results = { passed: 0, total: testCases.length, errors: [], timeTaken: 0 };
  const start = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const script = buildTestScript(code, language, tc, functionName);
      const { stdout, stderr, timedOut } = await runProcess(script, language);

      if (timedOut) {
        results.errors.push(`Test ${i + 1}: Time Limit Exceeded`);
        continue;
      }

      if (stderr && !stdout) {
        results.errors.push(`Test ${i + 1}: ${stderr.substring(0, 120)}`);
        continue;
      }

      const got      = normalizeOutput(stdout);
      const expected = normalizeOutput(tc.expectedOutput);

      if (got === expected) {
        results.passed++;
      } else {
        const desc = tc.description || `Test ${i + 1}`;
        results.errors.push(`${desc}: expected ${tc.expectedOutput}, got ${stdout.trim()}`);
      }

    } catch (e) {
      results.errors.push(`Test ${i + 1}: ${e.message}`);
    }
  }

  results.timeTaken = Date.now() - start;
  return results;
}

module.exports = { runCode };
