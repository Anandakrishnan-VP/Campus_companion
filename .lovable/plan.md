

# Fix Subscription Flow: Register → Approve → Pay → Access

## Current State
- Super admin accesses `/super-admin` by logging in at `/login` with a super_admin role account
- After registration approval, college admins log in and see a paywall inside the admin dashboard
- No standalone payment gate exists

## Desired Flow
```text
College registers at /register → status: pending
Super admin approves at /super-admin → status: active, subscription: none
College admin logs in at /login → redirected to /subscribe (payment page)
Admin pays (mock) → subscription: active
Admin redirected to /admin → full access
Kiosk subdomain becomes accessible
```

## Changes

### 1. Create `/subscribe` page (`src/pages/Subscribe.tsx`)
- Standalone payment page shown to admins whose tenant has `subscription_status !== 'active'`
- Shows plan details (Campus AI Pro — ₹999/mo), features list, and "Pay Now" button
- Calls `mock-payment` edge function to activate
- On success, redirects to `/subscription/success` → then `/admin`

### 2. Update Login redirect logic (`src/pages/Login.tsx`)
- After admin login, check tenant's `subscription_status`
- If `subscription_status !== 'active'`, redirect to `/subscribe` instead of `/admin`
- Super admin and professor flows unchanged

### 3. Simplify Admin.tsx paywall
- Remove the inline paywall from `Admin.tsx` since the `/subscribe` page now handles it
- Keep a simple redirect guard: if not subscribed, redirect to `/subscribe`

### 4. Update App.tsx
- Add route for `/subscribe`

### 5. Kiosk gate (already done)
- `Index.tsx` already blocks kiosk access for unsubscribed tenants — no changes needed

## Files
- **New**: `src/pages/Subscribe.tsx`
- **Edit**: `src/pages/Login.tsx` — add subscription check after admin login
- **Edit**: `src/pages/Admin.tsx` — replace paywall with redirect
- **Edit**: `src/App.tsx` — add `/subscribe` route

