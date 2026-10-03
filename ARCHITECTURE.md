# B28 Entertainment architecture

## Product shape

B28 is one application with two deliberately separate surfaces: a fast public film-studio experience and an authenticated editorial workspace at `/admin`. The public pages render published records from the CMS. The admin surface uses the same service layer for projects, pages, journal posts, services, team members, navigation and settings.

## Runtime

- Next.js 16 / React 19 / strict TypeScript, built through Vinext for Cloudflare Workers and portable Node-compatible source.
- Cloudflare D1 stores structured content, relationships, versions, activity, contact leads and settings. The tables use pagination-friendly indexes.
- Cloudflare R2 stores uploaded media. `lib/storage.ts` is the provider boundary; its shape also maps cleanly to S3-compatible providers.
- ChatGPT/Sites sign-in protects `/admin` and write APIs. Server-side role checks remain the authorization boundary.

## Content model

`content_items` is a typed editorial record for page, project, article, service and team content. Type-specific fields and flexible content blocks live in validated JSON. Each write first stores a new immutable `content_versions` row. Publishing is transactional with its audit event. Navigation, settings, media metadata, leads, users, notifications, backups and activity logs use dedicated tables.

## Failure model

Database and storage calls are isolated behind repository functions. Public pages have branded empty/fallback states; block rendering is individually guarded. Draft writes precede publish state changes. The system exposes `/api/health`, branded not-found/error/offline/maintenance routes, and a protected `/admin/recovery` surface. Last-known-good global settings are versioned before changes.

## Security model

Every write validates input with Zod, checks authenticated identity and role on the server, uses prepared queries, writes an audit event and returns stable error envelopes. Uploads use generated object keys, an allowlist, size limits and non-executable delivery. Security headers are configured globally. Secrets and provider credentials are environment-only.

## Extension points

The generic block renderer, content repository, storage provider, feature flags and navigation records allow later streaming, casting, marketplace, screener and account products without coupling them to the current editorial UI.
