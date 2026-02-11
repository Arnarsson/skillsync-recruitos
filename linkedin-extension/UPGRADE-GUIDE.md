# Upgrade Guide - RecruitOS LinkedIn Sync v1.1.0

## What's New

### LinkedIn Notification Monitoring
The extension now automatically captures:
- **Mentions** - When someone mentions you in a comment
- **Replies** - When someone replies to your comment
- **Likes** - When someone likes your comment or post
- **Comments** - When someone comments on your post
- **Shares** - When someone shares your post

Notifications sync to **Eureka Dashboard** (via GOG Bridge) with VIP highlighting for key contacts.

## Upgrade Steps

### If Extension Already Installed
1. Open `chrome://extensions/`
2. Find "RecruitOS LinkedIn Sync"
3. Click **Remove**
4. Click **Load unpacked** 
5. Select: `/home/sven/Documents/2026/Active/skillsync-recruitos/linkedin-extension`

### Fresh Installation
1. Ensure **GOG Bridge is running**: `systemctl --user status gog-bridge`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select: `/home/sven/Documents/2026/Active/skillsync-recruitos/linkedin-extension`

## Verify It Works

### 1. Check Extension Loaded
- Extension icon appears in Chrome toolbar
- Click icon → Settings popup opens
- Version shows `1.1.0`

### 2. Test Notification Capture
```bash
# Open LinkedIn notifications
https://www.linkedin.com/notifications/

# Wait 2-3 seconds (auto-capture runs)

# Check console (F12)
[RecruitOS] LinkedIn Sync initialized
[RecruitOS] Extracted X notifications
[RecruitOS] Syncing X notifications to Eureka

# Verify in database
sqlite3 ~/.eureka/messages.db "SELECT COUNT(*) FROM linkedin_notifications;"
```

### 3. Check Eureka Dashboard
```bash
# Open dashboard
https://eureka-ai.cc
# Password: eureka2026

# LinkedIn notifications widget should show:
- New notifications with actor names
- VIP highlighting (Christopher = gold)
- Timestamp and preview text
```

## New API Endpoint

Extension now calls:
```
POST http://localhost:8001/api/linkedin/notifications
```

Ensure GOG Bridge is running or notifications won't sync.

## Rollback (if needed)

```bash
cd /home/sven/Documents/2026/Active/skillsync-recruitos
git checkout 7e5e442  # Previous version (1.0.0)
# Reload extension in Chrome
```

## Troubleshooting

### Notifications not appearing in database
- Check GOG Bridge: `systemctl --user status gog-bridge`
- Check console (F12) for sync errors
- Verify host permission for localhost:8001 in manifest

### Extension won't load
- Check manifest.json syntax (must be valid JSON)
- Remove old version completely before reloading
- Check Chrome console (chrome://extensions/) for errors

### Duplicates in database
- Extension deduplicates by actor+type+preview
- Database has unique constraint on notifications
- If seeing duplicates, may need to clear: `DELETE FROM linkedin_notifications;`
