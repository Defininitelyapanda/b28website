# Security notes

- Set strong, distinct `LOCAL_ADMIN_PASSWORD` and `LOCAL_AUTH_SECRET` values in `.env.local`.
- Admin sessions use an HTTP-only, same-site signed cookie and expire after 12 hours.
- Zod validates content and contact bodies. Media uploads use a MIME allowlist, size cap, and generated filenames.
- Contact submissions include a honeypot and short-window in-memory rate limit.
- The server binds to `127.0.0.1` by default. Do not expose it to a network without adding TLS and a production-grade authentication boundary.
- Keep `.env.local`, `data/`, and private backups out of source control.
