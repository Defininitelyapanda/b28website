# B28 website builder guide

Enter `/admin2714` directly in the browser address bar. There is no login screen, Google authentication, password, or passkey. The route is intentionally absent from the public website.

Anyone who learns this path can modify the website. Treat the URL as private and change the route in the code if it becomes exposed.

Opening `/admin2714` launches the website builder rather than a separate dashboard. The left side navigates public pages and managed content, the centre switches between an instant design preview and the live website, and the right inspector edits the selected item. Desktop, tablet and mobile preview controls are available in the top toolbar.

## Publish work

Choose **+**, select the content type, add the title and clean URL slug, write the short description and main story, then choose or upload a cover image. Complete the type-specific fields shown by the inspector, and add, reorder or remove flexible content blocks. Use **Draft** until ready and **Publish** when the record is complete. Publishing switches the centre canvas to the refreshed live page.

Pages publish at `/{slug}` and are added to public navigation. Projects publish to the Work archive, journal articles publish below About and in the Journal archive, services publish to Services, and team members publish below About.

On the Cloudflare production deployment, publishing uses D1 database `b28-cms` and R2 bucket `b28-media`. Check `/api/health`: the database and storage checks must say `healthy`, and `checks.environment` must say `persistent`. If it says `ephemeral`, do not publish; redeploy after confirming the Cloudflare bindings. Wasmer deployments instead use the persistent CMS volume configured in `app.yaml`.

The builder keeps a local recovery copy after a short pause and provides undo and redo during the editing session. Every server save also creates an immutable version.

## Media

Upload JPG, PNG, WebP, AVIF, MP4, WebM, MP3, WAV or PDF files through the media endpoint. Files receive generated filenames; original filenames are metadata only. Add meaningful alt text before using an image. Cloudflare stores these files in R2; local and Wasmer environments use their configured filesystem storage.

## Recovery and backups

Check `/api/health` if publishing becomes unavailable. The backup endpoint writes a checksummed JSON snapshot to R2 on Cloudflare or `data/backups` on filesystem deployments; recovery is intentionally kept outside the visual editing interface.

## Demo content

Initial records are tagged `demo: true`. Replace their text, imagery and credits before presenting them as real B28 productions. No sample awards, clients or partnerships are claimed.
