import { qualityGate, startup, sustained } from "@/lib/neuron";

// Three small panels: what compilation cost, whether the fine-tune learned,
// and whether the server held its throughput.
const MAX = 3100;

export default function FactsStrip() {
  return (
    <div className="grid gap-10 border-t border-rule pt-8 sm:grid-cols-3">
      <div>
        <h3 className="display text-lg">Boot time to first token, inf2</h3>
        <div className="mt-4 space-y-4 text-sm">
          {startup.map((s) => (
            <div key={s.label} className="group">
              <div className="text-ink-soft">{s.label}</div>
              <div className="relative mt-1 h-5 bg-plate">
                <span
                  role="img"
                  aria-label={`${s.label}: ${s.seconds.toLocaleString()} seconds, ${s.note}`}
                  className="absolute left-0 top-0 h-full rounded-r bg-ink group-hover:bg-ink-soft"
                  style={{ width: `${(s.seconds / MAX) * 100}%` }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-2 text-xs font-semibold tabular-nums" style={{ left: `${(s.seconds / MAX) * 100}%` }}>
                  {s.seconds.toLocaleString()} s
                </span>
                <span className="pointer-events-none absolute right-0 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md border border-rule bg-white px-2 py-1 text-xs shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                  {(s.seconds / 60).toFixed(1)} min, {s.note}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-soft">Every graph is compiled ahead of time. Same graphs, new weights: nothing recompiled.</p>
      </div>
      <div>
        <h3 className="display text-lg">Held-out loss after the fine-tune</h3>
        <table className="mt-4 w-full border-collapse text-sm">
          <tbody>
            {qualityGate.map((q) => (
              <tr key={q.chip} className="group border-b border-rule">
                <td className="py-2 pr-4">{q.chip}</td>
                <td className="py-2 text-right tabular-nums">
                  <span className="text-ink-soft">{q.from.toFixed(3)}</span> to <span className="font-semibold">{q.to.toFixed(3)}</span>
                  <span className="ml-2 hidden text-xs text-ink-soft group-hover:inline">({(q.to - q.from).toFixed(3)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-5 text-ink-soft">Byte-identical held-out rows on both chips. Starting losses agree to three decimals, which is what makes the two runs comparable.</p>
      </div>
      <div>
        <h3 className="display text-lg">30 minutes of sustained load, inf2</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-ink-soft">Retention vs first iteration</dt>
          <dd className="text-right font-semibold tabular-nums">{sustained.retention}%</dd>
          <dt className="text-ink-soft">Throughput, first to last</dt>
          <dd className="text-right tabular-nums">
            {sustained.first} to {sustained.last} tok/s
          </dd>
          <dt className="text-ink-soft">First-token p99 spread</dt>
          <dd className="text-right tabular-nums">{sustained.ttftSpread}%</dd>
        </dl>
        <p className="mt-3 text-xs leading-5 text-ink-soft">Concurrency 8, seven iterations. No thermal or stability droop at this load.</p>
      </div>
    </div>
  );
}
