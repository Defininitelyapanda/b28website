# Deployment

The checked-in configuration builds a Cloudflare Worker through Vinext and binds D1 as `DB` and R2 as `BUCKET`. The same application source remains compatible with standard Next.js hosting; for Vercel/Node use PostgreSQL and S3 implementations behind the existing repository and storage boundaries.

Deployment order: type-check/build, inspect new append-only SQL migrations, create a backup for an existing production database, apply migrations, upload the new Worker, verify `/api/health`, then retain the previous version for rollback. Never delete data in an automatic migration.
