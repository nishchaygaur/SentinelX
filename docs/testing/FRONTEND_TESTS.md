# SentinelX — Frontend Testing & Linting

## 1. Static Analysis with Oxlint

SentinelX utilizes **Oxlint** for ultra-fast, zero-configuration linting across all JSX and JavaScript files.

Run command:
```bash
npm --prefix frontend run lint
```

Current status: **0 warnings, 0 errors** across all components.

---

## 2. Build Verification

Validates that the Rollup bundle builds cleanly without syntax or import breaks:

```bash
npm --prefix frontend run build
```
