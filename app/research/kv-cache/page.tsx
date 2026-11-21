import { KvExplainer } from "@/components/research/KvExplainer";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { Bars, LoadRows, Shift, Tally, VerdictGrid } from "@/components/research/KvFigures";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import {
  breakdown,
  cpu7900Span,
  cpuChangeSpan,
  cpuDirect,
  cpuDirectSpan,
  cpuDirectWorst,
  cpuMemory,
  cpuMemorySaved,
  cpuNeedles,
  cpuQuality,
  cpuSpeed,
  depthLabel,
  depthSeries,
  DEPTHS,
  MODELS,
  gb,
  gbLess,
  gbShown,
  prefillRate,
  crossPhone,
  gpuDirectSpan,
  gpuFiles,
  gpuSavedSpan,
  gpuSpeedSpan,
  kv,
  kvLinks,
  pct,
  qwenSpeed32500,
  repeatPairs,
  times,
} from "@/lib/kv-cache";

const href = "/research/kv-cache/";

export const metadata = postMetadata(href);

const tok = (x: number) => (x < 10 ? x.toFixed(1) : x.toFixed(0));
const signed = (x: number, d = 3) => (x > 0 ? `+${x.toFixed(d)}` : x < 0 ? `−${(-x).toFixed(d)}` : (0).toFixed(d));
const range = ([a, b]: readonly [number, number], f: (x: number) => string) => `${f(a)} to ${f(b)}`;
const gbN = (mib: number) => gb(mib).toFixed(1);
const gb2 = (mib: number) => gb(mib).toFixed(2);
const phoneName = (p: string | null) => (p === "2" ? "second" : p === "3" ? "third" : "first");

const [first, repeat] = repeatPairs;

// How much faster the second phone ran a model's 2k files, both caches, as "7 to 8%".
const phoneSpan = (model: string) => {
  const xs = crossPhone.filter((c) => c.model === model && c.window === "2k").map((c) => Math.round(100 * c.change));
  return `${Math.min(...xs)} to ${Math.max(...xs)}%`;
};

const findings = [
  {
    headline: "On the CPU, an 8-bit cache makes long chats much faster",
    line: `${range(cpu7900Span, (x) => times(x))} faster 7.9k tokens into a chat, and up to ${gbShown(cpuMemorySaved)} less memory.`,
  },
  {
    headline: "It nudges the answers, not consistently for the worse",
    line: "About 1 in 10 next-token picks change, but quality and recall moved in no consistent direction.",
  },
  {
    headline: "The GPU cannot use 8 bits; its 16-bit mode is faster and smaller",
    line: `${range(gpuSpeedSpan, (x) => times(x))} faster and ${range(gpuSavedSpan, (x) => gbN(x))} GB smaller.`,
  },
  {
    headline: "But 16-bit broke Llama deep into a long text",
    line: `At 32.5k tokens it answered ${breakdown.needles.b} of ${breakdown.needles.of} recall questions, against ${breakdown.needles.a} of ${breakdown.needles.of} with 32-bit.`,
  },
  {
    headline: "Published GPU files above 8k do not load on this phone",
    line: "Llama's 16k and 32k files abort while loading; a smaller prompt chunk fixed the 32k one.",
  },
  {
    headline: "What we would ship",
    line: "The 8-bit cache in CPU files at 8k and 32k, after a check in the app. GPU files stay 32-bit.",
  },
];

