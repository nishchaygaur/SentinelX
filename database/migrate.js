/**
 * SentinelX Database Migration Runner
 * Executes baseline schema and all SQL migrations in sequential order.
 * Fully compatible with local PostgreSQL and cloud providers (Supabase, Render).
 */

const fs = require("fs");
const path = require("path");

// Resolve dependencies from backend node_modules if running from root
const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const { Pool } = require(path.join(backendDir, "node_modules/pg"));

const poolConfig = {};

if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;

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

async function runMigrations() {
    console.log("=== SentinelX Database Migration Runner ===");
    const client = await pool.connect();

    try {
        // 1. Create migrations tracking table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Ensure baseline schema is applied if tables do not exist
        const schemaPath = path.join(__dirname, "schema.sql");
        if (fs.existsSync(schemaPath)) {
            const initialCheck = await client.query(
                "SELECT id FROM schema_migrations WHERE version = $1",
                ["000_initial_schema.sql"]
            );

            // Also check if core table log_sources exists
            const tableCheck = await client.query(`
                SELECT to_regclass('public.log_sources') AS exists;
            `);

            if (initialCheck.rows.length === 0 || !tableCheck.rows[0].exists) {
                console.log("[APPLYING] Baseline schema from schema.sql...");
                const schemaSql = fs.readFileSync(schemaPath, "utf8");
                await client.query("BEGIN");
                await client.query(schemaSql);
                await client.query(
                    "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
                    ["000_initial_schema.sql"]
                );
                await client.query("COMMIT");
                console.log("[SUCCESS] Baseline schema initialized successfully.");
            } else {
                console.log("[SKIPPED] Baseline schema (already applied).");
            }
        }

        // 3. Apply incremental migrations
        const migrationsDir = path.join(__dirname, "migrations");
        if (!fs.existsSync(migrationsDir)) {
            console.log("No migrations directory found.");
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith(".sql"))
            .sort();

        console.log(`Found ${files.length} migration file(s).`);

        for (const file of files) {
            const alreadyRun = await client.query(
                "SELECT id FROM schema_migrations WHERE version = $1",
                [file]
            );

            if (alreadyRun.rows.length > 0) {
                console.log(`[SKIPPED] ${file} (already applied)`);
                continue;
            }

            console.log(`[APPLYING] ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, "utf8");

            await client.query("BEGIN");
            await client.query(sql);
            await client.query(
                "INSERT INTO schema_migrations (version) VALUES ($1)",
                [file]
            );
            await client.query("COMMIT");
            console.log(`[SUCCESS] ${file} applied successfully.`);
        }

        console.log("All database migrations completed successfully.");
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Migration failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
