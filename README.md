# B28 Entertainment

A Next.js website and visual content builder for B28 Entertainment. The public site has no ChatGPT or OpenAI dependency. The builder is intentionally unlinked and available at a private path.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Add `/admin2714` to open the unlinked visual website builder. It provides live and draft previews, responsive device modes, content creation, media upload, flexible blocks, undo/redo, duplication, deletion, drafts, and publishing.

## Site configuration

Set the public site URL locally and on the hosting platform:

```env
NEXT_PUBLIC_SITE_URL="https://YOUR_DOMAIN"
CMS_DATA_DIR="/data/cms"
CMS_UPLOAD_DIR="/data/uploads"
```

There is no login or account authentication. Knowledge of `/admin2714` is the only access control, and its management APIs use the same unlinked namespace. Anyone who discovers the path can modify site content, so do not publish or link it.

## Runtime data

- CMS records and contact enquiries: `data/cms.json`
- Uploaded files: `public/uploads/`
- Backups: `data/backups/`

These runtime files are ignored by Git. A hosted deployment must attach persistent storage for these locations or migrate them to a durable database/object store. On Cloudflare, CMS records use D1 and media/backups use R2. The filesystem remains the local and Wasmer fallback. Production publishing returns a service error instead of claiming success when persistent storage is missing.

The production build intentionally uses the repository's local seed data. Wasmer mounts `/data` only when the deployed app starts, so `npm run build` isolates prerendering from the runtime-only `CMS_*` paths.

## Cloudflare deployment

The production site is deployed as a Cloudflare Worker at:

`https://b28website.tonniekye.workers.dev`

The typed configuration in `cloudflare.config.ts` provisions/binds D1 database `b28-cms`, R2 bucket `b28-media`, static assets, and the production site URL. Authenticate the Cloudflare CLI for the target account, then run:

```sh
npm run build:vinext
npm run deploy:vinext
```

The deployment wrapper always supplies the production URL so metadata, sitemap, and robots output cannot fall back to localhost. After deployment, check `/api/health`; its database, storage, and environment checks must all be healthy/persistent before publishing content.

Published CMS destinations are:

- Page: `/{slug}` and an automatic public navigation link
- Project: `/work/{slug}` and the Projects archive
- Journal article: `/journal/{slug}`, the Journal archive, and the Journal section on About
- Service: the Services page
- Team member: the Team section on About

## Commands

- `npm run dev` — development server on `127.0.0.1:3000`
- `npm run build` — production build
- `npm start` — production server on `127.0.0.1:3000`
- `npm run typecheck` — strict TypeScript check
- `npm run lint` — lint checks
- `npm test` — unit tests
- `npm run build:vinext` — build the Cloudflare Worker locally
- `npm run deploy:vinext` — build and deploy the Worker, D1 and R2 bindings
