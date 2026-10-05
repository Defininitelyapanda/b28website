# Backup and recovery

`POST /api/admin2714/backup` creates a checksummed JSON snapshot in persistent backup storage and records it in the CMS store. Copy the entire `data` directory and uploaded media to offline storage for a complete filesystem backup.

Design publishing also creates an automatic pre-publish version. Open **Versions** in the builder to restore one of these snapshots into a safe draft. Review it in Preview and publish explicitly when ready.

For a filesystem disaster recovery, stop the server, preserve the current directories, verify the selected backup checksum, and replace the applicable records in `data/cms.json`. Cloudflare deployments use D1 for structured CMS records and R2 for media/backups.
