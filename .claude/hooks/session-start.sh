#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing Node.js dependencies..."
cd "$CLAUDE_PROJECT_DIR"
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Session setup complete."
