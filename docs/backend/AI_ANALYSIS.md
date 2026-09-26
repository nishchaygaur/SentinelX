# SentinelX — OpenRouter AI SOC Copilot

## 1. Overview

SentinelX integrates the **OpenRouter API** to provide an intelligent SOC Copilot that performs automated root cause analysis, threat assessments, risk explanations, and customized containment playbooks.

Supported Models:
- `deepseek/deepseek-chat` (Production default)
- `google/gemini-2.5-flash`
- `openrouter/free`

---

## 2. Analysis Execution Flow

1. **Trigger**: Analyst clicks "Analyze with AI" in the SOC Console or calls `POST /api/ai/alerts/:id/analyze`.
2. **Context Aggregation**: The backend compiles:
   - Alert details (rule, severity, risk score)
   - Normalized log telemetry (source IP, port, host, user, message)
   - Mapped MITRE ATT&CK technique details
   - Threat intelligence reputation indicators
3. **Prompt Delivery**: Dispatches prompt to OpenRouter with strict JSON output constraints.
4. **Structured Parsing**: Validates and extracts JSON fields:
   - `summary`
   - `threat_assessment`
   - `risk_explanation`
   - `investigation_steps` (Array)
   - `recommended_response` (Array)
5. **Persistence**: Saves assessment in `ai_analysis` (aliased via `ai_security_analysis` view) and logs to `incident_timeline`.
