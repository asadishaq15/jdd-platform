# Administrative access setup

Administrative access is invitation-only and uses two distinct portals:

- `/staff/sign-in` for Jardin du Désert internal staff
- `/property/sign-in` for properties and businesses

Both account types must complete TOTP two-step verification. Property accounts
are restricted to one property, and only one active account can be assigned to
each property.

## Deployment requirements

1. Apply all migrations through
   `supabase/migrations/202610230004_admin_access_and_card_orders.sql`.
2. In Supabase Authentication settings, keep TOTP enrollment and verification
   enabled.
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin, for example
   `https://space.jardindudesert.com`.
4. Add these Supabase Auth redirect URLs:
   - `https://space.jardindudesert.com/auth/callback`
   - `http://localhost:3000/auth/callback`
5. Configure and verify custom SMTP before sending invitations.
6. Customize the Supabase **Invite user** email template for property and staff
   invitations.

## First use

Existing super administrators are redirected to `/admin/security` and must
enroll an authenticator before any administrative page or mutation is allowed.
After that, they can open `/admin/access` to invite internal staff or the single
account assigned to each property.

An invited account follows the email link, creates a password of at least 12
characters, enrolls an authenticator, and then enters its authorized dashboard.

## Card orders

Guests with an activated stay can submit a scented-card request from My Space.
No payment-card details are collected. Internal staff and the assigned property
account can update fulfilment status under `/admin/orders`.
