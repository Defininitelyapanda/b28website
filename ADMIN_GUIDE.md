# B28 admin guide

Enter `/admin2714` directly in the browser address bar. There is no login screen, Google authentication, password, or passkey. The route is intentionally absent from the public website.

Anyone who learns this path can use the studio and modify content. Treat the URL as private and change the route in the code if it becomes exposed.

## Publish work

Choose **New**, select the content type, add the title and clean URL slug, write the short description and main story, then add a cover image path. Complete the type-specific fields shown by the editor, and add, reorder or remove flexible content blocks. Use **Save draft** until ready and **Publish** when the record is complete. After publishing, use **View live** to verify the public result.

Pages publish at `/{slug}` and are added to public navigation. Projects publish to the Work archive, journal articles publish below About and in the Journal archive, services publish to Services, and team members publish below About.

The editor autosaves a local recovery copy after a short pause. If a tab or browser closes unexpectedly, return to the editor and choose **Restore**. Every server save also creates an immutable version. Version endpoints support review and restore without overwriting history.

## Media

Upload JPG, PNG, WebP, AVIF, MP4, WebM, MP3, WAV or PDF files through the media endpoint. Files receive generated local filenames; original filenames are metadata only. Add meaningful alt text before using an image. Keep media sizes appropriate for the available local disk space.

## Leads

New contact enquiries appear under **Contact pipeline** with the `NEW` state. Review the message, then move it through Contacted, In discussion, Booked, Completed or Archived as the relationship progresses.

## Recovery and backups

The `/admin2714/recovery` route works independently of the main dashboard. Check `/api/health` first. A backup request writes a checksummed JSON snapshot of content, settings and navigation into `data/backups`. Never restore a backup without separately confirming the target and backup ID.

## Demo content

Initial records are tagged `demo: true`. Replace their text, imagery and credits before presenting them as real B28 productions. No sample awards, clients or partnerships are claimed.
