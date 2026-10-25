#!/bin/sh
set -e

# WebLearnChinese Unified Container Entrypoint
# Launches Supervisord to manage Spring Boot and Python FastAPI processes concurrently.

# Ensure speech service defaults for local loopback
export SPEECH_HOST="${SPEECH_HOST:-127.0.0.1}"
export SPEECH_PORT="${SPEECH_PORT:-8000}"
export SPEECH_SERVICE_URL="${SPEECH_SERVICE_URL:-http://127.0.0.1:8000}"

echo "[Unified Entrypoint] Speech service target: ${SPEECH_SERVICE_URL}"
echo "[Unified Entrypoint] Starting Supervisord process manager..."

if [ $# -gt 0 ]; then
    exec "$@"
else
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
fi