export default function KvCache() {
  return (
    <Post
      href={href}
      related={["/research/window/", "/research/prefill-decode/", "/research/decode-stall/"]}
      sources={[
        { label: "ExecuTorch's 8-bit cache", href: kvLinks.int8Cache },
        { label: "Vulkan attention (SDPA.cpp)", href: kvLinks.sdpa },
        { label: "Vulkan softmax shader", href: kvLinks.softmax },
        { label: "The published GPU files", href: kvLinks.hub },
        { label: "PG-19 books", href: kvLinks.pg19 },
        { label: "RULER needles", href: kvLinks.ruler },
      ]}
      sourcesNote={
        <>
          The ExecuTorch links point at v1.5.1, the version the app ships. The files were built with{" "}
          <Go href="/executorch/" className={link}>
            ExecuPack
          </Go>
          &apos;s recipe. The phones&apos; raw results and the script that turns them into this page are not yet published.
        </>
      }
    >
      <Section id="cache" title="What the KV cache is">
        <Figure id="explainer" title="The cache in three pictures" lede="A model's running memory of the conversation, and the reason its size matters on a phone.">
          <KvExplainer />
        </Figure>
      </Section>

      <Section id="findings" title="What we found">
        <Findings items={findings} />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="cpu-speed"
          title="On the CPU, the deeper the chat, the more the 8-bit cache gains"
          lede="How many times faster each model writes its reply with the 8-bit cache than with the 32-bit one, at three points in a long text. Every token written reads the whole cache, so a cache a quarter the size pays off more as the text grows."
          note={`Each model's 32k file on the first phone: the median time per token over 127 single-token steps at each point, three books for LFM2.5 and Gemma, one for Llama and Qwen. All bars share one scale up to 4×; Qwen3's ${times(qwenSpeed32500.b / qwenSpeed32500.a)} at 32.5k runs off it, marked by the break. Its 32-bit file wrote ${qwenSpeed32500.a.toFixed(1)} tokens a second at 32.5k against ${qwenSpeed32500.b.toFixed(1)} with 8 bits: it held ${gbShown(cpuMemory("32k").find((m) => m.model === "Qwen3 1.7B")!.peakA)}, and memory pressure is the likely cause. At 1.9k, LFM2.5's 32k file gained nothing: only 6 of its 16 layers keep a cache.`}
        >
          <Bars
            max={4}
            groups={cpuSpeed.map((r) => ({
              label: r.model,
              rows: r.cells.map((c) => {
                const x = c.b / c.a;
                return {
                  label: `${depthLabel(c.depth)} in`,
                  value: x,
                  shown: times(x),
                  detail: `${tok(c.a)} → ${tok(c.b)} tok/s`,
                  tone: x < 1.1 ? ("neutral" as const) : ("good" as const),
                };
              }),
            }))}
          />
        </Figure>

        <Figure
          id="cpu-memory"
          title="And needs far less memory"
          lede="Peak memory of the test process with each model's 32k file. The cache is reserved in full when the model loads, so the saving is there from the first token."
          note="The 8-bit cache stores one byte per number plus a scale and offset for each token and head, about 27% of the 32-bit cache's size. At 2k the cache is small and so is the saving."
        >
          <Shift
            a="32-bit cache"
            b="8-bit cache"
            max={10}
            ticks={[0, 2, 4, 6, 8, 10]}
            unit="GB"
            rows={cpuMemory("32k").map((m) => ({
              label: m.model,
              a: gb(m.peakA),
              b: gb(m.peakB),
              change: `−${gbLess(m.peakA, m.peakB)} GB`,
              values: `${gbN(m.peakA)} → ${gbN(m.peakB)} GB`,
            }))}
          />
        </Figure>

        <Figure
          id="cpu-differs"
          title="The 8-bit cache changes some predictions"
          lede="How often the 8-bit file's likeliest next token differs from the 32-bit file's, reading the same book with the same true text fed in at every step."
          note={`Second phone, each model's 8k file, 384 positions per point (128 in each of three books). Measured as a divergence (KL, 0 for identical predictions), the two files differ by ${range(cpuDirectSpan, (x) => x.toFixed(3))} on average, and by up to ${cpuDirectWorst.toFixed(2)} at a single position.`}
        >
          <Bars
            caption="Share of positions where the two files' likeliest next token differs; bars run from 0 to 20%"
            max={20}
            groups={cpuDirect.map((r) => ({
              label: r.model,
              rows: r.cells.map((c, i) => {
                const share = c.top.differ / c.top.of;
                return {
                  label: `${i ? "7.9k" : "1.9k"} in`,
                  value: 100 * share,
                  shown: pct(share, 1),
                  detail: `about 1 in ${Math.round(1 / share)}, ${c.top.differ} of ${c.top.of} positions`,
                  tone: "mark" as const,
                };
              }),
            }))}
          />
        </Figure>

        <Figure
          id="cpu-drift"
          title="Against the original model, mostly no clear change"
          lede="Did the 8-bit file's predictions end up closer to the original, unquantized model's than the 32-bit file's did, or further from them? One cell per model and point in the text."
          note={`“No clear change” means the change is within the run-to-run noise (its 95% interval includes zero). The percentage is the change as a share of how far the 32-bit file already was from the original: both files sit 0.16 to 0.33 away from it (KL), mostly because of the 4-bit weights, and the cache moved that by ${signed(cpuChangeSpan[0])} to ${signed(cpuChangeSpan[1])}. The 32.5k cells for Llama and Qwen are one book each. On the 141 short chat questions from the app, the 8-bit cache moved first answers closer to the original for Llama, LFM2.5 and Qwen3, and too little to tell for Gemma.`}
        >
          <VerdictGrid
            columns={DEPTHS.map((d) => `${depthLabel(d)} tokens in`)}
            rows={MODELS.map((model) => ({
              label: model,
              cells: cpuQuality
                .filter((q) => q.model === model)
                .map((q) => {
                  const clear = q.low > 0 || q.high < 0;
                  return { kind: clear ? (q.change < 0 ? "closer" : "further") : "none", value: (100 * q.change) / q.klA } as const;
                }),
            }))}
          />
        </Figure>

        <Figure
          id="cpu-recall"
          title="The cache changed few recall answers"
          lede="Facts hidden in each long text (a “special magic number”), asked about at each checkpoint: how many each cache answered."
          note={`Per model, 12 questions at 2k, 21 at 8k, and 9 or 27 at 32k (one book or three). LFM2.5's answers come from the second phone, from a fresh model: on the first phone they were asked after a rewind that does not restore its state. The original 32-bit model answered ${cpuNeedles.map((n) => `${n.hf} (${n.model.split(" ")[0]})`).join(", ")}.`}
        >
          <Tally
            caption="Answered with the 32-bit cache → with the 8-bit cache"
            items={cpuNeedles.map((n) => {
              const [a, b] = [n.both + n.onlyA, n.both + n.onlyB];
              return {
                label: n.model,
                detail: `${n.of} questions`,
                change: b === a ? "same" : `${b > a ? "+" : "−"}${Math.abs(b - a)} answer${Math.abs(b - a) > 1 ? "s" : ""}`,
                values: `${a} → ${b} of ${n.of}`,
                tone: Math.abs(b - a) <= 1 ? ("neutral" as const) : b > a ? ("good" as const) : ("bad" as const),
              };
            })}
          />
        </Figure>

        <Figure
          id="gpu"
          title="On the GPU, 16-bit is faster and smaller"
          lede="ExecuTorch 1.5.1 cannot build the 8-bit cache for the GPU, so the GPU comparison is its 16-bit mode, which also computes in 16 bits, against 32-bit. Writing speed 1.9k tokens in, before the GPU throttles, and the GPU memory each file needs."
          note={`Second phone for the 2k and 8k files of Llama and the 2k of Qwen, third phone for the rest; both files of a pair on one phone. Up to 7.9k tokens the two files' predictions differ by ${range(gpuDirectSpan, (x) => x.toFixed(4))} (KL), below the CPU's 8-bit cache everywhere. Llama's 8k file drifted slightly further from the original in all three books (+0.012); Qwen's did not. Gemma 3 and LFM2.5 do not run on the GPU in this recipe.`}
        >
          <div className="space-y-4">
            <p className="text-sm font-medium">Writing speed</p>
            <Shift
              a="32-bit"
              b="16-bit"
              max={80}
              ticks={[0, 20, 40, 60, 80]}
              unit="tok/s"
              rows={gpuFiles.map((f) => ({
                label: f.label,
                detail: `${phoneName(f.phone)} phone`,
                a: f.at1900.a,
                b: f.at1900.b,
                change: times(f.at1900.b / f.at1900.a),
                values: `${tok(f.at1900.a)} → ${tok(f.at1900.b)} tok/s`,
              }))}
            />
            <p className="pt-2 text-sm font-medium">GPU memory</p>
            <Shift
              a="32-bit"
              b="16-bit"
              max={7}
              ticks={[0, 2, 4, 6]}
              unit="GB"
              rows={gpuFiles.map((f) => ({
                label: f.label,
                a: gb(f.memory.gpuA!),
                b: gb(f.memory.gpuB!),
                change: `−${gbLess(f.memory.gpuA!, f.memory.gpuB!)} GB`,
                values: `${gbN(f.memory.gpuA!)} → ${gbN(f.memory.gpuB!)} GB`,
              }))}
            />
          </div>
        </Figure>

        <Figure
          id="gpu-long"
          title="Deep into a long text, Llama's 16-bit file failed"
          lede="Llama 3.2 1B's 32k files on the GPU, reading one book: how often each file's likeliest next token matched the original model's, at three points in the text, and how many recall questions it answered at the end."
          note={
            <>
              At 32.5k the 16-bit file was worse at {breakdown.higher} of {breakdown.positions} positions, and its recall answers repeated the question back. A second run gave
              identical values. The CPU files on the same book matched the original {pct(depthSeries[2].top1[2])} (32-bit) and {pct(depthSeries[3].top1[2])} (8-bit) of the
              time at 32.5k. Where between 7.9k and 32.5k the failure begins was not measured, and the cause was not isolated. A candidate is in ExecuTorch&apos;s{" "}
              <Go href={kvLinks.softmax} className={link}>
                GPU attention
              </Go>
              , which adds up one term per earlier token, in 16 bits for buffer-stored 16-bit tensors, so rounding error can grow with the length of the text.
            </>
          }
        >
          <Shift
            a="32-bit"
            b="16-bit"
            max={100}
            ticks={[0, 25, 50, 75, 100]}
            unit="%"
            rows={[
              ...DEPTHS.map((d, i) => {
                const [a, b] = [100 * depthSeries[0].top1[i], 100 * depthSeries[1].top1[i]];
                return {
                  label: `${depthLabel(d)} tokens in`,
                  detail: "likeliest token matches the original",
                  a,
                  b,
                  change: `${b - a >= 0 ? "+" : "−"}${Math.abs(b - a).toFixed(0)} point${Math.abs(b - a).toFixed(0) === "1" ? "" : "s"}`,
                  values: `${a.toFixed(0)}% → ${b.toFixed(0)}%`,
                  tone: b - a < -5 ? ("bad" as const) : ("neutral" as const),
                };
              }),
              {
                label: "Recall at 32.5k",
                detail: `questions answered, of ${breakdown.needles.of}`,
                a: (100 * breakdown.needles.a) / breakdown.needles.of,
                b: (100 * breakdown.needles.b) / breakdown.needles.of,
                change: `−${breakdown.needles.a - breakdown.needles.b} answers`,
                values: `${breakdown.needles.a} → ${breakdown.needles.b} of ${breakdown.needles.of}`,
                tone: "bad" as const,
              },
            ]}
          />
        </Figure>

        <Figure
          id="heat"
          title="How warm the GPU starts changes the comparison"
          lede="How fast each file read the whole 32.5k-token book, the same two files run twice: first with the 16-bit file starting 18 °C warmer, then in reverse order with both starting at about the same temperature."
          note={`The GPU throttles within 10 to 20 seconds of work when it starts near 50 °C, and within one to two minutes from 30 to 40 °C. Starting ${(repeat.a.startC - first.a.startC).toFixed(0)} °C warmer, the 32-bit file read ${pct(1 - prefillRate(repeat.a) / prefillRate(first.a))} slower; starting ${(first.b.startC - repeat.b.startC).toFixed(0)} °C cooler, the 16-bit file read ${pct(prefillRate(repeat.b) / prefillRate(first.b) - 1)} faster. Writing speed at 1.9k and 7.9k tokens, reached before throttling, did not change, and the predictions were identical.`}
        >
          <Shift
            a="32-bit"
            b="16-bit"
            max={300}
            ticks={[0, 100, 200, 300]}
            unit="tok/s"
            rows={[
              { pair: first, label: "First run", detail: `32-bit started at ${Math.round(first.a.startC)} °C, 16-bit at ${Math.round(first.b.startC)} °C` },
              { pair: repeat, label: "Repeat, reverse order", detail: `both started at ${Math.round(repeat.b.startC)} to ${Math.round(repeat.a.startC)} °C` },
            ].map(({ pair, label, detail }) => ({
              label,
              detail,
              a: prefillRate(pair.a),
              b: prefillRate(pair.b),
              change: `${(prefillRate(pair.b) / prefillRate(pair.a)).toFixed(2)}×`,
              values: `${prefillRate(pair.a).toFixed(0)} → ${prefillRate(pair.b).toFixed(0)} tok/s`,
            }))}
          />
        </Figure>

        <Figure
          id="published"
          title="Published GPU files above 8k do not load on this phone"
          lede="Each Llama 3.2 1B GPU file tried, with the working memory its attention code asks for: two buffers of heads × prompt chunk × window. The two that aborted ask for twice as much as any file that loaded."
          note="That pattern makes the buffers the leading suspect, but it is not established: the abort came about 10 milliseconds after the GPU was set up, before the weights could have been uploaded, and the error's own message was lost. Vulkan may also cap such buffers, so the sizes are what the code asks for, not what was allocated. Each published file was tried once, through the same library the app uses; the published 8k file, other models' files and the app's own runner were not tested."
        >
          <LoadRows
            unit="GB"
            max={18}
            rows={[
              { label: "8k window", detail: "study build, 2,048-token chunk", chunk: 2048, window: 8192, loads: true, note: "second phone" },
              { label: "16k window", detail: "published, 2,048-token chunk", chunk: 2048, window: 16384, loads: false },
              { label: "32k window", detail: "published, 2,048-token chunk", chunk: 2048, window: 32768, loads: false, note: "the study's own build with this chunk aborted too" },
              { label: "32k window", detail: "study build, 256-token chunk", chunk: 256, window: 32768, loads: true, note: "and its 32-bit predictions at 32.5k were in line with the CPU's" },
            ].map(({ chunk, window, ...r }) => {
              const bytes = 2 * 32 * chunk * window * 4;
              return { ...r, value: bytes / 1e9, shown: (bytes / 1e9).toFixed(1) };
            })}
          />
        </Figure>

        <Figure id="numbers" title="Every number" lede="Each table folds open. tok/s is tokens a second; KL is the divergence from the original model, 0 for identical predictions.">
          <div className="grid gap-4">
            <More title="CPU: writing speed" summary="Every file, 32-bit against 8-bit cache, first phone">
              <Table
                label="CPU writing speed"
                head={["Model", "Window", "Depth", "32-bit tok/s", "8-bit tok/s", "Faster"]}
                right={[2, 3, 4, 5]}
                rows={kv.cpu.speed.flatMap((r) => r.decode.map((d) => [r.model, r.window, depthLabel(d.depth), tok(d.a), tok(d.b), times(d.b / d.a)]))}
              />
            </More>
            <More title="CPU: memory" summary="Resident memory after load and at its peak, in GB">
              <Table
                label="CPU memory"
                head={["Model", "Window", "After load, 32 → 8-bit", "Peak, 32 → 8-bit", "Saved"]}
                right={[2, 3, 4]}
                rows={kv.cpu.memory.map((m) => [m.model, m.window, `${gb2(m.afterA)} → ${gb2(m.afterB)}`, `${gb2(m.peakA)} → ${gb2(m.peakB)}`, `${gb2(m.peakA - m.peakB)}`])}
              />
            </More>
            <More title="CPU: divergence and accuracy" summary="KL to the original model, perplexity and top-token agreement, every checkpoint">
              <Table
                label="CPU divergence"
                min="52rem"
                head={["Model", "Window", "Books", "Depth", "KL, 32 → 8-bit", "Change (95% interval)", "Perplexity, 32 / 8 / original", "Top token matches, 32 / 8"]}
                right={[2, 3]}
                rows={kv.cpu.quality.map((q) => [
                  q.model,
                  q.window,
                  q.books,
                  depthLabel(q.depth),
                  `${q.klA.toFixed(3)} → ${q.klB.toFixed(3)}`,
                  `${signed(q.change, 4)} (${signed(q.low, 4)}, ${signed(q.high, 4)})`,
                  `${q.pplA} / ${q.pplB} / ${q.pplHf}`,
                  `${pct(q.top1A)} / ${pct(q.top1B)}`,
                ])}
              />
            </More>
            <More title="CPU: 32-bit against 8-bit directly" summary="Second phone: divergence between the two files, and how often their likeliest token differs">
              <Table
                label="CPU direct comparison"
                head={["Model", "Window", "Depth", "KL between files, mean / worst", "Likeliest token differs"]}
                right={[2, 3, 4]}
                rows={kv.rerun.quality.map((q) => {
                  const t = kv.rerun.topDiffers.find((x) => x.model === q.model && x.window === q.window && x.depth === q.depth)!;
                  return [q.model, q.window, depthLabel(q.depth), `${q.direct!.toFixed(4)} / ${q.directMax!.toFixed(3)}`, `${t.differ} of ${t.of}`];
                })}
              />
            </More>
            <More title="CPU: short chat questions" summary="141 held-out questions from the app, first-token divergence, and 47 replies">
              <Table
                label="CPU chat questions"
                min="48rem"
                head={["Model", "First-token KL, 32 → 8-bit", "Change (95% interval)", "Rows worse / better by 0.1", "Reply KL, 32 → 8-bit"]}
                rows={kv.cpu.app.map((a) => [
                  a.model,
                  `${a.heldA.toFixed(3)} → ${a.heldB.toFixed(3)}`,
                  `${signed(a.heldChange)} (${signed(a.heldLow)}, ${signed(a.heldHigh)})`,
                  `${a.worse} / ${a.better}`,
                  `${a.replyA.toFixed(3)} → ${a.replyB.toFixed(3)}`,
                ])}
              />
            </More>
            <More title="GPU: speed, memory and thermal level" summary="Every file, 32-bit against 16-bit, with the phone and the estimated throttle level">
              <Table
                label="GPU speed"
                min="48rem"
                head={["Model", "Window", "Phone", "Depth", "32-bit tok/s", "16-bit tok/s", "Faster", "Throttle level, 32 | 16"]}
                right={[3, 4, 5, 6]}
                rows={kv.gpu.speed.flatMap((r) =>
                  r.decode.map((d) => [r.model, r.window, phoneName(r.phone), depthLabel(d.depth), tok(d.a), tok(d.b), times(d.b / d.a), `${d.levelA ?? "?"} | ${d.levelB ?? "?"}`]),
                )}
              />
              <Note>Throttle level 0 is the GPU uncapped at 1,450 MHz; 12 is capped at 636 MHz. Levels are estimated from samples every 2 to 5 seconds.</Note>
              <Table
                label="GPU memory"
                head={["Model", "Window", "Phone", "GPU memory, 32 → 16-bit", "Saved"]}
                right={[3, 4]}
                rows={kv.gpu.memory.map((m) => [m.model, m.window, phoneName(m.phone), `${gb2(m.gpuA!)} → ${gb2(m.gpuB!)} GB`, `${gb2(m.gpuA! - m.gpuB!)} GB`])}
              />
            </More>
            <More title="GPU: divergence, recall and chat questions" summary="KL to the original model and between the files, needles, and the app's questions">
              <Table
                label="GPU divergence"
                min="56rem"
                head={["Model", "Window", "Phone", "Books", "Depth", "KL, 32 → 16-bit", "Change (95% interval)", "KL between files, mean / worst", "Top token matches, 32 / 16"]}
                right={[3, 4]}
                rows={kv.gpu.quality.map((q) => [
                  q.model,
                  q.window,
                  phoneName(q.phone),
                  q.books,
                  depthLabel(q.depth),
                  `${q.klA.toFixed(3)} → ${q.klB.toFixed(3)}`,
                  `${signed(q.change, 4)} (${signed(q.low, 4)}, ${signed(q.high, 4)})`,
                  `${q.direct!.toFixed(4)} / ${q.directMax!.toFixed(3)}`,
                  `${pct(q.top1A)} / ${pct(q.top1B)}`,
                ])}
              />
              <Table
                label="GPU needles"
                head={["Model", "Window", "Asked", "32-bit found", "16-bit found", "Original model found"]}
                right={[2, 3, 4, 5]}
                rows={kv.gpu.needles.map((n) => [n.model, n.window, n.of, n.a, n.b, n.hf])}
              />
              <Table
                label="GPU chat questions"
                min="48rem"
                head={["Model", "Phone", "First-token KL, 32 → 16-bit", "Change (95% interval)", "Rows worse / better by 0.1", "Reply KL, 32 → 16-bit"]}
                rows={kv.gpu.app.map((a) => [
                  a.model,
                  phoneName(a.phone),
                  `${a.heldA.toFixed(3)} → ${a.heldB.toFixed(3)}`,
                  `${signed(a.heldChange)} (${signed(a.heldLow)}, ${signed(a.heldHigh)})`,
                  `${a.worse} / ${a.better}`,
                  `${a.replyA.toFixed(3)} → ${a.replyB.toFixed(3)}`,
                ])}
              />
              <Note>
                Qwen3&apos;s average on the chat questions is set by a few uncertain questions (its median is about 0.003 with both files), so its fall with 16-bit is not evidence that
                16-bit is more accurate in general.
              </Note>
            </More>
            <More title="GPU: the 32k pair, run twice" summary="Llama 3.2 1B's 32k files, first 32-bit first, then 16-bit first from a matched temperature">
              <Table
                label="32k runs"
                min="48rem"
                head={["Run", "Cache", "Started at", "Whole-book read", "Writing at 1.9k / 7.9k / 32.5k, tok/s", "KL at 32.5k", "GPU memory"]}
                right={[2, 3, 5, 6]}
                rows={kv.repeat.map((r) => [
                  r.run === "first" ? "First" : "Repeat",
                  r.cache === "fp32" ? "32-bit" : "16-bit",
                  `${r.startC} °C`,
                  `${r.prefillS.toFixed(0)} s, ${prefillRate(r).toFixed(0)} tok/s`,
                  r.decode.map((d) => tok(d)).join(" / "),
                  r.kl32k.toFixed(3),
                  `${gb2(r.gpuMiB)} GB`,
                ])}
              />
            </More>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="The KV cache">
            For every token so far, a model keeps what each layer needs to look back at: its keys and values. That memory grows with the conversation, is reserved for the whole
            window when the model loads, and is read in full to write each new token. ExecuTorch stores it in 32-bit numbers by default; its{" "}
            <Go href={kvLinks.int8Cache} className={link}>
              8-bit cache
            </Go>{" "}
            stores one byte per number with a scale per token and head.
          </Row>
          <Row label="The files">
            Llama 3.2 1B, LFM2.5 1.2B, Qwen3 1.7B and Gemma 3 1B, each exported with ExecuPack&apos;s recipe (4-bit weights, 8-bit activations) at 2k, 8k and 32k windows,
            with the same weights in both files of a pair. On the CPU the pair differs only in the cache; on the GPU, 16-bit mode also computes in 16 bits.
          </Row>
          <Row label="The phones">
            Three Snapdragon SM8975 reference phones in Qualcomm&apos;s device cloud, through the same ExecuTorch 1.5.1 library the app uses (its Vulkan build for the GPU). The
            CPU pass ran on the first, its repeat and most GPU runs on the second, the rest on the third. Where two phones ran the same file, the predictions matched exactly; speeds did not always (see Limits).
          </Row>
          <Row label="Reading a book">
            Three books from PG-19, 32,500 tokens each, wrapped in the model&apos;s chat format. At 1.9k, 7.9k and 32.5k tokens the phone scores 128 next-token predictions,
            fed the book&apos;s true next token at every step rather than its own guess, so every file is scored on exactly the same text.
          </Row>
          <Row label="Against the original">
            The same predictions from the original model, unquantized and in 32-bit on a GPU, compared by KL divergence over its 64 likeliest tokens plus one bucket for the rest.
            That undercounts differences inside the bucket, so it is a lower bound. The second phone also stored each file&apos;s own probabilities, so the two files of a pair
            could be compared with each other directly.
          </Row>
          <Row label="Recall and chat">
            Nine facts hidden in each book in the style of{" "}
            <Go href={kvLinks.ruler} className={link}>
              RULER
            </Go>
            &apos;s needles, asked about at each checkpoint, and 141 short questions from the app&apos;s earlier tests.
          </Row>
          <Row label="Heat">
            The GPU runs waited before each book until the phone&apos;s thermal cap was off, its thermal status at most 1 and the GPU at or under 50 °C, and logged the cap every
            2 to 5 seconds. The CPU runs were not gated.
          </Row>
          <Row label="Review">
            OpenAI Codex reviewed the CPU study and the second phone&apos;s GPU runs three times, recomputing the numbers from the raw results; an independent agent reviewed the
            third phone&apos;s round the same way. What they found is corrected here.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Small samples">
            One phone model, three books, and one book for Llama and Qwen at 32k. The intervals describe these texts; they do not establish that 8 bits and 32 are equivalent.
          </Row>
          <Row label="Speed">
            The CPU runs were not temperature-gated. Repeated on a second phone, the 2k and 8k files wrote within {pct(Math.max(...crossPhone.filter((c) => c.window !== "2k" || ["Llama 3.2 1B", "Gemma 3 1B"].includes(c.model)).map((c) => Math.abs(c.change))))} of the
            first phone&apos;s speed except LFM2.5 at 2k ({phoneSpan("LFM2.5 1.2B")} faster) and Qwen3 at 2k ({phoneSpan("Qwen3 1.7B")} faster), so small gains, under about 1.15×, are
            within the noise; the large ones are not. GPU runs were short and
            separated by cooling, so they do not measure sustained speed, and each GPU speed is one run per file: the one pair run twice, Llama&apos;s 32k, repeated its
            writing speeds within 0.6%.
          </Row>
          <Row label="Not the app">
            Everything ran through a test harness on the app&apos;s library, not the app&apos;s own chat runner. Confirm there before shipping.
          </Row>
          <Row label="The 16-bit failure">
            One model and one book, and its cause was not isolated. Qwen3 has no 32k GPU file: its export was killed on the build machine, most likely for lack of memory.
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
