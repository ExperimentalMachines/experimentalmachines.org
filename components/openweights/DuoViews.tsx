"use client";

// Every pairing on both devices, model by model, drawn the way the Snapdragon post draws its own
// (PairingViews.tsx). Three switches: what to show (each pairing's total time, or its prefill and decode
// rates), which device (both, or one), and how (one matrix per model and device, or tables). Every view
// reads the same generated data (lib/prefill-decode-mtk-data.ts); the switches only change how it is
// drawn, and both devices go through the same code.

import { useId, useState } from "react";
import { Scroll, grouped, ordinal, slower } from "@/components/openweights/pd-parts";
import { DEVICE, DuoLabel, entries, type Entry } from "@/components/openweights/duo";
import { processors, ranked, sdModels, sdTwins, type MtkCell, type MtkModel } from "@/lib/prefill-decode-mtk";

type Show = "time" | "rates";

const key = (e: { m: MtkModel; d: string }) => `${e.m.name}${e.m.quant}${e.d}`;
const slow = (c: MtkCell) => c.stalls > 0;
const warm = (c: MtkCell) => c.gate !== "passed";
// Why a pairing has no cell: on the tablet, memory (its NPU copy refused, or no room beside it); on the
// S24, a parity run that ran only the tablet's pairings on purpose (Codex, final check).
const missing = (m: MtkModel) => (m.npuExport.startsWith("Hexagon") ? "not run, to match the tablet" : m.fits === 4 ? "refused by memory guard" : "did not fit in memory");

