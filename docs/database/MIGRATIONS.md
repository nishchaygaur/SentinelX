# SentinelX — Database Migrations Runner

## 1. Architecture

The migration runner (`database/migrate.js`) executes migrations sequentially and idempotently:
1. Connects to PostgreSQL (handling SSL negotiation for Supabase/Render).
2. Creates the tracking table `schema_migrations` if not present.
3. Inspects `000_initial_schema.sql`: If baseline tables do not exist, it applies `database/schema.sql` in a single transaction.
4. Reads all `*.sql` files in `database/migrations/` in alphabetical order.
5. Applies unapplied migration files within atomic transactions and records completion.

---

## 2. Registered Migrations

| Migration File | Description |
|---|---|
| `000_initial_schema.sql` | Baseline 11 tables and 35 indexes from `database/schema.sql`. |
| `001_create_raw_logs.sql` | Ensures raw_logs table exists with B-tree performance indexes. |
| `002_create_ai_security_analysis_view.sql` | Creates `ai_security_analysis` alias view pointing to `ai_analysis`. |
| `003_add_cascade_to_alert_foreign_keys.sql` | Ensures `ON DELETE CASCADE` on `mitre_attack` and `threat_intelligence` foreign keys. |

---

## 3. Running Migrations

```bash
# Local development
node database/migrate.js

# Target cloud database (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@[host]:6543/postgres" node database/migrate.js
```
