# Security notes

- Authentication is provided by the hosting platform and checked again on every admin API request.
- Authorization is based on stored roles. Public visitor input never decides access.
- SQL uses prepared bindings. Zod validates content and contact bodies.
- Media has a MIME allowlist, size cap and generated storage keys; unsanitized SVG uploads are rejected.
- Contact submissions include a honeypot and short-window rate limit. Configure Turnstile before a high-volume public launch.
- Cookies and identity tokens remain platform-managed and HTTP-only. Secrets belong in hosted environment settings, never source.
- Logs use event codes and error messages only; do not add passwords, session values or raw private submissions.
