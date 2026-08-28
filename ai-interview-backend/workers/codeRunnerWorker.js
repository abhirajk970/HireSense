const { startConsumer, publishMessage } = require("../services/kafkaClient");
const { runCode } = require("../services/codeRunner");
const AIInterview = require("../models/AIInterview");
const DSAQuestion = require("../models/DSAQuestion");

async function startCodeRunnerWorker(io) {
  console.log("🚀 Initializing Kafka Code Runner Worker...");
  
  await startConsumer("code-execution-requests", "code-runner-group", async (data) => {
    const { executionId, roomId, code, language } = data;
    console.log(`📥 [Kafka Worker] Received code execution request for room: ${roomId} (Execution: ${executionId || "N/A"})`);
    
    try {
      const interview = await AIInterview.findOne({ roomId });
      if (!interview) {
        console.error(`[Kafka Worker] Interview not found for room ${roomId}`);
        return;
      }
      
      const question = await DSAQuestion.findById(interview.questionId);
      if (!question) {
        console.error(`[Kafka Worker] Question not found for ID ${interview.questionId}`);
        return;
      }

      // Execute code against test cases
      const testResults = await runCode(code, language, question.testCases, question.functionName || "solution");

      // Update DB
      interview.submittedCode = code;
      interview.codeLanguage = language;
      interview.codeSnapshots.push({ code, language });
      interview.testResults = testResults;
      interview.interviewState = "CODE_EVALUATED";
      
      const ratio = testResults.total > 0 ? testResults.passed / testResults.total : 0;
      interview.scores.codeCorrectness = Math.round(ratio * 100);
      await interview.save();

      const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
      let feedbackMsg;
      if (testResults.passed === testResults.total) {
        feedbackMsg = `🎉 All ${testResults.total} test cases passed! Excellent work. Now, can you walk me through your solution? What's the time and space complexity?`;
      } else if (testResults.passed > 0) {
        feedbackMsg = `Your solution passed ${testResults.passed} out of ${testResults.total} test cases (${successRate}%). There are a few edge cases to fix. Can you explain your approach first — what's the time complexity?`;
      } else {
        feedbackMsg = `Your solution didn't pass any test cases yet. No worries — can you walk me through your logic? Sometimes explaining it out loud reveals the bug.`;
      }

      // Emit to Socket.io client if socket server reference is provided
      if (io) {
        io.to(roomId).emit("code-evaluation-result", {
          message: feedbackMsg,
          state: "CODE_EVALUATED",
          testResults
        });
        console.log(`📤 [Kafka Worker] Broadcasted evaluation results to room ${roomId}`);
      }

      // Publish execution results to Kafka topic
      await publishMessage("code-execution-results", { 
        executionId,
        roomId, 
        testResults, 
        success: true, 
        feedbackMsg 
      });

    } catch (err) {
      console.error(`❌ [Kafka Worker] Error executing code for room ${roomId}:`, err.message);
      await publishMessage("code-execution-results", { 
        executionId,
        roomId, 
        error: err.message, 
        success: false 
      });
      if (io) {
        io.to(roomId).emit("ai-error", `Code compilation/execution crashed: ${err.message}`);
      }
    }
  });
}

module.exports = { startCodeRunnerWorker };
