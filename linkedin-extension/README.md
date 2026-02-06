# RecruitOS LinkedIn Sync Extension

Chrome extension that captures LinkedIn profiles and messages to your RecruitOS pipeline.

## Features

### Tier 1: Passive Capture (Safe)
- **Profile capture**: Automatically captures profiles you view
- **Message sync**: Syncs LinkedIn conversations to RecruitOS inbox
- **"Add to Pipeline" button**: One-click add from any profile page
- **Local storage**: Works offline, syncs when connected

### Safety Features
- Rate limiting (max 50 captures/hour)
- 3-second cooldown between captures
- User-initiated only (no background automation)
- No credential storage
- No mass scraping

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `linkedin-extension` folder

## Configuration

1. Click the extension icon in Chrome toolbar
2. Enter your RecruitOS API key
3. Toggle auto-capture and message sync as needed

## API Endpoints (RecruitOS)

The extension expects these endpoints:

### POST `/api/linkedin/candidate`
```json
{
  "source": "linkedin_extension",
  "profile": {
    "linkedinId": "john-doe-123",
    "name": "John Doe",
    "headline": "Senior Engineer at Company",
    "location": "Copenhagen, Denmark",
    "currentCompany": "Company",
    "photoUrl": "https://...",
    "about": "...",
    "experience": [...],
    "url": "https://linkedin.com/in/john-doe-123"
  },
  "capturedAt": "2026-02-06T10:00:00Z"
}
```

### POST `/api/linkedin/messages`
```json
{
  "source": "linkedin_extension",
  "messages": [
    {
      "platform": "linkedin",
      "sender": "John Doe",
      "content": "Message text",
      "timestamp": "...",
      "conversationWith": "John Doe",
      "url": "https://linkedin.com/messaging/thread/..."
    }
  ],
  "syncedAt": "2026-02-06T10:00:00Z"
}
```

## Data Flow

```
User browses LinkedIn
        ↓
Extension observes (passive)
        ↓
Data stored locally first
        ↓
Synced to RecruitOS API
        ↓
Appears in candidate pipeline
```

## Files

- `manifest.json` - Extension configuration
- `content.js` - Runs on LinkedIn pages, extracts data
- `background.js` - Service worker, handles API calls
- `popup.html/js` - Extension popup UI
- `overlay.css` - "Add to RecruitOS" button styles

## Rate Limits

| Limit | Value |
|-------|-------|
| Max captures per hour | 50 |
| Cooldown between captures | 3 seconds |
| Local storage limit | 500 profiles, 200 queued |

## Privacy

- No data sent without user's API key configured
- Profile data stored locally first
- User controls what gets synced
- No third-party analytics or tracking
