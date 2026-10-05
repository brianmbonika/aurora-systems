#!/usr/bin/env bash
# Check PA_INGEST_KEY is set and that pa.aurorascents.co is reachable.
# Prints "set"/"NOT SET" for the key (never its value) and the HTTP status code
# for the host, or "unreachable" with curl's exit code if no response came back.
HOST="${PA_HOST:-https://pa.aurorascents.co}"

if [ -n "${PA_INGEST_KEY:-}" ]; then
  echo "PA_INGEST_KEY: set"
else
  echo "PA_INGEST_KEY: NOT SET"
fi

code=$(curl -sS -o /dev/null -m 15 -w '%{http_code}' "$HOST" 2>/dev/null)
rc=$?
if [ "$rc" -eq 0 ] && [ "$code" != "000" ]; then
  echo "$HOST: HTTP $code"
else
  echo "$HOST: unreachable (curl exit $rc)"
  exit 1
fi
