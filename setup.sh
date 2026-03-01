#!/bin/bash
# =====================================================
# Sam Central — Mac Setup Script
# Version 2.0 | South Consultants NZ
# =====================================================

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo ""
echo "${BLUE}  ⚙️  Sam Central — Setup${NC}"
echo "  South Consultants NZ v2.0"
echo "────────────────────────────────"
echo ""

# --- Check macOS ---
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "${RED}❌ This app requires macOS${NC}"
  exit 1
fi
echo "${GREEN}✅ macOS detected${NC}"

# --- Check Homebrew ---
if ! command -v brew &>/dev/null; then
  echo "${YELLOW}⚙️  Installing Homebrew (this may take 2-3 minutes)...${NC}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
else
  echo "${GREEN}✅ Homebrew found: $(brew --version | head -1)${NC}"
fi

# Ensure brew is in PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
  echo "${YELLOW}⚙️  Installing Node.js...${NC}"
  brew install node
fi
NODE_VER=$(node --version 2>/dev/null)
echo "${GREEN}✅ Node.js: $NODE_VER${NC}"

# --- Check npm ---
if ! command -v npm &>/dev/null; then
  echo "${RED}❌ npm not found. Please reinstall Node.js${NC}"
  exit 1
fi
NPM_VER=$(npm --version 2>/dev/null)
echo "${GREEN}✅ npm: $NPM_VER${NC}"

# --- Check network links ---
echo ""
echo "${BLUE}🔗 Checking connections...${NC}"
check_url() {
  if curl -s --max-time 5 "$1" > /dev/null 2>&1; then
    echo "  ${GREEN}✅ $2${NC}"
  else
    echo "  ${YELLOW}⚠️  $2 (offline or unreachable)${NC}"
  fi
}
check_url "https://nzci-flexi-webhook-production.up.railway.app/health" "Railway API"
check_url "https://nzciflexi.wordpress.com" "WordPress Site"
check_url "https://gumroad.com" "Gumroad"
check_url "http://localhost:80" "Agent Zero (Docker)"
check_url "http://localhost:8080" "Local Dashboard (Docker)"

# --- Install npm packages ---
echo ""
echo "${BLUE}📦 Installing Electron...${NC}"
npm install

if [ $? -ne 0 ]; then
  echo "${RED}❌ npm install failed. Check your internet connection${NC}"
  exit 1
fi

echo ""
echo "────────────────────────────────"
echo "${GREEN}✅ Sam Central is ready!${NC}"
echo ""
echo "TO LAUNCH:"
echo "  ${BLUE}npm start${NC}"
echo ""
echo "TO BUILD .app (double-clickable):"
echo "  ${BLUE}npm run build-mac${NC}"
echo ""
echo "${YELLOW}SIRI SHORTCUTS — add these in Shortcuts.app:${NC}"
echo "  samcentral://open     →  'Open Sam Central'  "
echo "  samcentral://status   →  'Sam Central Status'  "
echo "  samcentral://emails   →  'Sam Central Emails'  "
echo "  samcentral://briefing →  'Sam Central Briefing'  "
echo ""
echo "${YELLOW}CALENDAR AUTOMATION — in Shortcuts.app:${NC}"
echo "  Automation → Time of Day → 8:00 AM → Open URL: samcentral://briefing"
echo ""
