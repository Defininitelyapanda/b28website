# Backup and recovery

`POST /api/admin/backup` creates a checksummed JSON snapshot in `data/backups` and records it in the local CMS store. Copy the entire `data` directory and `public/uploads` to offline storage for a complete backup.

To restore, stop the server, preserve the current directories, verify the selected backup checksum, and replace the applicable records in `data/cms.json`. The `/admin/recovery` route provides a minimal health and navigation surface if the main dashboard fails.
