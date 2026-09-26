const PDFDocument = require("pdfkit");

/**
 * Formats a date value safely for display in the PDF report.
 */
function formatDate(val) {
    if (!val) return "N/A";
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
    } catch {
        return String(val);
    }
}

/**
 * Returns RGB hex color for severity.
 */
function getSeverityColor(severity) {
    switch (String(severity || "").toLowerCase()) {
        case "critical":
            return "#DC2626"; // red
        case "high":
            return "#EA580C"; // orange
        case "medium":
            return "#D97706"; // amber
        case "low":
            return "#2563EB"; // blue
        default:
            return "#64748B"; // slate
    }
}

/**
 * Generates a comprehensive, styled multi-page PDF incident report.
 * Streams the PDF directly into `res`.
 */
function generateIncidentReportPdf(reportData, res) {
    const {
        incident = {},
        alerts = [],
        mitre_attack = [],
        threat_intelligence = [],
        response_actions = [],
        ai_analysis = [],
        timeline = []
    } = reportData;

    const doc = new PDFDocument({
        margin: 36,
        size: "A4",
        bufferedPages: true,
        info: {
            Title: `SentinelX Incident Report - INC-${incident.id || "N/A"}`,
            Author: "SentinelX SOC Platform",
            Subject: `Incident Investigation Report for INC-${incident.id}: ${incident.title || ""}`,
            Keywords: "Cybersecurity, SOC, Incident Report, SentinelX, MITRE ATT&CK",
            CreationDate: new Date()
        }
    });

    // Stream to response
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 72; // 36 margin on each side

    function checkPageBreak(requiredSpace = 60) {
        if (doc.y + requiredSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 40;
        }
    }

    // =========================================================================
    // 1. TOP HEADER BANNER
    // =========================================================================
    const bannerHeight = 85;
    doc.rect(36, 36, contentWidth, bannerHeight).fill("#0F172A");

    // SentinelX Brand Pill
    doc.fillColor("#6366F1")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("SENTINELX · CYBERSECURITY OPERATIONS CENTER", 50, 48);

    // Title
    doc.fillColor("#FFFFFF")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("SECURITY INCIDENT REPORT", 50, 62);

    // Subtitle / Reference info
    doc.fillColor("#94A3B8")
        .fontSize(8.5)
        .font("Helvetica")
        .text(`INCIDENT ID: INC-${incident.id || "N/A"}   |   TLP:AMBER (CONFIDENTIAL)   |   STATUS: ${String(incident.status || "OPEN").toUpperCase()}`, 50, 84);

    // Right-side badge
    const sevColor = getSeverityColor(incident.severity);
    const sevText = String(incident.severity || "UNKNOWN").toUpperCase();
    doc.roundedRect(pageWidth - 140, 52, 90, 24, 4).fill(sevColor);
    doc.fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(sevText, pageWidth - 140, 59, { width: 90, align: "center" });

    doc.fillColor("#94A3B8")
        .fontSize(7.5)
        .font("Helvetica")
        .text(`Priority: ${incident.priority ?? "N/A"}/100`, pageWidth - 140, 84, { width: 90, align: "center" });

    doc.y = 135;

    // =========================================================================
    // 2. INCIDENT OVERVIEW & METADATA GRID
    // =========================================================================
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("1. Incident Overview", 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    // Metadata Card
    const metaCardY = doc.y;
    doc.roundedRect(36, metaCardY, contentWidth, 76, 4).fillAndStroke("#F8FAFC", "#E2E8F0");

    const colW = contentWidth / 3;

    // Col 1
    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("INCIDENT TITLE", 48, metaCardY + 10);
    doc.fillColor("#0F172A").fontSize(8.5).font("Helvetica").text(incident.title || "Untitled Incident", 48, metaCardY + 22, { width: colW - 20, lineBreak: true });

    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("ASSIGNED ANALYST", 48, metaCardY + 46);
    doc.fillColor("#0F172A").fontSize(8.5).font("Helvetica").text(incident.assigned_to || "Unassigned (Queue)", 48, metaCardY + 58);

    // Col 2
    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("CURRENT STATUS", 48 + colW, metaCardY + 10);
    doc.fillColor("#0F172A").fontSize(8.5).font("Helvetica-Bold").text(String(incident.status || "open").toUpperCase(), 48 + colW, metaCardY + 22);

    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("SEVERITY / PRIORITY", 48 + colW, metaCardY + 46);
    doc.fillColor(sevColor).fontSize(8.5).font("Helvetica-Bold").text(`${sevText} (Score: ${incident.priority ?? "N/A"})`, 48 + colW, metaCardY + 58);

    // Col 3
    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("OPENED AT", 48 + colW * 2, metaCardY + 10);
    doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(formatDate(incident.opened_at), 48 + colW * 2, metaCardY + 22);

    doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text("LAST UPDATED", 48 + colW * 2, metaCardY + 46);
    doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(formatDate(incident.updated_at), 48 + colW * 2, metaCardY + 58);

    doc.y = metaCardY + 88;

    // Description
    doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text("DESCRIPTION & INITIAL FINDINGS", 36, doc.y);
    doc.y += 4;
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(incident.description || "No description provided.", 36, doc.y, { width: contentWidth, lineGap: 2 });
    doc.y += 10;

    // Investigation Notes if any
    if (incident.investigation_notes) {
        checkPageBreak(50);
        doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text("ANALYST INVESTIGATION NOTES", 36, doc.y);
        doc.y += 4;
        const notesY = doc.y;
        doc.roundedRect(36, notesY, contentWidth, 36, 4).fillAndStroke("#EFF6FF", "#BFDBFE");
        doc.fillColor("#1E3A8A").fontSize(8.5).font("Helvetica").text(incident.investigation_notes, 44, notesY + 8, { width: contentWidth - 16, lineGap: 2 });
        doc.y = notesY + 46;
    }

    // =========================================================================
    // 3. LINKED SECURITY ALERTS
    // =========================================================================
    checkPageBreak(80);
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`2. Correlated Security Alerts (${alerts.length})`, 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    if (alerts.length === 0) {
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Oblique").text("No linked alerts recorded for this incident.", 36, doc.y);
        doc.y += 15;
    } else {
        // Table Header
        const tableY = doc.y;
        doc.rect(36, tableY, contentWidth, 20).fill("#F1F5F9");
        doc.fillColor("#475569").fontSize(7.5).font("Helvetica-Bold");
        doc.text("ALERT ID", 44, tableY + 6);
        doc.text("TITLE & DETECTION RULE", 100, tableY + 6);
        doc.text("SEVERITY", 320, tableY + 6);
        doc.text("RISK", 380, tableY + 6);
        doc.text("DETECTED AT", 430, tableY + 6);

        doc.y = tableY + 22;

        for (let i = 0; i < alerts.length; i++) {
            const a = alerts[i];
            checkPageBreak(30);
            const rowY = doc.y;
            const bg = i % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
            doc.rect(36, rowY, contentWidth, 24).fillAndStroke(bg, "#F1F5F9");

            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text(`ALT-${a.id}`, 44, rowY + 7);

            doc.fillColor("#1E293B").fontSize(8).font("Helvetica").text(a.title || "Security Detection", 100, rowY + 4, { width: 210, ellipsis: true });
            doc.fillColor("#64748B").fontSize(7).font("Helvetica-Oblique").text(a.detection_rule || a.alert_type || "", 100, rowY + 14, { width: 210, ellipsis: true });

            const aSevColor = getSeverityColor(a.severity);
            doc.fillColor(aSevColor).fontSize(7.5).font("Helvetica-Bold").text(String(a.severity || "medium").toUpperCase(), 320, rowY + 7);

            doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(String(a.risk_score ?? "N/A"), 380, rowY + 7);

            doc.fillColor("#64748B").fontSize(7.5).font("Helvetica").text(formatDate(a.detected_at), 430, rowY + 7);

            doc.y = rowY + 26;
        }
        doc.y += 8;
    }

    // =========================================================================
    // 4. NETWORK & HOST EVIDENCE (NORMALIZED LOGS)
    // =========================================================================
    checkPageBreak(80);
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("3. Forensic Log Evidence", 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    const evidenceLogs = alerts.filter(a => a.source_ip || a.message || a.hostname);

    if (evidenceLogs.length === 0) {
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Oblique").text("No raw network/host logs linked directly to these alerts.", 36, doc.y);
        doc.y += 15;
    } else {
        for (const log of evidenceLogs) {
            checkPageBreak(50);
            const boxY = doc.y;
            doc.roundedRect(36, boxY, contentWidth, 46, 4).fillAndStroke("#F8FAFC", "#E2E8F0");

            doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("SOURCE IP / PORT", 46, boxY + 6);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(`${log.source_ip || "N/A"} : ${log.source_port || "N/A"}`, 46, boxY + 16);

            doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("DESTINATION IP / PORT", 170, boxY + 6);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(`${log.destination_ip || "N/A"} : ${log.destination_port || "N/A"}`, 170, boxY + 16);

            doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("TARGET HOST & USER", 310, boxY + 6);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica").text(`${log.hostname || "unknown"} (${log.username || "system"})`, 310, boxY + 16);

            doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("RAW / NORMALIZED MESSAGE", 46, boxY + 28);
            doc.fillColor("#334155").fontSize(7.5).font("Courier").text(log.message || log.raw_log || "No raw message", 46, boxY + 36, { width: contentWidth - 20, ellipsis: true });

            doc.y = boxY + 52;
        }
        doc.y += 6;
    }

    // =========================================================================
    // 5. MITRE ATT&CK MAPPING
    // =========================================================================
    checkPageBreak(80);
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`4. MITRE ATT&CK® Framework Mapping (${mitre_attack.length})`, 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    if (mitre_attack.length === 0) {
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Oblique").text("No MITRE ATT&CK techniques mapped to this incident.", 36, doc.y);
        doc.y += 15;
    } else {
        for (const m of mitre_attack) {
            checkPageBreak(40);
            const mY = doc.y;
            doc.roundedRect(36, mY, contentWidth, 34, 4).fillAndStroke("#FDF2F8", "#FCE7F3");

            doc.fillColor("#BE185D").fontSize(8).font("Helvetica-Bold")
                .text(`${m.tactic_id || "TA"}: ${m.tactic_name || "Unknown Tactic"}   >   ${m.technique_id || "T"}: ${m.technique_name || "Unknown Technique"}${m.subtechnique_id ? ` (.${m.subtechnique_id})` : ""}`, 46, mY + 6);

            doc.fillColor("#475569").fontSize(7.5).font("Helvetica")
                .text(m.description || "Adversary observed executing tactics and techniques mapped against standard MITRE ATT&CK matrices.", 46, mY + 18, { width: contentWidth - 20, ellipsis: true });

            doc.y = mY + 40;
        }
        doc.y += 6;
    }

    // =========================================================================
    // 6. THREAT INTELLIGENCE CORRELATION
    // =========================================================================
    checkPageBreak(80);
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`5. Threat Intelligence Indicators (${threat_intelligence.length})`, 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    if (threat_intelligence.length === 0) {
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Oblique").text("No external threat intelligence indicators associated.", 36, doc.y);
        doc.y += 15;
    } else {
        for (const ti of threat_intelligence) {
            checkPageBreak(45);
            const tiY = doc.y;
            doc.roundedRect(36, tiY, contentWidth, 40, 4).fillAndStroke("#F0FDF4", "#DCFCE7");

            doc.fillColor("#15803D").fontSize(8).font("Helvetica-Bold")
                .text(`[${String(ti.indicator_type || "INDICATOR").toUpperCase()}] ${ti.indicator_value}   -   ${ti.threat_name || ti.threat_type || "Known Threat"}`, 46, tiY + 6);

            doc.fillColor("#334155").fontSize(7.5).font("Helvetica")
                .text(`Reputation: ${ti.reputation || "Malicious"}  |  Confidence: ${ti.confidence ?? "90"}%  |  Source: ${ti.source || "Threat Intel Feed"}`, 46, tiY + 17);

            doc.fillColor("#64748B").fontSize(7).font("Helvetica")
                .text(ti.description || "Threat intelligence correlation confirm anomalous activity.", 46, tiY + 27, { width: contentWidth - 20, ellipsis: true });

            doc.y = tiY + 46;
        }
        doc.y += 6;
    }

    // =========================================================================
    // 7. INCIDENT TIMELINE
    // =========================================================================
    checkPageBreak(80);
    doc.fillColor("#0F172A")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`6. Chronological Incident Timeline (${timeline.length})`, 36, doc.y);

    doc.strokeColor("#E2E8F0").lineWidth(1)
        .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

    doc.y += 12;

    if (timeline.length === 0) {
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Oblique").text("No timeline events recorded.", 36, doc.y);
        doc.y += 15;
    } else {
        for (const item of timeline) {
            checkPageBreak(30);
            const itemY = doc.y;

            // Small timeline bullet
            doc.circle(44, itemY + 6, 3).fill("#6366F1");

            // Event timestamp
            doc.fillColor("#64748B").fontSize(7.5).font("Courier").text(formatDate(item.event_time), 54, itemY + 2, { width: 115 });

            // Title & Description
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text(`[${String(item.event_type || "EVENT").toUpperCase()}] ${item.event_title || ""}`, 175, itemY + 2);
            doc.fillColor("#475569").fontSize(7.5).font("Helvetica").text(item.event_description || "", 175, itemY + 12, { width: contentWidth - 145, ellipsis: true });

            doc.y = itemY + 24;
        }
        doc.y += 8;
    }

    // =========================================================================
    // 8. AI SOC ANALYST ASSESSMENT
    // =========================================================================
    if (ai_analysis.length > 0) {
        const ai = ai_analysis[0];
        checkPageBreak(120);

        doc.fillColor("#0F172A")
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("7. AI SOC Analyst Assessment", 36, doc.y);

        doc.strokeColor("#E2E8F0").lineWidth(1)
            .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

        doc.y += 12;

        const aiBoxY = doc.y;
        doc.fillColor("#4F46E5").fontSize(8).font("Helvetica-Bold")
            .text(`Generated by: ${ai.model_name || "SentinelX AI Assistant"} (${ai.provider || "OpenRouter"})`, 36, aiBoxY);
        doc.y += 10;

        if (ai.summary) {
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text("Executive Summary:", 36, doc.y);
            doc.fillColor("#334155").fontSize(8).font("Helvetica").text(ai.summary, 36, doc.y + 2, { width: contentWidth });
            doc.y += 8;
        }

        if (ai.threat_assessment) {
            checkPageBreak(40);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text("Threat Assessment:", 36, doc.y);
            doc.fillColor("#334155").fontSize(8).font("Helvetica").text(ai.threat_assessment, 36, doc.y + 2, { width: contentWidth });
            doc.y += 8;
        }

        if (Array.isArray(ai.investigation_steps) && ai.investigation_steps.length > 0) {
            checkPageBreak(50);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text("Recommended Investigation Steps:", 36, doc.y);
            doc.y += 3;
            for (const step of ai.investigation_steps) {
                doc.fillColor("#334155").fontSize(7.5).font("Helvetica").text(`•  ${step}`, 46, doc.y, { width: contentWidth - 10 });
                doc.y += 3;
            }
            doc.y += 4;
        }

        if (Array.isArray(ai.recommended_response) && ai.recommended_response.length > 0) {
            checkPageBreak(50);
            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text("Recommended Containment & Response Actions:", 36, doc.y);
            doc.y += 3;
            for (const resp of ai.recommended_response) {
                doc.fillColor("#334155").fontSize(7.5).font("Helvetica").text(`•  ${resp}`, 46, doc.y, { width: contentWidth - 10 });
                doc.y += 3;
            }
            doc.y += 6;
        }
    }

    // =========================================================================
    // 9. AUTOMATED & MANUAL RESPONSE ACTIONS
    // =========================================================================
    if (response_actions.length > 0) {
        checkPageBreak(80);
        doc.fillColor("#0F172A")
            .fontSize(13)
            .font("Helvetica-Bold")
            .text(`8. Response & Containment Actions (${response_actions.length})`, 36, doc.y);

        doc.strokeColor("#E2E8F0").lineWidth(1)
            .moveTo(36, doc.y + 4).lineTo(36 + contentWidth, doc.y + 4).stroke();

        doc.y += 12;

        for (const action of response_actions) {
            checkPageBreak(35);
            const actY = doc.y;
            doc.roundedRect(36, actY, contentWidth, 30, 4).fillAndStroke("#F8FAFC", "#E2E8F0");

            doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold")
                .text(action.action_type || "Response Action", 46, actY + 6);

            doc.fillColor("#64748B").fontSize(7.5).font("Helvetica")
                .text(`Status: ${String(action.status || "completed").toUpperCase()}  |  Executed by: ${action.executed_by || "SOC Orchestrator"}  |  ${formatDate(action.executed_at || action.created_at)}`, 46, actY + 16);

            doc.y = actY + 36;
        }
        doc.y += 6;
    }

    // =========================================================================
    // 10. FOOTER ON EVERY BUFFERED PAGE
    // =========================================================================
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);

        // Footer dividing line
        doc.strokeColor("#E2E8F0").lineWidth(0.5)
            .moveTo(36, doc.page.height - 35)
            .lineTo(pageWidth - 36, doc.page.height - 35)
            .stroke();

        // Footer left: Platform branding
        doc.fillColor("#94A3B8")
            .fontSize(7)
            .font("Helvetica")
            .text("SentinelX Security Operations Center · Autonomous Threat Intelligence & Incident Response", 36, doc.page.height - 28);

        // Footer right: Page number
        doc.fillColor("#94A3B8")
            .fontSize(7)
            .font("Helvetica-Bold")
            .text(`Page ${i + 1} of ${totalPages}`, pageWidth - 100, doc.page.height - 28, { width: 64, align: "right" });
    }

    // Finalize PDF
    doc.end();
}

module.exports = {
    generateIncidentReportPdf
};
