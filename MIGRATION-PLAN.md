# Next.js to Static PWA Migration Plan

## Overview
Convert the existing Next.js SSR app to a static export PWA that works fully offline, moving from API routes to direct Supabase client calls + Edge Functions for external API integration.

## Current Architecture
- Next.js 15 with App Router (SSR)
- 13 API routes in `/src/app/api/`
- Supabase for data + auth with RLS
- External API integration with protected SERVICE_TOKEN
- Existing offline infrastructure (service worker, offline queue)

## Target Architecture
- Next.js static export (`output: 'export'`)
- Direct Supabase client calls (95% of current API routes)
- 1 Supabase Edge Function for external API calls (5% - drive sync)
- Full offline PWA capability

---

## Phase 1: Infrastructure Setup ✅
**Time: 30 minutes**

### 1.1 Configure Static Export ✅
- [x] Add `output: 'export'` to `next.config.ts`
- [x] Add `trailingSlash: true` and `images: { unoptimized: true }`

### 1.2 Create Supabase Edge Function ✅
- [x] Create `supabase/functions/sync-drive/index.ts`
- [x] Move `drive-sync.ts` logic to Edge Function
- [x] Add CORS helper at `supabase/functions/_shared/cors.ts`

---

## Phase 2: API Route Conversion Strategy
**Time: 2-3 hours**

### 2.1 Strategy: Mirror API Structure in /lib/supabase
**Approach:** Convert `/api` routes to helper functions in `/lib/supabase` with **same folder structure** for seamless replacement.

**Structure mapping:**
```
/api/task-stages           → /lib/supabase/task-stages.ts
/api/jobs/[id]             → /lib/supabase/jobs/[id].ts  
/api/user/jobs             → /lib/supabase/user/jobs.ts
/api/owners                → /lib/supabase/owners.ts
/api/suppliers             → /lib/supabase/suppliers.ts
/api/suppliers/[id]        → /lib/supabase/suppliers/[id].ts
/api/tasks                 → /lib/supabase/tasks.ts
/api/tasks/[id]            → /lib/supabase/tasks/[id].ts
/api/jobs                  → /lib/supabase/jobs.ts
/api/jobs/tasks/[id]       → /lib/supabase/jobs/tasks/[id].ts
```

### 2.2 Helper Function Pattern
Each helper throws errors just like Next.js routes for seamless replacement:

```typescript
// /lib/supabase/task-stages.ts
import { createClient } from '@/lib/supabase/client';
import { toCamelCase } from '@/lib/api/casing';

export async function getTaskStages() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cf_task_stages')
    .select('id, name, order')
    .order('order');

  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch task stages');
  }

  return toCamelCase(data);
}
```

**Frontend replacement:**
```typescript
// Before: await fetch('/api/task-stages').then(r => r.json())
// After:  await getTaskStages()
```

### 2.3 Routing Changes
**Dynamic Routes → Query Params**

**Before:** `/jobs/[id]/page.tsx` (requires generateStaticParams)  
**After:** `/job/page.tsx` with `?jobId=23` (fully static)

**Benefits:**
- ✅ No dynamic route generation needed
- ✅ Fully static export compatible
- ✅ Minimal frontend changes (just URL updates)

### 2.4 Simple CRUD Routes → Helper Functions (10 routes)

**Priority 1 (Core functionality):**
- [x] `/api/task-stages` → `/lib/supabase/task-stages.ts`
- [x] `/api/user/jobs` → `/lib/supabase/user/jobs.ts`
- [x] `/api/owners` → `/lib/supabase/owners.ts`
- [x] `/api/suppliers` → `/lib/supabase/suppliers.ts`
- [x] `/api/tasks` → `/lib/supabase/tasks.ts`

**Priority 2 (Updates):**
- [x] `/api/tasks/[id]` (PATCH) → `/lib/supabase/tasks.ts` (updateTask function)
- [x] `/api/jobs/tasks/[id]` (PATCH) → `/lib/supabase/job-tasks.ts`
- [x] `/api/jobs` (POST/PATCH/GET) → `/lib/supabase/jobs.ts`
- [x] `/api/jobs/[id]` (GET/PATCH) → `/lib/supabase/jobs.ts`
- [ ] `/api/suppliers/[id]` (PATCH) → `/lib/supabase/suppliers/[id].ts`

### 2.5 External API Routes → Edge Function (4 routes)
- [ ] `/api/jobs/[id]/sync-drive` → Call Edge Function
- [ ] `/api/jobs/tasks/[id]/sync-drive` → Call Edge Function  
- [ ] `/api/email/schedule` → Move to Edge Function (email sending)
- [ ] Any email sending helpers → Move to Edge Function (requires server-side secrets)

### 2.6 Frontend Updates

**Route Updates:**
- [x] `/jobs/[id]` → `/job?jobId=[id]` (URL changes in navigation)
- [x] Update all `Link` components and `router.push()` calls

