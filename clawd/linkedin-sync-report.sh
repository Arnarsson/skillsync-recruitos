#!/bin/bash
# LinkedIn Messages Intelligence Report
# Pulls from ~/.eureka/messages.db and orders by priority

DB=~/.eureka/messages.db
OUTPUT=/home/sven/clawd/linkedin-messages-report.md

# VIP contacts (meeting today)
VIP_CONTACTS=("Andreas Brøgger Jensen" "Christopher" "Thomas" "Daniel")

echo "# LinkedIn Messages Intelligence Report" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "**Generated:** $(date '+%Y-%m-%d %H:%M')" >> "$OUTPUT"
echo "**Database:** $DB" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Total count
TOTAL=$(sqlite3 "$DB" "SELECT COUNT(*) FROM messages WHERE platform='linkedin'")
echo "**Total LinkedIn messages:** $TOTAL" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Priority 1: Andreas (meeting at 11:30)
echo "## 🔥 Priority 1: Andreas Brøgger Jensen (Meeting Today 11:30)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
sqlite3 "$DB" <<EOF >> "$OUTPUT"
.mode markdown
SELECT 
  timestamp as "When",
  CASE 
    WHEN sender = 'Andreas Brøgger Jensen' THEN '▶️ Andreas'
    ELSE '◀️ You'
  END as "From",
  substr(content, 1, 100) || '...' as "Message"
FROM messages 
WHERE (sender LIKE '%Andreas%' OR conversation_with LIKE '%Andreas%')
AND platform = 'linkedin'
ORDER BY timestamp DESC
LIMIT 10;
EOF
echo "" >> "$OUTPUT"

# Priority 2: Recent active threads
echo "## 📬 Priority 2: Recent Active Threads (Last 7 Days)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
sqlite3 "$DB" <<EOF >> "$OUTPUT"
.mode markdown
SELECT 
  sender as "Contact",
  COUNT(*) as "Messages",
  MAX(timestamp) as "Last Message"
FROM messages
WHERE platform = 'linkedin'
AND sender != 'Sven Arnarsson'
AND timestamp > datetime('now', '-7 days')
GROUP BY sender
ORDER BY MAX(timestamp) DESC
LIMIT 10;
EOF
echo "" >> "$OUTPUT"

# Priority 3: Unread messages
echo "## 📨 Priority 3: Unread Messages" >> "$OUTPUT"
echo "" >> "$OUTPUT"
UNREAD=$(sqlite3 "$DB" "SELECT COUNT(*) FROM messages WHERE platform='linkedin' AND is_read=0")
echo "**Unread count:** $UNREAD" >> "$OUTPUT"
echo "" >> "$OUTPUT"

if [ "$UNREAD" -gt 0 ]; then
  sqlite3 "$DB" <<EOF >> "$OUTPUT"
.mode markdown
SELECT 
  sender as "From",
  timestamp as "When",
  substr(content, 1, 80) || '...' as "Preview"
FROM messages
WHERE platform = 'linkedin' 
AND is_read = 0
ORDER BY timestamp DESC
LIMIT 15;
EOF
else
  echo "_All messages read._" >> "$OUTPUT"
fi
echo "" >> "$OUTPUT"

# All contacts summary
echo "## 👥 All LinkedIn Contacts (Sorted by Recency)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
sqlite3 "$DB" <<EOF >> "$OUTPUT"
.mode markdown
SELECT 
  CASE 
    WHEN sender = 'Sven Arnarsson' THEN conversation_with
    ELSE sender
  END as "Contact",
  COUNT(*) as "Total Messages",
  MAX(timestamp) as "Last Activity"
FROM messages
WHERE platform = 'linkedin'
GROUP BY 
  CASE 
    WHEN sender = 'Sven Arnarsson' THEN conversation_with
    ELSE sender
  END
ORDER BY MAX(timestamp) DESC;
EOF
echo "" >> "$OUTPUT"

echo "✅ Report generated: $OUTPUT"
cat "$OUTPUT"
