# Rate Setup - MongoDB Persistence

Rate Setup uses MongoDB as the source of truth.

## Admin API

- `GET /api/admin/rates`
- `GET /api/admin/rates/:id`
- `POST /api/admin/rates`
- `PUT /api/admin/rates/:id`
- `DELETE /api/admin/rates/:id`
- `POST /api/admin/rates/import-local`

All routes use the existing Admin authentication cookie and `RATE_SETUP` permissions.

## Rate Name

Rate Name is a required select field. Supported values are:

- Lift On
- Lift Off
- Storage
- Congestion Surcharge
- Total Handling Reference
- Other

There is no separate Rate Type field.

## Other configuration

- Classification: Local / International
- Load Status: Empty / Loaded
- Container Size: 20FT / 40FT / All Sizes
- Amount
- Collection Point: Gate-in / Gate-out
- Active / Inactive

## Existing MongoDB records

If the database contains rates from the previous version with `serviceType`, run once:

```bash
npm run migrate:rate-names
```

This normalizes existing Rate Names where needed and removes the old `serviceType` field from stored rate documents.

## Legacy localStorage migration

The frontend still supports the previous one-time browser migration from `trans-roadway-rate-setup-v1`. Legacy values are converted to the new Rate Name values during import. MongoDB remains the source of truth after migration.
