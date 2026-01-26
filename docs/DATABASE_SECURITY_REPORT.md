# Database Security Audit Report
**Generated:** 2025-02-02  
**Scope:** Complete database schema analysis and Row Level Security (RLS) audit

---

## Executive Summary

This report identifies **critical security vulnerabilities** in your database schema. Several tables are completely unprotected, and some tables with RLS have **incorrect policies** that allow unauthorized access. Immediate action is required.

### Critical Issues Found:
- **11 tables** have NO RLS protection (completely exposed)
- **2 tables** contain sensitive credentials (oauth_tokens, workflow_secrets) with NO protection
- **3 tables** have incorrect RLS policies allowing ANY authenticated user full access
- **4 junction tables** are unprotected and could leak data relationships

---

## Tables with RLS Protection ✅

These tables have RLS enabled with appropriate policies:

1. **albums** ✅
   - Public read for published items
   - Admin full CRUD via `is_admin()` function

2. **artists** ✅
   - Public read access
   - Admin full CRUD

3. **labels** ✅
   - Public read access
   - Admin full CRUD

4. **platforms** ✅
   - Public read access
   - Admin full CRUD

5. **events** ✅
   - Public read for published items
   - Admin full CRUD

6. **updates** ✅
   - Public read for published items
   - Admin full CRUD

7. **user_settings** ✅
   - Users can read/update own settings
   - Admin full access

8. **user_colors** ✅
   - Users can manage own colors
   - Admin full access

9. **site_preferences** ✅
   - Public read access
   - Admin-only write access

10. **hero_carousel_images** ✅
    - Public read for active images
    - Admin full access

11. **album_images** ⚠️ **HAS INCORRECT POLICY** (see below)
12. **album_audios** ⚠️ **HAS INCORRECT POLICY** (see below)
13. **analytics_events** ✅ (RLS disabled intentionally - server-only writes)

---

## Tables WITHOUT RLS Protection ❌ CRITICAL

### 1. **album_artists** (Junction Table) ❌
**Risk Level:** HIGH  
**Issue:** No RLS enabled - anyone can read/modify album-artist relationships  
**Impact:** 
- Unauthorized users can see unpublished album-artist relationships
- Attackers can modify which artists are associated with albums
- Data integrity compromised

**Required Action:**
```sql
ALTER TABLE public.album_artists ENABLE ROW LEVEL SECURITY;

-- Public can read for published albums
CREATE POLICY "public can read album_artists for published albums"
  ON public.album_artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_artists.album_id
      AND albums.publish_status = 'published'
    )
  );

-- Admin full access
CREATE POLICY "admin full album_artists"
  ON public.album_artists FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 2. **album_links** (Junction Table) ❌
**Risk Level:** HIGH  
**Issue:** No RLS enabled - anyone can read/modify album links  
**Impact:**
- Unauthorized access to links for unpublished albums
- Attackers can modify or delete album links
- Can add malicious links to published albums

**Required Action:**
```sql
ALTER TABLE public.album_links ENABLE ROW LEVEL SECURITY;

-- Public can read links for published albums
CREATE POLICY "public can read album_links for published albums"
  ON public.album_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_links.album_id
      AND albums.publish_status = 'published'
    )
  );

-- Admin full access
CREATE POLICY "admin full album_links"
  ON public.album_links FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 3. **event_artists** (Junction Table) ❌
**Risk Level:** HIGH  
**Issue:** No RLS enabled - anyone can read/modify event-artist relationships  
**Impact:**
- Unauthorized access to unpublished event lineups
- Attackers can modify event lineups
- Data integrity compromised

**Required Action:**
```sql
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;

-- Public can read for published events
CREATE POLICY "public can read event_artists for published events"
  ON public.event_artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_artists.event_id
      AND events.publish_status = 'published'
    )
  );

-- Admin full access
CREATE POLICY "admin full event_artists"
  ON public.event_artists FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 4. **oauth_tokens** ❌ **CRITICAL - SENSITIVE DATA**
**Risk Level:** CRITICAL  
**Issue:** No RLS enabled - contains OAuth access tokens and refresh tokens  
**Impact:**
- **CRITICAL:** Anyone can read OAuth tokens (access_token, refresh_token)
- Attackers can steal Google Drive access tokens
- Complete compromise of Google Drive integration
- Unauthorized access to user's Google Drive files

**Required Action:**
```sql
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "users can manage own oauth_tokens"
  ON public.oauth_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Admins can read all (for support/debugging)
CREATE POLICY "admin can read all oauth_tokens"
  ON public.oauth_tokens FOR SELECT
  USING (public.is_admin(auth.uid()));
