import { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  User,
  Trash2,
  Info,
} from "lucide-react";
import "./AICopilot.css";
import Select from "./Select.jsx";

const SWARM_AGENTS_METADATA = [
  {
    id: "swarm",
    name: "Sentinel-Swarm Lead",
    role: "Autonomous Swarm Consensus",
    avatar: "🤖",
    badge: "SWARM CONSENSUS",
    color: "#ec4899",
    description: "Orchestrates collaborative consensus across all 4 SOC specialist agents.",
  },
  {
    id: "triage",
    name: "Sentinel-Triage",
    role: "Tier-1 Alert Triage & Risk Evaluator",
    avatar: "🛡️",
    badge: "TRIAGE SPECIALIST",
    color: "#38bdf8",
    description: "Rapid alert validation, severity scoring, filtering false positives, anomaly evaluation.",
  },
  {
    id: "hunter",
    name: "Sentinel-Hunter",
    role: "Blast Radius & Threat Hunter",
    avatar: "🔍",
    badge: "THREAT HUNTER",
    color: "#a855f7",
    description: "Patient zero tracing, lateral movement tracking, timeline reconstruction, blast radius.",
  },
  {
    id: "intel",
    name: "Sentinel-Intel",
    role: "Threat Intelligence & Attribution",
    avatar: "🌐",
    badge: "THREAT INTEL",
    color: "#10b981",
    description: "IoC reputation analysis, adversary TTPs, MITRE mapping, malware & campaign tracking.",
  },
  {
    id: "responder",
    name: "Sentinel-Responder",
    role: "SOAR & Incident Containment Commander",
    avatar: "⚡",
    badge: "INCIDENT COMMANDER",
    color: "#f59e0b",
    description: "Tactical containment commands (iptables, UFW, PowerShell), account locking, recovery playbooks.",
  },
];

