

# Add Stripe Payments for SaaS Monetization

## Overview
Add a single paid subscription plan for colleges using the Lovable Stripe integration. Colleges must have an active subscription to access their kiosk and admin features. The super admin dashboard will show subscription status per tenant.

## Architecture

```text
College registers → Pending approval → Super admin approves → 
College admin pays via Stripe checkout → Subscription active → 
Kiosk & admin features unlocked
```

## Plan

### 1. Enable Stripe Integration
Use the Lovable Stripe enablement tool to set up the payment infrastructure. Create one subscription product (e.g., "Campus AI Pro — $49/month").

### 2. Database: Add subscription tracking to tenants
Add a migration with:
- `subscription_status` column on `tenants` (`trialing`, `active`, `past_due`, `canceled`, `none`) — default `none`
- `stripe_customer_id` column on `tenants`
- `subscription_id` column on `tenants`
- `trial_ends_at` column (optional, if you want a trial period)

### 3. Edge Function: Create Checkout Session
Create `supabase/functions/create-checkout/index.ts`:
- Accepts `tenant_id` from an authenticated admin
- Creates a Stripe customer (or retrieves existing) and a checkout session for the subscription product
- Returns the checkout URL

### 4. Edge Function: Stripe Webhook Handler
Create `supabase/functions/stripe-webhook/index.ts`:
- Listens for `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
- Updates `tenants.subscription_status` and `stripe_customer_id` accordingly

### 5. Subscription Gate in TenantContext
Update `src/contexts/TenantContext.tsx`:
- Add `subscriptionStatus` to the Tenant interface
- Expose `isSubscribed` boolean (true when `subscription_status === 'active'`)

### 6. Paywall UI for Tenant Admins
- After approval, if `subscription_status !== 'active'`, show a paywall page instead of the admin dashboard
- "Subscribe to Campus AI" button triggers checkout via the edge function
- Add a `/subscription/success` callback page

### 7. Kiosk Access Gate
- In `Index.tsx`, if tenant exists but `subscription_status !== 'active'`, show a "This institution's kiosk is currently inactive" message instead of the chat interface

### 8. Super Admin Enhancements
- Show subscription status badge on each tenant card in `SuperAdmin.tsx`
- Display revenue/subscription stats

## Files Modified
- **New**: Edge function `create-checkout/index.ts`
- **New**: Edge function `stripe-webhook/index.ts`  
- **New**: `src/pages/SubscriptionSuccess.tsx`
- **Edit**: `src/contexts/TenantContext.tsx` — add subscription fields
- **Edit**: `src/pages/Admin.tsx` — add paywall gate
- **Edit**: `src/pages/Index.tsx` — add inactive tenant message
- **Edit**: `src/pages/SuperAdmin.tsx` — show subscription status
- **Edit**: `src/App.tsx` — add success route
- **Migration**: Add subscription columns to `tenants` table

## Technical Details
- Stripe integration uses Lovable's built-in Stripe support (no external account setup needed)
- Webhook validates signatures server-side for security
- Subscription status is checked both client-side (UX) and server-side (RLS could be added later)
- NCERC (your own tenant) can be manually set to `active` subscription status

