# SentinelX Deployment Guide

## 1. Overview

SentinelX supports flexible deployment models ranging from local single-node development to fully managed, globally distributed cloud architectures.

---

## 2. Production Topology

- **Frontend**: **Vercel** Edge Network (React 19 SPA)
- **Backend**: **Render** Web Service (Node.js 24 + Express 5)
- **Database**: **Supabase** Managed PostgreSQL (PostgreSQL 17 with PgBouncer session pooling)
- **Log Shippers**: Remote Ubuntu / Linux VMs
