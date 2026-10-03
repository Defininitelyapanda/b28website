# B28 admin guide

Open `/admin` and sign in with the password configured in `.env.local`. The local administrator has full editorial access.

## Publish work

Choose **New**, select Project, add the title and clean URL slug, write the short catalogue description and main story, then add a cover image path. Add, reorder or remove flexible content blocks. Use **Save draft** until ready and **Publish** when the record is complete. The same flow handles pages, services, team profiles and journal articles.

The editor autosaves a local recovery copy after a short pause. If a tab or browser closes unexpectedly, return to the editor and choose **Restore**. Every server save also creates an immutable version. Version endpoints support review and restore without overwriting history.

## Media

Upload JPG, PNG, WebP, AVIF, MP4, WebM, MP3, WAV or PDF files through the media endpoint. Files receive generated local filenames; original filenames are metadata only. Add meaningful alt text before using an image. Keep media sizes appropriate for the available local disk space.

## Leads

New contact enquiries appear under **Contact pipeline** with the `NEW` state. Review the message, then move it through Contacted, In discussion, Booked, Completed or Archived as the relationship progresses.

## Recovery and backups

The protected **Recovery** route works independently of the main dashboard. Check `/api/health` first. A backup request writes a checksummed JSON snapshot of content, settings and navigation into `data/backups`. Never restore a backup without separately confirming the target and backup ID.

## Demo content

Initial records are tagged `demo: true`. Replace their text, imagery and credits before presenting them as real B28 productions. No sample awards, clients or partnerships are claimed.
