"use client";

import { useEffect } from "react";

// React never runs an inline script it renders on the client, so a client-side navigation to a moved
// address needs this. On a full page load the inline script has already gone, and marks that it has.
export default function MovedForward({ to }: { to: string }) {
  useEffect(() => {
    if ((window as Window & { __moved?: number }).__moved) return;
    location.replace(to + location.search + location.hash);
  }, [to]);
  return null;
}
