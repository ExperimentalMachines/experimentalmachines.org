// Small pieces the prefill/decode page and its results switch (PairingViews) share. No hooks, so the
// server-rendered page and the client component can both use them.

import type { PdModel } from "@/lib/prefill-decode";

export const th = "pb-3 pr-4 text-left text-xs font-normal text-ink-soft";
export const thNum = "pb-3 pr-4 text-right text-xs font-normal text-ink-soft";
export const td = "py-3 pr-4 text-right";

export const grouped = (x: number, d = 0) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// How much longer than the fastest, to one decimal below 1% so a near tie does not read as +0%.
export const slower = (x: number, best: number) => {
  const d = (100 * x) / best - 100;
  return `+${d < 1 ? d.toFixed(1) : Math.round(d)}%`;
};

export const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export const label = (m: PdModel) => (
  <>
    {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
  </>
);

export const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 leading-7 text-ink-soft marker:text-ink/30 first:mt-0">{children}</ul>
);

export const Item = ({ lead, children }: { lead: string; children: React.ReactNode }) => (
  <li>
    <span className="font-medium text-ink">{lead}</span> {children}
  </li>
);

export const Note = ({ children }: { children: React.ReactNode }) => <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">{children}</p>;

export const Sub = ({ children }: { children: React.ReactNode }) => <h3 className="display text-2xl">{children}</h3>;

// A table that scrolls sideways on narrow screens, focusable so the keyboard can scroll it. Relative, so
// the screen-reader-only labels inside (absolutely positioned) stay in the scroll box instead of
// widening the page.
export const Scroll = ({ label: l, children }: { label: string; children: React.ReactNode }) => (
  <div
    role="region"
    aria-label={`${l}, scrolls sideways on small screens`}
    tabIndex={0}
    className="relative mt-4 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
  >
    {children}
  </div>
);
