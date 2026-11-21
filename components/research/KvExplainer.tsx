// The KV-cache post's explainer: what the cache holds, how big it gets, and why its size sets the speed, drawn and
// worked through for one model the post measured. The numbers are Llama 3.2 1B's shape (its config.json: 16 layers,
// 8 key-value heads, 64 numbers per head) and ExecuTorch 1.5.1's caches: 32-bit by default, 16-bit in the GPU's
// 16-bit mode, and the 8-bit cache, which keeps one byte per number plus a 32-bit scale and an 8-bit zero point for
// each token, head and layer, for keys and values alike (examples/models/llama/source_transformation/custom_kv_cache.py).

import { ChartCard } from "@/components/research/Compare";
import { to } from "@/components/research/KvFigures";

const LAYERS = 16;
const HEADS = 8;
const DIM = 64;
// Numbers kept per token: a key and a value for every layer and head.
const PER_TOKEN = 2 * LAYERS * HEADS * DIM;
const BYTES = {
  "32-bit": PER_TOKEN * 4,
  "16-bit": PER_TOKEN * 2,
  "8-bit": PER_TOKEN + 2 * LAYERS * HEADS * (4 + 1),
} as const;
type Kind = keyof typeof BYTES;
const MiB = 1024 * 1024;
const mb = (b: number) => `${Math.round(b / MiB).toLocaleString("en-US")} MB`;
const gbs = (b: number) => `${(b / 1024 / MiB).toFixed(b < 1024 * MiB ? 2 : 1)} GB`;
const grey = "#c3c8d0";

// The cache as a staircase of steps, from an empty cache: the first step reads only the start-of-text token and
// writes the first word. Each row is one step of writing: the words so far, each in its own column all
// the way down, and the word that step writes, outlined, in the next column. The word written in one row sits
// directly above itself in the next row, where its key and value have just been added to the cache (dark); every
// earlier word is read back from the cache (light). Each row is one word longer than the last.
const light = "color-mix(in srgb, #2b44e6 18%, white)";

