# B28 Entertainment

A Next.js website and editorial CMS for B28 Entertainment. The public site has no ChatGPT or OpenAI dependency. The editorial studio is intentionally unlinked and available at a private path.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The unlinked studio is at `http://localhost:3000/admin2714`.

## Site configuration

Set the public site URL locally and on the hosting platform:

```env
NEXT_PUBLIC_SITE_URL="https://YOUR_DOMAIN"
```

There is no login or account authentication. Knowledge of `/admin2714` is the only access control, and its management APIs use the same unlinked namespace. Anyone who discovers the path can modify site content, so do not publish or link it.

## Runtime data

- CMS records and contact enquiries: `data/cms.json`
- Uploaded files: `public/uploads/`
- Backups: `data/backups/`

These runtime files are ignored by Git. A hosted deployment must attach persistent storage for these locations or migrate them to a durable database/object store.

## Commands

- `npm run dev` — development server on `127.0.0.1:3000`
- `npm run build` — production build
- `npm start` — production server on `127.0.0.1:3000`
- `npm run typecheck` — strict TypeScript check
- `npm run lint` — lint checks
- `npm test` — unit tests
