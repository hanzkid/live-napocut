#!/bin/bash
set -euo pipefail

###############################################################################
# S3 Livestream Cleanup
#
# - Fetches the active livestream from BASE_URL/api/livestreams/active
# - Reads its s3_path (e.g. "1-randomstring/live.m3u8")
# - Keeps that directory (e.g. "1-randomstring/") and deletes all other
#   top-level directories in the configured S3 bucket.
#
# Supports a DRY_RUN mode that only prints the aws commands instead of running
# them.
###############################################################################

#
# Helpers
#

log() {
    # Simple logger with prefix
    echo "[s3-cleanup] $*"
}

fail() {
    log "ERROR: $*"
    exit 1
}

#
# Configuration from environment variables
#

BASE_URL="${BASE_URL:-http://app:8080}"

# These may be provided directly or mapped from LIVEKIT_* via Docker env
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${LIVEKIT_S3_ACCESS_KEY:-}}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-${LIVEKIT_S3_SECRET:-}}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${LIVEKIT_S3_REGION:-}}"
S3_BUCKET="${S3_BUCKET:-${LIVEKIT_S3_BUCKET:-}}"
S3_ENDPOINT="${S3_ENDPOINT:-${LIVEKIT_S3_ENDPOINT:-}}"

# DRY_RUN=true|1 (case-insensitive) enables dry run
DRY_RUN="${DRY_RUN:-false}"
DRY_RUN_LOWER=$(echo "${DRY_RUN}" | tr '[:upper:]' '[:lower:]')
if [ "${DRY_RUN_LOWER}" = "true" ] || [ "${DRY_RUN_LOWER}" = "1" ]; then
    DRY_RUN_ENABLED=1
    log "[DRY RUN] Enabled. No S3 deletions will actually run."
else
    DRY_RUN_ENABLED=0
fi

#
# Configure AWS CLI
#

if [ -n "${S3_ENDPOINT}" ]; then
    export AWS_ENDPOINT_URL="${S3_ENDPOINT}"
fi

#
# Fetch active livestream
#

log "Fetching active livestream from ${BASE_URL}/api/livestreams/active..."
RESPONSE=$(curl -s "${BASE_URL}/api/livestreams/active" || echo "")

if [ -z "${RESPONSE}" ] || [ "${RESPONSE}" = "null" ]; then
    log "No active livestream found. Nothing to clean up."
    exit 0
fi

#
# Extract s3_path from JSON response using grep/sed
# Handles both "s3_path":"value" and "s3_path":null
#

S3_PATH=$(echo "${RESPONSE}" | grep -o '"s3_path":"[^"]*"' | sed 's/"s3_path":"\([^"]*\)"/\1/' || echo "")

if [ -z "${S3_PATH}" ] || echo "${RESPONSE}" | grep -q '"s3_path":null'; then
    log "No s3_path found in response or s3_path is null. Nothing to clean up."
    exit 0
fi

log "Found s3_path: ${S3_PATH}"

#
# Derive the active directory prefix we want to keep
# Example: "1-randomstring/live.m3u8" -> "1-randomstring/"
#

ACTIVE_DIR=$(echo "${S3_PATH}" | sed 's|/[^/]*$|/|')

if [ -z "${ACTIVE_DIR}" ] || [ "${ACTIVE_DIR}" = "/" ]; then
    fail "Invalid s3_path format. Cannot extract directory."
fi

log "Active S3 directory (to keep): ${ACTIVE_DIR}"

if [ -z "${S3_BUCKET}" ]; then
    fail "S3_BUCKET is not set. Aborting cleanup."
fi

#
# List top-level "directories" (common prefixes) in the bucket
#

log "Listing top-level prefixes in s3://${S3_BUCKET}/ ..."

if [ -n "${S3_ENDPOINT}" ]; then
    DIRS=$(aws s3 ls "s3://${S3_BUCKET}/" --endpoint-url "${S3_ENDPOINT}" | awk '{print $2}')
else
    DIRS=$(aws s3 ls "s3://${S3_BUCKET}/" | awk '{print $2}')
fi

if [ -z "${DIRS}" ]; then
    log "No directories found in bucket. Nothing to clean up."
    exit 0
fi

#
# Iterate all top-level dirs and delete everything except ACTIVE_DIR
#

for DIR in ${DIRS}; do
    # Ensure DIR ends with a slash for comparison consistency
    if [[ "${DIR}" != */ ]]; then
        DIR="${DIR}/"
    fi

    if [ "${DIR}" = "${ACTIVE_DIR}" ]; then
        log "Skipping active directory: ${DIR}"
        continue
    fi

    TARGET_URI="s3://${S3_BUCKET}/${DIR}"

    if [ "${DRY_RUN_ENABLED}" -eq 1 ]; then
        # Only show what would be executed
        if [ -n "${S3_ENDPOINT}" ]; then
            log "[DRY RUN] Would run: aws s3 rm \"${TARGET_URI}\" --recursive --endpoint-url \"${S3_ENDPOINT}\""
        else
            log "[DRY RUN] Would run: aws s3 rm \"${TARGET_URI}\" --recursive"
        fi
        continue
    fi

    log "Deleting directory (and contents): ${TARGET_URI}"

    if [ -n "${S3_ENDPOINT}" ]; then
        aws s3 rm "${TARGET_URI}" --recursive --endpoint-url "${S3_ENDPOINT}" || {
            log "Failed to delete ${TARGET_URI}"
        }
    else
        aws s3 rm "${TARGET_URI}" --recursive || {
            log "Failed to delete ${TARGET_URI}"
        }
    fi
done

log "Cleanup complete. Kept directory: s3://${S3_BUCKET}/${ACTIVE_DIR}"

