# B28 Entertainment

A self-contained Next.js website and local editorial CMS for B28 Entertainment. It does not call ChatGPT, OpenAI, cloud databases, object storage, CDNs, analytics, or other hosted services.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The admin area is at `http://localhost:3000/admin`.

Set `LOCAL_ADMIN_PASSWORD` and `LOCAL_AUTH_SECRET` in `.env.local` before using the admin area. If `.env.local` is omitted, local development uses the password `b28-local-admin` so the project can run immediately.

## Local data

- CMS records and contact enquiries: `data/cms.json`
- Uploaded files: `public/uploads/`
- Backups: `data/backups/`

These runtime files are ignored by Git. Copy those three locations when moving the site to another computer.

## Commands

- `npm run dev` — local development server on `127.0.0.1:3000`
- `npm run build` — production build
- `npm start` — local production server on `127.0.0.1:3000`
- `npm run typecheck` — strict TypeScript check
- `npm test` — unit tests

The first page visit creates the local data file and seeds clearly marked demonstration content. Replace it in `/admin` before treating it as real company material.
