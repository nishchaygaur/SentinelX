import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Clock3,
  Dices,
  FileDown,
  FileText,
  Gauge,
  Globe,
  LayoutDashboard,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Siren,
  Target,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";

import "./App.css";
import Select from "./components/Select.jsx";
import DocsViewer from "./components/DocsViewer.jsx";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = RAW_API_URL.replace(/\/+$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/+$/, "")
  : `${RAW_API_URL.replace(/\/+$/, "")}/api`;

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isDocsOpen, setIsDocsOpen] = useState(() => {
    return window.location.pathname === "/docs" || window.location.pathname.startsWith("/docs/");
  });
  const [docsParamId, setDocsParamId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("doc") || "README";
  });

  // Handle browser Back / Forward history for /docs
  useEffect(() => {
    const onPopState = () => {
      const isDocs = window.location.pathname === "/docs" || window.location.pathname.startsWith("/docs/");
      setIsDocsOpen(isDocs);
      const params = new URLSearchParams(window.location.search);
      if (params.get("doc")) {
        setDocsParamId(params.get("doc"));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigateDocs = (docId = "README") => {
    setIsDocsOpen(true);
    setDocsParamId(docId);
    const targetUrl = docId && docId !== "README" ? `/docs?doc=${encodeURIComponent(docId)}` : "/docs";
    window.history.pushState({ docId }, "", targetUrl);
  };

  const handleNavigateHome = () => {
    setIsDocsOpen(false);
    window.history.pushState({}, "", "/");
  };

  const [dashboard, setDashboard] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logSources, setLogSources] = useState([]);
  const [normalizedLogs, setNormalizedLogs] = useState([]);
  const [responseActions, setResponseActions] = useState([]);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [report, setReport] = useState(null);

  const [aiAnalyses, setAiAnalyses] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [generatingIncident, setGeneratingIncident] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const reportPreviewRef = useRef(null);
  const incidentsRef = useRef([]);
  const initialLoadRef = useRef(false);

  // Keep the latest incidents available to event handlers
  // without making those handlers depend on incidents state.
  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  // =========================================================
  // API HELPER
  // =========================================================

  const fetchJSON = async (endpoint) => {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      throw new Error(`${endpoint} returned ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || `Failed to load ${endpoint}`
      );
    }

    return result.data;
  };

  const loadResponseActions = async () => {
    const data = await fetchJSON("/response-actions");
    setResponseActions(Array.isArray(data) ? data : []);
    return data;
  };

  const createResponseAction = async ({ incidentId, actionType, description }) => {
    if (!incidentId || !actionType || !description) return null;

    setError("");

    try {
      const response = await fetch(`${API_BASE}/response-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          action_type: actionType,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create response action");
      }

      await loadResponseActions();

      if (String(selectedIncident) === String(incidentId)) {
        await loadIncidentReport(incidentId);
      }

      return result.data;
    } catch (err) {
      console.error("Create response action error:", err);
      setError(err.message);
      return null;
    }
  };

  const executeResponseAction = async (actionId) => {
    if (!actionId) return null;

    setError("");

    try {
      const response = await fetch(`${API_BASE}/response-actions/${actionId}/execute`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to execute response action");
      }

      await loadResponseActions();

      if (selectedIncident) {
        await loadIncidentReport(selectedIncident);
      }

      return result.data;
    } catch (err) {
      console.error("Execute response action error:", err);
      setError(err.message);
      return null;
    }
  };

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  const loadDashboard = async () => {
    try {
      setError("");

      const [
        dashboardData,
        incidentData,
        alertData,
        sourceData,
        logData,
        responseData,
      ] = await Promise.all([
        fetchJSON("/dashboard/summary"),
        fetchJSON("/incidents"),
        fetchJSON("/alerts"),
        fetchJSON("/log-sources"),
        fetchJSON("/normalized-logs"),
        fetchJSON("/response-actions"),
      ]);

      setDashboard(dashboardData);

      setIncidents(
        Array.isArray(incidentData)
          ? incidentData
          : []
      );

      setAlerts(
        Array.isArray(alertData)
          ? alertData
          : []
      );

      setLogSources(
        Array.isArray(sourceData)
          ? sourceData
          : []
      );

      setNormalizedLogs(
        Array.isArray(logData)
          ? logData
          : []
      );

      setResponseActions(
        Array.isArray(responseData)
          ? responseData
          : []
      );

      // Do not automatically select an incident.
      // The user must explicitly select one.
      setReport(null);
      setSelectedIncident(null);
      setAiAnalyses([]);
    } catch (err) {
      console.error(
        "SentinelX dashboard error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD INCIDENT REPORT
  // =========================================================

  const loadIncidentReport = async (id) => {
  try {
    const [
      reportData,
      incidentData,
      timelineData,
    ] = await Promise.all([
      fetchJSON(`/incidents/${id}/report`),
      fetchJSON(`/incidents/${id}`),
      fetchJSON(`/incidents/${id}/timeline`),
    ]);

    const combinedReport = {
      ...reportData,

      incident:
        incidentData?.incident ||
        reportData?.incident,

      alerts:
        incidentData?.alerts ||
        reportData?.alerts ||
        [],

      logs:
        incidentData?.logs ||
        [],

      mitre_attack:
        incidentData?.mitre_attack ||
        reportData?.mitre_attack ||
        [],

      threat_intelligence:
        incidentData?.threat_intelligence ||
        reportData?.threat_intelligence ||
        [],

      response_actions:
        incidentData?.response_actions ||
        reportData?.response_actions ||
        [],

      timeline:
        timelineData?.timeline ||
        [],
    };

    setReport(combinedReport);
    setSelectedIncident(id);

    return combinedReport;
  } catch (err) {
    console.error(
      "Incident report error:",
      err
    );

    setError(err.message);

    return null;
  }
};


  // =========================================================
  // AI ANALYSIS
  // =========================================================

  const loadAIAnalysis = async (alertsForAnalysis = []) => {
    const relatedAlerts = Array.isArray(alertsForAnalysis)
      ? alertsForAnalysis
      : [];

    if (!relatedAlerts.length) {
      setAiAnalyses([]);
      return;
    }

    setAiLoading(true);

    try {
      const results = await Promise.all(
        relatedAlerts.map(async (alert) => {
          try {
            const data = await fetchJSON(
              `/ai/alerts/${alert.id}/analysis`
            );

            return Array.isArray(data) ? data : [];
          } catch (err) {
            // A 404/no-analysis response should not prevent
            // the other alerts from being displayed.
            console.warn(
              `No AI analysis available for alert ${alert.id}:`,
              err.message
            );
            return [];
          }
        })
      );

      setAiAnalyses(results.flat());
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIAnalysis = async (alertId) => {
    if (!alertId) return null;

    setAiGenerating(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/ai/alerts/${alertId}/analyze`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `AI analysis failed for alert ${alertId}`
        );
      }

      const generated = result.data;

      setAiAnalyses((current) => {
        const withoutCurrent = current.filter(
          (item) =>
            String(item.alert_id) !== String(alertId)
        );

        return [...withoutCurrent, generated];
      });

      return generated;
    } catch (err) {
      console.error("AI generation error:", err);
      setError(err.message);
      return null;
    } finally {
      setAiGenerating(false);
    }
  };

  const generateAllMissingAI = async () => {
    const relatedAlerts = report?.alerts || [];

    if (!relatedAlerts.length) return;

    setAiGenerating(true);
    setError("");

    try {
      for (const alert of relatedAlerts) {
        const existing = aiAnalyses.some(
          (analysis) =>
            String(analysis.alert_id) === String(alert.id)
        );

        if (!existing) {
          await generateAIAnalysis(alert.id);
        }
      }

      await loadAIAnalysis(relatedAlerts);
    } finally {
      setAiGenerating(false);
    }
  };

  // Load persisted AI analysis whenever an incident report changes.
  useEffect(() => {
    if (report?.alerts) {
      loadAIAnalysis(report.alerts);
    } else {
      setAiAnalyses([]);
    }
  }, [report]);

  // =========================================================
  // DASHBOARD INCIDENT SELECTION
  // =========================================================

  const handleDashboardIncidentSelect = async (
    id
  ) => {
    await loadIncidentReport(id);
    setActiveSection("incidents");
  };

  const handleResponseIncidentSelect = async (id) => {
    await loadIncidentReport(id);
    setActiveSection("response");
  };

  // =========================================================
  // REPORT SELECTION
  // =========================================================

  const handleReportSelect = async (id) => {
    setActiveSection("reports");

    await loadIncidentReport(id);

    setTimeout(() => {
      reportPreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =========================================================
  // GENERATE RANDOM INCIDENT
  // =========================================================

  const handleGenerateRandomIncident = async () => {
    setGeneratingIncident(true);
    setError("");

    try {
      showToast("Generating simulated cybersecurity incident in database...", "info");

      const response = await fetch(`${API_BASE}/incidents/generate-random`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to generate random incident"
        );
      }

      const newIncident = result.data;
      showToast(`Incident Created: INC-${newIncident.id} · ${newIncident.title}`, "success");

      // Reload incident list and dashboard telemetry
      const [updatedIncidents, updatedDashboard] = await Promise.all([
        fetchJSON("/incidents"),
        fetchJSON("/dashboard/summary"),
      ]);

      setIncidents(
        Array.isArray(updatedIncidents) ? updatedIncidents : []
      );
      setDashboard(updatedDashboard);

      // Select new incident and navigate to reports view
      await loadIncidentReport(newIncident.id);
      setActiveSection("reports");

      setTimeout(() => {
        reportPreviewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      return newIncident;
    } catch (err) {
      console.error("Generate random incident error:", err);
      setError(err.message);
      showToast(`Generation error: ${err.message}`, "error");
      return null;
    } finally {
      setGeneratingIncident(false);
    }
  };

  // =========================================================
  // DOWNLOAD PDF REPORT
  // =========================================================

  const handleDownloadPdf = async (incidentId) => {
    const targetId = incidentId || selectedIncident;
    if (!targetId) return;

    setDownloadingPdf(true);
    setError("");

    try {
      showToast(`Preparing PDF report for INC-${targetId}...`, "info");

      const response = await fetch(
        `${API_BASE}/incidents/${targetId}/report/pdf`
      );

      if (!response.ok) {
        throw new Error(`PDF generation failed (${response.status})`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `SentinelX-Incident-${targetId}-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Downloaded SentinelX-Incident-${targetId}-Report.pdf`, "success");
    } catch (err) {
      console.error("PDF download error:", err);
      setError(err.message);
      showToast(`PDF download failed: ${err.message}`, "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // =========================================================
  // UPDATE INCIDENT DETAILS
  // =========================================================

  const handleUpdateIncidentDetails = async ({
    assigned_to,
    investigation_notes,
  }) => {
    if (!selectedIncident) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/incidents/${selectedIncident}/details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assigned_to,
            investigation_notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update incident details"
        );
      }

      showToast("Incident details updated successfully", "success");
      await loadIncidentReport(selectedIncident);
    } catch (error) {
      console.error(
        "Error updating incident details:",
        error
      );
      showToast(`Update error: ${error.message}`, "error");
    }
  };

  // =========================================================
  // UPDATE INCIDENT STATUS
  // =========================================================

  const handleUpdateIncidentStatus = async (status) => {
    if (!selectedIncident) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/incidents/${selectedIncident}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update incident status"
        );
      }

      showToast(`Incident status updated to ${status}`, "success");
      await loadIncidentReport(selectedIncident);
    } catch (error) {
      console.error(
        "Error updating incident status:",
        error
      );
      showToast(`Status update error: ${error.message}`, "error");
    }
  };
  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    // React StrictMode can run mount effects more than once
    // during development. Guard the initial dashboard request
    // so it can never create duplicate loading loops.
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    loadDashboard();
  }, []);

  // =========================================================
  // ALERT INVESTIGATION EVENT
  // =========================================================

  useEffect(() => {
    const handleInvestigateAlert = async (event) => {
      const alertId = event.detail?.alertId;

      if (!alertId) {
        return;
      }

      try {
        setError("");

        // Read the latest incidents from the ref. This effect
        // is intentionally independent of incidents state so
        // updating the incident list cannot recreate the event
        // listener or trigger additional report requests.
        const currentIncidents = incidentsRef.current;

        for (const incident of currentIncidents) {
          const incidentReport = await fetchJSON(
            `/incidents/${incident.id}/report`
          );

          const relatedAlert = (
            incidentReport?.alerts || []
          ).some(
            (relatedAlert) =>
              String(relatedAlert.id) ===
              String(alertId)
          );

          if (relatedAlert) {
            setReport(incidentReport);
            setSelectedIncident(incident.id);
            setActiveSection("incidents");

            return;
          }
        }

        setError(
          `No incident is associated with alert ${alertId}.`
        );
      } catch (error) {
        console.error(
          "Alert investigation error:",
          error
        );

        setError(error.message);
      }
    };

    window.addEventListener(
      "sentinelx:investigate-alert",
      handleInvestigateAlert
    );

    return () => {
      window.removeEventListener(
        "sentinelx:investigate-alert",
        handleInvestigateAlert
      );
    };
  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const refresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // =========================================================
  // DEDICATED FULL-BROWSER DOCUMENTATION EXPLORER
  // =========================================================

  if (isDocsOpen) {
    return (
      <DocsViewer
        onNavigateHome={handleNavigateHome}
        initialDocId={docsParamId}
      />
    );
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return <LoadingScreen />;
  }

  // =========================================================
  // COMPLETE CONNECTION FAILURE
  // =========================================================

  if (error && !dashboard) {
    return (
      <div className="loading-screen">
        <div className="error-card">
          <XCircle size={42} />

          <h2>
            SentinelX Connection Error
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="sentinel-btn sentinel-btn-primary"
            onClick={loadDashboard}
          >
            <RefreshCw size={15} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary || {};

  return (
    <div className="app">

      <Topbar
        refreshing={refreshing}
        onRefresh={refresh}
        generatingIncident={generatingIncident}
        onGenerateRandomIncident={handleGenerateRandomIncident}
        onNavigateDocs={() => handleNavigateDocs()}
      />

      <div className="dashboard-layout">

        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onNavigateDocs={() => handleNavigateDocs()}
          alertCount={alerts.length}
          incidentCount={incidents.length}
        />

        <main className="main-content">

          {error && (
            <div className="connection-warning">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {activeSection === "dashboard" && (
            <DashboardView
              dashboard={dashboard}
              summary={summary}
              incidents={incidents}
              alerts={alerts}
              responseActions={responseActions}
              report={report}
              onIncidentSelect={
                handleDashboardIncidentSelect
              }
            />
          )}

          {activeSection === "alerts" && (
  <AlertsView
    alerts={alerts}
    onAlertStatusUpdate={(updatedAlert) => {
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          String(alert.id) ===
          String(updatedAlert.id)
            ? { ...alert, ...updatedAlert }
            : alert
        )
      );
    }}
  />
)}

          {activeSection === "incidents" && (
            <IncidentsView
              incidents={incidents}
              report={report}
              aiAnalyses={aiAnalyses}
              selectedIncident={
                selectedIncident
              }
              onIncidentSelect={handleDashboardIncidentSelect}
            />
          )}

          {activeSection === "threat-intel" && (
            <ThreatIntelView
              report={report}
              incidents={incidents}
              selectedIncident={selectedIncident}
              onIncidentSelect={loadIncidentReport}
            />
          )}

          {activeSection === "mitre" && (
            <MitreView
              report={report}
              incidents={incidents}
              selectedIncident={selectedIncident}
              onIncidentSelect={loadIncidentReport}
            />
          )}

          {activeSection === "ai" && (
            <AIView
              report={report}
              incidents={incidents}
              selectedIncident={selectedIncident}
              onIncidentSelect={loadIncidentReport}
              analyses={aiAnalyses}
              loading={aiLoading}
              generating={aiGenerating}
              onGenerate={generateAIAnalysis}
              onGenerateAll={generateAllMissingAI}
              onRefresh={loadAIAnalysis}
            />
          )}

          {activeSection === "response" && (
            <ResponseView
              responseActions={responseActions}
              incidents={incidents}
              report={report}
              selectedIncident={selectedIncident}
              onIncidentSelect={handleResponseIncidentSelect}
              onCreateAction={createResponseAction}
              onExecuteAction={executeResponseAction}
              onRefresh={loadResponseActions}
              aiAnalyses={aiAnalyses}
            />
          )}

          {activeSection === "reports" && (
            <ReportsView
              incidents={incidents}
              report={report}
              selectedIncident={selectedIncident}
              onIncidentSelect={handleReportSelect}
              reportPreviewRef={reportPreviewRef}
              onUpdateIncidentDetails={handleUpdateIncidentDetails}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onCreateAction={createResponseAction}
              onExecuteAction={executeResponseAction}
              aiAnalyses={aiAnalyses}
              onGenerateRandomIncident={handleGenerateRandomIncident}
              generatingIncident={generatingIncident}
              onDownloadPdf={handleDownloadPdf}
              downloadingPdf={downloadingPdf}
            />
          )}

          {activeSection === "logs" && (
            <LogsView
              logs={normalizedLogs}
              sources={logSources}
            />
          )}

        </main>
      </div>

      {toast && (
        <div className="sentinel-toast-container">
          <div className={`sentinel-toast sentinel-toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertTriangle size={16} />}
            {toast.type === "info" && <Dices size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// LOADING SCREEN
// =========================================================

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-card">

        <div className="loading-logo">
          <Shield size={30} />
        </div>

        <h2>SentinelX</h2>

        <p>
          Initializing Security Operations Center...
        </p>

        <div className="loading-bar">
          <span />
        </div>

      </div>
    </div>
  );
}

// =========================================================
// TOPBAR
// =========================================================

function Topbar({
  refreshing,
  onRefresh,
  generatingIncident,
  onGenerateRandomIncident,
  onNavigateDocs,
}) {
  return (
    <header className="topbar">

      <div className="brand">

        <div className="brand-mark">
          <Shield size={21} />
        </div>

        <div>
          <h1>SentinelX</h1>

          <p>
            AI-Powered Security Operations Center
          </p>
        </div>

      </div>

      <div className="topbar-right">

        <div className="system-status">
          <span className="status-dot" />
          <span>
            All Systems Operational
          </span>
        </div>

        <button
          type="button"
          className="docs-nav-btn"
          onClick={onNavigateDocs}
          title="Open SentinelX full-screen documentation explorer"
        >
          <BookOpen size={14} />
          Documentation
        </button>

        <button
          type="button"
          className="generate-btn"
          onClick={onGenerateRandomIncident}
          disabled={generatingIncident}
          title="Simulate and persist a realistic random cybersecurity incident"
        >
          <Dices
            size={14}
            className={generatingIncident ? "spin" : ""}
          />
          {generatingIncident ? "Generating..." : "Generate Incident"}
        </button>

        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            className={
              refreshing ? "spin" : ""
            }
          />

          Refresh
        </button>

      </div>

    </header>
  );
}

// =========================================================
// SIDEBAR
// =========================================================

function Sidebar({
  activeSection,
  setActiveSection,
  onNavigateDocs,
  alertCount,
  incidentCount,
}) {
  const navigation = [
    {
      label: "SOC",
      items: [
        [
          "dashboard",
          "Dashboard",
          LayoutDashboard,
        ],
        [
          "alerts",
          "Alerts",
          ShieldAlert,
          alertCount,
        ],
        [
          "incidents",
          "Incidents",
          Siren,
          incidentCount,
        ],
      ],
    },

    {
      label: "INTELLIGENCE",
      items: [
        [
          "threat-intel",
          "Threat Intelligence",
          Globe,
        ],
        [
          "mitre",
          "MITRE ATT&CK",
          Target,
        ],
        [
          "ai",
          "AI Analysis",
          BrainCircuit,
        ],
      ],
    },

    {
      label: "RESPONSE",
      items: [
        [
          "response",
          "Response Actions",
          Zap,
        ],
        [
          "reports",
          "Reports",
          FileText,
        ],
        [
          "logs",
          "Normalized Logs",
          Terminal,
        ],
      ],
    },

    {
      label: "SYSTEM",
      items: [
        [
          "docs",
          "Documentation",
          BookOpen,
        ],
      ],
    },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-navigation">

        {navigation.map((group) => (
          <div
            className="sidebar-section"
            key={group.label}
          >

            <div className="section-label">
              {group.label}
            </div>

            {group.items.map(
              ([
                id,
                label,
                Icon,
                count,
              ]) => (
                <button
                  key={id}
                  className={`nav-item ${
                    activeSection === id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (id === "docs") {
                      onNavigateDocs?.();
                    } else {
                      setActiveSection(id);
                    }
                  }}
                >

                  <Icon size={16} />

                  <span>{label}</span>

                  {count !== undefined && (
                    <span className="nav-count">
                      {count}
                    </span>
                  )}

                </button>
              )
            )}

          </div>
        ))}

      </div>

      <div className="sidebar-bottom">

        <EngineStatus
          icon={Activity}
          title="Detection Engine"
          status="Online"
        />

        <EngineStatus
          icon={Bot}
          title="AI Engine"
          status="OpenRouter"
        />

        <EngineStatus
          icon={DatabaseIcon}
          title="PostgreSQL"
          status="Connected"
        />

      </div>

    </aside>
  );
}

// =========================================================
// ENGINE STATUS
// =========================================================

function EngineStatus({
  icon: Icon,
  title,
  status,
}) {
  return (
    <div className="engine-status">

      <Icon size={15} />

      <div>
        <strong>{title}</strong>
        <small>{status}</small>
      </div>

      <span className="engine-dot" />

    </div>
  );
}

function DatabaseIcon(props) {
  return <Server {...props} />;
}

// =========================================================
// PAGE HEADER
// =========================================================

function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="page-header">

      <div>

        <div className="breadcrumb">
          SENTINELX / {eyebrow}
        </div>

        <h2>{title}</h2>

        <p>{description}</p>

      </div>

      <div className="live-indicator">
        <span />
        LIVE
      </div>

    </div>
  );
}

// =========================================================
// DASHBOARD
// =========================================================

function DashboardView({
  dashboard,
  summary,
  incidents,
  alerts,
  responseActions,
  report,
  onIncidentSelect,
}) {
  const severityData =
    dashboard?.alert_severity || [];

  return (
    <>
      <PageHeader
        eyebrow="SOC / DASHBOARD"
        title="Security Operations Dashboard"
        description="Real-time security monitoring, detection and incident response"
      />

      <section className="metrics-grid">

        <MetricCard
          icon={Activity}
          title="Total Logs"
          value={
            summary.total_logs || 0
          }
          type="blue"
        />

        <MetricCard
          icon={ShieldAlert}
          title="Active Alerts"
          value={
            summary.total_alerts || 0
          }
          type="warning"
        />

        <MetricCard
          icon={Siren}
          title="High Priority"
          value={
            summary.high_priority_alerts || 0
          }
          type="danger"
        />

        <MetricCard
          icon={Gauge}
          title="Average Risk"
          value={
            summary.average_risk_score || 0
          }
          suffix="/100"
          type="purple"
        />

        <MetricCard
          icon={AlertTriangle}
          title="Open Incidents"
          value={
            summary.open_incidents || 0
          }
          type="danger"
        />

        <MetricCard
          icon={CheckCircle2}
          title="Completed Responses"
          value={
            summary.completed_responses || 0
          }
          type="success"
        />

      </section>

      <div className="dashboard-grid">

        <section className="panel">

          <PanelTitle
            icon={ShieldAlert}
            title="Alert Severity Distribution"
          />

          <SeverityChart
            data={severityData}
          />

        </section>

        <section className="panel">

          <PanelTitle
            icon={Siren}
            title="Active Incidents"
            count={incidents.length}
          />

          <IncidentTable
            incidents={incidents.slice(0, 5)}
            onSelect={
              onIncidentSelect
            }
          />

        </section>

      </div>

      <div className="dashboard-grid">

        <section className="panel">

          <PanelTitle
            icon={AlertTriangle}
            title="Recent Alerts"
            count={alerts.length}
          />

          <AlertTable
            alerts={alerts.slice(0, 6)}
          />

        </section>

        <section className="panel">

          <PanelTitle
            icon={Zap}
            title="Response Activity"
            count={
              responseActions.length
            }
          />

          <ResponseList
            actions={
              responseActions.slice(0, 5)
            }
          />

        </section>

      </div>

      {report && (
        <IncidentSummary
          report={report}
        />
      )}
    </>
  );
}

// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({
  icon: Icon,
  title,
  value,
  suffix,
  type,
}) {
  return (
    <div
      className={`metric-card ${type}`}
    >

      <div className="metric-top">
        <span>{title}</span>
        <Icon size={17} />
      </div>

      <div className="metric-value">

        {value}

        {suffix && (
          <small>{suffix}</small>
        )}

      </div>

      <div className="metric-line" />

    </div>
  );
}

// =========================================================
// PANEL TITLE
// =========================================================

function PanelTitle({
  icon: Icon,
  title,
  count,
}) {
  return (
    <div className="panel-title">

      <div>
        <Icon size={16} />
        <h3>{title}</h3>
      </div>

      {count !== undefined && (
        <span className="panel-count">
          {count}
        </span>
      )}

    </div>
  );
}

// =========================================================
// SEVERITY CHART
// =========================================================

function SeverityChart({ data }) {
  if (!data.length) {
    return (
      <EmptyState
        text="No severity data available"
      />
    );
  }

  const max = Math.max(
    ...data.map((item) =>
      Number(item.count)
    )
  );

  return (
    <div className="severity-chart">

      {data.map((item) => {
        const count = Number(
          item.count
        );

        return (
          <div
            className="severity-row"
            key={item.severity}
          >

            <div className="severity-label">

              <SeverityDot
                severity={
                  item.severity
                }
              />

              <span>
                {item.severity}
              </span>

            </div>

            <div className="severity-bar">

              <span
                style={{
                  width: `${Math.max(
                    (count / max) *
                      100,
                    4
                  )}%`,
                }}
                className={`severity-fill ${item.severity}`}
              />

            </div>

            <strong>{count}</strong>

          </div>
        );
      })}

    </div>
  );
}

function SeverityDot({
  severity,
}) {
  return (
    <span
      className={`severity-dot ${severity}`}
    />
  );
}

// =========================================================
// INCIDENT TABLE
// =========================================================

function IncidentTable({
  incidents,
  onSelect,
}) {
  if (!incidents.length) {
    return (
      <EmptyState
        text="No incidents found"
      />
    );
  }

  return (
    <div className="table-list">

      {incidents.map((incident) => (
        <button
          className="table-row incident-row"
          key={incident.id}
          onClick={() =>
            onSelect(incident.id)
          }
          type="button"
        >

          <div>
            <strong>
              {incident.title}
            </strong>

            <small>
              INC-{incident.id}
            </small>
          </div>

          <span
            className={`severity-badge ${incident.severity}`}
          >
            {incident.severity}
          </span>

          <span
            className={`status-badge ${incident.status}`}
          >
            {incident.status}
          </span>

          <ChevronRight size={15} />

        </button>
      ))}

    </div>
  );
}

// =========================================================
// ALERT TABLE
// =========================================================

function AlertTable({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        text="No alerts found"
      />
    );
  }

  return (
    <div className="table-list">

      {alerts.map((alert) => (
        <div
          className="table-row"
          key={alert.id}
        >

          <div className="row-icon danger-icon">
            <AlertTriangle size={14} />
          </div>

          <div className="row-main">

            <strong>
              {alert.title}
            </strong>

            <small>
              {alert.alert_type} ·{" "}
              {alert.detection_rule}
            </small>

          </div>

          <span
            className={`severity-badge ${alert.severity}`}
          >
            {alert.severity}
          </span>

          <span className="risk-score">
            {alert.risk_score}
          </span>

        </div>
      ))}

    </div>
  );
}

// =========================================================
// RESPONSE LIST
// =========================================================

function ResponseList({
  actions,
  onExecute,
}) {
  if (!actions.length) {
    return (
      <EmptyState
        text="No response actions found"
      />
    );
  }

  return (
    <div className="table-list">

      {actions.map((action) => (
        <div
          className={`response-row ${onExecute ? "has-action" : ""}`}
          key={action.id}
        >

          <div className="response-check">

            {action.status ===
            "completed" ? (
              <CheckCircle2
                size={15}
              />
            ) : (
              <CircleDot size={15} />
            )}

          </div>

          <div>

            <strong>
              {formatAction(
                action.action_type
              )}
            </strong>

            <small>
              {action.description}
            </small>

          </div>

          <span
            className={`status-badge ${action.status}`}
          >
            {action.status}
          </span>

          {onExecute && action.status !== "completed" && (
            <button
              className="response-execute-btn"
              type="button"
              onClick={() => onExecute(action.id)}
              title="Simulate this response action"
            >
              <Zap size={12} />
              Execute
            </button>
          )}

        </div>
      ))}

    </div>
  );
}

// =========================================================
// INCIDENT SUMMARY
// =========================================================

function IncidentSummary({
  report,
}) {
  const incident =
    report?.incident;

  if (!incident) {
    return null;
  }

  return (
    <section className="incident-highlight">

      <div>

        <span className="eyebrow">
          LATEST INCIDENT
        </span>

        <h3>{incident.title}</h3>

        <p>
          {incident.description}
        </p>

      </div>

      <div className="incident-highlight-meta">

        <span
          className={`severity-badge ${incident.severity}`}
        >
          {incident.severity}
        </span>

        <strong>
          Risk {incident.priority}/100
        </strong>

      </div>

    </section>
  );
}

// =========================================================
// ALERTS PAGE
// =========================================================

function AlertsView({
  alerts,
  onAlertStatusUpdate,
}) {
  const [updatingAlert, setUpdatingAlert] =
    useState(null);

  const updateAlertStatus = async (
    alertId,
    status
  ) => {
    try {
      setUpdatingAlert(alertId);

      const response = await fetch(
        `${API_BASE}/alerts/${alertId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to update alert status"
        );
      }

      if (onAlertStatusUpdate) {
  onAlertStatusUpdate(result.data);
}
setUpdatingAlert(null);
    } catch (error) {
      console.error(
        "Alert status update error:",
        error
      );

      alert(
        error.message ||
          "Failed to update alert status"
      );

      setUpdatingAlert(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="SOC / ALERTS"
        title="Security Alerts"
        description="Detected suspicious activity across monitored sources"
      />

      <section className="panel">

        <PanelTitle
          icon={ShieldAlert}
          title="Detection Alerts"
          count={alerts.length}
        />

        <div className="full-alert-list">

          {alerts.length ? (
            alerts.map((alert) => (
              <div
                className="alert-card"
                key={alert.id}
              >

                <div className="alert-card-icon">
                  <AlertTriangle
                    size={18}
                  />
                </div>

                <div className="alert-card-main">

                  <div className="alert-card-header">

                    <div>

                      <h3>
                        {alert.title}
                      </h3>

                      <span>
                        {alert.detection_rule}
                      </span>

                    </div>

                    <span
                      className={`severity-badge ${alert.severity}`}
                    >
                      {alert.severity}
                    </span>

                  </div>

                  <p>
                    {alert.description}
                  </p>

                  <div className="alert-meta-grid">

                    <Detail
                      label="Type"
                      value={
                        alert.alert_type
                      }
                    />

                    <Detail
                      label="Risk"
                      value={
                        alert.risk_score
                      }
                    />

                    <Detail
                      label="Status"
                      value={
                        alert.status
                      }
                    />

                    <Detail
                      label="Detected"
                      value={formatDate(
                        alert.detected_at
                      )}
                    />

                  </div>

                  {/* ALERT ACTIONS */}

                  <div className="alert-actions">

  {alert.status === "new" && (
    <button
      type="button"
      className="alert-action-btn acknowledge"
      disabled={updatingAlert === alert.id}
      onClick={() =>
        updateAlertStatus(
          alert.id,
          "acknowledged"
        )
      }
    >
      <CheckCircle2 size={13} />
      {updatingAlert === alert.id
        ? "Updating..."
        : "Acknowledge"}
    </button>
  )}

  {alert.status === "acknowledged" && (
    <>
      <span className="alert-acknowledged">
        <CheckCircle2 size={12} />
        Acknowledged
      </span>

      <button
        type="button"
        className="alert-action-btn investigate"
        disabled={updatingAlert === alert.id}
        onClick={() =>
          updateAlertStatus(
            alert.id,
            "investigating"
          )
        }
      >
        <ShieldAlert size={13} />
        {updatingAlert === alert.id
          ? "Updating..."
          : "Start Investigation"}
      </button>
    </>
  )}

  {alert.status === "investigating" && (
    <>
      <span className="alert-investigating">
        ● Investigating
      </span>

      <button
        type="button"
        className="alert-action-btn resolve"
        disabled={updatingAlert === alert.id}
        onClick={() =>
          updateAlertStatus(
            alert.id,
            "resolved"
          )
        }
      >
        <CheckCircle2 size={13} />
        {updatingAlert === alert.id
          ? "Updating..."
          : "Resolve Alert"}
      </button>
    </>
  )}

  {alert.status === "resolved" && (
    <span className="alert-resolved">
      <CheckCircle2 size={12} />
      Resolved
    </span>
  )}

  <button
    type="button"
    className="alert-action-btn investigate"
    onClick={() => {
      window.dispatchEvent(
        new CustomEvent(
          "sentinelx:investigate-alert",
          {
            detail: {
              alertId: alert.id,
            },
          }
        )
      );
    }}
  >
    <ShieldAlert size={13} />
    Investigate
  </button>

</div>

                </div>

              </div>
            ))
          ) : (
            <EmptyState
              text="No alerts detected"
            />
          )}

        </div>

      </section>
    </>
  );
}

// =========================================================
// INCIDENTS PAGE
// =========================================================

function IncidentsView({
  incidents,
  report,
  selectedIncident,
  onIncidentSelect,
  aiAnalyses,
}) {
  return (
    <>
      <PageHeader
        eyebrow="SOC / INCIDENTS"
        title="Incident Investigation"
        description="Investigate, enrich and respond to security incidents"
      />

      <div className="incident-layout">

        <section className="panel incident-list-panel">

          <PanelTitle
            icon={Siren}
            title="Incidents"
            count={incidents.length}
          />

          {incidents.map(
            (incident) => (
              <button
                className={`incident-select ${
                  selectedIncident ===
                  incident.id
                    ? "selected"
                    : ""
                }`}
                key={incident.id}
                onClick={() =>
                  onIncidentSelect(
                    incident.id
                  )
                }
                type="button"
              >

                <div>

                  <strong>
                    {incident.title}
                  </strong>

                  <small>
                    INC-{incident.id} ·{" "}
                    {incident.alert_count ||
                      0}{" "}
                    alerts
                  </small>

                </div>

                <span
                  className={`severity-badge ${incident.severity}`}
                >
                  {incident.severity}
                </span>

              </button>
            )
          )}

        </section>

        <section className="panel">

          {report ? (
            <IncidentInvestigation
              report={report}
              aiAnalyses={aiAnalyses}
            />
          ) : (
            <EmptyState
              text="Select an incident to investigate"
            />
          )}

        </section>

      </div>
    </>
  );
}

// =========================================================
// INCIDENT INVESTIGATION
// =========================================================

// =========================================================
// INCIDENT INVESTIGATION
// =========================================================

function IncidentInvestigation({
  report,
  aiAnalyses = [],
}) {
  const {
    incident,
    alerts = [],
    logs = [],
    mitre_attack = [],
    threat_intelligence = [],
    response_actions = [],
    ai_analysis = [],
    timeline = [],
  } = report;

  const ai = ai_analysis[0] || aiAnalyses[0];

  return (
    <div className="investigation">

      {/* HEADER */}

      <div className="investigation-header">

        <div>

          <span className="eyebrow">
            INC-{incident.id}
          </span>

          <h3>
            {incident.title}
          </h3>

        </div>

        <div className="incident-badges">

          <span
            className={`severity-badge ${incident.severity}`}
          >
            {incident.severity}
          </span>

          <span
            className={`status-badge ${incident.status}`}
          >
            {incident.status}
          </span>

        </div>

      </div>

      {/* DESCRIPTION */}

      <p className="investigation-description">
        {incident.description}
      </p>

      {/* DETAILS */}

      <div className="detail-grid">

        <Detail
          label="Priority"
          value={incident.priority}
        />

        <Detail
          label="Assigned To"
          value={
            incident.assigned_to ||
            "Unassigned"
          }
        />

        <Detail
          label="Opened"
          value={formatDate(
            incident.opened_at
          )}
        />

        <Detail
          label="Alerts"
          value={alerts.length}
        />

      </div>

      <div className="investigation-sections">

        {/* ================================================= */}
        {/* INCIDENT TIMELINE */}
        {/* ================================================= */}

        <InvestigationBlock
          title="Incident Timeline"
          icon={Clock3}
        >

          {timeline.length ? (

            <div className="timeline-list">

              {timeline.map(
                (event, index) => (

                  <div
                    className="timeline-item"
                    key={`${event.event_type}-${event.reference_id}-${index}`}
                  >

                    <div className="timeline-marker">
                      <span />
                    </div>

                    <div className="timeline-content">

                      <div className="timeline-header">

                        <strong>
                          {event.event_title}
                        </strong>

                        <span className="timeline-type">
                          {event.event_type}
                        </span>

                      </div>

                      <small>
                        {formatDate(
                          event.event_time
                        )}
                      </small>

                      <p>
                        {event.event_description}
                      </p>

                      <div className="timeline-meta">

                        {event.status && (
                          <span
                            className={`status-badge ${event.status}`}
                          >
                            {event.status}
                          </span>
                        )}

                        {event.severity && (
                          <span
                            className={`severity-badge ${event.severity}`}
                          >
                            {event.severity}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <EmptyState
              text="No timeline events available"
            />

          )}

        </InvestigationBlock>
          {/* ================================================= */}
{/* ASSOCIATED NORMALIZED LOGS */}
{/* ================================================= */}

<InvestigationBlock
  title="Associated Normalized Logs"
  icon={Terminal}
>
  {logs.length ? (
    <div className="intel-list">

      {logs.map((log, index) => (
        <div
          className="intel-row"
          key={log.id || index}
        >

          <code>
            {log.event_type || "security_event"}
          </code>

          <div>

            <strong>
              {log.message ||
                log.action ||
                "Security event"}
            </strong>

            <small>
              {log.source_ip || "Unknown source"}
              {" → "}
              {log.destination_ip || "Unknown destination"}
              {" · "}
              {log.protocol || "Unknown protocol"}
            </small>

            <small>
              Username: {log.username || "—"}
              {" · "}
              Hostname: {log.hostname || "—"}
            </small>

            <small>
              Ports: {log.source_port || "—"}
              {" → "}
              {log.destination_port || "—"}
              {" · "}
              Action: {log.action || "—"}
            </small>

            {log.raw_log && (
              <small>
                Raw: {log.raw_log}
              </small>
            )}

          </div>

          {log.severity && (
            <span
              className={`severity-badge ${log.severity}`}
            >
              {log.severity}
            </span>
          )}

        </div>
      ))}

    </div>
  ) : (
    <EmptyState
      text="No normalized logs linked to this incident"
    />
  )}
</InvestigationBlock>
        {/* ================================================= */}
        {/* MITRE */}

<InvestigationBlock
  title="MITRE ATT&CK"
  icon={Target}
>
  {mitre_attack.length ? (
    mitre_attack.map(
      (item, index) => (
        <div
          className="intel-row"
          key={index}
        >

          <code>
            {item.technique_id}
          </code>

          <div>

            <strong>
              {item.technique_name}
            </strong>

            <small>
              {item.tactic_name}
            </small>

          </div>

        </div>
      )
    )
  ) : (
    <EmptyState
      text="No MITRE mapping"
    />
  )}
</InvestigationBlock>

        {/* ================================================= */}
        {/* THREAT INTELLIGENCE */}
        {/* ================================================= */}

        <InvestigationBlock
          title="Threat Intelligence"
          icon={Globe}
        >

          {threat_intelligence.length ? (

            threat_intelligence.map(
              (item, index) => (

                <div
                  className="intel-row"
                  key={index}
                >

                  <code>
                    {item.indicator_type}
                  </code>

                  <div>

                    <strong>
                      {item.indicator_value}
                    </strong>

                    <small>
                      {item.source} ·{" "}
                      Confidence{" "}
                      {item.confidence}%
                    </small>

                  </div>

                </div>

              )
            )

          ) : (

            <EmptyState
              text="No threat intelligence"
            />

          )}

        </InvestigationBlock>

        {/* ================================================= */}
        {/* AI SECURITY ANALYSIS */}
        {/* ================================================= */}

        {ai && (

          <InvestigationBlock
            title="AI Security Analysis"
            icon={BrainCircuit}
          >

            <div className="ai-summary">

              <div className="ai-provider">

                <Bot size={14} />

                {ai.provider} ·{" "}
                {ai.model_name}

              </div>

              <h4>
                Threat Assessment
              </h4>

              <p>
                {ai.threat_assessment}
              </p>

              <h4>
                Risk Explanation
              </h4>

              <p>
                {ai.risk_explanation}
              </p>

            </div>

          </InvestigationBlock>

        )}

        {/* ================================================= */}
        {/* RESPONSE ACTIONS */}
        {/* ================================================= */}

        <InvestigationBlock
          title="Response Actions"
          icon={Zap}
        >

          <ResponseList
            actions={response_actions}
          />

        </InvestigationBlock>

      </div>

    </div>
  );
}

// =========================================================
// THREAT INTELLIGENCE
// =========================================================

function ThreatIntelView({
  report,
  incidents,
  selectedIncident,
  onIncidentSelect,
}) {
  const intelligence =
    report?.threat_intelligence ||
    [];

  return (
    <>
      <PageHeader
        eyebrow="INTELLIGENCE / THREAT INTEL"
        title="Threat Intelligence"
        description="Indicators and enrichment associated with detected threats"
      />

      <section className="panel response-control-panel">
        <div className="response-control-header">
          <div>
            <span className="eyebrow">ACTIVE INCIDENT</span>
            <h3>
              {report?.incident
                ? `INC-${report.incident.id} · ${report.incident.title}`
                : "Select an incident"}
            </h3>
            <p>Choose an incident to view its threat intelligence indicators.</p>
          </div>

          <div className="response-control-actions">
            <Select
              className="response-select"
              value={selectedIncident || ""}
              placeholder="Choose incident"
              onChange={(id) => {
                if (id) onIncidentSelect(id);
              }}
              options={[
                { value: "", label: "Choose incident" },
                ...incidents.map((incident) => ({
                  value: incident.id,
                  label: `INC-${incident.id} · ${incident.title}`,
                  title: `INC-${incident.id} · ${incident.title}`,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      <section className="panel">

        <PanelTitle
          icon={Globe}
          title="Threat Intelligence Indicators"
          count={
            intelligence.length
          }
        />

        {intelligence.length ? (
          <div className="intel-grid">

            {intelligence.map(
              (item, index) => (
                <div
                  className="intel-large-card"
                  key={index}
                >

                  <div className="intel-card-top">

                    <span>
                      {item.indicator_type}
                    </span>

                    <span className="suspicious">
                      {item.reputation}
                    </span>

                  </div>

                  <code>
                    {item.indicator_value}
                  </code>

                  <h4>
                    {item.threat_name}
                  </h4>

                  <p>
                    {item.description}
                  </p>

                  <div className="intel-card-footer">

                    <span>
                      Source:{" "}
                      <strong>
                        {item.source}
                      </strong>
                    </span>

                    <span>
                      Confidence:{" "}
                      <strong>
                        {item.confidence}%
                      </strong>
                    </span>

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <EmptyState
            text="No threat intelligence available"
          />
        )}

      </section>
    </>
  );
}

// =========================================================
// MITRE
// =========================================================

function MitreView({
  report,
  incidents,
  selectedIncident,
  onIncidentSelect,
}) {
  const mappings =
    report?.mitre_attack || [];

  return (
    <>
      <PageHeader
        eyebrow="INTELLIGENCE / MITRE"
        title="MITRE ATT&CK Mapping"
        description="Map detected behavior to adversary tactics and techniques"
      />

      <section className="panel response-control-panel">
        <div className="response-control-header">
          <div>
            <span className="eyebrow">ACTIVE INCIDENT</span>
            <h3>
              {report?.incident
                ? `INC-${report.incident.id} · ${report.incident.title}`
                : "Select an incident"}
            </h3>
            <p>Choose an incident to view its MITRE ATT&CK mappings.</p>
          </div>

          <div className="response-control-actions">
            <Select
              className="response-select"
              value={selectedIncident || ""}
              placeholder="Choose incident"
              onChange={(id) => {
                if (id) onIncidentSelect(id);
              }}
              options={[
                { value: "", label: "Choose incident" },
                ...incidents.map((incident) => ({
                  value: incident.id,
                  label: `INC-${incident.id} · ${incident.title}`,
                  title: `INC-${incident.id} · ${incident.title}`,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      <section className="panel">

        <PanelTitle
          icon={Target}
          title="Technique Mappings"
          count={mappings.length}
        />

        {mappings.length ? (
          <div className="mitre-grid">

            {mappings.map(
              (item, index) => (
                <div
                  className="mitre-card"
                  key={index}
                >

                  <div className="mitre-technique">
                    {item.technique_id}
                  </div>

                  <h3>
                    {item.technique_name}
                  </h3>

                  <span>
                    {item.tactic_id} ·{" "}
                    {item.tactic_name}
                  </span>

                  <p>
                    {item.description}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <EmptyState
            text="No MITRE mappings available"
          />
        )}

      </section>
    </>
  );
}

// =========================================================
// AI ANALYSIS
// =========================================================

function AIView({
  report,
  incidents,
  selectedIncident,
  onIncidentSelect,
  analyses,
  loading,
  generating,
  onGenerate,
  onGenerateAll,
  onRefresh,
}) {
  const incidentAlerts = report?.alerts || [];
  const analysisByAlert = new Map(
    analyses.map((analysis) => [
      String(analysis.alert_id),
      analysis,
    ])
  );

  const missingAlerts = incidentAlerts.filter(
    (alert) =>
      !analysisByAlert.has(String(alert.id))
  );

  return (
    <>
      <PageHeader
        eyebrow="INTELLIGENCE / AI"
        title="AI Security Analysis"
        description="AI-assisted threat assessment and investigation guidance"
      />

      <section className="panel response-control-panel">
        <div className="response-control-header">
          <div>
            <span className="eyebrow">ACTIVE INCIDENT</span>
            <h3>
              {report?.incident
                ? `INC-${report.incident.id} · ${report.incident.title}`
                : "Select an incident"}
            </h3>
            <p>Choose an incident to view or generate its AI security analysis.</p>
          </div>

          <div className="response-control-actions">
            <Select
              className="response-select"
              value={selectedIncident || ""}
              placeholder="Choose incident"
              onChange={(id) => {
                if (id) onIncidentSelect(id);
              }}
              options={[
                { value: "", label: "Choose incident" },
                ...incidents.map((incident) => ({
                  value: incident.id,
                  label: `INC-${incident.id} · ${incident.title}`,
                  title: `INC-${incident.id} · ${incident.title}`,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      {!report ? (
        <section className="panel ai-empty-panel">
          <BrainCircuit size={28} />
          <h3>Select an incident first</h3>
          <p>
            Choose an incident above to analyze its associated alerts with OpenRouter AI.
          </p>
        </section>
      ) : (
        <>
          <section className="panel ai-context-panel">
            <div className="ai-context-info">
              <div>
                <span className="eyebrow">
                  SELECTED INCIDENT
                </span>
                <h3>{report.incident?.title}</h3>
                <p>
                  INC-{report.incident?.id} ·{" "}
                  {incidentAlerts.length} associated alert
                  {incidentAlerts.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="ai-action-group">
                {missingAlerts.length > 0 && (
                  <button
                    className="ai-action-btn"
                    type="button"
                    onClick={onGenerateAll}
                    disabled={generating}
                  >
                    <BrainCircuit size={15} />
                    {generating
                      ? "Generating..."
                      : `Analyze ${missingAlerts.length} Alert${
                          missingAlerts.length === 1 ? "" : "s"
                        }`}
                  </button>
                )}

                <button
                  className="ai-secondary-btn"
                  type="button"
                  onClick={() =>
                    onRefresh(incidentAlerts)
                  }
                  disabled={loading || generating}
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "spin" : ""}
                  />
                  Refresh AI
                </button>
              </div>
            </div>
          </section>

          {loading && !analyses.length ? (
            <section className="panel">
              <div className="ai-loading">
                <BrainCircuit size={24} />
                <strong>Loading AI analysis...</strong>
                <span>
                  Reading persisted SentinelX AI results.
                </span>
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
              <h3>No AI analysis generated yet</h3>
              <p>
                SentinelX has the incident and alert context,
                but no saved AI assessment exists yet.
              </p>

              {incidentAlerts.length > 0 && (
                <button
                  className="ai-action-btn"
                  type="button"
                  onClick={() =>
                    onGenerate(incidentAlerts[0].id)
                  }
                  disabled={generating}
                >
                  <BrainCircuit size={15} />
                  {generating
                    ? "Generating..."
                    : "Generate AI Analysis"}
                </button>
              )}
            </section>
          )}

          {missingAlerts.length > 0 && analyses.length > 0 && (
            <section className="panel ai-missing-panel">
              <AlertTriangle size={16} />
              <span>
                {missingAlerts.length} associated alert
                {missingAlerts.length === 1 ? " has" : "s have"} no
                saved AI analysis yet.
              </span>
            </section>
          )}
        </>
      )}
    </>
  );
}

// =========================================================
// AI ANALYSIS CARD
// =========================================================

function AIAnalysisCard({
  ai,
  incidentAlerts,
  onGenerate,
  generating,
}) {
  const alert = incidentAlerts.find(
    (item) =>
      String(item.id) === String(ai.alert_id)
  );

  return (
    <section className="panel ai-analysis-card">
      <div className="ai-analysis-header">
        <div>
          <span className="eyebrow">AI ANALYSIS</span>
          <h3>
            Alert #{ai.alert_id}
            {alert?.detection_rule
              ? ` · ${alert.detection_rule}`
              : ""}
          </h3>
        </div>

        <div className="ai-provider">
          <span className="ai-dot" />
          <Bot size={14} />
          {ai.provider || "OpenRouter"} ·{" "}
          {ai.model_name || "AI Model"}
        </div>
      </div>

      {alert && (
        <div className="ai-alert-context">
          <span className={`severity-badge ${alert.severity}`}>
            {alert.severity}
          </span>
          <span className="risk-score">
            Risk {alert.risk_score}
          </span>
          <span>{alert.title}</span>
        </div>
      )}

      <div className="ai-analysis-grid">
        <AIBlock
          title="Summary"
          text={ai.summary}
        />

        <AIBlock
          title="Threat Assessment"
          text={ai.threat_assessment}
        />

        <AIBlock
          title="Risk Explanation"
          text={ai.risk_explanation}
        />

        <div className="ai-block">
          <h4>Investigation Steps</h4>
          <ol>
            {(ai.investigation_steps || []).map(
              (step, index) => (
                <li key={index}>{step}</li>
              )
            )}
          </ol>
        </div>

        <div className="ai-block">
          <h4>Recommended Response</h4>
          <ol>
            {(ai.recommended_response || []).map(
              (step, index) => (
                <li key={index}>{step}</li>
              )
            )}
          </ol>
        </div>
      </div>

      <div className="ai-card-footer">
        <span>
          Generated{" "}
          {ai.created_at
            ? formatDate(ai.created_at)
            : "—"}
        </span>

        <button
          className="ai-secondary-btn"
          type="button"
          onClick={() => onGenerate(ai.alert_id)}
          disabled={generating}
        >
          <RefreshCw size={13} />
          Regenerate
        </button>
      </div>
    </section>
  );
}

// =========================================================
// AI BLOCK
// =========================================================

function AIBlock({
  title,
  text,
}) {
  return (
    <div className="ai-block">

      <h4>{title}</h4>

      <p>{text}</p>

    </div>
  );
}

// =========================================================
// RESPONSE PAGE
// =========================================================

function ResponseView({
  responseActions,
  incidents,
  report,
  selectedIncident,
  onIncidentSelect,
  onCreateAction,
  onExecuteAction,
  onRefresh,
  aiAnalyses = [],
}) {
  const [actionType, setActionType] = useState("Block Source IP");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedActions = selectedIncident
    ? responseActions.filter(
        (action) => String(action.incident_id) === String(selectedIncident)
      )
    : responseActions;

  const selectedIncidentData = incidents.find(
    (incident) => String(incident.id) === String(selectedIncident)
  );

  const responseRecommendations = (report?.alerts || [])
    .flatMap((alert) =>
      aiAnalyses.find(
        (analysis) => String(analysis.alert_id) === String(alert.id)
      )?.recommended_response || []
    );

  const submitAction = async (event) => {
    event.preventDefault();

    if (!selectedIncident || !description.trim()) return;

    setCreating(true);
    const created = await onCreateAction({
      incidentId: selectedIncident,
      actionType,
      description: description.trim(),
    });
    setCreating(false);

    if (created) {
      setDescription("");
    }
  };

  const applyRecommendation = (recommendation) => {
    setDescription(recommendation);
    setActionType(inferActionType(recommendation));
  };

  return (
    <>
      <PageHeader
        eyebrow="RESPONSE / ACTIONS"
        title="Response Actions"
        description="Create, review and simulate incident response actions"
      />

      <section className="panel response-control-panel">
        <div className="response-control-header">
          <div>
            <span className="eyebrow">ACTIVE INCIDENT</span>
            <h3>
              {selectedIncidentData
                ? `INC-${selectedIncidentData.id} · ${selectedIncidentData.title}`
                : "Select an incident"}
            </h3>
            <p>
              Response actions are linked to an incident and are simulated by SentinelX.
              No real system or network change is performed.
            </p>
          </div>

          <div className="response-control-actions">
            <Select
              className="response-select"
              value={selectedIncident || ""}
              placeholder="Choose incident"
              onChange={(id) => {
                if (id) onIncidentSelect(id);
              }}
              options={[
                { value: "", label: "Choose incident" },
                ...incidents.map((incident) => ({
                  value: incident.id,
                  label: `INC-${incident.id} · ${incident.title}`,
                  title: `INC-${incident.id} · ${incident.title}`,
                })),
              ]}
            />

            <button
              className="ai-secondary-btn"
              type="button"
              onClick={onRefresh}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {responseRecommendations.length > 0 && (
          <div className="response-recommendations">
            <div className="response-recommendation-title">
              <BrainCircuit size={14} />
              AI Recommended Response
            </div>
            <div className="recommendation-list">
              {responseRecommendations.map((recommendation, index) => (
                <button
                  type="button"
                  className="recommendation-chip"
                  key={index}
                  onClick={() => applyRecommendation(recommendation)}
                >
                  <span>{recommendation}</span>
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="response-create-form" onSubmit={submitAction}>
          <div className="response-form-field">
            <label htmlFor="response-action-type">Action Type</label>
            <Select
              id="response-action-type"
              value={actionType}
              onChange={(val) => setActionType(val)}
              disabled={!selectedIncident || creating}
              options={[
                "Block Source IP",
                "Reset Credentials",
                "Isolate Host",
                "Enable MFA",
                "Collect Evidence",
                "Update Detection Rule",
                "Other",
              ]}
            />
          </div>

          <div className="response-form-field response-description-field">
            <label htmlFor="response-description">Description</label>
            <input
              id="response-description"
              className="sentinel-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the response action..."
              disabled={!selectedIncident || creating}
            />
          </div>

          <button
            className="response-primary-btn"
            type="submit"
            disabled={!selectedIncident || !description.trim() || creating}
          >
            <Zap size={14} />
            {creating ? "Creating..." : "Create Action"}
          </button>
        </form>
      </section>

      <section className="panel">
        <PanelTitle
          icon={Zap}
          title={selectedIncident ? "Incident Response Actions" : "Response Action History"}
          count={selectedActions.length}
        />

        <ResponseList
          actions={selectedActions}
          onExecute={onExecuteAction}
        />
      </section>
    </>
  );
}

// =========================================================
// REPORTS PAGE
// =========================================================

function ReportsView({
  incidents,
  report,
  selectedIncident,
  onIncidentSelect,
  reportPreviewRef,
  onUpdateIncidentDetails,
  onUpdateIncidentStatus,
  onCreateAction,
  onExecuteAction,
  aiAnalyses = [],
  onGenerateRandomIncident,
  generatingIncident,
  onDownloadPdf,
  downloadingPdf,
}) {
  return (
    <>
      <div className="reports-top-actions">
        <PageHeader
          eyebrow="RESPONSE / REPORTS"
          title="Incident Reports"
          description="Generate and review consolidated incident intelligence reports"
        />

        <button
          type="button"
          className="generate-incident-btn"
          onClick={onGenerateRandomIncident}
          disabled={generatingIncident}
          title="Simulate and persist a realistic random cybersecurity incident"
        >
          <Dices
            size={16}
            className={generatingIncident ? "spin" : ""}
          />
          {generatingIncident ? "Generating Incident..." : "Generate Random Incident"}
        </button>
      </div>

      <div className="incident-layout">

        {/* REPORT LIST */}

        <section className="panel incident-list-panel">

          <PanelTitle
            icon={FileText}
            title="Available Reports"
            count={incidents.length}
          />

          {incidents.length ? (
            incidents.map(
              (incident) => (
                <button
                  className={`incident-select ${
                    selectedIncident ===
                    incident.id
                      ? "selected"
                      : ""
                  }`}
                  key={incident.id}
                  onClick={() =>
                    onIncidentSelect(
                      incident.id
                    )
                  }
                  type="button"
                >

                  <div>

                    <strong>
                      {incident.title}
                    </strong>

                    <small>
                      INC-{incident.id} ·{" "}
                      {incident.alert_count ||
                        0}{" "}
                      alerts
                    </small>

                  </div>

                  <div className="report-row-right">

                    <span
                      className={`severity-badge ${incident.severity}`}
                    >
                      {incident.severity}
                    </span>

                    <ChevronRight
                      size={15}
                    />

                  </div>

                </button>
              )
            )
          ) : (
            <EmptyState
              text="No incident reports available"
            />
          )}

        </section>

        {/* REPORT PREVIEW */}

        <section
          className="panel"
          ref={reportPreviewRef}
        >
{report?.incident && (
  <div className="incident-investigation-panel">
    <PanelTitle
      icon={Shield}
      title="Incident Investigation"
    />

    <div className="investigation-fields" key={report.incident.id}>
      <div className="field-group">
        <label htmlFor="incident-status">
          Incident Status
        </label>

        <Select
          id="incident-status"
          className="status-select"
          value={report.incident.status || "open"}
          onChange={(val) =>
            onUpdateIncidentStatus?.(val)
          }
          options={[
            { value: "open", label: "Open" },
            { value: "investigating", label: "Investigating" },
            { value: "containment", label: "Containment" },
            { value: "remediation", label: "Remediation" },
            { value: "resolved", label: "Resolved" },
          ]}
        />
      </div>

      <div className="field-group">
        <label htmlFor="incident-assignee">
          Assigned Analyst
        </label>

        <input
          id="incident-assignee"
          className="sentinel-input"
          type="text"
          defaultValue={report.incident.assigned_to || ""}
          placeholder="Enter analyst name"
          onBlur={(e) =>
            onUpdateIncidentDetails?.({
              assigned_to: e.target.value,
              investigation_notes:
                report.incident.investigation_notes || "",
            })
          }
        />
      </div>

      <div className="field-group field-group-full">
        <label htmlFor="investigation-notes">
          Investigation Notes
        </label>

        <textarea
          id="investigation-notes"
          className="sentinel-textarea"
          rows={6}
          defaultValue={
            report.incident.investigation_notes || ""
          }
          placeholder="Document investigation findings, indicators observed, evidence, and analyst conclusions..."
          onBlur={(e) =>
            onUpdateIncidentDetails?.({
              assigned_to:
                report.incident.assigned_to || "",
              investigation_notes: e.target.value,
            })
          }
        />
      </div>
    </div>
  </div>
)}
          {report ? (
            <IncidentReportPreview
              report={report}
              onCreateAction={onCreateAction}
              onExecuteAction={onExecuteAction}
              aiAnalyses={aiAnalyses}
              onDownloadPdf={onDownloadPdf}
              downloadingPdf={downloadingPdf}
            />
          ) : (
            <EmptyState
              text="Select an incident report"
            />
          )}

        </section>

      </div>
    </>
  );
}

// =========================================================
// INCIDENT REPORT PREVIEW
// =========================================================

function IncidentReportPreview({
  report,
  onCreateAction,
  onExecuteAction,
  aiAnalyses = [],
  onDownloadPdf,
  downloadingPdf,
}) {
  const {
    incident,
    alerts = [],
    mitre_attack = [],
    threat_intelligence = [],
    response_actions = [],
    ai_analysis = [],
    timeline = [],
  } = report;

  const ai = ai_analysis[0];

  return (
    <div className="investigation">

      <div className="investigation-header">

        <div>

          <span className="eyebrow">
            INCIDENT REPORT · INC-
            {incident.id}
          </span>

          <h3>
            {incident.title}
          </h3>

        </div>

        <div className="incident-header-actions">
          <div className="incident-badges">
            <span
              className={`severity-badge ${incident.severity}`}
            >
              {incident.severity}
            </span>

            <span
              className={`status-badge ${incident.status}`}
            >
              {incident.status}
            </span>
          </div>

          <button
            type="button"
            className="download-pdf-btn"
            onClick={() => onDownloadPdf?.(incident.id)}
            disabled={downloadingPdf}
            title="Download formatted executive PDF report"
          >
            <FileDown
              size={14}
              className={downloadingPdf ? "spin" : ""}
            />
            {downloadingPdf ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>

      </div>

      <p className="investigation-description">
        {incident.description}
      </p>

      <div className="detail-grid">

        <Detail
          label="Priority"
          value={
            incident.priority
          }
        />

        <Detail
          label="Severity"
          value={
            incident.severity
          }
        />

        <Detail
          label="Status"
          value={
            incident.status
          }
        />

        <Detail
          label="Alerts"
          value={alerts.length}
        />

        <Detail
          label="Assigned To"
          value={
            incident.assigned_to ||
            "Unassigned"
          }
        />

        <Detail
          label="Opened"
          value={formatDate(
            incident.opened_at
          )}
        />

      </div>

      {/* INCIDENT DESCRIPTION */}

      <InvestigationBlock
        title="Incident Details"
        icon={FileText}
      >

        <p>
          {incident.description}
        </p>

        {incident.investigation_notes && (
          <>
            <h4>
              Investigation Notes
            </h4>

            <p>
              {incident.investigation_notes}
            </p>
          </>
        )}

      </InvestigationBlock>
        {/* INCIDENT TIMELINE */}

<InvestigationBlock
  title="Incident Timeline"
  icon={Clock}
>
  {timeline.length ? (
    <div className="incident-timeline">

      {timeline.map((event, index) => (
        <div
          className="timeline-item"
          key={`${event.event_type}-${event.reference_id}-${event.event_time}-${index}`}
        >

          <div className="timeline-marker">
            <span />
          </div>

          <div className="timeline-content">

            <div className="timeline-header">

              <div>
                <strong>
                  {event.event_title}
                </strong>

                <small>
                  {event.event_type}
                </small>
              </div>

              <time>
                {formatDate(event.event_time)}
              </time>

            </div>

            {event.event_description && (
              <p>
                {event.event_description}
              </p>
            )}

            <div className="timeline-meta">

              {event.status && (
                <span
                  className={`status-badge ${event.status}`}
                >
                  {event.status}
                </span>
              )}

              {event.severity && (
                <span
                  className={`severity-badge ${event.severity}`}
                >
                  {event.severity}
                </span>
              )}

            </div>

          </div>

        </div>
      ))}

    </div>
  ) : (
    <EmptyState
      text="No timeline events"
    />
  )}
</InvestigationBlock>


      {/* ALERTS */}

      <InvestigationBlock
        title="Associated Alerts"
        icon={ShieldAlert}
      >

        {alerts.length ? (
          <div className="table-list">

            {alerts.map(
              (alert) => (
                <div
                  className="table-row"
                  key={alert.id}
                >

                  <div className="row-icon danger-icon">
                    <AlertTriangle
                      size={14}
                    />
                  </div>

                  <div className="row-main">

                    <strong>
                      {alert.title}
                    </strong>

                    <small>
                      {alert.alert_type} ·{" "}
                      {alert.detection_rule}
                    </small>

                  </div>

                  <span
                    className={`severity-badge ${alert.severity}`}
                  >
                    {alert.severity}
                  </span>

                  <span className="risk-score">
                    {alert.risk_score}
                  </span>

                </div>
              )
            )}

          </div>
        ) : (
          <EmptyState
            text="No alerts linked to this incident"
          />
        )}

      </InvestigationBlock>

      {/* MITRE */}

      <InvestigationBlock
        title="MITRE ATT&CK"
        icon={Target}
      >

        {mitre_attack.length ? (
          mitre_attack.map(
            (item, index) => (
              <div
                className="intel-row"
                key={index}
              >

                <code>
                  {item.technique_id}
                </code>

                <div>

                  <strong>
                    {item.technique_name}
                  </strong>

                  <small>
                    {item.tactic_id} ·{" "}
                    {item.tactic_name}
                  </small>

                </div>

              </div>
            )
          )
        ) : (
          <EmptyState
            text="No MITRE mapping"
          />
        )}

      </InvestigationBlock>

      {/* THREAT INTELLIGENCE */}

      <InvestigationBlock
        title="Threat Intelligence"
        icon={Globe}
      >

        {threat_intelligence.length ? (
          threat_intelligence.map(
            (item, index) => (
              <div
                className="intel-row"
                key={index}
              >

                <code>
                  {item.indicator_type}
                </code>

                <div>

                  <strong>
                    {item.indicator_value}
                  </strong>

                  <small>
                    {item.threat_name} ·{" "}
                    {item.source} ·
                    {" "}
                    Confidence{" "}
                    {item.confidence}%
                  </small>

                </div>

              </div>
            )
          )
        ) : (
          <EmptyState
            text="No threat intelligence"
          />
        )}

      </InvestigationBlock>

      {/* AI ANALYSIS */}

      {ai && (
        <InvestigationBlock
          title="AI Security Analysis"
          icon={BrainCircuit}
        >

          <div className="ai-summary">

            <div className="ai-provider">

              <Bot size={14} />

              {ai.provider} ·{" "}
              {ai.model_name}

            </div>

            <h4>
              Summary
            </h4>

            <p>
              {ai.summary}
            </p>

            <h4>
              Threat Assessment
            </h4>

            <p>
              {ai.threat_assessment}
            </p>

            <h4>
              Risk Explanation
            </h4>

            <p>
              {ai.risk_explanation}
            </p>

            <h4>
              Investigation Steps
            </h4>

            <ol>

              {(
                ai.investigation_steps ||
                []
              ).map(
                (step, index) => (
                  <li key={index}>
                    {step}
                  </li>
                )
              )}

            </ol>

            <h4>
              Recommended Response
            </h4>

            <ol>

              {(
                ai.recommended_response ||
                []
              ).map(
                (step, index) => (
                  <li key={index}>
                    {step}
                  </li>
                )
              )}

            </ol>

          </div>

        </InvestigationBlock>
      )}

      {/* RESPONSE ACTIONS */}

      <InvestigationBlock
        title="Response Actions"
        icon={Zap}
      >

        <ResponseActionPanel
          incidentId={incident.id}
          actions={response_actions}
          aiAnalyses={aiAnalyses}
          alerts={alerts}
          onCreateAction={onCreateAction}
          onExecuteAction={onExecuteAction}
        />

      </InvestigationBlock>



    </div>

    
  );
}

// =========================================================
// INCIDENT RESPONSE ACTION PANEL
// =========================================================

function ResponseActionPanel({
  incidentId,
  actions,
  aiAnalyses = [],
  alerts = [],
  onCreateAction,
  onExecuteAction,
}) {
  const [actionType, setActionType] = useState("Block Source IP");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const incidentAI = alerts
    .map((alert) =>
      aiAnalyses.find(
        (analysis) => String(analysis.alert_id) === String(alert.id)
      )
    )
    .filter(Boolean);

  const recommendations = incidentAI.flatMap(
    (analysis) => analysis.recommended_response || []
  );

  const applyRecommendation = (recommendation) => {
    setDescription(recommendation);
    setActionType(inferActionType(recommendation));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;

    setCreating(true);
    const created = await onCreateAction({
      incidentId,
      actionType,
      description: description.trim(),
    });
    setCreating(false);

    if (created) setDescription("");
  };

  return (
    <div className="incident-response-panel">
      {recommendations.length > 0 && (
        <div className="response-recommendations">
          <div className="response-recommendation-title">
            <BrainCircuit size={14} />
            AI Recommended Response
          </div>
          <div className="recommendation-list">
            {recommendations.map((recommendation, index) => (
              <button
                type="button"
                className="recommendation-chip"
                key={`${index}-${recommendation}`}
                onClick={() => applyRecommendation(recommendation)}
              >
                <span>{recommendation}</span>
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="response-create-form compact" onSubmit={submit}>
        <div className="response-form-field">
          <label>Action Type</label>
          <Select
            value={actionType}
            onChange={(val) => setActionType(val)}
            disabled={creating}
            options={[
              "Block Source IP",
              "Reset Credentials",
              "Isolate Host",
              "Enable MFA",
              "Collect Evidence",
              "Update Detection Rule",
              "Other",
            ]}
          />
        </div>

        <div className="response-form-field response-description-field">
          <label>Description</label>
          <input
            className="sentinel-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Create a response action for this incident..."
            disabled={creating}
          />
        </div>

        <button
          className="response-primary-btn"
          type="submit"
          disabled={!description.trim() || creating}
        >
          <Zap size={14} />
          {creating ? "Creating..." : "Create Action"}
        </button>
      </form>

      <ResponseList
        actions={actions}
        onExecute={onExecuteAction}
      />
    </div>
  );
}

function inferActionType(text = "") {
  const value = text.toLowerCase();
  if (value.includes("block") || value.includes("rate-limit") || value.includes("rate limit")) return "Block Source IP";
  if (value.includes("password") || value.includes("credential")) return "Reset Credentials";
  if (value.includes("mfa") || value.includes("multi-factor")) return "Enable MFA";
  if (value.includes("isolate") || value.includes("contain")) return "Isolate Host";
  if (value.includes("scan") || value.includes("evidence") || value.includes("logs")) return "Collect Evidence";
  if (value.includes("detection rule")) return "Update Detection Rule";
  return "Other";
}

// =========================================================
// NORMALIZED LOGS
// =========================================================

function LogsView({
  logs,
  sources,
}) {
  return (
    <>
      <PageHeader
        eyebrow="SOC / LOGS"
        title="Normalized Security Logs"
        description="Normalized events ingested into SentinelX PostgreSQL"
      />

      <section className="metrics-grid compact">

        <MetricCard
          icon={Activity}
          title="Normalized Logs"
          value={logs.length}
          type="blue"
        />

        <MetricCard
          icon={Server}
          title="Log Sources"
          value={sources.length}
          type="purple"
        />

      </section>

      <section className="panel">

        <PanelTitle
          icon={Terminal}
          title="Normalized Events"
          count={logs.length}
        />

        <div className="logs-table">

          <div className="logs-header">

            <span>ID</span>
            <span>Event</span>
            <span>Source IP</span>
            <span>Destination</span>
            <span>Username</span>
            <span>Hostname</span>

          </div>

          {logs.length ? (
            logs.map((log) => (
              <div
                className="logs-row"
                key={log.id}
              >

                <span>
                  #{log.id}
                </span>

                <strong>
                  {log.event_type ||
                    "—"}
                </strong>

                <span>
                  {log.source_ip ||
                    "—"}
                </span>

                <span>
                  {log.destination_ip ||
                    "—"}
                </span>

                <span>
                  {log.username ||
                    "—"}
                </span>

                <span>
                  {log.hostname ||
                    "—"}
                </span>

              </div>
            ))
          ) : (
            <EmptyState
              text="No normalized logs available"
            />
          )}

        </div>

      </section>
    </>
  );
}

// =========================================================
// INVESTIGATION BLOCK
// =========================================================

function InvestigationBlock({
  title,
  icon: Icon,
  children,
}) {
  return (
    <div className="investigation-block">

      <div className="investigation-block-title">

        <Icon size={15} />

        <h4>{title}</h4>

      </div>

      {children}

    </div>
  );
}

// =========================================================
// DETAIL
// =========================================================

function Detail({
  label,
  value,
}) {
  return (
    <div className="detail">

      <span>{label}</span>

      <strong>
        {value !== undefined &&
        value !== null &&
        value !== ""
          ? value
          : "—"}
      </strong>

    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  text,
}) {
  return (
    <div className="empty-state">

      <CircleDot size={18} />

      <span>{text}</span>

    </div>
  );
}

// =========================================================
// DATE FORMATTER
// =========================================================

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

// =========================================================
// ACTION FORMATTER
// =========================================================

function formatAction(action = "") {
  return action
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
}

export default App;