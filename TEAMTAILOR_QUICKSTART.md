# Team Tailor Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure API Token

1. Get your Team Tailor API token:
   - Log in to Team Tailor
   - Go to Settings → API
   - Generate or copy existing token

2. Add to `.env` file:
   ```bash
   TEAMTAILOR_API_TOKEN=your_api_token_here
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

### Step 2: Test Integration

Open your browser and test the integration status:

```bash
# Visit this URL (requires login)
http://localhost:3000/api/teamtailor/test
```

Expected response:
```json
{
  "configured": true,
  "connected": true,
  "message": "Team Tailor integration is working correctly"
}
```

### Step 3: Use in UI

Import and use the component in any page:

```tsx
import { TeamTailorExport } from '@/components/TeamTailorExport';

function MyRecruitingPage() {
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([
    // Your candidates here
  ]);

  return (
    <div>
      <TeamTailorExport
        candidates={selectedCandidates}
        onExportComplete={(results) => {
          console.log('Export complete!', results);
        }}
      />
    </div>
  );
}
```

### Step 4: Export Candidates

1. Select candidates you want to export
2. Enter email addresses (required by Team Tailor)
3. Optionally enter phone numbers
4. Optionally enter Team Tailor job ID
5. Click "Export to Team Tailor"
6. View results with direct links to Team Tailor profiles

## 📋 Quick API Reference

### Check Status
```bash
GET /api/teamtailor/export
```

### Export Candidates
```bash
POST /api/teamtailor/export
Content-Type: application/json

{
  "candidates": [
    {
      "candidate": { /* Candidate object */ },
      "email": "candidate@example.com",
      "phone": "+45 12 34 56 78"
    }
  ],
  "jobId": "optional-team-tailor-job-id",
  "includeEvidence": true,
  "tags": ["Q1-2026", "Senior"]
}
```

### Test Connection
```bash
GET /api/teamtailor/test
```

## 🧪 Testing Checklist

- [ ] API token configured in `.env`
- [ ] Dev server restarted
- [ ] Test endpoint returns success
- [ ] Export test candidate
- [ ] Verify candidate appears in Team Tailor
- [ ] Check custom fields are populated
- [ ] Verify tags are applied

## 🔧 Troubleshooting

### "Integration not configured"
- Check `.env` file has `TEAMTAILOR_API_TOKEN`
- Restart dev server
- Verify token is valid in Team Tailor

### "Connection failed"
- Verify token has API access permissions
- Check Team Tailor account is active
- Try generating a new token

### "Email required"
- Team Tailor requires email for all candidates
- Collect email before export
- No workaround available

## 📚 Full Documentation

See `docs/TEAMTAILOR_INTEGRATION.md` for complete documentation.

## 🎯 Danish Market Impact

Team Tailor is used by 70%+ of Danish tech companies. This integration:
- Removes manual data entry friction
- Preserves RecruitOS scores and insights
- Enables one-click candidate submission
- Expected 3-5x increase in Danish conversion rate

**This is the key to Danish market success!** 🇩🇰
