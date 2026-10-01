import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target,
  Shield,
  AlertTriangle,
  Flame,
  Search,
  ExternalLink,
  Layers,
  CheckCircle,
  EyeOff,
  Filter,
  Copy,
  Check,
  Bot,
  RefreshCw,
} from "lucide-react";
import "./MitreHeatmap.css";
import Select from "./Select.jsx";

export default function MitreHeatmap({
  report,
  incidents = [],
  selectedIncident,
  onIncidentSelect,
  onAskCopilot,
  apiBase = "/api",
}) {
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'detected' | 'covered' | 'uncovered'
  const [viewMode, setViewMode] = useState("matrix"); // 'matrix' | 'focused'
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Fetch full MITRE Heatmap matrix from backend
  const fetchMatrix = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedIncident
        ? `${apiBase}/mitre/matrix?incidentId=${selectedIncident}`
        : `${apiBase}/mitre/matrix`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load MITRE matrix (${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setMatrixData(json.data);
      } else {
        throw new Error(json.message || "Invalid matrix data");
      }
    } catch (err) {
      console.warn("Matrix fetch warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedIncident, apiBase]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Fetch details when a technique is clicked
  const handleSelectTechnique = async (tech) => {
    setSelectedTechnique(tech);

    try {
      const res = await fetch(`${apiBase}/mitre/techniques/${encodeURIComponent(tech.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedTechnique((prev) => (prev?.id === tech.id ? { ...prev, ...json.data } : prev));
        }
      }
    } catch (err) {
      console.warn("Technique details fetch error:", err.message);
    }
  };

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filter tactics and techniques
  const filteredTactics = useMemo(() => {
    if (!matrixData?.tactics) return [];

    const query = searchQuery.trim().toLowerCase();

    return matrixData.tactics
      .map((tactic) => {
        let techniques = tactic.techniques || [];

        // In focused incident mode, only show techniques detected in this incident
        if (viewMode === "focused") {
          techniques = techniques.filter(
            (t) => t.incident_detected || (report?.mitre_attack || []).some((m) => m.technique_id === t.id)
          );
        }

        // Apply status filter
        if (statusFilter === "detected") {
          techniques = techniques.filter((t) => t.detected || t.incident_detected);
        } else if (statusFilter === "covered") {
          techniques = techniques.filter((t) => t.covered);
        } else if (statusFilter === "uncovered") {
          techniques = techniques.filter((t) => !t.covered && !t.detected);
        }

        // Apply search query
        if (query) {
          techniques = techniques.filter((t) => {
            return (
              t.id?.toLowerCase().includes(query) ||
              t.name?.toLowerCase().includes(query) ||
              t.description?.toLowerCase().includes(query) ||
              t.rule?.toLowerCase().includes(query)
            );
          });
        }

        return {
          ...tactic,
          techniques,
        };
      })
      .filter((tactic) => {
        // If searching or in focused view, hide empty tactics
        if (query || viewMode === "focused" || statusFilter !== "all") {
          return tactic.techniques.length > 0;
        }
        return true;
      });
  }, [matrixData, searchQuery, statusFilter, viewMode, report]);

  // Total matching techniques
  const totalVisibleTechniques = useMemo(() => {
    return filteredTactics.reduce((acc, t) => acc + t.techniques.length, 0);
  }, [filteredTactics]);

  const coverage = matrixData?.coverage_summary || {
    total_tactics: 14,
    total_techniques: 38,
    covered_techniques: 22,
    detected_techniques: 4,
    coverage_percentage: 58,
  };

  return (
    <div className="mitre-heatmap-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <span className="eyebrow">INTELLIGENCE / MITRE ATT&CK</span>
          <h2>Enterprise ATT&CK Matrix & Coverage Heatmap</h2>
          <p>
            Interactive adversary tactic and technique matrix with real-time detection telemetry, rule coverage, and incident correlation.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <section className="mitre-kpi-bar">
        <div className="kpi-card">
          <div className="kpi-icon tactics">
            <Layers size={18} />
          </div>
          <div>
            <span className="kpi-label">ATT&CK Tactics</span>
            <div className="kpi-value">{coverage.total_tactics} / 14</div>
            <span className="kpi-sub">Adversary lifecycle</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon coverage">
            <Shield size={18} />
          </div>
          <div>
            <span className="kpi-label">Detection Coverage</span>
            <div className="kpi-value">{coverage.coverage_percentage}%</div>
            <span className="kpi-sub">{coverage.covered_techniques} techniques protected</span>
          </div>
        </div>

        <div className="kpi-card active-detections">
          <div className="kpi-icon detected">
            <Flame size={18} />
          </div>
          <div>
            <span className="kpi-label">Active Detections</span>
            <div className="kpi-value">{coverage.detected_techniques} Detected</div>
            <span className="kpi-sub">Live alerts mapped</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blindspots">
            <EyeOff size={18} />
          </div>
          <div>
            <span className="kpi-label">Unmonitored Gaps</span>
            <div className="kpi-value">{coverage.blind_spots || 16} Blind Spots</div>
            <span className="kpi-sub">Recommended for rule tuning</span>
          </div>
        </div>
      </section>

      {/* Control Panel: Active Incident & Filters */}
      <section className="panel mitre-controls-panel">
        <div className="mitre-controls-top">
          <div className="incident-context-selector">
            <span className="eyebrow">ACTIVE INCIDENT SCOPE</span>
            <div className="incident-selector-row">
              <Select
                className="incident-dropdown"
                value={selectedIncident || ""}
                placeholder="All Incidents (Enterprise Matrix)"
                onChange={(id) => {
                  if (onIncidentSelect) onIncidentSelect(id || null);
                }}
                options={[
                  { value: "", label: "All Incidents (Enterprise Matrix)" },
                  ...incidents.map((inc) => ({
                    value: inc.id,
                    label: `INC-${inc.id} · ${inc.title}`,
                    title: `INC-${inc.id} · ${inc.title}`,
                  })),
                ]}
              />

              <button
                type="button"
                className="mitre-refresh-btn"
                onClick={fetchMatrix}
                disabled={loading}
                title="Refresh Matrix"
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="view-mode-tabs">
            <button
              type="button"
              className={`view-tab ${viewMode === "matrix" ? "active" : ""}`}
              onClick={() => setViewMode("matrix")}
            >
              <Target size={14} />
              <span>Enterprise Matrix</span>
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === "focused" ? "active" : ""}`}
              onClick={() => setViewMode("focused")}
              disabled={!selectedIncident && (!report || !(report.mitre_attack || []).length)}
            >
              <Flame size={14} />
              <span>Incident Mappings {report?.mitre_attack?.length ? `(${report.mitre_attack.length})` : ""}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mitre-filter-row">
          <div className="mitre-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Filter by Technique ID (e.g., T1110), Name, or Keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="status-filter-pills">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Techniques
            </button>
            <button
              type="button"
              className={`filter-pill detected ${statusFilter === "detected" ? "active" : ""}`}
              onClick={() => setStatusFilter("detected")}
            >
              <Flame size={12} />
              Detected Hits
            </button>
            <button
              type="button"
              className={`filter-pill covered ${statusFilter === "covered" ? "active" : ""}`}
              onClick={() => setStatusFilter("covered")}
            >
              <Shield size={12} />
              Covered by Rules
            </button>
            <button
              type="button"
              className={`filter-pill uncovered ${statusFilter === "uncovered" ? "active" : ""}`}
              onClick={() => setStatusFilter("uncovered")}
            >
              <EyeOff size={12} />
              Blind Spots
            </button>
          </div>
        </div>

        <div className="mitre-results-counter">
          <span>
            Showing <strong>{totalVisibleTechniques}</strong> technique{totalVisibleTechniques === 1 ? "" : "s"} across{" "}
            <strong>{filteredTactics.length}</strong> tactic{filteredTactics.length === 1 ? "" : "s"}
          </span>
          <div className="legend">
            <span className="legend-item"><span className="legend-dot detected" /> Detected Activity</span>
            <span className="legend-item"><span className="legend-dot covered" /> Protected / Covered</span>
            <span className="legend-item"><span className="legend-dot uncovered" /> Uncovered</span>
          </div>
        </div>
      </section>

      {/* Main Heatmap Matrix Grid */}
      <section className="panel mitre-matrix-panel">
        {loading && !matrixData ? (
          <div className="matrix-loading">
            <RefreshCw size={24} className="spin" />
            <p>Loading MITRE ATT&CK Enterprise Matrix & Telemetry...</p>
          </div>
        ) : filteredTactics.length === 0 ? (
          <div className="matrix-empty">
            <Filter size={32} />
            <h4>No techniques match your criteria</h4>
            <p>Try clearing your search query or adjusting your status filter.</p>
            <button
              type="button"
              className="clear-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="matrix-scroll-wrapper">
            <div className="matrix-grid">
              {filteredTactics.map((tactic) => (
                <div className="matrix-column" key={tactic.id}>
                  {/* Tactic Column Header */}
                  <div className="tactic-header">
                    <span className="tactic-id">{tactic.id}</span>
                    <h4 className="tactic-name">{tactic.name}</h4>
                    <div className="tactic-meta">
                      <span className="count-pill">{tactic.techniques.length} techniques</span>
                      {tactic.active_detections > 0 && (
                        <span className="detected-pill">
                          <Flame size={10} />
                          {tactic.active_detections}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Techniques list under this tactic */}
                  <div className="technique-cells">
                    {tactic.techniques.map((tech) => {
                      const isSelected = selectedTechnique?.id === tech.id;
                      const isDetected = tech.detected || tech.incident_detected;
                      const isCovered = tech.covered;

                      let cellClass = "technique-cell";
                      if (isDetected) cellClass += " detected";
                      else if (isCovered) cellClass += " covered";
                      else cellClass += " uncovered";

                      if (isSelected) cellClass += " selected";
                      if (tech.incident_detected) cellClass += " incident-highlight";

                      return (
                        <div
                          key={tech.id}
                          className={cellClass}
                          onClick={() => handleSelectTechnique({ ...tech, tactic_name: tactic.name })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectTechnique({ ...tech, tactic_name: tactic.name });
                            }
                          }}
                        >
                          <div className="tech-cell-header">
                            <span className="tech-id">{tech.id}</span>
                            {isDetected ? (
                              <span className="tech-tag detected" title="Alerts detected in environment">
                                <Flame size={10} />
                                {tech.detection_count || 1}
                              </span>
                            ) : isCovered ? (
                              <span className="tech-tag covered" title="Covered by SentinelX rule">
                                <Shield size={10} />
                              </span>
                            ) : null}
                          </div>

                          <div className="tech-name">{tech.name}</div>

                          {tech.rule && (
                            <div className="tech-rule" title={`Rule: ${tech.rule}`}>
                              {tech.rule}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Technique Detail Drawer / Modal */}
      {selectedTechnique && (
        <div className="technique-drawer-backdrop" onClick={() => setSelectedTechnique(null)}>
          <div
            className="technique-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="drawer-header">
              <div className="drawer-title-group">
                <span className="eyebrow">
                  {selectedTechnique.tactic_id} · {selectedTechnique.tactic_name || "Enterprise ATT&CK"}
                </span>
                <h3>
                  {selectedTechnique.id}: {selectedTechnique.name}
                </h3>
              </div>

              <div className="drawer-header-actions">
                <button
                  type="button"
                  className="drawer-copy-btn"
                  onClick={() => handleCopyId(selectedTechnique.id)}
                  title="Copy Technique ID"
                >
                  {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setSelectedTechnique(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="drawer-body">
              {/* Status and Severity Badges */}
              <div className="drawer-badges">
                {selectedTechnique.detected ? (
                  <span className="status-badge detected">
                    <Flame size={12} />
                    Active Detection ({selectedTechnique.detection_count || 1} hits)
                  </span>
                ) : selectedTechnique.covered ? (
                  <span className="status-badge covered">
                    <Shield size={12} />
                    Protected by SentinelX Rules
                  </span>
                ) : (
                  <span className="status-badge uncovered">
                    <EyeOff size={12} />
                    Unmonitored Blind Spot
                  </span>
                )}

                {selectedTechnique.platforms && selectedTechnique.platforms.length > 0 && (
                  <span className="platform-pill">
                    Platforms: {selectedTechnique.platforms.join(", ")}
                  </span>
                )}
              </div>

              {/* Adversary Behavior Description */}
              <div className="drawer-section">
                <h4>Adversary Technique Description</h4>
                <p>{selectedTechnique.description || "Detailed behavior profile from MITRE ATT&CK framework."}</p>
              </div>

              {/* SentinelX Protection & Detection Mechanism */}
              <div className="drawer-section highlight">
                <h4>
                  <Shield size={15} />
                  SentinelX Detection Capability
                </h4>
                {selectedTechnique.rule ? (
                  <div className="coverage-box">
                    <div className="rule-name">
                      Active Rule: <code>{selectedTechnique.rule}</code>
                    </div>
                    <p>
                      SentinelX continuously monitors normalized logs for this technique using deterministic pattern recognition and behavioral heuristics.
                    </p>
                  </div>
                ) : (
                  <div className="blindspot-box">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Coverage Gap Identified</strong>
                      <p>
                        No active deterministic rule currently flags this specific technique. Telemetry should be expanded or a custom YARA/Sigma rule deployed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-World Mitigations */}
              {selectedTechnique.mitigations && selectedTechnique.mitigations.length > 0 && (
                <div className="drawer-section">
                  <h4>Recommended Enterprise Mitigations</h4>
                  <ul className="mitigation-list">
                    {selectedTechnique.mitigations.map((mit, idx) => (
                      <li key={idx}>
                        <CheckCircle size={14} />
                        <span>{mit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External MITRE Link & Ask AI Button */}
              <div className="drawer-actions">
                <a
                  href={`https://attack.mitre.org/techniques/${selectedTechnique.id.split(".")[0]}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="external-mitre-btn"
                >
                  <ExternalLink size={14} />
                  View on MITRE ATT&CK Official
                </a>

                {onAskCopilot && (
                  <button
                    type="button"
                    className="ask-copilot-btn"
                    onClick={() => {
                      const prompt = `Analyze MITRE technique ${selectedTechnique.id} (${selectedTechnique.name}) and explain how an attacker exploits it in our environment and how SentinelX should contain it.`;
                      onAskCopilot(prompt);
                    }}
                  >
                    <Bot size={14} />
                    Ask AI Copilot
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
