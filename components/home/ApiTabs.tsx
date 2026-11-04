"use client";

import { useId, useState } from "react";

// A switch between APIs for the samples beside it. Both panels are in the page's HTML and the other one
// is only hidden, so the code stays coloured at build time and readable by search engines; without
// scripts the first panel simply stays.
export default function ApiTabs({
  panels,
  tone = "light",
}: {
  panels: { id: string; label: string; body: React.ReactNode }[];
  tone?: "light" | "dark";
}) {
  const [active, setActive] = useState(panels[0].id);
  const labelId = useId();
  const on = tone === "dark" ? "border-white bg-white text-[#0e1638]" : "border-ink bg-ink text-white";
  const off = tone === "dark" ? "border-white/35 text-white hover:border-white" : "border-rule bg-white hover:border-ink";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span id={labelId} className={`text-sm ${tone === "dark" ? "text-white/70" : "text-ink-soft"}`}>
          API
        </span>
        <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
          {panels.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={active === p.id}
              onClick={() => setActive(p.id)}
              className={`rounded-full border px-4 py-1.5 text-sm ${active === p.id ? on : off}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {panels.map((p) => (
        <div key={p.id} hidden={active !== p.id} className="mt-5">
          {p.body}
        </div>
      ))}
    </div>
  );
}
