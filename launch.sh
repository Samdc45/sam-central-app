#!/bin/bash
# Sam Central - Launch Script
# This script is called by the Automator app

LOG="$HOME/Library/Logs/SamCentral.log"
echo "$(date) Starting Sam Central..." >> "$LOG"

# Find sam-central-app folder - check common Agent Zero mount paths
for DIR in     "$HOME/agent-zero-data/projects/project_south_consultants/sam-central-app"     "$HOME/Documents/agent-zero-data/projects/project_south_consultants/sam-central-app"     "$HOME/Desktop/sam-central-app"     "$(find $HOME -name 'sam-central-app' -type d 2>/dev/null | head -1)"; do
    if [ -f "$DIR/package.json" ]; then
        APP_DIR="$DIR"
        break
    fi
done

if [ -z "$APP_DIR" ]; then
    osascript -e 'display alert "Sam Central" message "Could not find sam-central-app folder. Please check installation." as warning'
    exit 1
fi

echo "$(date) Found app at: $APP_DIR" >> "$LOG"
cd "$APP_DIR"

# Install Node if missing
if ! command -v node &>/dev/null; then
    export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "$(date) Installing dependencies..." >> "$LOG"
    npm install >> "$LOG" 2>&1
fi

# Launch the app
echo "$(date) Launching Electron..." >> "$LOG"
npm start >> "$LOG" 2>&1
