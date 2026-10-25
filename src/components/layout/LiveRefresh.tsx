"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Re-fetches the server-rendered data (prices, stock, catalog) when the tab
 * regains focus and every 30 s while visible, so edits made directly in the
 * database show up without a manual reload.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [router]);

  return null;
}
