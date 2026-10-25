# Storage Monitoring Notes

Storage Monitoring is integrated with the authenticated Admin user system.

- No shared Admin API key is required.
- API calls use the HTTP-only Admin session cookie.
- `STORAGE_MONITORING` permissions control View, Create, Edit, Delete, Assign and Relocate actions.
- Socket.IO subscriptions are limited to admins with Storage Monitoring View access.
- 20FT block capacity is displayed in TEU.
- 40FT block capacity is displayed in FEU.
- Capacity is hidden until container size is selected and cannot exceed Bays x Rows x Tiers.


## October 25, 2026 UI revision

- Removed the Mega Port Yard Layout/map section from the Storage Monitoring overview.
- Removed the unused YardOverview and YardPlan map components.
- Rebuilt the block 3D visualization as a stable pseudo-isometric Bay/Row/Tier renderer.
- Occupied containers show front/top/right faces and block-color accents.
- Empty positions remain visible as outlined slots.
- Container selection/highlighting, 2D/3D toggle, zoom, rotate-view, and reset controls remain available.

## Premium container visuals

- 2D and 3D slots are now drawn as real shipping containers: corrugated walls, amber corner castings, top/bottom rails, door-end locking bars, roof ribs and a marking panel (owner code, serial, check digit, size/type).
- 20' blocks render short boxes, 40' blocks render long boxes; reefers render in light grey with an RF badge.
- Container colour is derived from the shipping line, so the same line always looks the same.
- 2D view is a tier-by-tier side elevation with row/bay labels; 3D view sits on a yard-surface backdrop.

## Scroll fix (dashboard)

- Document-level scroll removed: `html/body` are `overflow: hidden`; the layout shell and `<main>` are `relative`, so `sr-only` elements can no longer extend the page.
- `<main>` is the single content scroller. Sidebar nav uses a slim, hover-only scrollbar.
- `overscroll-behavior: contain` stops scroll chaining between the sidebar and main content.
