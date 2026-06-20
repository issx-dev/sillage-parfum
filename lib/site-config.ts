/**
 * Site-wide configuration constants.
 *
 * Centralized so we never burn a hardcoded domain into metadata,
 * structured data, or absolute URLs. Override via env in any environment.
 */

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000";

/** Canonical absolute origin of the site (no trailing slash). */
export const SITE_URL = RAW_SITE_URL.replace(/\/$/, "");

/** Origin only — used to build image URLs in absolute form. */
export const SITE_ORIGIN = (() => {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return SITE_URL;
  }
})();
