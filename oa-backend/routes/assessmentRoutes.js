const express = require("express");
const axios = require("axios");
const Assessment = require("../models/Assessment");
const Question = require("../models/Question");
const SolvedQuestion = require("../models/SolvedQuestion");

const router = express.Router();

// ─── Shared: Code execution engine ──────────────────────────────────
async function executeCode(finalCode, language, stdin) {
    const langMap = { javascript: "javascript", python: "python", cpp: "c++", c: "c", java: "java" };
    const pistonLang = langMap[language] || "javascript";
    let output = "", errOutput = "";

    try {
        const res = await axios.post("https://piston.sillydev.co.uk/api/v2/execute", {
            language: pistonLang, version: "*",
            files: [{ content: finalCode }],
            stdin
        }, { timeout: 4000 });
        output = res.data.run.stdout ? res.data.run.stdout.trim() : "";
        errOutput = res.data.run.stderr || "";
    } catch (_) {
        if (["javascript", "python", "cpp", "c"].includes(language)) {
            try {
                const { execSync } = require("child_process");
                const fs = require("fs");
                const path = require("path");
                const os = require("os");

                const ext = { python: "py", javascript: "js", cpp: "cpp", c: "c" }[language];
                const tmpFile = path.join(os.tmpdir(), `code_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
                const exeFile = path.join(os.tmpdir(), `prog_${Date.now()}_${Math.random().toString(36).slice(2)}.exe`);
                fs.writeFileSync(tmpFile, finalCode);

                let childOutput = "";
                if (language === "cpp" || language === "c") {
                    const compiler = language === "cpp" ? "g++" : "gcc";
                    execSync(`${compiler} "${tmpFile}" -o "${exeFile}"`, { encoding: "utf-8" });
                    childOutput = execSync(`"${exeFile}"`, { input: stdin, timeout: 5000, encoding: "utf-8" });
                    if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
                } else {
                    const cmd = language === "python" ? `python "${tmpFile}"` : `node "${tmpFile}"`;
                    childOutput = execSync(cmd, { input: stdin, timeout: 5000, encoding: "utf-8" });
                }
                output = childOutput.trim();
                if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            } catch (localErr) {
                errOutput = localErr.stderr ? localErr.stderr.toString() : localErr.message;
            }
        } else {
            errOutput = "Local execution not available for " + language + ". Use JavaScript, Python, C, or C++.";
        }
    }
    return { output, errOutput };
}

function buildFinalCode(question, code, language) {
    let finalCode = question.driverCode[language] || code;
    finalCode = finalCode.replace("// __USER_CODE__", code).replace("# __USER_CODE__", code);
    return finalCode;
}

// ═══════════════════════════════════════════════════════════════════
//  STANDALONE CODE RUNNER (used by Interview IDE)
// ═══════════════════════════════════════════════════════════════════
router.post("/run", async (req, res) => {
    try {
        const { code, language, stdin } = req.body;
        if (!code) return res.status(400).json({ error: "No code provided" });
        const { output, errOutput } = await executeCode(code, language || "javascript", stdin || "");
        res.json({ output, errOutput });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
//  PRACTICE MODE
// ═══════════════════════════════════════════════════════════════════

// Get ALL questions for practice list page
router.get("/questions/all", async (req, res) => {
    try {
        const questions = await Question.find({}).sort({ difficulty: 1 });
        const safeQuestions = questions.map(q => {
            const qObj = q.toObject();
            // Only send visible test cases fully; mark hidden ones
            qObj.testCases = qObj.testCases.map(tc => ({
                input: tc.isHidden ? undefined : tc.input,
                expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
                isHidden: tc.isHidden
            }));
            // Count totals for frontend display
            qObj.visibleCount = q.testCases.filter(t => !t.isHidden).length;
            qObj.hiddenCount = q.testCases.filter(t => t.isHidden).length;
            qObj.totalCount = q.testCases.length;
            return qObj;
        });
        res.json(safeQuestions);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single question by ID
router.get("/questions/:id", async (req, res) => {
    try {
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).json({ error: "Question not found" });
        const qObj = q.toObject();
        qObj.testCases = qObj.testCases.map(tc => ({
            input: tc.isHidden ? undefined : tc.input,
            expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
            isHidden: tc.isHidden
        }));
        qObj.visibleCount = q.testCases.filter(t => !t.isHidden).length;
        qObj.hiddenCount = q.testCases.filter(t => t.isHidden).length;
        qObj.totalCount = q.testCases.length;
        res.json(qObj);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Practice RUN — only visible test cases (quick feedback)
router.post("/practice/run", async (req, res) => {
    try {
        const { questionId, code, language } = req.body;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: "Question not found" });

        const finalCode = buildFinalCode(question, code, language);
        const visibleCases = question.testCases.filter(tc => !tc.isHidden);
        const results = [];
        let passedCount = 0;

        for (const tc of visibleCases) {
            const { output, errOutput } = await executeCode(finalCode, language, tc.input);
            const passed = output === tc.expectedOutput.trim();
            if (passed) passedCount++;
            results.push({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: output,
                error: errOutput,
                passed
            });
        }

        res.json({
            mode: "run",
            allPassed: passedCount === visibleCases.length,
            passed: passedCount,
            total: visibleCases.length,
            results
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Practice SUBMIT — ALL test cases (visible + hidden)
router.post("/practice/submit", async (req, res) => {
    try {
        const { questionId, code, language, candidateId } = req.body;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: "Question not found" });

        const finalCode = buildFinalCode(question, code, language);
        let passedCount = 0;
        const visibleResults = [];
        const hiddenSummary = { passed: 0, total: 0 };

        for (const tc of question.testCases) {
            const { output, errOutput } = await executeCode(finalCode, language, tc.input);
            const passed = output === tc.expectedOutput.trim();
            if (passed) passedCount++;

            if (!tc.isHidden) {
                visibleResults.push({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: output,
                    error: errOutput,
                    passed
                });
            } else {
                hiddenSummary.total++;
                if (passed) hiddenSummary.passed++;
            }
        }

        const allPassed = passedCount === question.testCases.length;
        const score = Math.round((passedCount / question.testCases.length) * 100);

        // If all passed, mark as solved
        if (allPassed && candidateId) {
            try {
                await SolvedQuestion.findOneAndUpdate(
                    { candidateId, questionId },
                    { candidateId, questionId, solvedAt: new Date(), language },
                    { upsert: true }
                );
            } catch (_) { /* duplicate is fine */ }
        }

        res.json({
            mode: "submit",
            allPassed,
            score,
            passed: passedCount,
            total: question.testCases.length,
            visibleResults,
            hiddenSummary
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get solved question IDs for a candidate
router.get("/practice/solved/:candidateId", async (req, res) => {
    try {
        const solved = await SolvedQuestion.find({ candidateId: req.params.candidateId });
        res.json(solved.map(s => s.questionId.toString()));
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
//  ASSESSMENT MODE (OA)
// ═══════════════════════════════════════════════════════════════════

// Get 2 random questions for assessment
router.get("/questions", async (req, res) => {
    try {
        const questions = await Question.aggregate([{ $sample: { size: 2 } }]);
        const safeQuestions = questions.map(q => {
            q.testCases = q.testCases.map(tc => ({
                input: tc.isHidden ? undefined : tc.input,
                expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
                isHidden: tc.isHidden
            }));
            q.visibleCount = q.testCases.filter(t => !t.isHidden).length;
            q.hiddenCount = q.testCases.filter(t => t.isHidden).length;
            q.totalCount = q.testCases.length;
            return q;
        });
        res.json(safeQuestions);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Start an assessment
router.post("/start", async (req, res) => {
    try {
        const { applicationId, candidateId } = req.body;
        const assessment = await Assessment.create({
            applicationId, candidateId, status: "In Progress"
        });
        res.json(assessment);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// OA Run Code — visible test cases only (quick check)
router.post("/run-code", async (req, res) => {
    try {
        const { questionId, code, language } = req.body;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: "Question not found" });

        const finalCode = buildFinalCode(question, code, language);
        const visibleCases = question.testCases.filter(tc => !tc.isHidden);
        const results = [];
        let passedCount = 0;

        for (const tc of visibleCases) {
            const { output, errOutput } = await executeCode(finalCode, language, tc.input);
            const passed = output === tc.expectedOutput.trim();
            if (passed) passedCount++;
            results.push({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: output,
                error: errOutput,
                passed
            });
        }

        res.json({
            mode: "run",
            allPassed: passedCount === visibleCases.length,
            passed: passedCount,
            total: visibleCases.length,
            results
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// OA Submit Code — ALL test cases, save to assessment
router.post("/submit-code", async (req, res) => {
    try {
        const { assessmentId, questionId, code, language } = req.body;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: "Question not found" });

        const finalCode = buildFinalCode(question, code, language);
        let passedCount = 0;
        const visibleResults = [];
        const hiddenSummary = { passed: 0, total: 0 };

        for (const tc of question.testCases) {
            const { output, errOutput } = await executeCode(finalCode, language, tc.input);
            const passed = output === tc.expectedOutput.trim();
            if (passed) passedCount++;

            if (!tc.isHidden) {
                visibleResults.push({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: output,
                    error: errOutput,
                    passed
                });
            } else {
                hiddenSummary.total++;
                if (passed) hiddenSummary.passed++;
            }
        }

        const allPassed = passedCount === question.testCases.length;
        const score = Math.round((passedCount / question.testCases.length) * 100);

        await Assessment.findByIdAndUpdate(assessmentId, {
            $push: { codeSubmissions: { questionId, code, language, passedAll: allPassed, score } }
        });

        res.json({
            mode: "submit",
            allPassed,
            score,
            passed: passedCount,
            total: question.testCases.length,
            visibleResults,
            hiddenSummary
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Log proctoring events
router.post("/log-proctoring", async (req, res) => {
    try {
        const { assessmentId, event } = req.body;
        await Assessment.findByIdAndUpdate(assessmentId, {
            $push: { proctoringLogs: { event } }
        });
        res.json({ msg: "Logged" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Finish assessment
router.post("/finish", async (req, res) => {
    try {
        const { assessmentId } = req.body;
        const assessment = await Assessment.findById(assessmentId);
        let finalScore = 0;
        
        if (assessment.codeSubmissions.length > 0) {
            const bestScores = {};
            assessment.codeSubmissions.forEach(sub => {
                if (!bestScores[sub.questionId] || sub.score > bestScores[sub.questionId]) {
                    bestScores[sub.questionId] = sub.score;
                }
            });
            const total = Object.values(bestScores).reduce((a, b) => a + b, 0);
            finalScore = Math.round(total / Object.keys(bestScores).length);
        }

        assessment.status = "Submitted";
        assessment.endTime = new Date();
        assessment.score = finalScore;

        let pScore = 100;
        for (let log of assessment.proctoringLogs) {
            if (log.event.includes("Phone")) pScore -= 50;
            else if (log.event.includes("Multiple Faces")) pScore -= 25;
            else if (log.event.includes("Fullscreen")) pScore -= 15;
            else if (log.event.includes("Tab Switch")) pScore -= 10;
            else if (log.event.includes("No Face") || log.event.includes("Away")) pScore -= 5;
        }

        if (pScore < 0) pScore = 0;
        assessment.proctorScore = pScore;
        assessment.finalWeightedScore = Math.round((finalScore * 0.70) + (pScore * 0.30));

        await assessment.save();

        try {
            await axios.put(`http://localhost:5000/api/applications/${assessment.applicationId}/oa-score`, {
                oaScore: assessment.finalWeightedScore
            });
        } catch (syncErr) {
            console.error("Failed to sync score:", syncErr.message);
        }

        res.json(assessment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
