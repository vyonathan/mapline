// OpenNext configuration for Mapline (Cloudflare Workers)
// Minimal config: no R2 incremental cache, no workerd-specific overrides needed
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config';

export default defineCloudflareConfig({
  // No incremental cache configured (R2 not used — Prisma uses direct Postgres connection)
});
