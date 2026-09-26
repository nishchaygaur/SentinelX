#!/usr/bin/env bash
# ==============================================================================
# SentinelX Linux / Ubuntu VM Security Log Shipper
# Streams authentic Linux auth & security telemetry over HTTPS into SentinelX
#
# Target Architecture:
# Ubuntu VM -> /var/log/auth.log -> Shipper -> HTTPS -> Render Backend -> Supabase -> Vercel
#
# Usage:
#   bash scripts/ubuntu_log_shipper.sh --url https://<render-url>/api --token <secret-token> --test
#   bash scripts/ubuntu_log_shipper.sh --url https://<render-url>/api --token <secret-token> --tail
# ==============================================================================

set -euo pipefail

# Defaults
SENTINELX_URL="${SENTINELX_API_URL:-http://localhost:5000/api}"
INGESTION_TOKEN="${LOG_INGESTION_TOKEN:-}"
MODE="test" # "test" or "tail"
LOG_FILE="/var/log/auth.log"

# Parse CLI options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      SENTINELX_URL="$2"
      shift 2
      ;;
    --token)
      INGESTION_TOKEN="$2"
      shift 2
      ;;
    --tail)
      MODE="tail"
      shift
      ;;
    --test)
      MODE="test"
      shift
      ;;
    --file)
      LOG_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "SentinelX Ubuntu Log Shipper"
      echo "Usage: $0 [--url <API_BASE>] [--token <INGESTION_TOKEN>] [--test | --tail]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

INGEST_ENDPOINT="${SENTINELX_URL%/}/logs/ingest"

echo "=================================================="
echo "      SENTINELX UBUNTU LOG SHIPPER PIPELINE      "
echo "=================================================="
echo "Target Endpoint : ${INGEST_ENDPOINT}"
echo "Execution Mode  : ${MODE}"
echo "Auth Token      : $(if [[ -n "$INGESTION_TOKEN" ]]; then echo "Configured (Protected)"; else echo "None (Open Mode)"; fi)"
echo "Source File     : ${LOG_FILE}"
echo ""

# Function to ship a single log line or JSON payload
send_log() {
  local raw_msg="$1"
  local json_payload
  json_payload=$(cat <<EOF
{
  "source_type": "linux_ssh",
  "raw_message": $(printf '%s' "$raw_msg" | jq -R -s '.')
}
EOF
)

  local auth_header=()
  if [[ -n "$INGESTION_TOKEN" ]]; then
    auth_header=(-H "x-ingestion-token: ${INGESTION_TOKEN}")
  fi

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST "${INGEST_ENDPOINT}" \
    -H "Content-Type: application/json" \
    "${auth_header[@]}" \
    -d "$json_payload")

  local http_code
  http_code=$(echo "$response" | tail -n1)
  local response_body
  response_body=$(echo "$response" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "[SUCCESS] HTTP ${http_code} | Log ingested into SentinelX"
  else
    echo "[ERROR] HTTP ${http_code} | Failed to ingest: ${response_body}"
  fi
}

if [[ "$MODE" == "test" ]]; then
  echo "--- Running Controlled Verification Test ---"
  TEST_HOST="$(hostname -f 2>/dev/null || hostname)"
  TEST_DATE="$(date '+%b %d %H:%M:%S')"
  TEST_MSG="${TEST_DATE} ${TEST_HOST} sshd[$$]: Failed password for invalid user admin from 198.51.100.222 port 45210 ssh2"
  
  echo "Simulating Linux SSH Failed Login Event:"
  echo "  ${TEST_MSG}"
  echo ""
  send_log "${TEST_MSG}"
  echo ""
  echo "Test log shipped successfully. Check SentinelX Dashboard or alerts for ingestion confirmation."

elif [[ "$MODE" == "tail" ]]; then
  echo "--- Streaming Real-Time Linux Auth Logs to SentinelX ---"
  if [[ ! -r "$LOG_FILE" ]]; then
    echo "WARNING: Cannot read ${LOG_FILE} directly. Falling back to journalctl..."
    journalctl -u ssh -f -n 0 --no-tail | while read -r line; do
      if [[ "$line" =~ sshd.*(Failed|Accepted|Invalid) ]]; then
        echo "[EVENT] $line"
        send_log "$line"
      fi
    done
  else
    tail -n 0 -F "$LOG_FILE" | while read -r line; do
      if [[ "$line" =~ sshd.*(Failed|Accepted|Invalid) ]]; then
        echo "[EVENT] $line"
        send_log "$line"
      fi
    done
  fi
fi
