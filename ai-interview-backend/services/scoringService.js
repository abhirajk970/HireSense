/**
 * scoringService.js — Hybrid scoring engine
 *
 * Scoring weights (from ai-interviewPlan.txt):
 *   Code Correctness  → 70% (deterministic, from test results)
 *   Intuition         → 15% (LLM-assisted)
 *   Code Quality      → 10% (LLM-assisted)
 *   Communication     → 5%  (LLM-assisted)
 *
 * Hint penalty:
 *   0 hints → 0%
 *   1 hint  → -5%
 *   2 hints → -10%
 *   3+ hints → -20%
 */

const HINT_PENALTIES = [0, 5, 10, 20];

/**
 * Compute the final score from all components.
 *
 * @param {object} params
 * @param {number} params.passed         - test cases passed
 * @param {number} params.total          - total test cases
 * @param {number} params.intuitionScore - LLM score 0–100
 * @param {number} params.codeQuality    - LLM score 0–100
 * @param {number} params.communication  - LLM score 0–100
 * @param {number} params.hintLevel      - 0, 1, 2, 3, or 4
 * @returns {{
 *   codeCorrectness: number,
 *   intuition: number,
 *   codeQuality: number,
 *   communication: number,
 *   hintPenalty: number,
 *   overall: number
 * }}
 */
function computeScore({ passed, total, intuitionScore, codeQuality, communication, hintLevel }) {
  // 1. Deterministic component (70%)
  const correctnessRatio   = total > 0 ? passed / total : 0;
  const codeCorrectnessRaw = correctnessRatio * 70;

  // 2. LLM components (normalized to their weight)
  const intuitionRaw     = (intuitionScore / 100) * 15;
  const codeQualityRaw   = (codeQuality / 100) * 10;
  const communicationRaw = (communication / 100) * 5;

  // 3. Hint penalty
  const penaltyIdx    = Math.min(hintLevel, HINT_PENALTIES.length - 1);
  const hintPenalty   = HINT_PENALTIES[penaltyIdx];

  // 4. Overall (capped 0–100)
  const rawTotal = codeCorrectnessRaw + intuitionRaw + codeQualityRaw + communicationRaw;
  const overall  = Math.max(0, Math.min(100, Math.round(rawTotal - hintPenalty)));

  return {
    codeCorrectness: Math.round(codeCorrectnessRaw),
    intuition:       Math.round(intuitionRaw),
    codeQuality:     Math.round(codeQualityRaw),
    communication:   Math.round(communicationRaw),
    hintPenalty,
    overall
  };
}

/**
 * Convert a verdict string from LLM intuition eval to a 0-100 score.
 */
function verdictToScore(verdict) {
  const map = { correct: 100, partial: 55, incorrect: 0 };
  return map[verdict] ?? 55;
}

/**
 * Build a human-readable feedback summary from scores.
 */
function buildFeedbackSummary(scores, testResults, hintLevel, aiSummary) {
  const lines = [];

  lines.push(`📊 Overall Score: ${scores.overall}/100`);
  lines.push(`✅ Code Correctness: ${testResults.passed}/${testResults.total} test cases passed (${scores.codeCorrectness} pts)`);
  lines.push(`💡 Intuition & Approach: ${scores.intuition} pts`);
  lines.push(`🧹 Code Quality: ${scores.codeQuality} pts`);
  lines.push(`🗣 Communication: ${scores.communication} pts`);

  if (hintLevel > 0) {
    lines.push(`⚠️  Hint Penalty: -${scores.hintPenalty} pts (${hintLevel} hint${hintLevel > 1 ? "s" : ""} used)`);
  }

  if (testResults.errors && testResults.errors.length > 0) {
    lines.push(`\n❌ Failed Cases:\n${testResults.errors.slice(0, 3).map(e => `  • ${e}`).join("\n")}`);
  }

  if (aiSummary) {
    lines.push(`\n📝 AI Evaluation:\n${aiSummary}`);
  }

  return lines.join("\n");
}

module.exports = { computeScore, verdictToScore, buildFeedbackSummary };
