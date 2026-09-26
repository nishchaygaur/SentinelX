# SentinelX — Postman API Testing Collection

## 1. Collection File

A fully configured Postman collection is maintained at:
`docs/SentinelX.postman_collection.json`

---

## 2. Importing & Execution

1. Open Postman.
2. Click **Import** and select `docs/SentinelX.postman_collection.json`.
3. Set the `baseUrl` collection variable to:
   - `http://localhost:5000/api` (Local), or
   - `https://<your-render-url>/api` (Production).
4. Run the collection runner to test all 20+ request definitions in sequence.
