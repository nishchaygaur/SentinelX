require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = "0.0.0.0";

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("SentinelX PostgreSQL connection successful");

        const server = app.listen(PORT, HOST, () => {
            console.log(`SentinelX backend running on http://${HOST}:${PORT}`);
        });

        // Graceful shutdown handling
        const shutdown = async (signal) => {
            console.log(`Received ${signal}. Gracefully shutting down SentinelX backend...`);
            server.close(async () => {
                console.log("HTTP server closed.");
                try {
                    await pool.end();
                    console.log("PostgreSQL database pool drained.");
                } catch (err) {
                    console.error("Error closing database pool:", err);
                }
                process.exit(0);
            });

            // Force close after 10s if graceful close hangs
            setTimeout(() => {
                console.error("Could not close connections in time, forcefully shutting down");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
        process.exit(1);
    }
};

startServer();