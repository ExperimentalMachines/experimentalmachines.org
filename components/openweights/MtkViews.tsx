// The MediaTek prefill/decode results, drawn the way the Snapdragon page draws its own
// (PairingViews.tsx): one matrix per model, shaded by total time, and the rates beside them. Every view
// reads the generated data (lib/prefill-decode-mtk-data.ts). There are no cool starts to set aside and
// no cells borrowed from another unit, so this is the simpler of the two.

import { Scroll, grouped, ordinal, slower, th, thNum } from "@/components/openweights/pd-parts";
import { mtkModels, processors, ranked, type MtkModel } from "@/lib/prefill-decode-mtk";

const key = (m: MtkModel) => `${m.name}${m.quant}`;

export const mtkLabel = (m: MtkModel) => (
  <>
    {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
  </>
);

function Grid({ m, device }: { m: MtkModel; device?: string }) {
  const r = ranked(m);
  const top = r[0].cell.seconds;
  const low = r.at(-1)!.cell.seconds;
  return (
    <div className="min-w-0">
      <h3 className="display text-xl">{mtkLabel(m)}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        {device ? `${device}, unit` : "Unit"} {m.unit}, {m.turns} turns{m.convs < 9 && ` from ${m.convs} of the 9 conversations`}
        {m.fits < 9 && `, the ${m.fits} pairings that fit`}
      </p>
      <Scroll label={`${m.name} ${m.quant}: total time for each pairing`}>
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
                        {m.fits === 4 ? "NPU refused to load" : "did not fit in memory"}
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
                      <span aria-hidden className={`absolute right-1.5 top-1 text-[0.72rem] leading-none ${fastest ? "text-white/70" : "text-ink-soft"}`}>
                        {c.order}
                      </span>
                      <span className="sr-only">, ran {ordinal(c.order)}</span>
                      <span className="block font-medium">{grouped(c.seconds)} s</span>
                      <span className={`block text-xs ${fastest ? "text-white/80" : "text-ink-soft"}`}>{fastest ? "fastest" : slower(c.seconds, top)}</span>
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

// The tablet's models by default; the S24's for the same-generation comparison.
// device names each model's device in its subtitle, when the grids mix two devices.
export function MtkMatrices({ models = mtkModels, device }: { models?: MtkModel[]; device?: (m: MtkModel) => string }) {
  return (
    <div>
      <p className="max-w-3xl text-sm leading-6 text-ink-soft">
        Total time for each model&apos;s turns, and how much longer than its fastest pairing, in bold blue. The small number is the order the pairings ran in.
      </p>
      <div className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
        {models.map((m) => (
          <Grid key={`${key(m)}${m.unit}`} m={m} device={device?.(m)} />
        ))}
      </div>
    </div>
  );
}

// Each processor's rate, pooled over the pairings it ran in: prompt tokens over prompt time for
// prefill, reply tokens over decode time for decode.
export function MtkRates({ models = mtkModels }: { models?: MtkModel[] }) {
  const cols: { title: string; vals: (m: MtkModel) => (number | null)[]; d: number }[] = [
    { title: "Prefill, tokens per second", vals: (m) => m.prefill.map((p) => p?.tokS ?? null), d: 0 },
    { title: "Decode, tokens per second", vals: (m) => m.decode.map((p) => p?.tokS ?? null), d: 1 },
  ];
  return (
    <Scroll label="Each processor's prefill and decode rate, model by model">
      <table className="w-full min-w-[40rem] text-sm tabular-nums">
        <thead>
          <tr className="align-bottom">
            <th className={th} rowSpan={2}>
              Model
            </th>
            {cols.map((c) => (
              <th key={c.title} className={`${th} text-center`} colSpan={3}>
                {c.title}
              </th>
            ))}
          </tr>
          <tr>
            {cols.flatMap((c) =>
              processors.map((p) => (
                <th key={`${c.title}${p}`} className={thNum}>
                  {p}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={key(m)} className="border-t border-rule">
              <th scope="row" className="py-3 pr-4 text-left font-medium">
                {mtkLabel(m)}
              </th>
              {cols.flatMap((c) => {
                const v = c.vals(m);
                const hi = Math.max(...v.filter((x) => x !== null));
                return v.map((x, i) => (
                  <td key={`${c.title}${i}`} className={`py-3 pr-4 text-right ${x === hi ? "font-medium text-blue-deep" : ""}`}>
                    {x === null ? "did not load" : grouped(x, c.d)}
                  </td>
                ));
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
