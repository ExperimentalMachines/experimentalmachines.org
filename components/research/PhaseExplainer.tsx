// The prefill-and-decode explainer for the phone posts: the two phases of a reply, drawn, with one measured example
// passed in from the post's own data (a model on one processor: its reading and writing rates, the tokens a turn
// read and wrote, and the share of the time spent writing).

import { ChartCard } from "@/components/research/Compare";
import { from, to } from "@/components/research/KvFigures";

const ink = "#4a524c";

function Reading() {
  // A prompt's tokens all go in together: one bracket, one step.
  const n = 9;
  return (
    <svg viewBox="0 0 240 70" className="h-auto w-full max-w-[17rem]" role="img" aria-label="Many prompt tokens go through the model together in one step">
      {Array.from({ length: n }, (_, k) => (
        <rect key={k} x={8 + k * 25} y="10" width="20" height="20" rx="4" fill="color-mix(in srgb, #2b44e6 14%, white)" stroke={to} />
      ))}
      <path d={`M 8 40 v 6 h ${n * 25 - 5} v -6`} fill="none" stroke={to} strokeWidth="1.75" />
      <text x={8 + ((n * 25 - 5) / 2)} y="62" fontSize="11" textAnchor="middle" fill="#1c2ea8">
        one step, many tokens
      </text>
    </svg>
  );
}

function Writing() {
  // Reply tokens come one per step, each fed back in to make the next.
  const n = 5;
  return (
    <svg viewBox="0 0 240 70" className="h-auto w-full max-w-[17rem]" role="img" aria-label="Reply tokens come one per step, each fed back in for the next">
      {Array.from({ length: n }, (_, k) => {
        const x = 8 + k * 46;
        return (
          <g key={k}>
            <rect x={x} y="10" width="20" height="20" rx="4" fill="color-mix(in srgb, #2b44e6 14%, white)" stroke={to} />
            <path d={`M ${x} 40 v 6 h 20 v -6`} fill="none" stroke={to} strokeWidth="1.75" />
            <text x={x + 10} y="62" fontSize="11" textAnchor="middle" fill="#1c2ea8">
              {k + 1}
            </text>
            {k < n - 1 && <path d={`M ${x + 22} 20 h 20`} stroke={from} strokeWidth="1.5" markerEnd="url(#pe-arrow)" />}
          </g>
        );
      })}
      <defs>
        <marker id="pe-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill={from} />
        </marker>
      </defs>
      <text x="236" y="62" fontSize="11" textAnchor="end" fill={ink}>
        steps
      </text>
    </svg>
  );
}

export type PhaseExample = {
  where: string; // "Qwen3 0.6B on the Galaxy S24 Ultra's CPU"
  prefillTokS: number;
  decodeTokS: number;
  promptTokens: number; // per turn
  replyTokens: number; // per turn
  decodeShare: number; // of the turn's time
};

export function PhaseExplainer({ example, pairing }: { example: PhaseExample; pairing?: boolean }) {
  const e = example;
  const ratio = e.prefillTokS / e.decodeTokS;
  return (
    <ChartCard>
      <ul className="grid gap-3 md:grid-cols-2">
        <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">Prefill: reading the prompt</p>
          <div className="mt-3">
            <Reading />
          </div>
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            The prompt goes through the model a large batch of tokens at a time: a lot of arithmetic at once, the work GPUs and NPUs are built for. Whether they beat the CPU at it is what we measured.
          </p>
          <p className="mt-3 text-sm">
            <span className="display text-2xl tabular-nums">{Math.round(e.prefillTokS)}</span> tokens read a second
          </p>
        </li>
        <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">Decode: writing the reply</p>
          <div className="mt-3">
            <Writing />
          </div>
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            The reply comes one token per step, and each step reads all of the model&apos;s weights from memory for that one token. So memory speed, more than arithmetic, sets the pace.
          </p>
          <p className="mt-3 text-sm">
            <span className="display text-2xl tabular-nums">{Math.round(e.decodeTokS)}</span> tokens written a second
          </p>
        </li>
      </ul>
      <div className="mt-3 rounded-xl border border-rule bg-white px-4 py-4">
        <p className="text-sm">
          One turn: about {Math.round(e.promptTokens)} prompt tokens read, {Math.round(e.replyTokens)} reply tokens written
        </p>
        <div className="mt-3 flex h-7 w-full overflow-hidden rounded-md text-xs leading-7" aria-hidden>
          <span className="whitespace-nowrap px-2 text-white" style={{ width: `${100 * (1 - e.decodeShare)}%`, minWidth: "4.5rem", backgroundColor: from }}>
            reading {Math.round(100 * (1 - e.decodeShare))}%
          </span>
          <span className="whitespace-nowrap px-2 text-white" style={{ width: `${100 * e.decodeShare}%`, backgroundColor: to }}>
            writing {Math.round(100 * e.decodeShare)}% of the time
          </span>
        </div>
        <p className="mt-3 text-sm leading-5 text-ink-soft">
          {e.where}: reading ran {Math.round(ratio)}× faster per token than writing, so the reply took most of the turn.
        </p>
      </div>
      {pairing && (
        <div className="mt-3 rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-sm font-medium">A pairing</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md px-2 py-1" style={{ backgroundColor: "color-mix(in srgb, #2b44e6 12%, white)", color: "#1c2ea8" }}>
              NPU reads the prompt
            </span>
            <span className="text-ink-soft" aria-hidden>
              →
            </span>
            <span className="rounded-md border border-dashed border-rule px-2 py-1 text-ink-soft">handoff</span>
            <span className="text-ink-soft" aria-hidden>
              →
            </span>
            <span className="rounded-md px-2 py-1" style={{ backgroundColor: "#eef0f3", color: ink }}>
              CPU writes the reply
            </span>
          </div>
          <p className="mt-2 text-sm leading-5 text-ink-soft">
            Each phase can run on a different processor. We timed every pairing of CPU, GPU and NPU; switching between them costs a handoff.
          </p>
        </div>
      )}
    </ChartCard>
  );
}