function Picker<T extends string>({ title, value, set, options }: { title: string; value: T; set: (v: T) => void; options: [T, string][] }) {
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

const Mark = ({ c, fastest }: { c: MtkCell; fastest: boolean }) => (
  <>
    {slow(c) && (
      <>
        <span aria-hidden>*</span>
        <span className="sr-only">, {c.stalls} CPU decode steps over half a second</span>
      </>
    )}
    {warm(c) && (
      <>
        <span aria-hidden className={fastest ? "" : "text-ink-soft"}>
          †
        </span>
        <span className="sr-only">, started after the cooling gate timed out</span>
      </>
    )}
  </>
);

// Both views shade by total time, so a reader switching to rates keeps the same picture of which pairing
// won on that device.
function Grid({
  m,
  d,
  whole,
  extra,
  caption,
  children,
}: {
  m: MtkModel;
  d: "mtk" | "sd";
  whole?: boolean;
  extra?: boolean;
  caption: string;
  children: (c: MtkCell, fastest: boolean) => React.ReactNode;
}) {
  const r = ranked(m);
  const top = r[0].cell.seconds;
  const low = r.at(-1)!.cell.seconds;
  return (
    <div className="min-w-0">
      <h3 className="display text-xl">
        <DuoLabel m={m} />
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        <span className="font-medium text-ink">{DEVICE[d]}</span>, unit {m.unit}, {m.turns} turns{m.convs < 9 && ` from ${m.convs} of the 9 conversations`}
        {m.fits < 9 && (d === "sd" ? `, the ${m.fits} pairings the tablet ran` : `, the ${m.fits} pairings that fit in memory`)}
        {whole && `; its whole run, beside no ${DEVICE.sd} run (the ${DEVICE.sd} read a subset)`}
        {extra && "; an earlier run on another unit, replaced in the comparison by the full-turn run, not compared"}
      </p>
      <Scroll label={`${m.name} ${m.quant} on the ${DEVICE[d]}: ${caption}`}>
        <table className="w-full min-w-[19rem] table-fixed border-separate border-spacing-1 text-sm tabular-nums">
          <thead>
            <tr>
              <th className="w-[18%] whitespace-nowrap pb-1 text-left align-bottom text-[0.7rem] font-normal leading-4 text-ink-soft">
                prefill <span aria-hidden>↓</span>
                <br />
                decode <span aria-hidden>→</span>
              </th>
              {processors.map((p) => (
                <th key={p} scope="col" className="pb-1 text-left text-xs font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.cells.map((row, i) => (
              <tr key={processors[i]}>
                <th scope="row" className="text-left text-xs font-medium">
                  {processors[i]}
                </th>
                {row.map((c, j) => {
                  if (!c)
                    return (
                      <td key={j} className="rounded-md border border-dashed border-ink/25 px-2 py-2 align-top text-xs text-ink-soft">
                        {missing(m)}
                      </td>
                    );
                  const fastest = c.seconds === top;
                  const t = low === top ? 1 : (low - c.seconds) / (low - top);
                  return (
                    <td
                      key={j}
                      className={`relative rounded-md px-2 py-2 align-top ${fastest ? "bg-blue text-white" : ""}`}
                      style={fastest ? undefined : { backgroundColor: `color-mix(in srgb, var(--color-blue) ${Math.round(5 + 22 * t)}%, white)` }}
                    >
                      {children(c, fastest)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
    </div>
  );
}

function TimeGrid({ m, d, whole, extra }: { m: MtkModel; d: "mtk" | "sd"; whole?: boolean; extra?: boolean }) {
  const top = ranked(m)[0].cell.seconds;
  return (
    <Grid m={m} d={d} whole={whole} extra={extra} caption="total time for every pairing">
      {(c, fastest) => (
        <>
          <span aria-hidden className={`absolute right-1.5 top-1 text-[0.72rem] leading-none ${fastest ? "text-white/70" : "text-ink-soft"}`}>
            {c.order}
          </span>
          <span className="sr-only">, ran {ordinal(c.order)}</span>
          <span className="block font-medium">
            {grouped(c.seconds)} s<Mark c={c} fastest={fastest} />
          </span>
          <span className={`block text-xs ${fastest ? "text-white/85" : "text-ink-soft"}`}>{fastest ? "fastest" : slower(c.seconds, top)}</span>
        </>
      )}
    </Grid>
  );
}

function RateGrid({ m, d, whole, extra }: { m: MtkModel; d: "mtk" | "sd"; whole?: boolean; extra?: boolean }) {
  return (
    <Grid m={m} d={d} whole={whole} extra={extra} caption="prefill and decode rates for every pairing">
      {(c, fastest) => (
        <>
          <span className="block whitespace-nowrap font-medium">
            {grouped(c.prefillTokS)}
            <span className="sr-only"> new tokens per second prefill, </span>
          </span>
          <span className="block whitespace-nowrap font-medium leading-4">
            {c.decodeTokS.toFixed(1)}
            <span className="sr-only"> tokens per second decode</span>
            <Mark c={c} fastest={fastest} />
            {fastest && <span className="sr-only">, fastest pairing in total time</span>}
          </span>
        </>
      )}
    </Grid>
  );
}

const Legend = ({ line, keys = [] }: { line: string; keys?: React.ReactNode[] }) => (
  <div>
    <p className="max-w-3xl leading-7 text-ink-soft">{line}</p>
    {keys.length > 0 && (
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm leading-6 text-ink-soft">
        {keys.filter(Boolean).map((k, i) => (
          <li key={i}>{k}</li>
        ))}
      </ul>
    )}
  </div>
);

// The models to pick from, the ones both devices ran first. Picking one shows its two devices side by
// side over the same turns: the tablet's rows rebuilt on the S24's turns where the S24 read a subset.
const same = (a: MtkModel, b: MtkModel) => a.name === b.name && a.quant === b.quant;
// One option per model: extra runs are not models of their own (they show under "All models").
const models = [...entries.filter((e) => e.d === "sd" && !e.extra), ...entries.filter((e) => e.d === "mtk" && !sdModels.some((s) => same(s, e.m)))].map((e) => e.m);
const modelKey = (m: MtkModel) => `${m.name} ${m.quant}`;
const shortName = (m: MtkModel) => `${m.name}${m.quant.startsWith("Q8_0") ? " Q8_0" : ""}`;
// A model's two sides over the same turns; a model without a tablet twin shows only the device that
// ran it, never the S24's run under the tablet's name (Codex fairness review, round three).
const sidesOf = (key: string): Entry[] => {
  const m = models.find((x) => modelKey(x) === key)!;
  const i = sdModels.findIndex((s) => same(s, m));
  if (i < 0) return [{ m, d: "mtk" as const }];
  const t = sdTwins[i];
  return t
    ? [
        { m: t, d: "mtk" as const },
        { m: sdModels[i], d: "sd" as const },
      ]
    : [{ m: sdModels[i], d: "sd" as const }];
};

// One model at a time, both devices side by side: the model, and whether to show time or rates. The
// tables, the device filter and the all-models view were cut as repeats of what this shows (owner,
// 2026-11-17: no duplicated views).
export default function DuoViews() {
  const [show, setShow] = useState<Show>("time");
  const [model, setModel] = useState<string>(modelKey(models[0]));
  // "All" shows every model's two matrices in the page's model order; earlier runs a parity run
  // replaced (extra) are not shown.
  const rows = model === "all" ? entries.filter((e) => !e.extra) : sidesOf(model);
  const marks = ["*: a CPU decode step over half a second", "†: started after the cooling gate ran out", "Dashed: not run"];
  return (
    <div>
      <div className="space-y-3">
        <Picker title="Model" value={model} set={setModel} options={[...models.map((m): [string, string] => [modelKey(m), shortName(m)]), ["all", "All"]]} />
        <Picker
          title="Show"
          value={show}
          set={setShow}
          options={[
            ["time", "Total time"],
            ["rates", "Prefill and decode rates"],
          ]}
        />
      </div>
      <div className="mt-8">
        <Legend
          line={
            show === "time"
              ? "Total time for the model's turns, and how much longer than that device's fastest pairing (blue)."
              : "Prefill rate on top, decode rate below, in tokens per second; blue is the fastest pairing in total time."
          }
          keys={["Rows: prefill, columns: decode", ...(show === "time" ? ["Small number: the order it ran in"] : []), ...marks]}
        />
      </div>
      <div className="mt-8 grid gap-x-12 gap-y-14 md:grid-cols-2">
        {rows.map((e) => (show === "time" ? <TimeGrid key={key(e)} m={e.m} d={e.d} /> : <RateGrid key={key(e)} m={e.m} d={e.d} />))}
      </div>
    </div>
  );
}