export default function AICopilot({
  report,
  incidents = [],
  selectedIncident,
  onIncidentSelect,
  analyses = [],
  loading = false,
  generating = false,
  onGenerate,
  onGenerateAll,
  onRefresh,
  apiBase = "/api",
  initialPrompt = "",
}) {
  const [activeTab, setActiveTab] = useState("swarm"); // 'swarm' | 'chat' | 'alerts'
  const [selectedAgent, setSelectedAgent] = useState("swarm");

  // Swarm Investigation State
  const [swarmResult, setSwarmResult] = useState(null);
  const [swarmInvestigating, setSwarmInvestigating] = useState(false);
  const [swarmError, setSwarmError] = useState("");
  const [activeDossierTab, setActiveDossierTab] = useState("triage");

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome-1",
      sender: "agent",
      agentId: "swarm",
      agentName: "Sentinel-Swarm Lead",
      badge: "SWARM CONSENSUS",
      avatar: "🤖",
      text: "👋 Welcome to the **SentinelX Autonomous AI SOC Copilot**. I am coordinating our 4 specialized agents: **Triage**, **Threat Hunter**, **Threat Intel**, and **Incident Commander**.\n\nSelect an incident above or ask any question to begin rapid investigation or active containment.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState(initialPrompt || "");
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState({});

  const chatEndRef = useRef(null);

  // Auto scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Load initial prompt if passed
  useEffect(() => {
    if (initialPrompt) {
      setInputMessage(initialPrompt);
      setActiveTab("chat");
    }
  }, [initialPrompt]);

  // Run Autonomous Swarm Investigation
  const handleRunSwarmInvestigation = async () => {
    if (!selectedIncident) return;
    setSwarmInvestigating(true);
    setSwarmError("");

    try {
      const res = await fetch(`${apiBase}/ai/swarm-investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: selectedIncident }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to execute swarm investigation");
      }

      setSwarmResult(json.data);
      setActiveDossierTab("triage");
    } catch (err) {
      console.error("Swarm investigation error:", err);
      setSwarmError(err.message);
    } finally {
      setSwarmInvestigating(false);
    }
  };

  // Send Chat Message to Copilot
  const handleSendMessage = async (textToSend) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || chatLoading) return;

    const currentAgentMeta = SWARM_AGENTS_METADATA.find((a) => a.id === selectedAgent) || SWARM_AGENTS_METADATA[0];

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setChatLoading(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          incidentId: selectedIncident || null,
          agentRole: selectedAgent,
          history,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Copilot response failed");
      }

      const agentData = json.data?.agent || currentAgentMeta;
      const aiResponse = json.data?.response || "Analysis completed.";

      const agentMsg = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        agentId: agentData.id || selectedAgent,
        agentName: agentData.name || currentAgentMeta.name,
        badge: agentData.badge || currentAgentMeta.badge,
        avatar: agentData.avatar || currentAgentMeta.avatar,
        text: aiResponse,
        provider: json.data?.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: `error-${Date.now()}`,
        sender: "agent",
        agentId: "triage",
        agentName: "Sentinel-Triage",
        badge: "TRIAGE NOTICE",
        avatar: "🛡️",
        text: `⚠️ **Advisory Notice**: ${err.message}\n\nPlease check network connectivity or choose another incident to investigate.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyText = (codeId, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode((prev) => ({ ...prev, [codeId]: true }));
    setTimeout(() => {
      setCopiedCode((prev) => ({ ...prev, [codeId]: false }));
    }, 2000);
  };

  const clearChatHistory = () => {
    setChatMessages([
      {
        id: "welcome-reset",
        sender: "agent",
        agentId: "swarm",
        agentName: "Sentinel-Swarm Lead",
        badge: "SWARM CONSENSUS",
        avatar: "🤖",
        text: "🧹 Chat console cleared. Ready for new security queries or incident investigations.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const incidentAlerts = report?.alerts || [];

  return (
    <div className="ai-copilot-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <span className="eyebrow">INTELLIGENCE / AUTONOMOUS SOC</span>
          <h2>AI Security Copilot & Autonomous Swarm</h2>
          <p>
            Coordinated multi-agent SOC investigation team with real-time conversational assistance, patient-zero hunting, and active containment playbooks.
          </p>
        </div>
      </div>

      {/* Incident Context Selector Bar */}
      <section className="panel ai-top-control-panel">
        <div className="ai-top-control-content">
          <div className="incident-context-box">
            <span className="eyebrow">TARGET INCIDENT FOR AI INVESTIGATION</span>
            <div className="incident-picker-row">
              <Select
                className="ai-incident-select"
                value={selectedIncident || ""}
                placeholder="Choose incident to investigate..."
                onChange={(id) => {
                  if (onIncidentSelect && id) onIncidentSelect(id);
                }}
                options={[
                  { value: "", label: "Select an incident for AI context..." },
                  ...incidents.map((incident) => ({
                    value: incident.id,
                    label: `INC-${incident.id} · ${incident.title}`,
                    title: `INC-${incident.id} · ${incident.title}`,
                  })),
                ]}
              />

              {report?.incident && (
                <div className={`incident-severity-pill ${report.incident.severity}`}>
                  {report.incident.severity.toUpperCase()} SEVERITY
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs for Swarm, Chat, and Per-Alert deep dives */}
          <div className="ai-tab-switcher">
            <button
              type="button"
              className={`ai-tab-btn ${activeTab === "swarm" ? "active" : ""}`}
              onClick={() => setActiveTab("swarm")}
            >
              <BrainCircuit size={15} />
              <span>Multi-Agent Swarm</span>
              <span className="agent-count-pill">4 Agents</span>
            </button>

            <button
              type="button"
              className={`ai-tab-btn ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <Bot size={15} />
              <span>Interactive Copilot</span>
              {chatMessages.length > 1 && <span className="chat-badge">{chatMessages.length}</span>}
            </button>

            <button
              type="button"
              className={`ai-tab-btn ${activeTab === "alerts" ? "active" : ""}`}
              onClick={() => setActiveTab("alerts")}
            >
              <Layers size={15} />
              <span>Alert Analyses {analyses.length ? `(${analyses.length})` : ""}</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TAB 1: MULTI-AGENT SWARM COMMAND CENTER
          ========================================================================= */}
      {activeTab === "swarm" && (
        <div className="swarm-command-center">
          {/* 4 Agent Status Cards */}
          <div className="swarm-agents-grid">
            {SWARM_AGENTS_METADATA.filter((a) => a.id !== "swarm").map((agent) => (
              <div className="agent-card" key={agent.id}>
                <div className="agent-card-header">
                  <div className="agent-avatar" style={{ borderColor: agent.color }}>
                    <span>{agent.avatar}</span>
                  </div>
                  <div>
                    <span className="agent-badge" style={{ color: agent.color }}>
                      {agent.badge}
                    </span>
                    <h4>{agent.name}</h4>
                  </div>
                  <span className="agent-live-dot" title="Agent online and synchronized" />
                </div>
                <div className="agent-role">{agent.role}</div>
                <p className="agent-desc">{agent.description}</p>
                <div className="agent-card-footer">
                  <button
                    type="button"
                    className="agent-chat-shortcut"
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setActiveTab("chat");
                    }}
                  >
                    Direct Chat →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Swarm Investigation Execution Panel */}
          <section className="panel swarm-execution-panel">
            <div className="swarm-execution-header">
              <div>
                <span className="eyebrow">COORDINATED THREAT INVESTIGATION</span>
                <h3>Autonomous Swarm Investigation</h3>
                <p>
                  Deploy all 4 agents in parallel to perform comprehensive triage, blast radius analysis, threat intelligence correlation, and containment formulation.
                </p>
              </div>

              <button
                type="button"
                className="run-swarm-btn"
                onClick={handleRunSwarmInvestigation}
                disabled={swarmInvestigating || !selectedIncident}
              >
                {swarmInvestigating ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Swarm Analyzing Incident...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Run Multi-Agent Swarm</span>
                  </>
                )}
              </button>
            </div>

            {!selectedIncident && (
              <div className="swarm-no-incident">
                <AlertTriangle size={20} />
                <span>Please select an active incident from the dropdown above to run the swarm investigation.</span>
              </div>
            )}

            {swarmError && (
              <div className="swarm-error-box">
                <AlertTriangle size={18} />
                <span>{swarmError}</span>
              </div>
            )}

            {/* Swarm Investigation Results Dossier */}
            {swarmResult && (
              <div className="swarm-dossier-wrapper">
                <div className="swarm-consensus-banner">
                  <div className="consensus-icon">🤖</div>
                  <div className="consensus-text">
                    <span className="eyebrow">SWARM CONSENSUS DOSSIER</span>
                    <h4>{swarmResult.swarm_summary}</h4>
                    <span className="dossier-timestamp">
                      Investigated on {new Date(swarmResult.timestamp).toLocaleString()} · Incident INC-{swarmResult.incident_id}
                    </span>
                  </div>
                </div>

                {/* Dossier Tabs */}
                <div className="dossier-tabs">
                  <button
                    type="button"
                    className={`dossier-tab ${activeDossierTab === "triage" ? "active" : ""}`}
                    onClick={() => setActiveDossierTab("triage")}
                  >
                    🛡️ Triage Verdict
                  </button>
                  <button
                    type="button"
                    className={`dossier-tab ${activeDossierTab === "hunter" ? "active" : ""}`}
                    onClick={() => setActiveDossierTab("hunter")}
                  >
                    🔍 Blast Radius & Hunter
                  </button>
                  <button
                    type="button"
                    className={`dossier-tab ${activeDossierTab === "intel" ? "active" : ""}`}
                    onClick={() => setActiveDossierTab("intel")}
                  >
                    🌐 Threat Intel & Attribution
                  </button>
                  <button
                    type="button"
                    className={`dossier-tab ${activeDossierTab === "responder" ? "active" : ""}`}
                    onClick={() => setActiveDossierTab("responder")}
                  >
                    ⚡ Containment Playbook
                  </button>
                </div>

                {/* Dossier Tab Content */}
                <div className="dossier-content">
                  {/* 1. Triage Findings */}
                  {activeDossierTab === "triage" && (
                    <div className="dossier-section triage-pane">
                      <div className="dossier-meta-row">
                        <div className="verdict-card">
                          <span className="label">Triage Verdict</span>
                          <div className="verdict-value true-positive">
                            {swarmResult.agents?.triage?.verdict || "TRUE POSITIVE"}
                          </div>
                        </div>
                        <div className="verdict-card">
                          <span className="label">Confidence Score</span>
                          <div className="verdict-value confidence">
                            {swarmResult.agents?.triage?.confidence_score || 96}%
                          </div>
                        </div>
                        <div className="verdict-card">
                          <span className="label">Operational Urgency</span>
                          <div className="verdict-value urgency">
                            {swarmResult.agents?.triage?.urgency || "P1 - CRITICAL"}
                          </div>
                        </div>
                      </div>

                      <div className="dossier-block">
                        <h5>Triage Summary</h5>
                        <p>{swarmResult.agents?.triage?.summary}</p>
                      </div>

                      <div className="dossier-block">
                        <h5>Key Behavioral Signals</h5>
                        <ul className="signals-list">
                          {(swarmResult.agents?.triage?.key_signals || []).map((sig, idx) => (
                            <li key={idx}>
                              <span className="signal-dot" />
                              <span>{sig}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. Threat Hunter Findings */}
                  {activeDossierTab === "hunter" && (
                    <div className="dossier-section hunter-pane">
                      <div className="hunter-grid">
                        <div className="hunter-card">
                          <h5>🎯 Patient Zero Identification</h5>
                          <div className="hunter-detail">
                            <span className="detail-label">Entry Vector:</span>
                            <span>{swarmResult.agents?.hunter?.patient_zero?.entry_vector}</span>
                          </div>
                          <div className="hunter-detail">
                            <span className="detail-label">Target Host:</span>
                            <code>{swarmResult.agents?.hunter?.patient_zero?.host}</code>
                          </div>
                          <div className="hunter-detail">
                            <span className="detail-label">Target Identity:</span>
                            <code>{swarmResult.agents?.hunter?.patient_zero?.identity}</code>
                          </div>
                        </div>

                        <div className="hunter-card">
                          <h5>🌐 Blast Radius Assessment</h5>
                          <div className="hunter-detail">
                            <span className="detail-label">Lateral Movement Risk:</span>
                            <span className="risk-tag high">
                              {swarmResult.agents?.hunter?.blast_radius?.lateral_movement_risk || "HIGH"}
                            </span>
                          </div>
                          <div className="hunter-detail">
                            <span className="detail-label">Impacted Hosts:</span>
                            <span>{(swarmResult.agents?.hunter?.blast_radius?.impacted_hosts || []).join(", ")}</span>
                          </div>
                          <div className="hunter-detail">
                            <span className="detail-label">Compromised Identities:</span>
                            <span>{(swarmResult.agents?.hunter?.blast_radius?.impacted_identities || []).join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="dossier-block">
                        <h5>Reconstructed Attack Progression Chain</h5>
                        <div className="attack-chain-timeline">
                          {(swarmResult.agents?.hunter?.attack_chain || []).map((stage, idx) => (
                            <div className="chain-step" key={idx}>
                              <div className="chain-step-num">{idx + 1}</div>
                              <div>
                                <strong>{stage.stage}</strong>
                                <p>{stage.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="dossier-block">
                        <h5>Threat Hunting Recommendation</h5>
                        <p>{swarmResult.agents?.hunter?.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {/* 3. Threat Intel Findings */}
                  {activeDossierTab === "intel" && (
                    <div className="dossier-section intel-pane">
                      <div className="dossier-block">
                        <h5>Adversary Indicators of Compromise (IoCs)</h5>
                        <div className="ioc-table-wrapper">
                          <table className="ioc-table">
                            <thead>
                              <tr>
                                <th>Indicator</th>
                                <th>Type</th>
                                <th>Reputation</th>
                                <th>Threat Source</th>
                                <th>Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(swarmResult.agents?.intel?.indicators || []).map((ioc, idx) => (
                                <tr key={idx}>
                                  <td><code>{ioc.value}</code></td>
                                  <td>{ioc.type}</td>
                                  <td><span className="reputation-badge malicious">{ioc.reputation}</span></td>
                                  <td>{ioc.source}</td>
                                  <td>{ioc.confidence}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="dossier-block">
                        <h5>Campaign Assessment & Profiling</h5>
                        <p>{swarmResult.agents?.intel?.campaign_assessment}</p>
                      </div>

                      <div className="dossier-block">
                        <h5>Correlated MITRE ATT&CK Techniques</h5>
                        <div className="mitre-tags-list">
                          {(swarmResult.agents?.intel?.mitre_mappings || []).map((m, idx) => (
                            <div className="mitre-tag-item" key={idx}>
                              <span className="tag-id">{m.technique_id}</span>
                              <span className="tag-name">{m.technique_name}</span>
                              <span className="tag-tactic">({m.tactic_name})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Responder Containment Playbook */}
                  {activeDossierTab === "responder" && (
                    <div className="dossier-section responder-pane">
                      <div className="dossier-block">
                        <h5>Immediate Containment Commands</h5>
                        <div className="action-commands-list">
                          {(swarmResult.agents?.responder?.immediate_actions || []).map((act, idx) => (
                            <div className="command-card" key={idx}>
                              <div className="command-title-row">
                                <span className="action-label">Action {idx + 1}: {act.action}</span>
                                <button
                                  type="button"
                                  className="copy-command-btn"
                                  onClick={() => handleCopyText(`act-${idx}`, act.command)}
                                >
                                  {copiedCode[`act-${idx}`] ? <Check size={13} /> : <Copy size={13} />}
                                  <span>{copiedCode[`act-${idx}`] ? "Copied" : "Copy Command"}</span>
                                </button>
                              </div>
                              <pre className="command-box"><code>{act.command}</code></pre>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="dossier-block">
                        <h5>Post-Containment Recovery Checklist</h5>
                        <ul className="recovery-list">
                          {(swarmResult.agents?.responder?.recovery_steps || []).map((step, idx) => (
                            <li key={idx}>
                              <Check size={14} />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INTERACTIVE COPILOT CHAT
          ========================================================================= */}
      {activeTab === "chat" && (
        <section className="panel copilot-chat-panel">
          {/* Chat Control Header */}
          <div className="chat-control-bar">
            <div className="chat-agent-selector">
              <span className="selector-label">Chatting With:</span>
              <div className="agent-pill-selector">
                {SWARM_AGENTS_METADATA.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    className={`agent-tab-pill ${selectedAgent === agent.id ? "active" : ""}`}
                    onClick={() => setSelectedAgent(agent.id)}
                    style={{
                      borderColor: selectedAgent === agent.id ? agent.color : undefined,
                    }}
                  >
                    <span>{agent.avatar}</span>
                    <span>{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="clear-chat-btn"
              onClick={clearChatHistory}
              title="Clear conversation"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="quick-prompts-bar">
            <span className="chips-label">Quick Inquiries:</span>
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                handleSendMessage("Generate immediate firewall containment rules (iptables & PowerShell) for the attacker IP.")
              }
            >
              ⚡ Contain Attacker IP
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                handleSendMessage("Analyze patient zero, lateral movement, and blast radius for this incident.")
              }
            >
              🔍 Blast Radius & Lateral Movement
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                handleSendMessage("Assess threat actor attribution and IoC reputation for observed telemetry.")
              }
            >
              🌐 Threat Intel Attribution
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                handleSendMessage("Draft an executive incident notification and remediation summary.")
              }
            >
              📋 Executive Incident Summary
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="chat-messages-stream">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                {msg.sender === "agent" && (
                  <div className="agent-chat-avatar">
                    <span>{msg.avatar || "🤖"}</span>
                  </div>
                )}

                <div className="chat-bubble">
                  {msg.sender === "agent" && (
                    <div className="chat-bubble-header">
                      <span className="chat-agent-name">{msg.agentName}</span>
                      <span className="chat-badge-pill">{msg.badge}</span>
                      <span className="chat-timestamp">{msg.timestamp}</span>
                    </div>
                  )}

                  <div className="chat-text">
                    <ChatMarkdownRenderer text={msg.text} onCopy={handleCopyText} copiedCode={copiedCode} />
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="user-chat-avatar">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="chat-bubble-row agent">
                <div className="agent-chat-avatar">
                  <span>🤖</span>
                </div>
                <div className="chat-bubble loading">
                  <div className="chat-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="typing-text">SentinelX AI is synthesizing security telemetry...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="chat-input-bar">
            <textarea
              className="chat-textarea"
              placeholder={`Ask ${SWARM_AGENTS_METADATA.find((a) => a.id === selectedAgent)?.name || "Copilot"} about containment, attack paths, or forensic queries... (Press Enter to send)`}
              value={inputMessage}
              rows={2}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputMessage.trim()}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 3: PRESERVED PER-ALERT DEEP DIVES
          ========================================================================= */}
      {activeTab === "alerts" && (
        <div className="per-alert-analyses-wrapper">
          <section className="panel ai-context-panel">
            <div className="ai-context-info">
              <div>
                <span className="eyebrow">ASSOCIATED ALERTS</span>
                <h3>{report?.incident?.title || "Incident Alerts"}</h3>
                <p>
                  INC-{report?.incident?.id || "N/A"} · {incidentAlerts.length} alert{incidentAlerts.length === 1 ? "" : "s"} linked
                </p>
              </div>

              <div className="ai-action-group">
                {incidentAlerts.length > 0 && (
                  <button
                    className="ai-action-btn"
                    type="button"
                    onClick={onGenerateAll}
                    disabled={generating}
                  >
                    <BrainCircuit size={15} />
                    {generating ? "Generating..." : `Analyze All ${incidentAlerts.length} Alerts`}
                  </button>
                )}

                <button
                  className="ai-secondary-btn"
                  type="button"
                  onClick={() => onRefresh && onRefresh(incidentAlerts)}
                  disabled={loading || generating}
                >
                  <RefreshCw size={14} className={loading ? "spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </section>

          {loading && !analyses.length ? (
            <section className="panel">
              <div className="ai-loading">
                <BrainCircuit size={24} />
                <strong>Loading alert analyses...</strong>
                <span>Reading persisted SentinelX AI results.</span>
              </div>
            </section>
          ) : analyses.length ? (
            analyses.map((ai) => (
              <AIAnalysisCard
                key={ai.id}
                ai={ai}
                incidentAlerts={incidentAlerts}
                onGenerate={onGenerate}
                generating={generating}
              />
            ))
          ) : (
            <section className="panel ai-empty-panel">
              <BrainCircuit size={28} />
              <h3>No single-alert analysis generated yet</h3>
              <p>You can generate individual alert analyses or use the Swarm Investigation tab above.</p>
              {incidentAlerts.length > 0 && (
                <button
                  className="ai-action-btn"
                  type="button"
                  onClick={() => onGenerate && onGenerate(incidentAlerts[0].id)}
                  disabled={generating}
                >
                  <BrainCircuit size={15} />
                  Analyze First Alert
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function getSeverityBadgeClass(text) {
  const t = (text || "").trim().toUpperCase();
  if (t === "CRITICAL" || t === "MALICIOUS" || t === "HIGH RISK" || t === "HIGH") return "badge-danger";
  if (t === "WARNING" || t === "MEDIUM" || t === "SUSPICIOUS") return "badge-warning";
  if (t === "LOW" || t === "INFO" || t === "CLEAN" || t === "BENIGN" || t === "COMPLETED") return "badge-success";
  return "";
}

function renderInlineMarkdown(text = "") {
  if (!text) return null;

  // Split tokens by inline code, bold, italic
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length >= 2) {
      return (
        <code className="chat-inline-code" key={i}>
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length >= 4) {
      const inner = tok.slice(2, -2);
      const badgeCls = getSeverityBadgeClass(inner);
      return (
        <strong className={`chat-strong ${badgeCls}`} key={i}>
          {inner}
        </strong>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length >= 2) {
      return (
        <em className="chat-em" key={i}>
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

/**
 * Structured React Markdown & Table Renderer
 * Formats tables, callouts, code blocks, bullet/numbered lists, headers, and cyber badges.
 */
function ChatMarkdownRenderer({ text = "", onCopy, copiedCode }) {
  if (!text) return null;

  // 1. Separate triple-backtick code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content">
      {parts.map((part, pIdx) => {
        if (!part) return null;

        // Render Code Block
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          let lang = lines[0]?.trim();
          let code = lines.slice(1).join("\n");
          if (!code && lines.length === 1) {
            code = lines[0];
            lang = "bash";
          }
          const codeId = `code-${pIdx}`;

          return (
            <div className="chat-code-block" key={pIdx}>
              <div className="code-block-header">
                <span>{lang || "terminal"}</span>
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={() => onCopy(codeId, code)}
                  title="Copy command"
                >
                  {copiedCode[codeId] ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCode[codeId] ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre><code>{code}</code></pre>
            </div>
          );
        }

        // Render structured text blocks (tables, callouts, lists, headers, paragraphs)
        const lines = part.split("\n");
        const blocks = [];
        let i = 0;

        while (i < lines.length) {
          const rawLine = lines[i];
          const trimmed = rawLine.trim();

          if (!trimmed) {
            i++;
            continue;
          }

          // Markdown Table: lines starting and ending with |
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
              tableLines.push(lines[i].trim());
              i++;
            }

            if (tableLines.length >= 2) {
              const parseCells = (row) =>
                row
                  .slice(1, -1)
                  .split("|")
                  .map((c) => c.trim());

              const headerCells = parseCells(tableLines[0]);
              // Skip separator line if it contains dashes
              const bodyLines = tableLines.slice(tableLines[1].includes("---") ? 2 : 1);

              blocks.push(
                <div className="chat-table-wrapper" key={`tbl-${i}`}>
                  <table className="chat-markdown-table">
                    <thead>
                      <tr>
                        {headerCells.map((h, hIdx) => (
                          <th key={hIdx}>{renderInlineMarkdown(h)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyLines.map((bLine, rIdx) => {
                        const cells = parseCells(bLine);
                        return (
                          <tr key={rIdx}>
                            {cells.map((cell, cIdx) => (
                              <td key={cIdx}>{renderInlineMarkdown(cell)}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
              continue;
            }
          }

          // Callout / Blockquote: starts with >
          if (trimmed.startsWith(">")) {
            const calloutLines = [];
            while (i < lines.length && lines[i].trim().startsWith(">")) {
              calloutLines.push(lines[i].trim().replace(/^>\s?/, ""));
              i++;
            }
            blocks.push(
              <div className="chat-callout" key={`callout-${i}`}>
                <Info size={14} className="callout-icon" />
                <div className="callout-body">
                  {renderInlineMarkdown(calloutLines.join(" "))}
                </div>
              </div>
            );
            continue;
          }

          // Headings: ###, ####, ##
          if (trimmed.startsWith("### ")) {
            blocks.push(
              <h3 className="chat-h3" key={`h3-${i}`}>
                {renderInlineMarkdown(trimmed.slice(4))}
              </h3>
            );
            i++;
            continue;
          }

          if (trimmed.startsWith("#### ")) {
            blocks.push(
              <h4 className="chat-h4" key={`h4-${i}`}>
                {renderInlineMarkdown(trimmed.slice(5))}
              </h4>
            );
            i++;
            continue;
          }

          if (trimmed.startsWith("## ")) {
            blocks.push(
              <h2 className="chat-h2" key={`h2-${i}`}>
                {renderInlineMarkdown(trimmed.slice(3))}
              </h2>
            );
            i++;
            continue;
          }

          // Unordered list: * or -
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const listItems = [];
            while (
              i < lines.length &&
              (lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("- "))
            ) {
              listItems.push(lines[i].trim().slice(2));
              i++;
            }
            blocks.push(
              <ul className="chat-ul" key={`ul-${i}`}>
                {listItems.map((item, lIdx) => (
                  <li key={lIdx}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
            continue;
          }

          // Ordered list: 1. 2.
          if (/^\d+\.\s+/.test(trimmed)) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
              listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
              i++;
            }
            blocks.push(
              <ol className="chat-ol" key={`ol-${i}`}>
                {listItems.map((item, lIdx) => (
                  <li key={lIdx}>{renderInlineMarkdown(item)}</li>
                ))}
              </ol>
            );
            continue;
          }

          // Regular paragraph
          blocks.push(
            <p className="chat-p" key={`p-${i}`}>
              {renderInlineMarkdown(trimmed)}
            </p>
          );
          i++;
        }

        return <div className="text-chunk" key={pIdx}>{blocks}</div>;
      })}
    </div>
  );
}

/**
 * Preserved AI Analysis Card for Per-Alert view
 */
function AIAnalysisCard({ ai, incidentAlerts }) {
  const alert = incidentAlerts.find(
    (item) => String(item.id) === String(ai.alert_id)
  );

  return (
    <section className="panel ai-analysis-card">
      <div className="ai-analysis-header">
        <div>
          <span className="eyebrow">AI ANALYSIS</span>
          <h3>
            Alert #{ai.alert_id}
            {alert?.detection_rule ? ` · ${alert.detection_rule}` : ""}
          </h3>
        </div>

        <div className="ai-provider">
          <span className="ai-dot" />
          <Bot size={14} />
          {ai.provider || "OpenRouter"} · {ai.model_name || "AI Model"}
        </div>
      </div>

      {alert && (
        <div className="ai-alert-context">
          <span className={`severity-badge ${alert.severity}`}>
            {alert.severity}
          </span>
          <span className="risk-score">Risk {alert.risk_score}</span>
          <span>{alert.title}</span>
        </div>
      )}

      <div className="ai-analysis-grid">
        <div className="ai-block">
          <h4>Summary</h4>
          <p>{ai.summary}</p>
        </div>
        <div className="ai-block">
          <h4>Threat Assessment</h4>
          <p>{ai.threat_assessment}</p>
        </div>
        <div className="ai-block">
          <h4>Risk Explanation</h4>
          <p>{ai.risk_explanation}</p>
        </div>
      </div>

      {ai.investigation_steps && (
        <div className="ai-steps-section">
          <h4>Investigation Guidance</h4>
          <ul>
            {(Array.isArray(ai.investigation_steps)
              ? ai.investigation_steps
              : [ai.investigation_steps]
            ).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.recommended_response && (
        <div className="ai-response-section">
          <h4>Containment & Response</h4>
          <ul>
            {(Array.isArray(ai.recommended_response)
              ? ai.recommended_response
              : [ai.recommended_response]
            ).map((resp, idx) => (
              <li key={idx}>{resp}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