```

---

### 5. **generated_assets** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized access to generated video/file URLs
- Can see metadata about unpublished content
- Potential information disclosure

**Required Action:**
```sql
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- Public can read assets for published entities
CREATE POLICY "public can read generated_assets for published entities"
  ON public.generated_assets FOR SELECT
  USING (
    (entity_type = 'album' AND EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = generated_assets.entity_id::uuid
      AND albums.publish_status = 'published'
    ))
    OR
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = generated_assets.entity_id::uuid
      AND events.publish_status = 'published'
    ))
    OR
    (entity_type = 'update' AND EXISTS (
      SELECT 1 FROM public.updates
      WHERE updates.id = generated_assets.entity_id::uuid
      AND updates.publish_status = 'published'
    ))
  );

-- Admin full access
CREATE POLICY "admin full generated_assets"
  ON public.generated_assets FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 6. **entity_types** ❌
**Risk Level:** LOW-MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized modification of entity type configuration
- Can disable/enable entity types
- Configuration tampering

**Required Action:**
```sql
ALTER TABLE public.entity_types ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "public can read entity_types"
  ON public.entity_types FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "admin can manage entity_types"
  ON public.entity_types FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 7. **workflows** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized modification of workflow definitions
- Can enable/disable workflows
- Can modify workflow schemas and settings

**Required Action:**
```sql
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Public read access (for UI display)
CREATE POLICY "public can read enabled workflows"
  ON public.workflows FOR SELECT
  USING (enabled = true);

-- Admin full access
CREATE POLICY "admin full workflows"
  ON public.workflows FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 8. **workflow_secrets** ❌ **CRITICAL - SENSITIVE DATA**
**Risk Level:** CRITICAL  
**Issue:** No RLS enabled - contains API keys and webhook URLs  
**Impact:**
- **CRITICAL:** Anyone can read API keys and webhook URLs
- Attackers can steal API credentials
- Can modify webhook URLs to point to malicious endpoints
- Complete compromise of automation system

**Required Action:**
```sql
ALTER TABLE public.workflow_secrets ENABLE ROW LEVEL SECURITY;

-- Admin-only access (highly sensitive)
CREATE POLICY "admin only workflow_secrets"
  ON public.workflow_secrets FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 9. **entity_type_workflows** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized modification of workflow associations
- Can break automation configurations

**Required Action:**
```sql
ALTER TABLE public.entity_type_workflows ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "public can read entity_type_workflows"
  ON public.entity_type_workflows FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "admin can manage entity_type_workflows"
  ON public.entity_type_workflows FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 10. **workflow_runs** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized access to workflow execution history
- Can see metadata about unpublished content
- Information disclosure about automation processes

**Required Action:**
```sql
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Public can read runs for published entities
CREATE POLICY "public can read workflow_runs for published entities"
  ON public.workflow_runs FOR SELECT
  USING (
    (entity_type = 'album' AND EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = workflow_runs.entity_id::uuid
      AND albums.publish_status = 'published'
    ))
    OR
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = workflow_runs.entity_id::uuid
      AND events.publish_status = 'published'
    ))
    OR
    (entity_type = 'update' AND EXISTS (
      SELECT 1 FROM public.updates
      WHERE updates.id = workflow_runs.entity_id::uuid
      AND updates.publish_status = 'published'
    ))
  );

-- Admin full access
CREATE POLICY "admin full workflow_runs"
  ON public.workflow_runs FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 11. **workflow_run_outputs** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized access to workflow output data
- Can see generated file URLs and metadata
- Information disclosure

**Required Action:**
```sql
ALTER TABLE public.workflow_run_outputs ENABLE ROW LEVEL SECURITY;

-- Public can read outputs for published entities (via workflow_runs)
CREATE POLICY "public can read workflow_run_outputs for published entities"
  ON public.workflow_run_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs
      WHERE workflow_runs.id = workflow_run_outputs.run_id
      AND (
        (workflow_runs.entity_type = 'album' AND EXISTS (
          SELECT 1 FROM public.albums
          WHERE albums.id = workflow_runs.entity_id::uuid
          AND albums.publish_status = 'published'
        ))
        OR
        (workflow_runs.entity_type = 'event' AND EXISTS (
          SELECT 1 FROM public.events
          WHERE events.id = workflow_runs.entity_id::uuid
          AND events.publish_status = 'published'
        ))
        OR
        (workflow_runs.entity_type = 'update' AND EXISTS (
          SELECT 1 FROM public.updates
          WHERE updates.id = workflow_runs.entity_id::uuid
          AND updates.publish_status = 'published'
        ))
      )
    )
  );

-- Admin full access
CREATE POLICY "admin full workflow_run_outputs"
  ON public.workflow_run_outputs FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 12. **workflow_presets** ❌
