/**
 * SentinelX Risk Scoring Engine
 * Implements a transparent, deterministic, and explainable risk scoring model:
 *
 * Risk = Severity contribution
 *      + Confidence contribution
 *      + Threat Intelligence contribution
 *      + Frequency contribution
 *      + Attack Technique contribution
 *
 * Range: 0 to 100.
 */

function calculateRiskScore({
    severity = "medium",
    confidence = 0.8,
    threatIntelReputation = null,
    occurrenceCount = 1,
    techniqueId = null
}) {
    const reasons = [];
    let score = 0;

    // 1. Severity Contribution (Max 40 points)
    let severityContribution = 20;
    const normalizedSev = String(severity).toLowerCase();
    switch (normalizedSev) {
        case "critical":
            severityContribution = 40;
            reasons.push("Critical severity classification (+40)");
            break;
        case "high":
            severityContribution = 30;
            reasons.push("High severity classification (+30)");
            break;
        case "medium":
            severityContribution = 20;
            reasons.push("Medium severity classification (+20)");
            break;
        case "low":
        default:
            severityContribution = 10;
            reasons.push("Low severity classification (+10)");
            break;
    }
    score += severityContribution;

    // 2. Confidence Contribution (Max 20 points)
    const confVal = typeof confidence === "number" && !isNaN(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.8;
    const confidenceContribution = Math.round(confVal * 20);
    score += confidenceContribution;
    reasons.push(`Detection confidence ${(confVal * 100).toFixed(0)}% (+${confidenceContribution})`);

    // 3. Threat Intelligence Contribution (Max 20 points)
    let threatIntelContribution = 0;
    const rep = String(threatIntelReputation || "").toLowerCase();
    if (rep === "malicious") {
        threatIntelContribution = 20;
        reasons.push("Known malicious threat intelligence indicator matched (+20)");
    } else if (rep === "suspicious") {
        threatIntelContribution = 15;
        reasons.push("Suspicious reputation indicator matched (+15)");
    } else if (rep === "external") {
        threatIntelContribution = 5;
        reasons.push("External unverified indicator observed (+5)");
    }
    score += threatIntelContribution;

    // 4. Frequency / Volume Contribution (Max 10 points)
    let frequencyContribution = 0;
    const count = parseInt(occurrenceCount || "1", 10);
    if (count >= 15) {
        frequencyContribution = 10;
        reasons.push(`High repeated volume (${count} events) (+10)`);
    } else if (count >= 5) {
        frequencyContribution = 7;
        reasons.push(`Threshold pattern exceeded (${count} events) (+7)`);
    } else if (count >= 2) {
        frequencyContribution = 3;
        reasons.push(`Multiple related events (${count} events) (+3)`);
    }
    score += frequencyContribution;

    // 5. Attack Technique Impact Contribution (Max 10 points)
    let techniqueContribution = 0;
    if (techniqueId) {
        const tid = String(techniqueId).toUpperCase();
        if (tid === "T1190" || tid === "T1204") {
            techniqueContribution = 10;
            reasons.push(`High-impact ATT&CK technique ${tid} mapped (+10)`);
        } else if (tid === "T1110" || tid === "T1046" || tid === "T1078" || tid === "T1070") {
            techniqueContribution = 8;
            reasons.push(`ATT&CK technique ${tid} mapped (+8)`);
        } else {
            techniqueContribution = 5;
            reasons.push(`ATT&CK technique ${tid} mapped (+5)`);
        }
    }
    score += techniqueContribution;

    // Clamp score strictly between 1 and 100
    const finalScore = Math.max(1, Math.min(100, Math.round(score)));

    return {
        score: finalScore,
        breakdown: {
            severityContribution,
            confidenceContribution,
            threatIntelContribution,
            frequencyContribution,
            techniqueContribution
        },
        reasons
    };
}

module.exports = {
    calculateRiskScore
};
