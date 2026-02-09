# Demo Mode Verification - Remove Purchase CTAs

## Changes Made (Issue 7-275)

### Problem
User was confused by "Køb Deep Profile" (Buy Deep Profile) messages appearing in demo mode.

### Solution
Added conditional logic to hide all purchase-related CTAs when demo mode is active.

## Files Modified

1. **`app/search/page.tsx`**
   - Added `isDemoMode` from `useAdmin()` hook
   - Updated `isLocked` to check: `!isAdmin && !isDemoMode && searchCount >= FREE_SEARCHES`
   - Updated `incrementSearchCount` to skip counting in demo mode
   - Updated `searchDevelopers` to skip lock check in demo mode
   - Added condition to hide signup modal: `{showSignupModal && !isDemoMode && (`

2. **`components/CreditGate.tsx`**
   - Imported `useAdmin` hook
   - Added early return when `isDemoMode` is true
   - Prevents credit gate modal from showing in demo mode

## Testing Instructions

### 1. Activate Demo Mode
Two ways to activate:
- **URL parameter**: Add `?demo=true` to any URL (e.g., `http://localhost:3000?demo=true`)
- **Keyboard shortcut**: Press `Ctrl+Shift+A` (already enables admin mode which includes demo)

### 2. Verify No Purchase CTAs

#### Search Page (`/search`)
1. Navigate to `/search`
2. Perform multiple searches (more than 1)
3. **EXPECTED**: No "Gratis søgning brugt" (Free search used) modal appears
4. **EXPECTED**: Search continues to work unlimited

#### Pipeline/Deep Profile (when implemented)
1. Navigate to pipeline with candidates
2. Try to unlock deep profile or outreach
3. **EXPECTED**: No CreditGate modal asking for payment
4. **EXPECTED**: Feature works without credit prompts

### 3. Verify Normal Mode Still Works

1. Clear demo mode:
   ```javascript
   localStorage.removeItem('recruitos_demo_mode');
   localStorage.removeItem('recruitos_admin_mode');
   ```
2. Refresh page
3. Perform 2 searches
4. **EXPECTED**: After 1st free search, modal appears asking to sign up
5. **EXPECTED**: Credit gate works normally when triggered

## How Demo Mode Works

Demo mode is controlled by:
- **URL param**: `?demo=true` → sets `localStorage.recruitos_demo_mode = "true"`
- **Keyboard**: `Ctrl+Shift+A` → toggles admin mode (which grants similar access)
- **Context**: `useAdmin()` hook provides `{ isDemoMode, isAdmin }`

## Definition of Done Checklist

- [x] Find all "Køb" / purchase CTAs in codebase
- [x] Add conditional: if demo mode, hide purchase prompts  
- [ ] Fresh browser test passed (manual testing required)
- [ ] PR committed

## Next Steps

1. **Manual Testing**: Run dev server and verify using instructions above
2. **Browser Test**: Open in fresh browser (incognito), activate demo mode, verify no purchase CTAs
3. **Commit Changes**: Create PR with these changes

## Quick Test Commands

```bash
# Start dev server
npm run dev

# In browser console, activate demo mode
localStorage.setItem('recruitos_demo_mode', 'true');
localStorage.setItem('recruitos_admin_mode', 'true');
location.reload();

# Verify demo mode is active
console.log(localStorage.getItem('recruitos_demo_mode')); // Should return 'true'

# Deactivate demo mode
localStorage.removeItem('recruitos_demo_mode');
localStorage.removeItem('recruitos_admin_mode');
location.reload();
```
