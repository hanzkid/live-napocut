#!/bin/sh
# Wrapper script for s3-cleanup that handles curl installation and runs the cleanup loop

set -e

# Install curl if not present
if ! command -v curl >/dev/null 2>&1; then
    yum install -y curl >/dev/null 2>&1 || true
fi

# Run cleanup loop (run script with sh since volume is read-only)
CLEANUP_INTERVAL="${CLEANUP_INTERVAL:-3600}"
while true; do
    sh /s3-cleanup.sh || echo "Cleanup failed, will retry on next interval"
    sleep "${CLEANUP_INTERVAL}"
done

