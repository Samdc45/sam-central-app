#!/bin/bash
# Sam Central Mac App - One-Line Setup
# Run: bash setup.sh

echo '🚀 Setting up Sam Central Mac App...'

# Check node
if ! command -v node &>/dev/null; then
  echo 'Installing Node.js...'
  brew install node 2>/dev/null || {
    echo 'Please install Node.js from https://nodejs.org'
    exit 1
  }
fi

echo "Node $(node --version) ready"
npm install

echo ''
echo '✅ Setup complete!'
echo ''
echo 'TO RUN:'
echo '   npm start'
echo ''
echo 'TO BUILD .dmg installer:'
echo '   npm run build-mac'
echo ''
echo 'SIRI SHORTCUTS - Create these in Shortcuts.app:'
echo '   samcentral://open     -> Open Sam Central'
echo '   samcentral://status   -> Sam Central Status'
echo '   samcentral://emails   -> Sam Central Emails'
echo '   samcentral://briefing -> Sam Central Briefing'
