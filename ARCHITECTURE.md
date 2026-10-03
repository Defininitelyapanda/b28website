# B28 Entertainment architecture

## Runtime

The application runs as a standard Next.js 16 server bound to `127.0.0.1`. React pages, API routes, authentication, data, uploads, and backups all execute on and remain on the local computer.

## Storage

`lib/local-store.ts` serializes the content model to `data/cms.json`. Writes are queued in-process to prevent overlapping updates. Uploaded media is stored below `public/uploads`, and manual backups are written to `data/backups` with SHA-256 checksums.

## Authentication

The admin password and signing secret come from `.env.local`. Successful sign-in creates an HTTP-only, same-site signed cookie with a 12-hour lifetime. Every admin API route verifies that cookie and the stored local role.

## Network boundary

The browser security policy permits resources, frames, forms, and connections only from the same local origin. The application contains no cloud service bindings or runtime connector clients.
