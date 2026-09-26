# SentinelX — Secrets & Credentials Management

## 1. Principles of Secrets Handling

1. **Zero Hardcoded Secrets**: No API keys, database credentials, or tokens are committed to the git repository.
2. **Environment Injection**: Secrets are injected at runtime via environment variables (`backend/.env`, Render Environment, or Supabase Vault).
3. **Template Provided**: `.env.example` provides safe templates with dummy placeholders.
4. **Git Exclusion**: `.env` and private keys are excluded in `.gitignore`.
