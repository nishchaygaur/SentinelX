#!/usr/bin/env python3
"""
SentinelX Linux Telemetry Shipper (Python 3)
Streams system authentication and audit events to SentinelX Ingestion API over HTTPS.

Usage:
    python3 scripts/linux_collector.py --url https://<render-url>/api --token <secret-token> --test
"""

import sys
import os
import json
import socket
import argparse
import datetime
import urllib.request
import urllib.error

def send_payload(api_url, token, logs):
    endpoint = f"{api_url.rstrip('/')}/logs/ingest"
    data = json.dumps(logs).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json"
    }
    if token:
        headers["x-ingestion-token"] = token
        
    req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, err_body
    except Exception as e:
        return 0, str(e)

def main():
    parser = argparse.ArgumentParser(description="SentinelX Linux Security Log Collector")
    parser.add_argument("--url", default=os.getenv("SENTINELX_API_URL", "http://localhost:5000/api"), help="SentinelX API URL")
    parser.add_argument("--token", default=os.getenv("LOG_INGESTION_TOKEN", ""), help="Ingestion security token")
    parser.add_argument("--test", action="store_true", help="Send test authentication event")
    args = parser.parse_args()

    print("==================================================")
    print("      SENTINELX LINUX SECURITY LOG COLLECTOR      ")
    print("==================================================")
    print(f"Target URL: {args.url}")
    print(f"Token: {'[CONFIGURED]' if args.token else '[NONE]'}")
    
    hostname = socket.gethostname()
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%b %d %H:%M:%S")

    test_msg = f"{timestamp} {hostname} sshd[12489]: Failed password for invalid user admin from 198.51.100.222 port 49152 ssh2"
    payload = [{
        "source_type": "linux_ssh",
        "raw_message": test_msg
    }]

    print(f"\nSending test log:\n  {test_msg}\n")
    status, res = send_payload(args.url, args.token, payload)
    
    if 200 <= status < 300:
        print(f"[SUCCESS] HTTP {status}: Log successfully ingested into SentinelX!")
        print(f"Response: {res}")
    else:
        print(f"[ERROR] HTTP {status}: Ingestion failed: {res}")
        sys.exit(1)

if __name__ == "__main__":
    main()
