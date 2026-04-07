# Multi-Tenant SaaS Transformation

## Overview
Convert the current single-college campus AI kiosk into a multi-tenant SaaS platform. Each college gets its own isolated environment with a unique subdomain.

## Phase 1: Database Schema (Tenant Foundation)

### New Tables
- **`tenants`** — id, name, slug (subdomain), logo_url, website_url, primary_color, created_at, status (active/suspended/trial)
- **`tenant_memberships`** — links users to tenants with a role (tenant_admin, professor)

### Modify Existing Tables
Add a `tenant_id` column (UUID, NOT NULL, FK → tenants) to ALL data tables:
- faculty, timetable, events, locations, attendance, notifications, knowledge_base, departments, emergency_contacts, student_issues, issue_votes

### New Enum
- Expand `app_role` to include `super_admin` OR create a separate `is_super_admin` flag on profiles

### RLS Policies
- Update ALL existing RLS policies to scope data by tenant
- Create a helper function `get_user_tenant_id()` that returns the tenant_id for the current user
- Tenants can only see their own data

## Phase 2: Super Admin

### New Role: `super_admin`
- Add to `app_role` enum
- Can view/manage all tenants, suspend accounts, view platform analytics
- New super admin dashboard at `/super-admin`

### Super Admin Dashboard Features
- List all tenants with status, user count, creation date
- Create/suspend/activate tenants
- View platform-wide analytics (total users, total queries, etc.)
- Impersonate tenant admin for support

## Phase 3: Self-Service College Onboarding

### Public Registration Flow (`/register`)
- College name, admin name, email, password
- Auto-generate slug from college name (e.g., "NCERC" → `ncerc`)
- Create tenant record + admin user + assign tenant_admin role
- Email verification required

### Post-Registration Setup Wizard
- Upload college logo
- Set college website URL (for Brain scraping)
- Import initial data (faculty CSV, etc.)

## Phase 4: Subdomain-Based Tenant Resolution

### How It Works
- Each tenant gets `{slug}.ncercai.lovable.app` (or custom domain later)
- App detects tenant from subdomain on load
- React context provides current tenant to all components
- Kiosk landing page shows tenant-specific branding

### Technical Approach
- `TenantProvider` context wrapping the app
- `useTenant()` hook for accessing current tenant info
- Tenant resolution: parse `window.location.hostname` → lookup tenant by slug
- Fallback: `/select-college` page if no subdomain match

## Phase 5: Code Refactoring

### All Data Operations
- Every Supabase query adds `.eq("tenant_id", currentTenantId)`
- Insert operations include `tenant_id` automatically
- `useRealtimeTable` hook gets tenant_id filter

### Branding
- Kiosk UI adapts colors/logo based on tenant settings
- Chat AI system prompt includes tenant name and context

### Auth Flow
- Login page is tenant-aware (shows college name/logo)
- Role checks include tenant membership verification

## Phase 6: Edge Functions
- `campus-chat`: filter knowledge_base by tenant_id
- `scrape-website`: associate scraped content with tenant
- `create-professor`: scope to tenant
- `setup-admin`: becomes tenant setup function

## Migration Strategy
- Existing data gets assigned to a "default" tenant (NCERC)
- Existing admin user becomes both super_admin and NCERC tenant_admin
- No data loss during migration

## Files Modified/Created
- **Database**: ~5 migrations (new tables, alter existing, RLS updates)
- **New**: TenantProvider, useTenant hook, RegisterPage, SuperAdminDashboard, TenantSetupWizard
- **Modified**: Admin.tsx, Professor.tsx, Index.tsx, Login.tsx, App.tsx, all edge functions, useRealtimeTable, useAuth

## Estimated Scope
This is a large change spanning 6 phases. I recommend implementing phase by phase with testing between each.
