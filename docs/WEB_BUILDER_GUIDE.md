# B28 Website Builder Guide

Open the unlinked builder by manually entering `/admin2714`. Use `/admin2714?safe=true` when a third-party embed, animation, or heavy media item makes the normal canvas difficult to load.

## Editing the public site

Choose Global design or a public page in the left sidebar, then click an element in the canvas. Text becomes editable in place. The contextual toolbar provides controls appropriate to the selection; the amber handles reposition and resize it. The right inspector provides detailed content, typography, color, background, spacing, border, image, link, and positioning controls.

Device buttons switch the canvas between real desktop, tablet, and mobile widths. Live site shows the published page; Design shows the editable canvas.

## Drafts, autosave, and publishing

Design changes are written to a separate persistent draft after a short idle period. The status beside the B28 logo shows Saving draft, Draft saved, offline recovery, or failure. Autosave does not modify the visitor-facing site.

If browser-saved changes differ from the server version after reopening the builder, a recovery dialog lets you recover them or keep the server version. Autosave, publish, and restore requests run in order to prevent a delayed autosave from overwriting a recovery operation.

Use Save draft for an immediate save. Publish changes asks for confirmation, stores a snapshot of the current live design, and only then promotes the draft. A failed publish leaves the live version untouched and keeps the draft recoverable.

Back to last saved discards the design draft and restores the last published design without reloading the canvas. Versions opens the recovery history; restoring a version creates a draft first, allowing review before publishing.

## Pages and managed content

Use the plus button in Pages & content to create a page, project, journal article, service, or team member. Enter a unique slug, content, cover media, and type-specific details. Content blocks add text, images, quotes, videos, galleries, statistics, timelines, and calls to action. Blocks can be reordered, hidden, duplicated through the editor, or deleted.

Save as Draft keeps a new item private. For an already published item, it keeps the current live content visible while storing your changes separately. Publish promotes the changes to the public route. Restoring a content version also creates a draft. Existing items can be duplicated or deleted from their inspector.

## Media

Image fields include an upload button. Uploaded files use persistent R2 storage on Cloudflare and the configured upload directory on filesystem deployments. Always provide useful image descriptions. External YouTube, Vimeo, and other HTTPS sources can be inserted with Video / embed; a provider may refuse embedding through its own policy.

## Global design and navigation

Global design controls identity, logo, navigation labels, primary action, site colors, typography, layout width, corner radius, spacing, footer identity, social links, and trusted-admin CSS. Page design controls each page hero, background, introduction, section copy, and imagery.

## Keyboard shortcuts

- `Ctrl/Cmd+Z`: undo
- `Ctrl/Cmd+Shift+Z`: redo
- `Ctrl/Cmd+S`: save draft
- `Ctrl/Cmd+C`: copy a selected component
- `Ctrl/Cmd+V`: paste/duplicate the copied component
- `Delete` or `Backspace`: delete a selected non-text component
- `Esc`: deselect
- `Ctrl/Cmd+P`: toggle design/live preview

## Recovery and backups

Use Versions for design snapshots and Back to last saved for the current published configuration. The backup endpoint stores checksummed structured exports in configured persistent storage. Before destructive maintenance, also export/copy CMS data and uploaded media as described in `docs/BACKUP_RECOVERY.md`.

## Authentication switch

Development access uses `ADMIN_AUTH_ENABLED=false`. The builder remains unlinked, excluded from indexing, and disallowed in robots. Before enabling authentication, configure a long random server-only `ADMIN_SESSION_TOKEN`; never place it in `NEXT_PUBLIC_*` variables.
