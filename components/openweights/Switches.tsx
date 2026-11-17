"use client";

// A figure that shows one view at a time, picked by one or more rows of switches. The page renders
// every view on the server and passes them in as nodes, keyed by the picked options joined with ":",
// so the numbers stay generated server-side and this component only chooses which one to draw.

import { useId, useState } from "react";

export type Axis = { title: string; options: [string, string][]; initial?: string };

function Picker({ title, value, set, options }: { title: string; value: string; set: (v: string) => void; options: [string, string][] }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span id={id} className="text-sm text-ink-soft">
        {title}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => set(v)}
            className={`rounded-full border px-4 py-2 text-sm ${value === v ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Switches({ axes, views }: { axes: Axis[]; views: Record<string, React.ReactNode> }) {
  const [picked, setPicked] = useState(() => axes.map((a) => a.initial ?? a.options[0][0]));
  const view = views[picked.join(":")];
  return (
    <div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {axes.map((a, i) => (
          <Picker key={a.title} title={a.title} value={picked[i]} set={(v) => setPicked((p) => p.map((x, j) => (j === i ? v : x)))} options={a.options} />
        ))}
      </div>
      <div className="mt-8">{view ?? <p className="text-sm text-ink-soft">Not measured.</p>}</div>
    </div>
  );
}
