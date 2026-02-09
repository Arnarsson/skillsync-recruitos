# RecruitOS Monitoring Setup

## Health Check Endpoint

**URL:** `/api/health`
**Method:** GET
**Auth:** None (public endpoint for monitoring services)

### Response

```json
{
  "status": "ok",
  "database": true,
  "timestamp": "2026-02-09T12:00:00.000Z",
  "version": "0.2.0"
}
```

- `status`: `"ok"` when all systems healthy, `"degraded"` when any check fails
- `database`: PostgreSQL connectivity check
- HTTP 200 = healthy, HTTP 503 = degraded

## Sentry Error Monitoring

- **Dashboard:** https://sentry.io (org: recruitos, project: recruitos-web)
- **Client errors:** Captured via `sentry.client.config.ts`
- **Server errors:** Captured via `sentry.server.config.ts` + `instrumentation.ts`
- **Unhandled errors:** Caught by `app/global-error.tsx` error boundary
- **Session replay:** 10% of sessions, 100% of error sessions

### Required Environment Variables
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source map uploads
```

## Uptime Monitoring (Recommended: BetterUptime)

### Setup
1. Create account at https://betteruptime.com
2. Add monitor:
   - **URL:** `https://recruitos.dk/api/health`
   - **Check frequency:** 1 minute
   - **Request method:** GET
   - **Expected status:** 200
3. Configure alerts:
   - Email: team@recruitos.dk
   - Slack: #ops-alerts channel
4. Set incident thresholds:
   - **Incident after:** 3 consecutive failures (3 min)
   - **Recovery after:** 2 consecutive successes

### Alternative Services
- **UptimeRobot** (free tier: 50 monitors, 5 min interval)
- **Pingdom** (more advanced, paid)
