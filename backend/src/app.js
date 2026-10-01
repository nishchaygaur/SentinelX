const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const detectionRoutes = require("./routes/detectionRoutes");
const alertRoutes = require("./routes/alertRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const responseActionRoutes = require("./routes/responseActionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reportRoutes = require("./routes/reportRoutes");

const logSourceRoutes = require("./routes/logSourceRoutes");
const normalizedLogRoutes = require("./routes/normalizedLogRoutes");
const ingestionRoutes = require("./routes/ingestionRoutes");
const mitreRoutes = require("./routes/mitreRoutes");

const app = express();

app.use(helmet());

// Dynamic, secure CORS configuration
const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    // Allow non-browser requests (tools, curl, server-to-server, unit tests)
    if (!origin) return true;

    // Always permit local development
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return true;
    }

    // Explicitly configured origins (e.g. from CORS_ORIGIN environment variable)
    if (configuredOrigins.includes(origin)) {
        return true;
    }

    // Allow Vercel preview and production deployments (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
        return true;
    }

    return false;
};

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS BLOCKED] Rejected origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-ingestion-token", "X-Title", "HTTP-Referer"]
}));

app.use(express.json({ limit: "5mb" }));
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

app.get("/", (req, res) => {
    res.json({
        name: "SentinelX",
        status: "online",
        message: "AI-Powered SOC & Threat Intelligence Platform",
        version: "1.0.0"
    });
});

// Health check available at both /health and /api/health
app.get(["/health", "/api/health"], (req, res) => {
    res.json({
        status: "healthy",
        service: "SentinelX Backend",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/log-sources", logSourceRoutes);
app.use("/api/logs", ingestionRoutes);
app.use("/api/normalized-logs", normalizedLogRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/response-actions", responseActionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/mitre", mitreRoutes);
app.use("/api", reportRoutes);

// Global error handler
app.use((err, req, res, next) => {
    if (err.message && err.message.includes("CORS")) {
        return res.status(403).json({
            success: false,
            message: err.message
        });
    }

    console.error("Unhandled server error:", err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
    });
});

module.exports = app;