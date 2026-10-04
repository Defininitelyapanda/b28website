# B28 Entertainment

A Next.js website and editorial CMS for B28 Entertainment. The public site has no ChatGPT or OpenAI dependency. Administration uses Google OAuth and is restricted to one verified B28 account. An enrolled passkey can be used as a recovery method if Google sign-in is unavailable.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The protected studio is at `http://localhost:3000/admin`.

## Secure admin setup

Create an OAuth 2.0 Web application in Google Cloud for the B28 Google account. Configure these redirect URIs:

- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://YOUR_DOMAIN/api/auth/callback/google`

Set these environment variables locally and on the hosting platform:

```env
AUTH_SECRET="a-long-random-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
AUTH_URL="https://YOUR_DOMAIN"
NEXT_PUBLIC_SITE_URL="https://YOUR_DOMAIN"
```

Generate `AUTH_SECRET` with `npx auth secret`. Never commit the real values. In Google Cloud, keep the OAuth app internal/testing with only `b28entertainment@gmail.com` added as a test user until it is ready for production.

The security boundary is enforced in three places:

- `/admin` routes require a signed Google or registered-passkey session.
- The Google profile must have a verified email matching `ADMIN_EMAIL` exactly.
- Admin API routes repeat the server-side session and role check.

Google OAuth only requires a free OAuth client configured in Google Cloud Console. The website and its data do not need to be hosted on Google Cloud, and billing is not required for this sign-in configuration.

## Passkey recovery

After signing in with the approved Google account, open **Passkey recovery** in the admin settings and register at least one passkey. Registration requires the Google-authenticated session; a session created by a passkey cannot enroll another passkey.

The recovery screen is intentionally not linked from the public site or normal admin login. Staff should store this private address safely:

```text
https://YOUR_DOMAIN/admin/login/passkey
```

Passkeys require HTTPS in production; localhost HTTP is supported for development. Credential public keys, counters and challenge records are saved with the CMS data, so the deployment must provide durable storage for `data/cms.json`. Losing that file removes enrolled passkeys.

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
