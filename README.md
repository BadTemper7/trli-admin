# Trans Roadway Logistics Admin

React + Vite JavaScript-only internal Admin Dashboard.

## Setup

```bash
npm install
npm run dev
```

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

The Admin project uses the server's HTTP-only Admin login cookie. `VITE_ADMIN_API_KEY` is no longer used.

## First login

1. Run `npm run seed:super-admin` in the server project.
2. Login with the bootstrap Super Admin email/password from the server `.env`.
3. The Admin app redirects to `/setup-password`.
4. Create a permanent password before accessing dashboard modules.

## Permissions

Sidebar navigation, frontend routes, action buttons, backend API calls and Socket.IO module subscriptions all use the same module/action permission model. Unauthorized routes show a 403 Access Denied page.

## User Management

Super Admin can create internal users without choosing their password. The server generates and emails a temporary password. User Management includes module/action permissions, status changes, account setup state, and temporary-password reissue.

## Storage Monitoring

Storage Monitoring supports block CRUD, yard positions, waiting containers, assignment/relocation and real-time updates. 20FT block capacity is shown as TEU; 40FT block capacity is shown as FEU; capacity cannot exceed physical slots.