**Store files (Zustand):**
- [x] `src/store/task-store.ts` - Replace fetch calls with helper imports
- [x] `src/store/job/job-store.ts` - Replace fetch calls with helper imports  
- [x] `src/store/owners-store.ts` - Replace fetch calls with helper imports
- [x] `src/store/supplier-store.ts` - Replace fetch calls with helper imports
- [ ] Any other store files with API calls

**Component files:**
- [x] `src/app/jobs/create/page.tsx` - Replace fetch call with createJob helper
- [x] Updated sidebar to use query params for navigation and highlighting
- [ ] Search for any remaining `fetch("/api/` across components

### 2.7 JavaScript/HTML Preloading Strategy

**Approach:** Load all JS bundles and HTML at app startup for full offline capability

**Implementation:**
- [ ] Add preload links in root layout for all route chunks
- [ ] Use Next.js `Link` prefetch for all major routes in main navigation
- [ ] Add component-level prefetching for common user flows
- [ ] Configure service worker to cache all static assets aggressively

**Root Layout Preloading:**
```typescript
// In app/layout.tsx or main component
useEffect(() => {
  // Prefetch all main routes
  router.prefetch('/jobs');
  router.prefetch('/suppliers'); 
  router.prefetch('/job'); // Generic job page
  router.prefetch('/offline');
}, []);
```

**Service Worker Enhancement:**
- [ ] Ensure service worker caches all JS chunks from `_next/static/`
- [ ] Cache all route HTML files
- [ ] Add runtime caching for dynamic imports
- [ ] Implement aggressive caching for static assets

**Bundle Optimization:**
- [ ] Review code splitting - ensure critical paths are in main bundle
- [ ] Consider reducing dynamic imports if they hurt offline loading
- [ ] Add preload directives for critical route chunks

---

## Phase 3: Testing & Validation
**Time: 1 hour**

### 3.1 Build & Deploy Test
- [ ] Run `npm run build` (static export)
- [ ] Test locally with static files
- [ ] Deploy to Vercel as static site
- [ ] Deploy Edge Function to Supabase

### 3.2 Functionality Testing
- [ ] Test CRUD operations work offline
- [ ] Test drive sync functionality  
- [ ] Test PWA install & offline mode
- [ ] Test service worker caching
- [ ] Test all JavaScript/HTML preloaded at runtime

### 3.3 Performance Testing
- [ ] Compare bundle size (should be smaller)
- [ ] Test load times (should be faster)
- [ ] Test offline-to-online sync

---

## Phase 4: Cleanup
**Time: 30 minutes**

- [ ] Delete all `/src/app/api/` route files
- [ ] Remove unused API utilities if any
- [ ] Remove legacy offline handling (navigation in layout client)
- [ ] Update documentation
- [ ] Remove API-related dependencies if unused

---

## Implementation Details

### Helper Function Pattern
**Before (API route):**
```typescript
// /api/task-stages/route.ts
export const GET = withAuth(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cf_task_stages").select("*");
  return Response.json(toCamelCase(data));
});
```

**After (Helper function):**
```typescript
// /lib/supabase/task-stages.ts
export async function getTaskStages() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cf_task_stages')
    .select('*')
    .order('order');
  
  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch task stages');
  }
  
  return toCamelCase(data);
}
```

**Frontend replacement:**
```typescript
// Before: const response = await fetch('/api/task-stages'); const data = await response.json();
// After:  const data = await getTaskStages();
```

### Edge Function Pattern
**Client call:**
```typescript
const { data, error } = await supabase.functions.invoke('sync-drive', {
  body: { action: 'sync-job', jobId, jobName }
});
```

### Environment Variables Needed
- `SUPABASE_URL` (client)
- `SUPABASE_ANON_KEY` (client) 
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function)
- `BASD_SERVICE_URL` (Edge Function)
- `BASD_SERVICE_TOKEN` (Edge Function)
- Email service credentials (Edge Function - for email sending)

---

## Risk Mitigation

### RLS Security
- ✅ Already using RLS policies
- ✅ Client-side auth handled by Supabase
- ✅ No additional exposure vs current API routes

### External API Security
- ✅ SERVICE_TOKEN stays in Edge Function (server-side)
- ✅ Same security as current Next.js API routes

### Offline Functionality  
- ✅ Existing service worker + offline queue
- ✅ Static files work better offline than SSR
- ✅ Supabase offline capabilities built-in

---

## Rollback Plan
- Keep current API routes during migration
- Test static build alongside current deployment
- Can revert `next.config.ts` changes instantly
- Edge Functions are additive (don't break existing)

---

## Success Criteria
- [ ] App builds and deploys as static export
- [ ] All CRUD operations work offline/online  
- [ ] Drive sync functionality preserved
- [ ] PWA installs and works offline
- [ ] Performance improved (faster loads)
- [ ] Deployment simplified (one static build)

## Timeline
- **Phase 1**: ✅ Completed
- **Phase 2**: 2-3 hours (main work)
- **Phase 3**: 1 hour (testing)
- **Phase 4**: 30 minutes (cleanup)
- **Total**: ~4 hours