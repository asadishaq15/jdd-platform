# Admin dashboard delivery roadmap

The admin dashboard is delivered in independently usable phases. A later phase
must not weaken the authorization and property boundaries established earlier.

## Phase 1 — Secure foundation (complete)

- Global and property-scoped admin memberships
- Server-side route guards
- Property-aware shell and navigation
- Row-level security helpers
- Append-only audit log support

## Phase 2 — Stay and activation operations

- Search and filter PMS stays
- Inspect stay and guest activation state
- Generate one-time activation links
- Revoke unused activation links
- Property-scoped operational permissions
- Audit every activation mutation

Email delivery is not included. Generated links are shown once for an authorized
operator to copy. Automated delivery belongs with the PMS/email integration.

## Phase 3 — Overview analytics (complete)

- Date and property filters
- Checked-out stays, invitations, activation rate, connected guests
- Discovery completion and returning-guest metrics
- Trends and property comparison
- Drill-through from metrics to source records

Metric definitions must include their date basis, numerator, denominator, and
property scope. Aggregation happens on the server or in database functions.

## Phase 4 — Product journey analytics (complete)

- Append-only product event collection
- Activation and discovery funnels
- Discovery abandonment
- Recommended-to-chosen State match
- Seven- and thirty-day return engagement
- Test and internal traffic exclusion

## Phase 5 — Guest feedback (complete)

- Post-stay sentiment collection
- Response rate and sample size
- Property and State comparisons
- Optional anonymized comments
- Small-cohort privacy protection

## Phase 6 — Extended administration

- Events, invitations, and RSVPs
- Card orders and fulfillment
- Reminders
- PMS synchronization health
- Scheduled reports, exports, and alerts

These modules begin only after their guest-facing data is persisted in Supabase
rather than browser-local storage.
