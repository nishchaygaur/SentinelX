# SentinelX — Environment Variables Reference

Below is the definitive reference for all environment variables supported by SentinelX:

| Variable | Target Service | Default (Dev) | Production Example | Description |
|---|---|---|---|---|
| `PORT` | Backend | `5000` | `10000` | HTTP port for Express backend server. |
| `NODE_ENV` | Backend | `development` | `production` | Execution environment mode. |
| `DATABASE_URL` | Backend / DB | None | `postgresql://user:pass@host:6543/db` | PostgreSQL connection URI. Overrides discrete DB vars if set. |
| `DB_HOST` | Backend | `localhost` | None | Database host for parameter-based connection. |
| `DB_PORT` | Backend | `5432` | None | Database port. |
| `DB_NAME` | Backend | `sentinelx` | None | Database name. |
| `DB_USER` | Backend | `postgres` | None | Database username. |
| `DB_PASSWORD` | Backend | `postgres` | None | Database password. |
| `DATABASE_SSL` | Backend | Auto | `true` | Forces SSL connection to database. Automatically enabled for cloud DBs. |
| `CORS_ORIGIN` | Backend | `http://localhost:5173` | `https://sentinelx.vercel.app` | Comma-separated list of whitelisted frontend origins. |
| `OPENROUTER_API_KEY` | Backend | None | `sk-or-v1-xxxxxx` | API key for OpenRouter AI threat copilot. |
| `OPENROUTER_MODEL` | Backend | `openrouter/free` | `deepseek/deepseek-chat` | LLM model identifier for AI investigation. |
| `LOG_INGESTION_TOKEN`| Backend & Shipper| None | `sec_tok_991823` | Optional secret token required in `x-ingestion-token` header. |
| `VITE_API_URL` | Frontend | `http://localhost:5000/api`| `https://sentinelx-api.onrender.com/api` | Base API endpoint target for React frontend. |
