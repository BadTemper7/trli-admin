# Client Verification - Database Integration

The Client Verification module now uses the real MongoDB registration records.

## Data Sources

- `ClientCompany` - company information, verification status, documents
- `ClientUser` - registered contact person and login email
- `VerificationHistory` - submitted, rejected, resubmitted, approved history

## Admin APIs

- `GET /api/admin/client-verifications`
- `GET /api/admin/client-verifications/:id`
- `GET /api/admin/client-verifications/:id/documents/:documentId`
- `POST /api/admin/client-verifications/:id/approve`
- `POST /api/admin/client-verifications/:id/reject`

The document endpoint is protected by Admin authentication and Client Verification VIEW permission. Uploaded verification files are not exposed through a public uploads directory.

## Realtime

The page listens for new registration, resubmission, and admin verification update Socket.IO events so connected reviewers see status changes without reloading the page.
