# Backup and recovery

`POST /api/admin/backup` creates a checksummed, timestamped JSON snapshot in private R2 storage and records its verification status in D1. Schedule this endpoint daily with a service credential when the production audience and operator are finalized. Recommended retention is 7 daily, 4 weekly and 12 monthly copies.

Restore is intentionally a confirmed operator workflow: select a verified backup, validate its checksum in staging, create a fresh pre-restore backup, then import records in a transaction. Never run destructive schema migrations or overwrite production media as part of an automated deployment.

The `/admin/recovery` route exposes the minimal health and navigation surface if the main dashboard fails. Deployment rollback is handled by deploying the previous known-good Site version.
