// What the two-device page and its client switch (DuoViews.tsx) share. No hooks and no "use client", so
// the server-rendered page can read these values too.

import { mtkModels, sdExtra, sdModels, sdTwins, type MtkModel } from "@/lib/prefill-decode-mtk";

export const DEVICE = { mtk: "Dimensity 9300+", sd: "Snapdragon 8 Gen 3" } as const;

// Each model the tablet ran, followed by the S24's run of it when there is one; then any model only the
// S24 ran. The tablet ran more models, so its rows come first by model, not because it leads. Where the
// S24 read a subset of the tablet's turns, the tablet's row is its run rebuilt on the S24's turns, so the
// two sit side by side over the same work, and its whole run follows as its own row, marked whole (Codex
// fairness review, round three: the full run had been drawn beside the S24's subset).
// whole: the tablet's whole run where the S24 read a subset; extra: an S24 run a full-turn parity run
// replaced in the comparison, kept on its own unit.
export type Entry = { m: MtkModel; d: "mtk" | "sd"; whole?: boolean; extra?: boolean };
export const entries: Entry[] = [
  ...mtkModels.flatMap((m) => {
    const i = sdModels.findIndex((s) => s.name === m.name && s.quant === m.quant);
    const t = i >= 0 ? sdTwins[i] : null;
    if (i < 0 || !t) return [{ m, d: "mtk" as const }];
    return [
      { m: t, d: "mtk" as const },
      { m: sdModels[i], d: "sd" as const },
      ...(t.turns !== m.turns ? [{ m, d: "mtk" as const, whole: true }] : []),
      ...sdExtra.filter((x) => x.name === m.name && x.quant === m.quant).map((x) => ({ m: x, d: "sd" as const, extra: true })),
    ];
  }),
  ...sdModels.filter((s) => !mtkModels.some((m) => m.name === s.name && m.quant === s.quant)).map((s) => ({ m: s, d: "sd" as const })),
];

export const DuoLabel = ({ m }: { m: MtkModel }) => (
  <>
    {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
  </>
);
