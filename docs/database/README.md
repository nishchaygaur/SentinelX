# SentinelX Database Architecture

## 1. Overview

SentinelX is backed by **PostgreSQL 17** (compatible with PostgreSQL 15, 16, 17, and Supabase). The database schema is engineered for high-throughput security event ingestion, indexed search, relational correlation, and audit immutability.

---

## 2. Core Statistics

- **Tables**: 11 relational core tables
- **Views**: 1 alias view (`ai_security_analysis`)
- **Indexes**: 35 performance B-tree indexes
- **Foreign Keys**: 10 referential constraints with CASCADE behaviors
- **Custom Types**: Native `INET` for IP address storage and subnet indexing, native `JSONB` for extensible payload metadata.
