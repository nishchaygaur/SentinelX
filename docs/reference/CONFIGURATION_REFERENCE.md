# SentinelX — Detection & Engine Configuration Reference

## 1. Detection Configuration (`backend/src/config/detectionConfig.js`)

| Setting Key | Default | Description |
|---|---|---|
| `bruteForce.failedLoginsThreshold` | `5` | Minimum failed login attempts to trigger brute force alert. |
| `bruteForce.criticalThreshold` | `15` | Threshold to escalate brute force alert to Critical. |
| `bruteForce.timeWindowMinutes` | `5` | Sliding window duration in minutes for brute force grouping. |
| `portScan.uniquePortsThreshold` | `5` | Minimum distinct destination ports probed to trigger port scan. |
| `portScan.criticalThreshold` | `20` | Threshold to escalate port scan alert to Critical. |
| `suspiciousLogin.failedAttemptsBeforeSuccessThreshold` | `3` | Prior failed attempts required before a successful login is flagged. |
| `suspiciousLogin.failureToSuccessWindowMinutes` | `10` | Lookback window in minutes for prior authentication failures. |
| `anomalousActivity.minEventsForAnomaly` | `10` | Minimum total log volume before anomaly ratio test applies. |
| `anomalousActivity.highSeverityErrorRatioThreshold` | `0.40` | Ratio of high/critical logs to total logs required to trigger anomaly. |
