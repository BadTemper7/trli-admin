# API Call Optimization

This revision reduces duplicate Admin API and Socket.IO traffic.

## Changes

- `/api/admin/auth/me` is owned by `AuthContext` and in-flight requests are deduplicated.
- React `StrictMode` was removed from `main.jsx` to avoid development-only double mount effects.
- Socket.IO connection ownership is centralized in `AuthContext`.
- Feature pages no longer connect/disconnect the shared socket instance.
- Socket.IO uses WebSocket transport directly to avoid repeated long-polling requests.
- Rate Setup performs one initial `GET /api/admin/rates` and updates state from create/update/delete REST responses and socket payloads.
- Rate Setup no longer performs a full rates refetch after its own create/edit/delete actions.
- Storage Monitoring updates block state directly from storage socket payloads and CRUD responses instead of refetching the full block list after each event.
- Storage block details update container/block state from realtime payloads instead of calling all detail APIs after each storage event.
- Database implementation wording was removed from the user-facing Rate Setup screen.

## Expected Network Behavior

On a normal Rate Setup page load after authentication:

- `GET /api/admin/auth/me`: once for session bootstrap
- `GET /api/admin/rates`: once for initial Rate Setup data
- Socket.IO: one WebSocket connection

Rate create/edit/delete actions should only make the corresponding POST/PUT/DELETE request. The page state updates immediately without an additional GET request.

A one-time legacy rate import may add one import request if old browser-stored rate data still exists. After a successful import that browser key is removed.
