"use client";

// The prefill/decode results, model by model. Two switches: what to show (each pairing's total time,
// or its prefill and decode rates) and how (one matrix per model, or tables). Every view reads the same
// generated data (lib/prefill-decode-data.ts); the switches only change how it is drawn.

import { useId, useState } from "react";
import { link } from "@/components/home/ui";
import { Note, Scroll, Sub, grouped, label, ordinal, slower, th, thNum } from "@/components/openweights/pd-parts";
import { pdModels, pdTurns, processors, ranked, type PdCell, type PdModel } from "@/lib/prefill-decode";

type Show = "time" | "rates";
type Form = "matrices" | "tables";

const key = (m: PdModel) => `${m.name}${m.quant}`;
const cell = (m: PdModel, p: string, d: string) =>
  m.cells[processors.indexOf(p as (typeof processors)[number])][processors.indexOf(d as (typeof processors)[number])];
const stuck = (c: PdCell) => c.frozenSeconds > 0;
const elsewhere = (m: PdModel, c: PdCell) => c.phone !== m.phone;

// Each model's fastest and slowest compared pairing, for the shading.
const bounds = (m: PdModel) => {
  const r = ranked(m);
  return { top: r[0].cell.seconds, low: r.at(-1)!.cell.seconds };
};

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

// Both views shade by total time, so a reader switching to rates keeps the same picture of which
// pairing won; a cool start is drawn but never shaded or ranked, since only warm starts compare.
function Grid({ m, caption, children }: { m: PdModel; caption: string; children: (c: PdCell, fastest: boolean) => React.ReactNode }) {
  const { top, low } = bounds(m);
  return (
    <div className="min-w-0">
      <h3 className="display text-xl">{label(m)}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Phone {m.phone}
        {Object.keys(m.replaced).map((k) => {
          const [pf, dc] = k.toUpperCase().split(":");
          return `; ${pf} → ${dc} on phone ${cell(m, pf, dc).phone}`;
        })}
      </p>
      <Scroll label={`${m.name} ${m.quant}: ${caption}`}>
        <table className="w-full min-w-[19rem] table-fixed border-separate border-spacing-1 text-sm tabular-nums">
          <thead>
            <tr>
              <th className="w-[16%] pb-1 text-left align-bottom text-[0.7rem] font-normal leading-4 text-ink-soft">
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
                  const fastest = !c.coolStart && c.seconds === top;
                  const t = low === top ? 1 : (low - c.seconds) / (low - top);
                  return (
                    <td
                      key={j}
                      className={`relative rounded-md px-2 py-2 align-top ${
                        c.coolStart ? "border border-dashed border-ink/25 text-ink-soft" : fastest ? "bg-blue text-white" : ""
                      }`}
                      style={
                        c.coolStart || fastest
                          ? undefined
                          : { backgroundColor: `color-mix(in srgb, var(--color-blue) ${Math.round(5 + 22 * t)}%, white)` }
                      }
                    >
                      {children(c, fastest)}
                      {c.coolStart && <span className="block text-xs">started cool</span>}
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

// The order a pairing ran in matters because each inherits the heat of the ones before it; a letter
// instead marks a pairing taken from another phone.
const Corner = ({ m, c, fastest, order = true }: { m: PdModel; c: PdCell; fastest: boolean; order?: boolean }) =>
  elsewhere(m, c) || order ? (
    <>
      <span aria-hidden className={`absolute right-1.5 top-1 text-[0.65rem] ${fastest ? "text-white/70" : "text-ink-soft"}`}>
        {elsewhere(m, c) ? c.phone : c.order}
      </span>
      <span className="sr-only">{elsewhere(m, c) ? `, run on phone ${c.phone}` : `, ran ${ordinal(c.order)}`}</span>
    </>
  ) : null;

const Star = ({ what }: { what: string }) => (
  <>
    <span aria-hidden>*</span>
    <span className="sr-only">, {what}</span>
  </>
);

function TimeGrid({ m }: { m: PdModel }) {
  const { top } = bounds(m);
  return (
    <Grid m={m} caption="total time for every pairing">
      {(c, fastest) => (
        <>
          <Corner m={m} c={c} fastest={fastest} />
          <span className={`block ${c.coolStart ? "" : "font-medium"}`}>
            {grouped(c.seconds)} s{stuck(c) && <Star what={`including ${Math.round(c.frozenSeconds)} s with decode stuck`} />}
          </span>
          {!c.coolStart && (
            <span className={`block text-xs ${fastest ? "text-white/85" : "text-ink-soft"}`}>{fastest ? "fastest" : slower(c.seconds, top)}</span>
          )}
        </>
      )}
    </Grid>
  );
}

function RateGrid({ m }: { m: PdModel }) {
  return (
    <Grid m={m} caption="prefill and decode rates for every pairing">
      {(c, fastest) => (
        <>
          <Corner m={m} c={c} fastest={fastest} order={false} />
          <span className={`block whitespace-nowrap pr-2 text-xs sm:text-[13px] ${c.coolStart ? "" : "font-medium"}`}>
            {grouped(c.prefillTokS)}
            <span className="sr-only"> new tokens per second prefill, </span>
            <span aria-hidden className={fastest ? "text-white/70" : "text-ink-soft"}>
              {" / "}
            </span>
            {c.decodeTokS.toFixed(1)}
            <span className="sr-only"> tokens per second decode</span>
            {stuck(c) && <Star what="including the time decode was stuck" />}
            {fastest && <span className="sr-only">, fastest pairing in total time</span>}
          </span>
        </>
      )}
    </Grid>
  );
}

// Grouped by prefill processor so each group reads like one row of a matrix.
function TimeTable() {
  return (
    <Scroll label="Total time for every pairing">
      <table className="w-full min-w-[64rem] text-sm tabular-nums">
        <thead>
          <tr>
            <th rowSpan={2} className={`${th} align-bottom`}>
              Model
            </th>
            {processors.map((p) => (
              <th key={p} colSpan={3} scope="colgroup" className="pb-1 pl-6 text-left text-xs font-medium">
                {p} prefill
              </th>
            ))}
          </tr>
          <tr className="align-bottom">
            {processors.flatMap((p) =>
              processors.map((d, j) => (
                <th key={`${p}${d}`} scope="col" className={`${thNum} ${j === 0 ? "pl-6" : ""}`}>
                  {d} decode
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {pdModels.map((m) => {
            const { top } = bounds(m);
            return (
              <tr key={key(m)} className="border-t border-rule align-top">
                <th scope="row" className="py-3 pr-4 text-left font-medium">
                  {label(m)}
                </th>
                {processors.flatMap((p) =>
                  processors.map((d, j) => {
                    const c = cell(m, p, d);
                    const fastest = !c.coolStart && c.seconds === top;
                    return (
                      <td key={`${p}${d}`} className={`py-3 pr-4 text-right ${j === 0 ? "pl-6" : ""} ${fastest ? "font-medium text-blue-deep" : ""}`}>
                        <span className="block whitespace-nowrap">
                          {grouped(c.seconds)} s{stuck(c) && <Star what={`including ${Math.round(c.frozenSeconds)} s with decode stuck`} />}
                          {elsewhere(m, c) && (
                            <>
                              <sup aria-hidden className="ml-0.5 text-[0.65rem] font-normal text-ink-soft">
                                {c.phone}
                              </sup>
                              <span className="sr-only">, run on phone {c.phone}</span>
                            </>
                          )}
                        </span>
                        <span className="block text-xs font-normal text-ink-soft">
                          {c.coolStart ? "started cool" : fastest ? "fastest" : slower(c.seconds, top)}
                        </span>
                      </td>
                    );
                  }),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Scroll>
  );
}

// Pooled over every warm pairing that used the processor for that phase: totals over totals for the
// rates, so stuck decode time stays in, and the median turn for time to first token.
function RateTables() {
  const tables = [
    {
      title: "Prefill",
      unit: "new tokens per second",
      vals: (m: PdModel) => m.prefill.map((p) => p.tokS),
      show: (x: number) => grouped(x),
      high: true,
    },
    {
      title: "Time to first token",
      unit: "milliseconds, median per turn",
      vals: (m: PdModel) => m.prefill.map((p) => p.firstTokenMs),
      show: (x: number) => grouped(x),
      high: false,
    },
    { title: "Decode", unit: "tokens per second", vals: (m: PdModel) => m.decode.map((d) => d.tokS), show: (x: number) => x.toFixed(1), high: true },
  ];
  return (
    <div className="grid gap-14 lg:grid-cols-3">
      {tables.map((t) => (
        <div key={t.title} className="min-w-0">
          <h4 className="display text-xl">{t.title}</h4>
          <p className="mt-1 text-sm text-ink-soft">{t.unit}</p>
          <Scroll label={t.title}>
            <table className="w-full min-w-[20rem] text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={th}>Model</th>
                  {processors.map((p) => (
                    <th key={p} className={thNum}>
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pdModels.map((m) => {
                  const v = t.vals(m);
                  const topV = t.high ? Math.max(...v) : Math.min(...v);
                  return (
                    <tr key={key(m)} className="border-t border-rule">
                      <th scope="row" className="py-2.5 pr-4 text-left text-[13px] font-medium">
                        {label(m)}
                      </th>
                      {v.map((x, i) => (
                        <td key={i} className={`whitespace-nowrap py-2.5 pr-4 text-right ${x === topV ? "font-medium text-blue-deep" : ""}`}>
                          {t.show(x)}
                          {x === topV && <span className="sr-only">, best of the three</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Scroll>
        </div>
      ))}
    </div>
  );
}

const Stuck = ({ children }: { children: React.ReactNode }) => (
  <a href="#stuck" className={link}>
    {children}
  </a>
);

// All a reader needs before the numbers: a line on what a cell holds, then a key. Anything that qualifies
// the numbers goes below them, so it does not stand between the reader and the data.
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

const Swatch = () => <span aria-hidden className="mr-1.5 inline-block h-3 w-3 rounded-[3px] bg-blue align-[-1px]" />;

// The rate matrices show the same processor prefilling at different rates in different pairings; a
// reader would otherwise take one cell's rate as the processor's. The note states the pattern and the
// temperatures beside it, and no cause, because none was tested.
const spread = (v: number[]) => Math.max(...v) / Math.min(...v) - 1;
const npuRows = pdModels.map((m) => {
  const row = m.cells[2].map((c, j) => ({ c, j })).filter(({ c }) => !c.coolStart);
  const top = row.reduce((a, b) => (b.c.prefillTokS > a.c.prefillTokS ? b : a));
  const rest = row.filter((x) => x !== top).map((x) => x.c.startC.npu - top.c.startC.npu);
  return { decode: processors[top.j], gain: spread(row.map((x) => x.c.prefillTokS)), cooler: rest };
});
const besideGpu = npuRows.filter((x) => x.decode === "GPU");
const cpuSpread = Math.max(...pdModels.map((m) => spread(m.cells[0].filter((c) => !c.coolStart).map((c) => c.prefillTokS))));
const cooler = besideGpu.flatMap((x) => x.cooler);
const PrefillVaries = () =>
  besideGpu.length > 0 ? (
    <Note>
      Prefill rates differ between pairings. NPU prefill was fastest beside GPU decode on{" "}
      {besideGpu.length === pdModels.length ? `all ${pdModels.length}` : `${besideGpu.length} of ${pdModels.length}`} models, by up to{" "}
      {Math.round(100 * Math.max(...besideGpu.map((x) => x.gain)))}% over its slowest pairing
      {cooler.every((x) => x > 0) &&
        `, and the NPU's median turn started ${Math.round(Math.min(...cooler))} to ${Math.round(Math.max(...cooler))} °C cooler there. Heat may explain it; that was not tested`}
      . CPU prefill differs by up to {Math.round(100 * cpuSpread)}%; the cause was not investigated.
    </Note>
  ) : null;

export default function PairingViews() {
  const [show, setShow] = useState<Show>("time");
  const [form, setForm] = useState<Form>("matrices");
  const other = pdModels.some((m) => Object.keys(m.replaced).length > 0);
  const cool = pdModels.some((m) => m.cells.flat().some((c) => c.coolStart));
  const pooled = show === "rates" && form === "tables";

  const letter = other && "Letter: run on another phone";
  const axes = ["Rows: prefill", "Columns: decode"];
  const legend = {
    "time:matrices": (
      <Legend
        line={`Total time for the same ${pdTurns} turns, and how much longer than the model's fastest.`}
        keys={[
          ...axes,
          <>
            <Swatch />
            Fastest; darker is faster
          </>,
          "Small number: order it ran in",
          letter,
          <>
            *: <Stuck>CPU decode got stuck</Stuck>
          </>,
          cool && "Dashed: started cool, not compared",
        ]}
      />
    ),
    "time:tables": (
      <Legend
        line={`Total time for the same ${pdTurns} turns, and how much longer than the model's fastest, in bold blue.`}
        keys={[
          <>
            *: <Stuck>CPU decode got stuck</Stuck>
          </>,
          letter,
        ]}
      />
    ),
    "rates:matrices": (
      <Legend
        line="Each pairing's prefill / decode rate, in tokens per second. Prefill counts new tokens only."
        keys={[
          ...axes,
          <>
            <Swatch />
            Fastest in total time
          </>,
          letter,
          <>
            *: includes time <Stuck>CPU decode was stuck</Stuck>
          </>,
        ]}
      />
    ),
    "rates:tables": <Legend line="Each processor, pooled over every warm pairing that used it. The best of the three is in bold blue." />,
  }[`${show}:${form}` as const];

  return (
    <div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <Picker
          title="Show"
          value={show}
          set={setShow}
          options={[
            ["time", "Total time"],
            ["rates", "Prefill and decode rates"],
          ]}
        />
        <Picker
          title="As"
          value={form}
          set={setForm}
          options={[
            ["matrices", "Matrices"],
            ["tables", "Tables"],
          ]}
        />
      </div>

      <div className="mt-10 space-y-4">
        {pooled && <Sub>Rates by processor</Sub>}
        {legend}
      </div>

      <div className="mt-10">
        {form === "matrices" ? (
          <div className={`grid gap-x-12 gap-y-14 xl:grid-cols-3 ${show === "time" ? "md:grid-cols-2" : "lg:grid-cols-2"}`}>
            {pdModels.map((m) => (show === "time" ? <TimeGrid key={key(m)} m={m} /> : <RateGrid key={key(m)} m={m} />))}
          </div>
        ) : show === "time" ? (
          <TimeTable />
        ) : (
          <RateTables />
        )}
        {show === "rates" && form === "matrices" && <PrefillVaries />}
        {pooled && (
          <Note>
            Prefill and decode are total tokens over total time, so decode keeps any stuck time. Time to first token is the median turn. The matrices show
            each pairing&apos;s own rates.
          </Note>
        )}
      </div>
    </div>
  );
}
