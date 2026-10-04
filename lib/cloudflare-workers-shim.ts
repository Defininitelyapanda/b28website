// Next.js development and non-Cloudflare hosts use the filesystem adapters.
// next.config.ts aliases Cloudflare's native runtime module to this empty env.
export const env: Record<string, never> = {};
