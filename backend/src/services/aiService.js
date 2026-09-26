const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const analyzeAlertWithAI = async (alertData) => {
    try {
        const {
            alert,
            log,
            mitre_attack,
            threat_intelligence
        } = alertData;

        const prompt = `
You are the AI analysis engine of SentinelX, an AI-powered SOC and Threat Intelligence Platform.

Analyze the following security alert.

ALERT:
${JSON.stringify(alert, null, 2)}

NORMALIZED LOG:
${JSON.stringify(log, null, 2)}

MITRE ATT&CK:
${JSON.stringify(mitre_attack, null, 2)}

THREAT INTELLIGENCE:
${JSON.stringify(threat_intelligence, null, 2)}

Provide a concise SOC analyst assessment.

Return ONLY valid JSON with this exact structure:

{
  "summary": "Short summary of what happened",
  "threat_assessment": "Assessment of the threat and attacker behavior",
  "risk_explanation": "Explain why the alert has this risk level",
  "investigation_steps": [
    "Investigation step 1",
    "Investigation step 2",
    "Investigation step 3"
  ],
  "recommended_response": [
    "Recommended response 1",
    "Recommended response 2"
  ]
}

Do not include markdown.
Do not include code fences.
`;

        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: process.env.OPENROUTER_MODEL,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a cybersecurity SOC analyst assisting SentinelX."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "SentinelX"
                }
            }
        );

        const content =
            response.data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Empty response received from OpenRouter");
        }

        let parsed;

        try {
            let sanitized = content.trim();
            if (sanitized.startsWith("```")) {
                sanitized = sanitized.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
            }
            parsed = JSON.parse(sanitized);
        } catch {
            const firstBrace = content.indexOf("{");
            const lastBrace = content.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                    parsed = JSON.parse(content.slice(firstBrace, lastBrace + 1));
                } catch {
                    console.error("AI returned non-JSON response:", content);
                    throw new Error("AI response could not be parsed as JSON");
                }
            } else {
                console.error("AI returned non-JSON response:", content);
                throw new Error("AI response could not be parsed as JSON");
            }
        }

        return {
            ...parsed,
            model_name: process.env.OPENROUTER_MODEL,
            provider: "OpenRouter",
            raw_response: response.data
        };

    } catch (error) {
        console.error(
            "OpenRouter AI analysis error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

module.exports = {
    analyzeAlertWithAI
};