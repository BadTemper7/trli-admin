# Build Notes

- Admin authentication now uses HTTP-only cookie sessions instead of a Vite-exposed shared API key.
- User Management includes Super Admin bootstrap support, granular module/action permissions, first-login password setup and real-time access changes.
- Storage capacity UI uses TEU for 20FT and FEU for 40FT, with server and frontend physical-slot validation.
- Source syntax was checked with TypeScript's JavaScript/JSX parser and server files with `node --check`.
- This execution environment could not complete `npm install` because registry access timed out, so the final Vite production build must be run on a machine with npm registry access.

## API Call Optimization Revision

- Removed duplicate page-level socket connect/disconnect calls.
- Added in-flight `/admin/auth/me` request deduplication.
- Removed React StrictMode development double-mount behavior.
- Rate Setup now updates state from REST/socket payloads instead of refetching after every mutation.
- Storage Monitoring uses realtime payloads for incremental state updates.
- Removed user-facing MongoDB/storage implementation wording from Rate Setup.
- Static JS/JSX parse: passed with 0 syntax errors.
- Local/alias import validation: passed with 0 missing imports.
- Full Vite build was not run because npm registry access timed out in the generation environment.
