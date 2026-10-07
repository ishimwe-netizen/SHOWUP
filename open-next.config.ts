import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental-cache override (e.g. R2) for now - every route in this
// prototype is either fully dynamic (API routes, /health, /checkout/*) or
// plain static (/, /vendor/onboarding), so there's no ISR/ on-demand
// revalidation happening yet that would need a persistent cache backend.
// Add one (see https://opennext.js.org/cloudflare/caching) if/when a page
// starts using revalidate.
export default defineCloudflareConfig();