function CacheMatrix() {
  const words = ["start", "The", "cat", "sat", "on", "the"];
  const steps = words.length - 1;
  return (
    <div className="space-y-3">
      <div className="grid items-center gap-1" style={{ gridTemplateColumns: `2.5rem repeat(${words.length}, minmax(0, 1fr))` }}>
        {Array.from({ length: steps }, (_, r) => (
          <div key={r} className="contents">
            <span className="text-[11px] leading-4 text-ink-soft">step {r + 1}</span>
            {words.map((w, c) => {
              const style =
                c < r
                  ? { backgroundColor: light, color: "#1c2ea8" }
                  : c === r
                    ? { backgroundColor: to, color: "white" }
                    : c === r + 1
                      ? { boxShadow: `inset 0 0 0 1.5px ${to}`, color: "#1c2ea8", backgroundColor: "white" }
                      : undefined;
              return (
                <span key={c} className={`flex h-8 items-center justify-center rounded ${c === 0 ? "text-[10px] italic" : "text-xs"}`} style={style}>
                  {c <= r + 1 ? w : ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// A multiplication drawn out: each factor large, what it counts in small type underneath.
function Factors({ items }: { items: { n: string; what: string; op?: string; on?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-start gap-x-1.5 gap-y-2">
      {items.map((f, k) => (
        <div key={k} className="flex items-start gap-1.5">
          {f.op && <span className="pt-0.5 text-base leading-6 text-ink-soft">{f.op}</span>}
          <span className="flex flex-col items-center">
            <span
              className="rounded px-1.5 text-base leading-6 tabular-nums"
              style={f.on ? { backgroundColor: "color-mix(in srgb, #2b44e6 12%, white)", color: "#1c2ea8" } : undefined}
            >
              {f.n}
            </span>
            <span className="max-w-[4.5rem] text-center text-[10px] leading-3 text-ink-soft">{f.what}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Meter({ rows, max }: { rows: { label: string; value: number; shown: string; on?: boolean }[]; max: number }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2">
          <span className={`text-xs leading-4 ${r.on ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.label}</span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-3.5 shrink-0 rounded-r-[4px]" style={{ width: `calc((100% - 4.5rem) * ${r.value / max})`, minWidth: "3px", backgroundColor: r.on ? to : grey }} />
            <span className={`whitespace-nowrap text-xs tabular-nums ${r.on ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.shown}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function KvExplainer() {
  const win = 32768;
  const sizes = (["32-bit", "16-bit", "8-bit"] as Kind[]).map((k) => ({ k, b: BYTES[k] * win }));
  const depths = [1900, 7900, 32500];
  return (
    <ChartCard>
      <ul className="grid gap-3 lg:grid-cols-3">
        <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">What the cache keeps</p>
          <div className="mt-3">
            <CacheMatrix />
          </div>
          <p className="mt-3 text-sm leading-5">In each step:</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-5 text-ink-soft">
            <li className="flex gap-2">
              <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: to }} />
              <span>
                The newest token goes in. Its key and value are worked out and <b className="font-medium text-ink">written</b> to the cache.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: light }} />
              <span>
                The whole cache is <b className="font-medium text-ink">read</b>: every token before it, and the newest too.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm" style={{ boxShadow: `inset 0 0 0 1.5px ${to}` }} />
              <span>Out comes the next token, the newest in the step below.</span>
            </li>
          </ul>
          <p className="mt-2 text-sm leading-5 text-ink-soft">
            The cache grows by one token a step, and every step reads all of it. In a chat, the whole prompt takes the start token&apos;s place, read in at
            once.
          </p>
        </li>
        <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">How big it gets</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">Llama 3.2 1B, a 32k window</p>
          <p className="mt-3 text-xs leading-5 text-ink-soft">Numbers kept for each token:</p>
          <div className="mt-1">
            <Factors
              items={[
                { n: "2", what: "a key and a value" },
                { op: "×", n: String(LAYERS), what: "layers" },
                { op: "×", n: String(HEADS), what: "heads in each layer" },
                { op: "×", n: String(DIM), what: "numbers in each key or value" },
                { op: "=", n: PER_TOKEN.toLocaleString("en-US"), what: "numbers per token", on: true },
              ]}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-soft">For the whole window, in 32 bits:</p>
          <div className="mt-1">
            <Factors
              items={[
                { n: PER_TOKEN.toLocaleString("en-US"), what: "numbers per token" },
                { op: "×", n: "4", what: "bytes each (32-bit)" },
                { op: "×", n: win.toLocaleString("en-US"), what: "tokens (32k)" },
                { op: "=", n: gbs(BYTES["32-bit"] * win), what: "reserved at load", on: true },
              ]}
            />
          </div>
          <div className="mt-4">
            <Meter max={sizes[0].b} rows={sizes.map(({ k, b }) => ({ label: k === "32-bit" ? "32-bit" : k === "16-bit" ? "16-bit (GPU)" : "8-bit (CPU)", value: b, shown: gbs(b), on: k === "8-bit" }))} />
          </div>
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            16 bits halves it. 8 bits is one byte a number, plus a scale and an offset per head, about{" "}
            {Math.round((100 * (BYTES["8-bit"] - PER_TOKEN)) / PER_TOKEN)}% extra. Here 1 GB is 1,024 MB.
          </p>
        </li>
        <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">Why it sets the speed</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">Cache read to write one token, Llama 3.2 1B</p>
          <div className="mt-3 space-y-3">
            {depths.map((d) => (
              <div key={d}>
                <p className="text-xs leading-5">{d.toLocaleString("en-US")} tokens in</p>
                <Meter
                  max={BYTES["32-bit"] * depths.at(-1)!}
                  rows={(["32-bit", "8-bit"] as Kind[]).map((k) => ({ label: k, value: BYTES[k] * d, shown: d * BYTES[k] < 1024 * MiB ? mb(d * BYTES[k]) : gbs(d * BYTES[k]), on: k === "8-bit" }))}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            Every new token reads the whole cache so far. The deeper the conversation, the more it reads, and the more a smaller cache saves.
          </p>
        </li>
      </ul>
    </ChartCard>
  );
}
