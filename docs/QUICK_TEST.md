# Quick API Testing (Browser Console)

Open your browser console (F12) on `http://localhost:3000/admin` (while logged in) and run these tests:

## Test 1: Check if you're authenticated

```javascript
// This should return your user object if logged in
fetch('/api/admin/albums', { method: 'GET' })
  .then(r => r.json())
  .then(console.log);
```

## Test 2: Try creating an album (as admin)

```javascript
fetch('/api/admin/albums', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Album',
    slug: 'test-album-' + Date.now(),
    publish_status: 'draft',
    release_date: '2025-01-01'
  })
})
  .then(r => r.json())
  .then(console.log);
```

**Expected Result:**
- If you're **admin**: Should return `201 Created` with album data
- If you're **not admin** or **not logged in**: Should return `401` or `403`

## Test 3: Check public access (without auth)

Open an **incognito/private window** and visit:
- `http://localhost:3000/dev/albums` - Should only show published albums
- `http://localhost:3000/dev/events` - Should only show published events

---

## Test in Supabase SQL Editor

Go to Supabase Dashboard > SQL Editor and test RLS:

### Test as anonymous user:
```sql
SET ROLE anon;
SELECT * FROM albums;  -- Should only return published
SELECT * FROM events;  -- Should only return published
```

### Test as authenticated user:
```sql
SET ROLE authenticated;
SELECT * FROM albums;  -- Should only return published (if not admin)
```

### Test admin access:
```sql
-- First, set your user_id (replace with actual ID from auth.users)
SET LOCAL request.jwt.claim.sub = 'your-user-id-here';

-- Run as admin (if your user_settings.role = 'admin')
SELECT * FROM albums;  -- Should return ALL albums
```

---

## Quick Manual Checklist

1. ✅ **Public pages work** - Visit `/dev` or `/` (no login required)
2. ✅ **Admin requires auth** - Visit `/admin` (redirects to login)
3. ✅ **Login works** - Can log in with credentials
4. ✅ **Admin dashboard loads** - After login, see sidebar/header
5. ✅ **Can create/edit** - Try creating an album in admin UI (if admin)
6. ✅ **Public sees only published** - Check `/dev/albums` in incognito window

