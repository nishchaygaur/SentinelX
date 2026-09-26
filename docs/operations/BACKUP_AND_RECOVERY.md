# SentinelX — Database Backup & Recovery

## 1. PostgreSQL Backup via `pg_dump`

```bash
# Create compressed backup
pg_dump -U postgres -d sentinelx -F c -b -v -f "sentinelx_backup_$(date +%Y%m%d).dump"
```

---

## 2. Database Restoration

```bash
# Restore from backup file
pg_restore -U postgres -d sentinelx -v "sentinelx_backup_20260926.dump"
```

---

## 3. Supabase Cloud Backups

When using Supabase PostgreSQL, automated daily physical and point-in-time recovery (PITR) backups are managed via the Supabase Dashboard.
