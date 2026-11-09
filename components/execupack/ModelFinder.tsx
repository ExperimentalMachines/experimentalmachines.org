"use client";

import { useId, useState } from "react";
import WindowStrip, { k, spoken } from "@/components/execupack/WindowStrip";

// Every published model, with what is on Hugging Face for each target. A reader usually arrives with one
// chip in mind, so the targets double as a filter: pick one and only the models built for it stay, with
// its column in full colour. Without scripts, every model shows.

export type TargetKey = "xnnpack" | "vulkan" | "qnn" | "mtk";

export type FinderCell =
  | { kind: "built"; windows: number[]; detail?: string }
  // ExecuTorch can build it and nobody has yet.
  | { kind: "todo" }
  // Built, measured, and not published on purpose; the reason is in the exceptions.
  | { kind: "withheld" }
  // No export path in the pinned ExecuTorch.
  | { kind: "none" };

export type FinderRow = { name: string; href: string; family: string; updated: string; cells: Record<TargetKey, FinderCell> };

export type FinderTarget = { key: TargetKey; label: string; detail: string };

function Cell({ c, slots, version }: { c: FinderCell; slots: number[]; version: string }) {
  if (c.kind === "built") {
    const range = c.windows.length > 1 ? `${k(c.windows[0])}–${k(c.windows.at(-1)!)}` : k(c.windows[0]);
    return (
      <>
        <WindowStrip windows={c.windows} slots={slots} />
        <span className="sr-only">Published at {spoken(c.windows)}{c.detail ? `, ${c.detail}` : ""}</span>
        <span aria-hidden className="mt-1.5 block text-xs leading-5 tabular-nums text-ink-soft">
          {range}
          {c.detail && <span className="font-medium text-ink">, {c.detail}</span>}
        </span>
      </>
    );
  }
  if (c.kind === "todo") {
    return <span className="inline-block rounded-full border border-dashed border-ink/40 px-2 py-0.5 text-xs">Not yet</span>;
  }
  if (c.kind === "withheld") {
    return (
      <a href="#exceptions" className="inline-block rounded-full border border-ink/25 px-2 py-0.5 text-xs underline-offset-4 hover:border-ink hover:underline">
        Withheld<span className="sr-only">, see why under Exceptions</span>
      </a>
    );
  }
  return (
    <>
      <span aria-hidden className="text-ink-soft">
        —
      </span>
      <span className="sr-only">No path in ExecuTorch {version}</span>
    </>
  );
}

export default function ModelFinder({
  rows,
  targets,
  slots,
  version,
}: {
  rows: FinderRow[];
  targets: FinderTarget[];
  slots: number[];
  version: string;
}) {
  const [only, setOnly] = useState<TargetKey | null>(null);
  const labelId = useId();
  const shown = only ? rows.filter((r) => r.cells[only].kind === "built") : rows;
  const count = (t: TargetKey) => rows.filter((r) => r.cells[t].kind === "built").length;
  const dim = (t: TargetKey) => (only && only !== t ? "opacity-35" : "");
  const pill = (on: boolean) => `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${on ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`;
  const n = (on: boolean) => `tabular-nums ${on ? "text-white/70" : "text-ink-soft"}`;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span id={labelId} className="text-sm text-ink-soft">
          Built for
        </span>
        <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={only === null} onClick={() => setOnly(null)} className={pill(only === null)}>
            Any target <span className={n(only === null)}>{rows.length}</span>
          </button>
          {targets.map((t) => (
            <button key={t.key} type="button" aria-pressed={only === t.key} onClick={() => setOnly(only === t.key ? null : t.key)} className={pill(only === t.key)}>
              {t.label} <span className={n(only === t.key)}>{count(t.key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] bg-white p-5 sm:p-8">
        <p className="mb-3 text-xs text-ink-soft md:hidden">Scroll sideways for all four targets.</p>
        <div
          role="region"
          aria-label="Published models by target, scrolls sideways on small screens"
          tabIndex={0}
          className="relative overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
        >
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">
              Published ExecuPack models and the context windows on Hugging Face for each target
              {only ? `, showing models built for ${targets.find((t) => t.key === only)!.label}` : ""}
            </caption>
            <thead>
              <tr className="align-bottom text-xs text-ink-soft">
                <th scope="col" className="pb-3 pr-4 text-left font-normal">
                  Model
                </th>
                {targets.map((t) => (
                  <th key={t.key} scope="col" className={`w-[18%] pb-3 pr-4 text-left font-normal transition-opacity ${dim(t.key)}`}>
                    <span className="block text-sm font-medium text-ink">{t.label}</span>
                    <span className="block">{t.detail}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.flatMap((r, i) => {
                const head =
                  i === 0 || shown[i - 1].family !== r.family ? (
                    <tr key={`family-${r.family}`}>
                      <th scope="colgroup" colSpan={targets.length + 1} className="border-t border-rule pb-1 pt-5 text-left text-xs font-medium text-ink-soft">
                        {r.family}
                      </th>
                    </tr>
                  ) : null;
                return [
                  head,
                  <tr key={r.name} className="align-top">
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                      <a href={r.href} target="_blank" rel="noreferrer" className="font-medium text-blue-deep underline decoration-blue/30 underline-offset-4 hover:decoration-blue">
                        {r.name}
                      </a>
                      <span className="mt-0.5 block text-xs text-ink-soft">Updated {r.updated}</span>
                    </th>
                    {targets.map((t) => (
                      <td key={t.key} className={`py-2.5 pr-4 transition-opacity ${dim(t.key)}`}>
                        <Cell c={r.cells[t.key]} slots={slots} version={version} />
                      </td>
                    ))}
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
