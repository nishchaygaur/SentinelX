# SentinelX — Response Actions & Containment Simulation

## 1. Safe Containment Simulation

SentinelX allows SOC analysts to stage, simulate, and document containment actions against hostile entities without risking production network disruptions.

Supported action types:
- **Block IP on Perimeter Firewall**: Simulates dropping inbound/outbound packets for the offending IP address.
- **Isolate Endpoint from Network**: Simulates host isolation at the EDR/switch level.
- **Revoke User Session & Reset Credentials**: Simulates invalidating active tokens and forcing password resets.
- **Enable Mandatory MFA Challenge**: Simulates enforcing secondary factors for targeted accounts.
- **Quarantine Malicious Binary**: Simulates isolating detected executables.

---

## 2. Action Lifecycle

1. **Creation**:
   `POST /api/response-actions`
   ```json
   {
     "incident_id": 146,
     "action_type": "Block IP on Perimeter Firewall",
     "description": "Block hostile brute-force origin IP 185.220.101.5 on edge firewall."
   }
   ```
   Creates an action in `pending` status and records a timeline event.

2. **Execution**:
   `POST /api/response-actions/:id/execute`
   Sets status to `completed`, records `executed_at` timestamp, logs `executed_by`, and automatically records a completion event in the incident timeline.
