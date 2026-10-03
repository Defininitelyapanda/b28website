# B28 Entertainment

The production website and editorial platform for B28 Entertainment: a cinematic public portfolio, project archive, journal, contact pipeline and database-backed CMS.

## Stack

- Next.js 16, React 19, strict TypeScript and Tailwind CSS 4
- Vinext / Cloudflare Worker production output
- D1 relational content database and R2 media/backup storage
- Drizzle schema and append-only SQL migrations
- Zod validation, React Hook Form primitives and Lucide icons
- Platform-managed sign-in with server-side role authorization

## Local setup

Requires Node.js 22.13 or newer.

```sh
npm install
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_b28_foundation.sql
npm run dev
```

The first visit seeds clearly marked demonstration projects, services, a journal item and a team record. Replace these from `/admin` before treating them as real company material. Portable local development supplies a simulated signed-in user; hosted sign-in is owned by the platform.

## Commands

- `npm run dev` — development server
- `npm run build` — production Worker build
- `npm run start` — local production preview with D1/R2
- `npm run typecheck` — strict TypeScript verification
- `npm test` — critical validation tests
- `npm run db:generate` — generate a new migration after schema changes

## Environment

The hosted Sites build receives D1 as `DB` and R2 as `BUCKET`; no credentials are committed. `.env.example` documents the equivalent PostgreSQL/S3 provider variables for a conventional Vercel or Node deployment and optional analytics/Turnstile values.

## Editorial model

Projects, pages, journal articles, services and team profiles use a shared versioned content model. Each record supports draft, scheduled, published and archived states plus flexible ordered blocks. Server writes create an immutable version and audit event. Public routes read published records only.

The media layer uses generated storage keys and an explicit allowlist. Contact leads are validated and rate limited. Backups are checksummed snapshots stored separately from the database.

## Operations

See [ARCHITECTURE.md](ARCHITECTURE.md), [ADMIN_GUIDE.md](ADMIN_GUIDE.md), [deployment](docs/DEPLOYMENT.md), [backup and recovery](docs/BACKUP_RECOVERY.md), and [security](docs/SECURITY.md).

Production checklist: configure the final B28 email/social links, replace demo material, confirm the first super admin, add Turnstile for a high-volume public launch, test an R2 restore in staging, then decide the Site audience.
