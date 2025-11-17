# Authentication & Authorization Testing Checklist

## Prerequisites

Before testing, ensure:
- ✅ All migrations have been run in Supabase
- ✅ You have created at least one user in Supabase Auth (via Supabase Dashboard)
- ✅ You have created a corresponding entry in `user_settings` table with `role = 'admin'`
- ✅ Supabase Auth signups are disabled (Settings > Authentication > Providers > Email)
- ✅ Email + Password provider is enabled

### Setting up your first admin user

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Go to SQL Editor and run:
```sql
INSERT INTO public.user_settings (user_id, role, avatar_url, style_color)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'admin',
  NULL,
  NULL
);
```

---

## 1. Authentication Testing

### 1.1 Login Page Access
- [ ] Visit `/admin/login` - should load without errors
- [ ] Login page should NOT show admin sidebar/header (plain page)
- [ ] Login form should be visible and functional

### 1.2 Login Flow
- [ ] Try logging in with **invalid credentials** - should show error message
- [ ] Try logging in with **valid credentials** - should redirect to `/admin`
- [ ] After successful login, should see admin dashboard with sidebar/header
- [ ] Browser should have Supabase session cookies set

### 1.3 Protected Routes
- [ ] Visit `/admin` without being logged in - should redirect to `/admin/login`
- [ ] Visit `/admin/albums` without being logged in - should redirect to `/admin/login`
- [ ] Visit `/admin/artists` without being logged in - should redirect to `/admin/login`
- [ ] Visit any `/admin/*` route without auth - should redirect to `/admin/login`

### 1.4 Public Routes (Should Work Without Auth)
- [ ] Visit `/` (homepage) - should work (no redirect)
- [ ] Visit `/dev` pages - should work (no redirect)
- [ ] Public pages should still load published content

---

## 2. Authorization Testing (Role-Based Access)

### 2.1 Admin User Access
- [ ] Log in as a user with `role = 'admin'` in `user_settings`
- [ ] Should be able to access all `/admin/*` pages
- [ ] Should see admin sidebar and header

### 2.2 Regular User Access
- [ ] Create a test user with `role = 'user'` in `user_settings`
- [ ] Log in as this user
- [ ] Should be able to access `/admin` pages (can view)
- [ ] Should NOT be able to create/update/delete via API (test below)

### 2.3 API Protection
Test that admin-only endpoints are protected:

#### Albums API (`/api/admin/albums`)
- [ ] **Without auth**: POST/PUT/DELETE should return 401 Unauthorized
- [ ] **With 'user' role**: POST/PUT/DELETE should return 403 Forbidden
- [ ] **With 'admin' role**: POST/PUT/DELETE should work (200/201)

#### Test with curl or browser console:
```bash
# Test without auth (should fail)
curl -X POST http://localhost:3000/api/admin/albums \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","publish_status":"draft"}'

# Test with admin session (should work - use cookies from browser after login)
```

Repeat for other admin API routes:
- [ ] `/api/admin/artists`
- [ ] `/api/admin/events`
- [ ] `/api/admin/labels`
- [ ] `/api/admin/platforms`
- [ ] `/api/admin/updates`

---

## 3. Row Level Security (RLS) Testing

### 3.1 Public Read Access (Published Content Only)

Test as **anonymous user** (incognito/private browser or no auth):

- [ ] Query published albums - should only return rows with `publish_status = 'published'`
- [ ] Query published events - should only return rows with `publish_status = 'published'`
- [ ] Query published updates - should only return rows with `publish_status = 'published'`
- [ ] Draft/scheduled/archived content should NOT be visible

#### Test in Supabase SQL Editor:
```sql
-- As anonymous role (should only see published)
SELECT * FROM albums;  -- Should only show published
SELECT * FROM events;  -- Should only show published  
SELECT * FROM updates; -- Should only show published
```

