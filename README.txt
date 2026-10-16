Jardin du Désert · Space — clickable prototype

Next migration
- The original prototype files are preserved unchanged in legacy-html/.
- Phase 1/2 are now real TSX: / renders the onboarding flow and /sign-in renders the
  public auth flow with shared tokens, layout, theme toggle, logo/assets, email OTP,
  Google/Apple buttons, legal modal shell and loading state.
- /space is now a React state-backed handoff view so selected/code-based discovery
  data is visible before the full dashboard migration in Phase 4.
- Phase 3 is real TSX at /discover: date of birth, recommendation result, world
  selection, intention, "I am becoming", access-code warning and code entry.
- Phase 4 is real TSX at /space: dashboard header/profile menu, My World, My Scent,
  My Intention, My Ritual, My Community / Property Circle entry and Explore all States.
- Phase 5 is real TSX inside /space: scented card order/payment mock, card delivery
  simulation, invitation ritual, perfume oil ritual, action/reminder editor, Property
  Circle events/invitations/news and profile menu actions including delete account.
- public/prototype/ keeps a standalone browser copy for comparison only.

Files
- index.html          Start page: onboarding (3 screens). Always shown on every visit/refresh. Skip / Enter your Space -> app.
- space-signin.html   The whole app: sign-in, birth date, recommendation, intention, access codes,
                      My Space dashboard, card order, rituals, Property Circle, profile menu.
- assets/             Logo.

How to run
Open index.html in a browser. Everything runs locally; demo progress is saved in the browser (localStorage).
"Restart demo" clears it.

Demo access codes
SRNK-KYOT-2026 (Serein Kyoto) · LIOR-AEST-2026 (Liora Estate) · SIER-RARE-2026 (Sierra Reserve)

What is simulated
Sign-in (Clerk to be connected), payment, card delivery, reminders, bookings and maps are mocked.
Integration points are marked in the code with "DEVELOPER:" comments.

Full system logic, data model, integrations, analytics and admin: see the spec document
"Space — system logic and developer spec", tab "English (for developer)":
https://claude.ai/code/artifact/91ed7f4a-cffa-41b2-9adc-099d83ddae57
