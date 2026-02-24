#!/bin/bash
# Start the Yogifi Pose Detection microservice.
# Activate the yogifi-env virtualenv from the pose_detection project if it exists.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# yogifi-ai/pose-service/ → yogifi-ai/ → Projects/ → pose_detection/yogifi-env
VENV_PATH="$SCRIPT_DIR/../../pose_detection/yogifi-env"

if [ -d "$VENV_PATH" ]; then
    echo "Activating virtualenv: $VENV_PATH"
    source "$VENV_PATH/bin/activate"
else
    echo "No virtualenv found at $VENV_PATH — using system Python"
fi

echo "Starting Yogifi Pose Service on port 8001..."
cd "$SCRIPT_DIR"
python3 main.py