**Risk Level:** MEDIUM  
**Issue:** No RLS enabled  
**Impact:**
- Unauthorized modification of workflow presets
- Can enable/disable presets
- Configuration tampering

**Required Action:**
```sql
ALTER TABLE public.workflow_presets ENABLE ROW LEVEL SECURITY;

-- Public can read enabled presets
CREATE POLICY "public can read enabled workflow_presets"
  ON public.workflow_presets FOR SELECT
  USING (enabled = true);

-- Admin full access
CREATE POLICY "admin full workflow_presets"
  ON public.workflow_presets FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

## Tables with INCORRECT RLS Policies ⚠️

### 1. **album_images** ⚠️
**Current Policy:**
```sql
CREATE POLICY "Admins can manage all album images"
  ON album_images FOR ALL
  USING (auth.role() = 'authenticated');
```

**Problem:** This allows **ANY authenticated user** to manage album images, not just admins!

**Required Fix:**
```sql
DROP POLICY IF EXISTS "Admins can manage all album images" ON album_images;

CREATE POLICY "admin full album_images"
  ON album_images FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

### 2. **album_audios** ⚠️
**Current Policy:**
```sql
CREATE POLICY "Admins can manage all album audios"
  ON album_audios FOR ALL
  USING (auth.role() = 'authenticated');
```

**Problem:** This allows **ANY authenticated user** to manage album audios, not just admins!

**Required Fix:**
```sql
DROP POLICY IF EXISTS "Admins can manage all album audios" ON album_audios;

CREATE POLICY "admin full album_audios"
  ON album_audios FOR ALL
  USING (public.is_admin(auth.uid()));
```

**Note:** The privacy policies added in `20260202000000_add_privacy_to_audios_and_images.sql` also use `auth.role() = 'authenticated'` which is correct for those specific policies (they're meant to allow authenticated users to view private content). However, the admin management policy should use `is_admin()`.

---

## Summary of Required Actions

### Priority 1: CRITICAL (Fix Immediately)
1. ✅ Add RLS to `oauth_tokens` - Contains OAuth credentials
2. ✅ Add RLS to `workflow_secrets` - Contains API keys
3. ✅ Fix `album_images` admin policy - Currently allows any authenticated user
4. ✅ Fix `album_audios` admin policy - Currently allows any authenticated user

### Priority 2: HIGH (Fix Soon)
5. ✅ Add RLS to `album_artists` - Junction table exposure
6. ✅ Add RLS to `album_links` - Junction table exposure
7. ✅ Add RLS to `event_artists` - Junction table exposure

### Priority 3: MEDIUM (Fix When Possible)
8. ✅ Add RLS to `generated_assets`
9. ✅ Add RLS to `workflow_runs`
10. ✅ Add RLS to `workflow_run_outputs`
11. ✅ Add RLS to `workflows`
12. ✅ Add RLS to `workflow_presets`
13. ✅ Add RLS to `entity_types`
14. ✅ Add RLS to `entity_type_workflows`

---

## Additional Security Recommendations

### 1. Function Security
- ✅ `is_admin()` function uses `security definer` correctly - Good!
- ✅ `trigger_set_timestamp()` function is safe

### 2. Service Role Usage
- ⚠️ **Review:** Ensure `analytics_events` is only written via service role (server-side)
- ⚠️ **Review:** Ensure sensitive operations use service role key, not anon key

### 3. API Endpoints
- ⚠️ **Review:** All API routes should verify admin status server-side, not rely solely on RLS
- ⚠️ **Review:** Check that no client-side code uses service role key

### 4. Testing
- ⚠️ **Recommendation:** Create test suite to verify RLS policies
- ⚠️ **Recommendation:** Test with unauthenticated users, authenticated non-admin users, and admin users

---

## Migration File Recommendations

Create a new migration file: `20260203000000_fix_rls_security.sql`

This should include:
1. All RLS policies for unprotected tables
2. Fixes for incorrect policies
3. Comments explaining each policy

---

## Testing Checklist

After applying fixes, test:

- [ ] Unauthenticated users cannot read unpublished content
- [ ] Unauthenticated users cannot modify any data
- [ ] Authenticated non-admin users cannot modify data
- [ ] Authenticated non-admin users can only read published content
- [ ] Admin users can read and modify all data
- [ ] OAuth tokens are only accessible by token owner and admins
- [ ] Workflow secrets are only accessible by admins
- [ ] Junction tables respect parent entity publish status

---

## Notes

- The `analytics_events` table intentionally has RLS disabled - this is acceptable if it's only written via service role server-side
- All policies should use the `is_admin()` function for consistency and to avoid recursion issues
- Junction tables should check parent entity publish status for public read access

---

**Report Status:** Complete  
**Next Steps:** Create migration file with all fixes and test thoroughly
