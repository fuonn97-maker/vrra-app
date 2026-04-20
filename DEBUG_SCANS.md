# Scan and Score Debugging Guide

## RLS Authentication Fix (CRITICAL)

The `scans` and `user_scores` tables use Row Level Security (RLS) requiring:
```sql
auth.uid() = user_id
```

**Why it was failing:**
- Old code created Supabase client WITHOUT token
- Client ran as `anon` user, not authenticated
- RLS check failed: `auth.uid()` (anon) ≠ `user_id` (real user)

**The Fix:**
1. Client sends Authorization header: `Authorization: Bearer {access_token}`
2. API extracts token from header
3. API creates authenticated Supabase client with token in headers:
   ```typescript
   const authenticatedSupabase = createClient(URL, KEY, {
     global: {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     },
   })
   ```
4. All queries use `authenticatedSupabase` (not default anon client)
5. RLS check now passes: `auth.uid()` (real user) = `user_id` ✓

**Key difference:**
```typescript
// WRONG: Anon client doesn't respect auth
const supabase = createClient(URL, KEY) // auth.uid() = anon

// RIGHT: Authenticated client with token
const supabase = createClient(URL, KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } }
}) // auth.uid() = user_id
```

## Expected Server Logs (Success Case)

When a scan saves successfully, check Next.js server logs for:

```
[v0] POST /api/scores - Received request
[v0] foodName: Grilled Chicken with Rice
[v0] mealData: { calories: 450, protein: 38, carbs: 48, fat: 12 }
[v0] Authenticated userId: 550e8400-e29b-41d4-a716-446655440000
[v0] Creating authenticated Supabase client with token
[v0] Authenticated client created, auth.uid() will equal: 550e8400-e29b-41d4-a716-446655440000
[v0] Calculated mealScore: 85
[v0] Saving scan to public.scans table
[v0] Scan insert payload: { user_id: '550e8400...', meal_name: 'Grilled Chicken with Rice', ... }
[v0] Scan inserted successfully
[v0] Checking for existing user_scores for user_id: 550e8400... date: 2024-01-15
[v0] Existing score: null
[v0] Creating new user_scores record
[v0] User scores inserted successfully
[v0] Returning success response
```

## Database Verification

After scanning, verify in your Supabase SQL editor:

**Check scans table:**
```sql
SELECT * FROM public.scans 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check user_scores table:**
```sql
SELECT * FROM public.user_scores 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY date DESC 
LIMIT 5;
```

**Verify RLS policy (should show these):**
```sql
SELECT * FROM pg_policies WHERE tablename = 'scans';
```

Expected output:
- USING: `auth.uid() = user_id`
- WITH CHECK: `auth.uid() = user_id`

## Common Errors and Solutions

### Error: "new row violates row-level security policy"
**Cause:** Supabase client not running as authenticated user (still running as anon)
**Fix:**
1. Verify API creates authenticated client with token
2. Check server logs show: `[v0] Creating authenticated Supabase client with token`
3. Ensure all inserts use `authenticatedSupabase` (not default client)
4. Verify token is passed in Authorization header

### Error: "Unauthorized" from API
**Cause:** Missing or invalid access token
**Fix:**
1. Verify client calls `getSession()` to get access token
2. Check token is sent in Authorization header: `Authorization: Bearer <token>`
3. Ensure token is not expired (refresh if needed)

### Error: "Missing authorization token"
**Cause:** Client didn't send Authorization header
**Fix:**
1. Open DevTools → Network tab
2. Trigger a scan
3. Click `/api/scores` request
4. Check Headers tab for `Authorization: Bearer ...`
5. If missing, verify scan-meal page calls `getSession()`

### Error: Scans saved but body score not updating
**Cause:** Home screen not fetching scores
**Fix:**
1. Verify home screen has `useEffect(() => { fetchScores() }, [])`
2. Check GET `/api/scores` returns records
3. Refresh page to see updated body score

## Testing Step-by-Step

1. **Open DevTools**: F12 → Console tab
2. **Login** to app with test account
3. **Take a meal photo** and go through scan flow
4. **Watch console** for `[v0]` debug logs
5. **Check server logs** at vercel.com dashboard or local terminal
6. **Query Supabase** to verify data saved:
   ```sql
   SELECT COUNT(*) FROM public.scans WHERE user_id = '<your-id>';
   SELECT COUNT(*) FROM public.user_scores WHERE user_id = '<your-id>';
   ```

## If Still Not Working

1. **Clear all cache**: Ctrl+Shift+Delete → Clear all browsing data
2. **Logout completely** and login again
3. **Check access token**: In DevTools Console, run:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log(session?.access_token)
   ```
4. **Verify user_id**: Run in console:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser()
   console.log(user?.id)
   ```
5. **Check RLS policies** are set on both tables
6. **Try creating new test user** and scan with them
