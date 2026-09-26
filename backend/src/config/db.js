const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { Pool } = require("pg");

const poolConfig = {};

if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;

    // SSL configuration for cloud providers (Supabase, Render, Neon, etc.)
    const requiresSsl = process.env.DATABASE_SSL === "true" ||
        process.env.NODE_ENV === "production" ||
        process.env.DATABASE_URL.includes("supabase.co") ||
        process.env.DATABASE_URL.includes("render.com") ||
        process.env.DATABASE_URL.includes("pooler.supabase.com");

    if (process.env.DATABASE_SSL !== "false" && requiresSsl) {
        poolConfig.ssl = { rejectUnauthorized: false };
    }
} else {
    poolConfig.host = process.env.DB_HOST || "localhost";
    poolConfig.port = parseInt(process.env.DB_PORT || "5432", 10);
    poolConfig.database = process.env.DB_NAME || "sentinelx";
    poolConfig.user = process.env.DB_USER || "postgres";
    poolConfig.password = process.env.DB_PASSWORD || "postgres";
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("SentinelX PostgreSQL connected");
});

pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err);
});

module.exports = pool;