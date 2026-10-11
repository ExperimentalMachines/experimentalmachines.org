"use client";

import { useState } from "react";
import { matrix, targets } from "@/lib/home";

// ExecuPack's published builds: a few models first, the rest on request.
export default function Matrix() {
  const [all, setAll] = useState(false);
  const rows = all ? matrix : matrix.filter((m) => m.featured);
  return (
    <>
      <p className="mb-3 text-xs text-ink-soft sm:hidden">Scroll sideways for all four targets.</p>
      {/* Focusable so the table can be scrolled from the keyboard on narrow screens. */}
      <div
        role="region"
        aria-label="Published builds"
        tabIndex={0}
        className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
      >
        <table id="execupack-builds" className="relative w-full min-w-[27rem] text-sm">
          <caption className="sr-only">Published ExecuPack builds by model and target</caption>
          <thead>
            <tr className="align-bottom text-xs text-ink-soft">
              <th scope="col" className="pb-3 pr-4 text-left font-normal">
                Model
              </th>
              {targets.map((t) => (
                <th key={t.key} scope="col" className="px-1.5 pb-3 text-center font-normal sm:px-3">
                  <span className="block font-medium text-ink">{t.label}</span>
                  <span className="block">{t.detail}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.name} className="border-t border-rule">
                <th scope="row" className="min-w-[8rem] py-3 pr-4 text-left font-normal">
                  <a href={m.href} target="_blank" rel="noreferrer" className="font-medium hover:text-blue-deep">
                    {m.label}
                  </a>
                  {m.note && <span className="mt-0.5 block text-xs text-blue-deep">{m.note}</span>}
                </th>
                {m.cells.map((c, i) => (
                  <td key={targets[i].key} className="relative px-1.5 py-3 text-center sm:px-3">
                    {c ? (
                      <span className="inline-flex flex-col items-center gap-1">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-blue" />
                        <span className="sr-only">Published, windows {c}</span>
                        <span aria-hidden className="text-[0.7rem] tabular-nums text-ink-soft">
                          {c}
                        </span>
                      </span>
                    ) : (
                      <>
                        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full border border-ink/50" />
                        <span className="sr-only">Not published</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        aria-expanded={all}
        aria-controls="execupack-builds"
        onClick={() => setAll(!all)}
        className="mt-1 flex min-h-11 w-full items-center border-t border-rule pt-1 text-left text-sm font-medium hover:text-blue-deep"
      >
        {all ? "Show fewer" : `Show all ${matrix.length} models`}
      </button>
    </>
  );
}
