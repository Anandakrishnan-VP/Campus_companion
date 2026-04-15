

# Bootstrap the Super Admin Account

## Problem
The super admin account (`saasbyak` / `parasfak47`) doesn't exist in the database yet. The `setup-admin` edge function requires a `SETUP_SECRET` header to create it, but nothing triggers it automatically.

## Solution
Trigger the `setup-admin` edge function once to create the account. Two changes needed:

### 1. Invoke the setup-admin function (one-time)
Use the edge function test/curl tool to call `setup-admin` with the `x-setup-secret` header. The secrets `SETUP_SECRET`, `SETUP_ADMIN_EMAIL` (`saasbyak@campus.local`), and `SETUP_ADMIN_PASSWORD` (`parasfak47`) are already configured.

### 2. Add a visible route to the Super Admin dashboard
Verify `/super-admin` route exists in `App.tsx` so once the account is created, logging in at `/login` with `saasbyak` / `parasfak47` redirects there automatically.

## After Setup
- Go to `/login`
- Enter ID: `saasbyak`, Password: `parasfak47`
- You'll be redirected to `/super-admin` dashboard automatically

