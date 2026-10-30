# Public-site catalog maintenance

Public visitors may browse the catalog and request generated translations of existing entries. Bulk refresh, enrichment, imports and supplied translation edits require a server-only maintenance credential.

The current deployment uses the Site's service credential as CATALOG_ADMIN_TOKEN. An unattended maintainer must obtain the current credential through the supported Sites get_site operation and send its value as X-SideQuest-Catalog-Key to this Site only. OAI-Sites-Authorization alone grants gateway access, not catalog-write permission. Do not put the credential in source, a schedule prompt, command arguments or logs. Pass it through hidden stdin or session memory.

After a future service-credential rotation, update CATALOG_ADMIN_TOKEN through Sites runtime secrets and redeploy before using the rotated maintenance key. Do not remove the write check to restore a failing updater.

Refresh source records with POST /api/catalog using action refresh, then action expand when appropriate. Read GET /api/catalog to confirm the persisted check times and counts. Existing refresh locks and source caches still apply. Failures must preserve old records and their original source timestamps.

The linked cloud refresh task predates this authorization requirement. Its prompt must include the extra maintenance header. The desktop automation-management connection was unavailable during the public release, so this task's prompt update remains unverified. Local audit scripts now send both headers when given the service credential on hidden stdin.
