// Simple proctoring service — processes violation reports from frontend
// In a production system, you'd use a face-detection model here

const violationLogs = new Map(); // roomId -> violations[]

function initProctoring(roomId) {
    violationLogs.set(roomId, []);
}

function addViolation(roomId, type, details) {
    if (!violationLogs.has(roomId)) violationLogs.set(roomId, []);
    violationLogs.get(roomId).push({
        type,
        timestamp: new Date(),
        details: details || ""
    });
}

function getViolations(roomId) {
    return violationLogs.get(roomId) || [];
}

function destroyProctoring(roomId) {
    violationLogs.delete(roomId);
}

module.exports = { initProctoring, addViolation, getViolations, destroyProctoring };
