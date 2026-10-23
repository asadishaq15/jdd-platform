# jdd-platform

## Admin foundation

Phase 1 adds a protected administration area at `/admin` with property-scoped
roles, row-level security, and append-only audit support.

Apply the Supabase migrations before opening the admin area. Then grant the
first administrator role to an existing, confirmed account:

```sh
npm run admin:grant -- admin@example.com super_admin
```

Property-scoped roles require a property slug:

```sh
npm run admin:grant -- manager@example.com property_admin serein-kyoto
npm run admin:grant -- staff@example.com property_staff serein-kyoto
npm run admin:grant -- analyst@example.com analyst serein-kyoto
```

The command uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` from
`.env.local`. The secret key must remain server-only.

Available roles:

- `super_admin`: global access across all properties
- `property_admin`: administrative access to one assigned property
- `property_staff`: operational access to one assigned property
- `analyst`: read-only reporting access to one assigned property
