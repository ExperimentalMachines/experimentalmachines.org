import { ladder, objectives, trainingCost } from "@/lib/neuron";

// Left: steady-state tokens per second for the same LoRA fine-tune at three
// sequence lengths, one Trainium1 bar and one Trainium2 bar per length,
// MFU on hover. Right: what each training objective did on Trainium1.
const MAX = 9000;

// `last` anchors the hover readout to the bar's right edge, so it stays on a phone's screen.
function Bar({ chip, tok, mfu, seq, blue, last }: { chip: string; tok: number | null; mfu: number | null; seq: number; blue?: boolean; last?: boolean }) {
  if (tok === null) {
    return (
      <div className="group relative flex h-full w-11 flex-col justify-end sm:w-14">
        <div className="flex h-10 items-center justify-center rounded border border-dashed border-rule text-center text-[11px] leading-3 text-ink-soft" role="img" aria-label={`${chip}, sequence ${seq}: does not fit in device memory`}>
          does not fit
        </div>
      </div>
    );
  }
  const h = (tok / MAX) * 100;
  return (
    <div className="group relative flex h-full w-11 flex-col justify-end sm:w-14">
      <div className={`mb-1 text-center text-xs font-semibold tabular-nums ${blue ? "text-blue" : "text-ink"}`}>{tok.toLocaleString()}</div>
      <div
        role="img"
        aria-label={`${chip}, sequence ${seq}: ${tok.toLocaleString()} tokens per second, ${mfu}% MFU`}
        className={`w-full rounded-t ${blue ? "bg-blue group-hover:bg-blue-deep" : "bg-ink group-hover:bg-ink-soft"}`}
        style={{ height: `${h}%` }}
      />
      <span
        className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md border border-rule bg-white px-2 py-1 text-xs shadow-sm group-hover:block ${
          last ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
      >
        <span className="font-semibold">{chip}</span>, seq {seq.toLocaleString()}: {tok.toLocaleString()} tok/s, {mfu}% MFU
      </span>
    </div>
  );
}

export default function TrainingFigure() {
  return (
    <figure>
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-14">
        <div>
          <div className="flex items-center gap-5 text-xs text-ink-soft">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-ink" aria-hidden /> Trainium1, $1.34/hr
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-blue" aria-hidden /> Trainium2, $2.24/hr
            </span>
          </div>
          <div className="mt-4 flex h-56 items-end justify-between border-b border-rule bg-plate px-4 pt-8">
            {ladder.map((row, i) => (
              <div key={row.seq} className="flex h-full items-end gap-1.5">
                <Bar chip="Trainium1" tok={row.trn1?.tok ?? null} mfu={row.trn1?.mfu ?? null} seq={row.seq} last={i === ladder.length - 1} />
                <Bar chip="Trainium2" tok={row.trn2.tok} mfu={row.trn2.mfu} seq={row.seq} blue last={i === ladder.length - 1} />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-4 pt-2 text-xs text-ink-soft">
            {ladder.map((row) => (
              <span key={row.seq} className="w-[5.9rem] text-center sm:w-[7.4rem]">
                seq {row.seq.toLocaleString()}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-soft">Steady-state tok/s. Hover a bar for MFU.</p>
        </div>
        <table className="w-full border-collapse self-start text-sm">
          <thead className="text-left text-ink-soft">
            <tr className="border-b border-rule">
              <th className="py-2 pr-4 font-normal">Objective, one Trainium1</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 font-normal">Measured</th>
            </tr>
          </thead>
          <tbody>
            {objectives.map((o) => (
              <tr key={o.stage} className="border-b border-rule align-top">
                <td className="py-2.5 pr-4">
                  {o.stage}
                  <div className="text-xs text-ink-soft">{o.model}</div>
                </td>
                <td className={`py-2.5 pr-4 ${o.status === "works" ? "font-medium" : "text-ink-soft"}`}>{o.status}</td>
                <td className="py-2.5 text-ink-soft">{o.number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-6 text-sm text-ink-soft">
        Llama 3.1 8B Instruct, LoRA r16, bf16, micro-batch 1, Trainium1 at TP=2 and Trainium2 at TP=4, the working default of each chip. At sequence 2048 the Trainium2 is 1.2x faster and runs at 26.5% MFU: the step is too small to fill a chip with 3.2x the peak. At 4096 it is 2x faster, and 8192 fits only on the Trainium2. Two physical Trainium2 chips ran the study and differed by 2.4%, the same as the seed-to-seed noise floor, so the final loss was bit-identical across chips (1.1489). The Trainium1 fine-tune cost ${trainingCost.trn1.seq2048} per 1M training tokens at 2048 and ${trainingCost.trn1.seq4096} at 4096. The GPU study trained the full 8B in BF16, a different quantity, so no GPU training number is placed beside these.
      </figcaption>
    </figure>
  );
}
