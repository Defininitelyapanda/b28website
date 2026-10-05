# B28 builder architecture and implementation stages

## Current architecture

The public website and `/admin2714` run in the same Next.js application. Cloudflare uses the Vinext build, a D1 CMS state record, and R2 media. Filesystem hosts use an atomic JSON store and a persistent upload directory. `lib/local-store.ts` supplies the shared persistence abstraction; `lib/cms.ts` supplies content and design operations.

The canvas renders the actual public routes in an iframe. `visual-editor-runtime.tsx` sends selection, text, transformation, and keyboard events to `site-builder.tsx`. Design changes are applied through same-origin messages, including undo and redo, without navigating the iframe. Element overrides and inserted elements are stored in site settings. The inspectors expose page, global, component, and managed-content controls.

Authentication is behind `lib/admin-access.ts` and the route proxy. The development default opens the builder directly. A configured server token is required when the switch is enabled; a production login/session provider can replace this implementation behind the same interface.

## Implemented persistence and recovery stage

- Published site settings and design drafts use separate settings records.
- Design autosave writes a persistent server draft and a browser fallback.
- Reopening the builder loads a server draft; differing browser changes can be recovered explicitly.
- Design write requests execute in order so publish and recovery cannot be overtaken by an earlier autosave.
- Publishing creates an automatic snapshot of the previous live design.
- Restoring a design version creates a draft for review.
- Managed-content drafts are separate from live content; editing an existing published item does not remove its public version.
- Content version restoration creates a draft.
- Persistent media can be searched and reused through the media library.
- Managed content supports search metadata, canonical URLs, social images, and indexing settings.
- Safe mode disables canvas motion, pauses videos, and replaces custom embeds with placeholders.

## Remaining stages from the full builder specification

1. Structured sections, containers, and layers: stable component IDs, nesting, drag ordering, locking, responsive overrides, reusable sections, and templates. Current individual element editing uses DOM selectors; it is not yet a fully structured page composition engine.
2. Expanded content workflows: persistent managed-content autosave, scheduling, archive/unpublish actions, richer project credits and galleries, and explicit content draft recovery controls.
3. Media management: editable metadata, folders, replacement, usage tracking, deletion safeguards, image cropping, and upload progress.
4. Publishing controls: a change summary, complete validation, multi-editor conflict handling, and an atomic publish operation spanning related content and design.
5. Site operations: integrated backup export/import, health and activity views, redirect management, forms/inquiries, and expanded SEO controls for the fixed public pages.
6. Browser acceptance testing: desktop/mobile pointer manipulation, repeated history operations, offline recovery, and failed publishing on the deployed Cloudflare runtime.

The completed stage establishes draft/live isolation and recovery. It does not claim completion of every feature in the full professional-builder specification.

## Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`, and `npm run build:vinext`. Use an isolated `CMS_DATA_DIR` for integration tests so draft, publish, and restore checks cannot alter real content. A successful build does not replace browser interaction testing or verification of the deployed D1/R2 bindings.
