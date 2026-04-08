

# Platform Landing Page and Tenant-Aware Routing

## Problem
Currently, the root URL `/` always shows the NCERC kiosk because the single-tenant auto-select logic kicks in. There is no distinction between the main platform domain and a college's subdomain. The platform needs:
- **Main domain** (`ncercai.lovable.app` or custom domain): Shows a platform landing/marketing page with options to register a new college or log in.
- **Tenant subdomain** (`ncerc.yourdomain.com` or `?tenant=ncerc`): Shows the college-specific kiosk.

## Plan

### 1. Create a Platform Landing Page (`src/pages/Landing.tsx`)
A public-facing page that introduces the Campus AI Kiosk SaaS platform. Includes:
- Hero section with branding and tagline
- Brief feature highlights (AI chatbot, faculty directory, notifications, etc.)
- Two CTAs: **Register Your College** (links to `/register`) and **Log In** (links to `/login`)
- List of active tenants as a "trusted by" section (optional)

### 2. Update Tenant Resolution Logic (`src/contexts/TenantContext.tsx`)
- Remove the single-tenant auto-select fallback (lines 87-89). When no slug is resolved from hostname or localStorage, `tenant` should remain `null`.
- Add an `isPlatformHome` boolean to the context: `true` when no tenant is resolved and no subdomain is detected. This signals we are on the main platform domain.

### 3. Update Root Route Logic (`src/App.tsx`)
- Change the `/` route to use a wrapper component that checks `tenant` from context:
  - If `tenant` is resolved (subdomain or query param): render `<Index />` (the kiosk)
  - If `tenant` is null and multiple tenants exist: render `<Landing />` (the platform home)
  - If `tenant` is null and zero tenants: render `<Landing />`
- Keep `/register`, `/login`, `/super-admin` as tenant-independent routes.

### 4. Update Index Page Header
- Make the header dynamic: show the tenant's name/logo instead of hardcoded "NCERC AI". Already partially done via `useTenant()` but the logo and title are hardcoded to NCERC.

### Files Modified
- **New**: `src/pages/Landing.tsx` — Platform marketing/landing page
- **Edit**: `src/contexts/TenantContext.tsx` — Remove auto-select, add `isPlatformHome`
- **Edit**: `src/App.tsx` — Conditional root route rendering
- **Edit**: `src/pages/Index.tsx` — Replace hardcoded NCERC branding with tenant-dynamic branding

