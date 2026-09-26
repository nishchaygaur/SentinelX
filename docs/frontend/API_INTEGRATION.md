# SentinelX — Frontend API Integration

## 1. API Configuration

The frontend determines the backend API target using Vite environment variables:

```javascript
const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = RAW_API_URL.replace(/\/+$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/+$/, "")
  : `${RAW_API_URL.replace(/\/+$/, "")}/api`;
```

---

## 2. API Helper Utility

The application uses standard `fetch` with automatic error envelope parsing:

```javascript
const fetchJSON = async (endpoint) => {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`${endpoint} returned ${response.status}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || `Failed to load ${endpoint}`);
  }
  return result.data;
};
```

---

## 3. Real-Time Data Synchronization

- **Initial Hydration**: Loads dashboard summary, alerts, incidents, response actions, log sources, and normalized logs upon mounting.
- **Manual Refresh**: Topbar refresh button initiates parallel re-fetching of all telemetry endpoints.
- **Reactive Mutations**: Creating response actions, updating incident statuses, or generating random incidents automatically trigger targeted refreshes.