### 3.2 Reference Tables (Always Public)
- [ ] Query `artists` - should return all rows (no filter)
- [ ] Query `labels` - should return all rows (no filter)
- [ ] Query `platforms` - should return all rows (no filter)

### 3.3 Admin Full Access

Log in as admin and test in Supabase SQL Editor or your app:

- [ ] Can SELECT all albums (including drafts/unpublished)
- [ ] Can INSERT new albums
- [ ] Can UPDATE any album
- [ ] Can DELETE any album
- [ ] Same for events, updates, artists, labels, platforms

#### Test RLS in Supabase:
1. Go to Supabase Dashboard > Authentication > Policies
2. Verify policies exist:
   - `anon can read published albums` (albums table)
   - `admin full albums` (albums table)
   - Similar for other tables

---

## 4. User Settings Testing

### 4.1 User Settings Table
- [ ] `user_settings` table exists
- [ ] Has columns: `user_id`, `role`, `avatar_url`, `style_color`
- [ ] `user_id` is foreign key to `auth.users(id)`
- [ ] RLS is enabled on `user_settings`

### 4.2 User Settings Policies
- [ ] Users can read their own settings
- [ ] Users can update their own settings
- [ ] Admins can read/update all user settings

Test in Supabase SQL Editor:
```sql
-- As logged-in user, should only see own settings
SELECT * FROM user_settings; 

-- As admin, should see all settings
SELECT * FROM user_settings;
```

---

## 5. Edge Cases & Security

### 5.1 Session Management
- [ ] After closing browser, session should persist (if cookies set correctly)
- [ ] After logout (if implemented), should redirect to login
- [ ] Invalid/expired session should redirect to login

### 5.2 Route Protection
- [ ] Direct URL access to `/admin/*` routes should require auth
- [ ] Login page should NOT redirect if already logged in (or handle gracefully)

### 5.3 API Security
- [ ] API routes don't leak sensitive data in error messages
- [ ] 401/403 responses are properly formatted
- [ ] No CORS issues when calling APIs from frontend

---

## 6. Database Verification

### 6.1 Migrations Applied
Check in Supabase Dashboard > Database > Migrations:
- [ ] `20250102110000_create_user_settings.sql` - applied
- [ ] `20250102111000_rls_public_read_published.sql` - applied
- [ ] `20250102112000_rls_admin_crud.sql` - applied

### 6.2 Helper Functions
- [ ] `is_admin()` function exists (check in Database > Functions)
- [ ] Function returns boolean correctly

---

## 7. Browser Console Testing

Open browser DevTools (F12) and check for:
- [ ] No authentication errors in console
- [ ] No RLS policy errors
- [ ] Session cookies are set after login
- [ ] Network requests to `/api/admin/*` return proper status codes

---

## Quick Smoke Test Script

1. **Public Access**: Visit homepage → should work
2. **Unauthenticated**: Visit `/admin` → should redirect to `/admin/login`
3. **Login**: Enter credentials → should redirect to `/admin`
4. **Protected**: Visit `/admin/albums` → should load (if admin)
5. **API Test**: Try creating an album via admin UI → should work (if admin)
6. **Public Data**: Visit `/dev/albums` → should only show published albums

---

## Troubleshooting

If something doesn't work:

1. **Check Supabase Dashboard**:
   - Authentication > Users (user exists?)
   - Database > Tables > user_settings (role set correctly?)
   - Database > Policies (RLS policies enabled?)

2. **Check Browser**:
   - DevTools > Application > Cookies (session cookies present?)
   - DevTools > Console (any errors?)

3. **Check Environment Variables**:
   - `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Check Migrations**:
   - All migrations applied successfully?
   - No migration errors in Supabase logs?

---

## Success Criteria

✅ All tests pass
✅ Public users can only see published content
✅ Only authenticated users can access `/admin`
✅ Only admin users can modify data via API
✅ RLS policies work as expected
✅ No console errors or security issues

