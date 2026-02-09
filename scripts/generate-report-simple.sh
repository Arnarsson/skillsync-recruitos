#!/bin/bash
# Quick Win CLI - Generate Recruitment Report
# Brug: ./scripts/generate-report-simple.sh <github-username>

USERNAME=$1
API_URL=${API_URL:-"http://localhost:3000"}

if [ -z "$USERNAME" ]; then
  echo "Brug: ./scripts/generate-report-simple.sh <github-username>"
  echo "Eksempel: ./scripts/generate-report-simple.sh ecederstrand"
  exit 1
fi

echo "🚀 RecruitOS CLI - Genererer rapport for @$USERNAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Kald GitHub profile API
echo "🔍 Henter GitHub data..."
GITHUB_DATA=$(curl -s "$API_URL/api/github/user?username=$USERNAME")

# 2. Kald psychometric profile API
echo "🧠 Genererer BigFive + Team Fit analyse..."
REPORT=$(curl -s -X POST "$API_URL/api/profile/psychometric" \
  -H "Content-Type: application/json" \
  -d "{\"githubUsername\": \"$USERNAME\"}")

# Check for errors
if echo "$REPORT" | grep -q "error"; then
  echo "❌ Fejl: $(echo $REPORT | jq -r '.error // .details // "Unknown error"')"
  exit 1
fi

# 3. Hent rapport ID
REPORT_ID=$(echo "$REPORT" | jq -r '.reportId // .id // empty')

if [ -z "$REPORT_ID" ]; then
  echo "❌ Kunne ikke oprette rapport"
  echo "Response: $REPORT"
  exit 1
fi

# Success!
REPORT_URL="$API_URL/report/$REPORT_ID"

echo "✅ Rapport genereret!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Share Link: $REPORT_URL"
echo ""
echo "💡 Send dette link til Thomas (ingen login påkrævet)"
echo ""
