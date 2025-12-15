#!/bin/bash
# Helper script to run s3-cleanup.sh once (instead of continuously)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if DRY_RUN is set, otherwise default to false
DRY_RUN="${DRY_RUN:-false}"

echo "Running s3-cleanup once (DRY_RUN=${DRY_RUN})..."
echo ""

# Run as one-off container
docker compose -f compose.prod.yaml run --rm \
    --entrypoint /bin/sh \
    -e DRY_RUN="${DRY_RUN}" \
    s3-cleanup -c "
        if ! command -v curl >/dev/null 2>&1; then
            yum install -y curl >/dev/null 2>&1 || true;
        fi;
        chmod +x /s3-cleanup.sh;
        /s3-cleanup.sh
    "

