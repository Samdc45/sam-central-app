#!/bin/bash
# ╔══════════════════════════════════════╗
# ║   SAM CENTRAL — Auto Installer      ║
# ║   Double-click to install & launch  ║
# ╚══════════════════════════════════════╝
# This file runs automatically when double-clicked in Finder

clear
echo ""
echo "  ⚙️  SAM CENTRAL"
echo "  South Consultants NZ"
echo "  ─────────────────────────────"
echo ""

# Move to the folder this script lives in
cd "$(dirname "$0")"

# ─── Step 1: Homebrew ────────────────────────────────────────
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v brew &>/dev/null; then
  echo "  Installing Homebrew (1-2 min)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" < /dev/null
  # Apple Silicon path
  [[ -f /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile 2>/dev/null
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
echo "  ✅ Homebrew ready"

# ─── Step 2: Node.js ─────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "  Installing Node.js..."
  brew install node --quiet
fi
echo "  ✅ Node.js $(node --version)"

# ─── Step 3: Get latest app files ────────────────────────────
if [ ! -f "package.json" ]; then
  echo "  Downloading Sam Central..."
  cd /tmp
  rm -rf sam-central-app 2>/dev/null
  git clone --quiet https://github.com/Samdc45/sam-central-app.git
  cd sam-central-app
else
  echo "  Updating Sam Central..."
  git pull --quiet 2>/dev/null || true
fi
echo "  ✅ Files ready"

# ─── Step 4: Install dependencies ────────────────────────────
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "  Installing Electron (1 min first time)..."
  npm install --silent
fi
echo "  ✅ Dependencies installed"

# ─── Step 5: Link check ───────────────────────────────────────
echo ""
echo "  🔗 Checking connections..."
check_url() {
  curl -s --max-time 4 "$1" > /dev/null 2>&1 && echo "    ✅ $2" || echo "    ⚠️  $2 offline"
}
check_url "https://nzci-flexi-webhook-production.up.railway.app" "Railway (dashboard)"
check_url "https://nzciflexi.wordpress.com" "WordPress site"
check_url "http://localhost:80" "Agent Zero (Docker)"

# ─── Step 6: Launch ──────────────────────────────────────────
echo ""
echo "  ─────────────────────────────"
echo "  🚀 Launching Sam Central..."
echo "  Look for SC in your menu bar!"
echo "  ─────────────────────────────"
echo ""

npm start &
NPM_PID=$!

# Wait 5 seconds then close this terminal window
sleep 5

# Close the Terminal window (macOS AppleScript)
osascript -e 'tell application "Terminal" to close (every window whose name contains "SamCentral")' 2>/dev/null
osascript -e 'tell application "Terminal" to if (count of windows) is 0 then quit' 2>/dev/null

wait $NPM_PID
