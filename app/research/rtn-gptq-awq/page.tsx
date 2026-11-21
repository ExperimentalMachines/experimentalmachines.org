import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { Closeness, DataCards, MethodCards, ModelBars, RecallRows, TeacherForcing } from "@/components/research/QuantFigures";
import { FILES, kl, methodName, minutes, models, pct, quantLinks, signedPct, signed, solveTimes, type Arm, sizes, change, times, type Change, type File, type ModelView } from "@/lib/quant";

const href = "/research/rtn-gptq-awq/";

export const metadata = postMetadata(href);

// Every figure's rows, in this order: plain rounding, the three GPTQ files together, then AWQ and AWQ + GPTQ.
const ORDER: File[] = ["rtn", "gptq", "gptq_kv", "published", "awq", "awq_gptq"];
const SHORT: Record<File, string> = { rtn: "RTN", gptq: "GPTQ", gptq_kv: "GPTQ again", published: "Published", awq: "AWQ", awq_gptq: "AWQ + GPTQ" };
const qwen = models.find((m) => m.key === "qwen3-1.7b")!;
const ci = (c?: Change) => (c ? `${signedPct(c[0])} (${signedPct(c[1])} to ${signedPct(c[2])})` : "–");
const ppl = (x: number) => x.toFixed(x < 100 ? 1 : 0);

// The findings, computed: each sentence reads the models that have the numbers it needs.
const llama = models.find((m) => m.key === "llama32-1b")!;
const names = (ms: ModelView[]) => (ms.length > 1 ? `${ms.slice(0, -1).map((m) => m.name).join(", ")} and ${ms.at(-1)!.name}` : (ms[0]?.name ?? ""));
const awqBooks = models.flatMap((m) => (change(m, "awq", "books") ? [change(m, "awq", "books")!] : []));
// Every GPTQ file of a model: this round's solve (and Qwen3's thinking-on one), the second file, the published one.
const gptqFiles = (m: ModelView) => [m.arm("gptq"), m.arm("gptq_kv"), m.arm("published"), m.thinkingOn()].flatMap((a) => (a ? [a] : []));
// Free-running replies: models where AWQ's left the original's sooner than every GPTQ file's.
// Free-running replies: models where AWQ's overlapped the original's clearly less than GPTQ's, and left them sooner than
// every GPTQ file's.
const genBehind = models.filter((m) => {
  const a = m.arm("awq")?.gen;
  const g = gptqFiles(m).flatMap((x) => (x.gen ? [x.gen.prefix] : []));
  return a && g.length && a.prefix < Math.min(...g) && (m.vs("awq")?.genLcs?.[2] ?? 0) < 0;
});
// App questions: models where AWQ was further from the original than GPTQ in both rounds (2k and 8k builds).
const appBoth = models.filter((m) => {
  const r1 = m.firstAppKl;
  return (m.arm("awq")?.app.kl ?? 0) > (m.arm("gptq")?.app.kl ?? Infinity) && (r1.awq ?? 0) > (r1.gptq ?? Infinity);
});
const genRun = models.filter((m) => m.arm("awq")?.gen);
const qKv = qwen.arm("gptq_kv");
const qOnSolve = qwen.thinkingOn();
const qRtn = qwen.arm("rtn");
const llamaRtn = llama.arm("rtn");
const llamaBoth = change(llama, "awq_gptq", "books");
const llamaBand = Math.abs(change(llama, "gptq_kv", "books")?.[0] ?? 0);
// Family-wise (Bonferroni over the twelve long-text comparisons with GPTQ): the models where AWQ's gain still clears zero.
const fwClear = (f: File) => models.filter((m) => (m.vs(f)?.booksFw?.[2] ?? 0) < 0);
// Models where AWQ read the books closer to the original than every GPTQ file.
const awqBeatsAll = models.filter((m) => {
  const a = m.arm("awq")?.booksAll?.kl;
  const g = [m.arm("gptq"), m.arm("gptq_kv"), m.arm("published"), m.thinkingOn()].flatMap((x) => (x?.booksAll ? [x.booksAll.kl] : []));
  return a !== undefined && g.length > 0 && a < Math.min(...g);
});
// AWQ's solve time against GPTQ's, per model, from the first round: "1.3 to 2.9 times".
const awqRatios = solveTimes.flatMap((t) => (t.awq && t.gptq ? [t.awq / t.gptq] : []));
const awqTimes = `${Math.min(...awqRatios).toFixed(1)} to ${Math.max(...awqRatios).toFixed(1)} times`;
const recall = models.map((m) => {
  const xs = FILES.flatMap((f) => (m.arm(f) ? [m.arm(f)!.needles] : []));
  return { m, lo: Math.min(...xs.map((x) => x.found)), hi: Math.max(...xs.map((x) => x.found)), hf: xs[0]?.hf ?? 0, of: xs[0]?.of ?? 0 };
});
const fullRecall = recall.filter((r) => r.lo === r.of);
const recallGap = Math.max(0, ...recall.map((r) => r.hf - r.lo));
const partRecall = recall.filter((r) => r.lo < r.of);

const findings = [
  {
    headline: "On long text, AWQ stayed closest to the original",
    line: `Its predictions were ${sizes(awqBooks.map((c) => c[0]))} closer to the original's than GPTQ's on all ${awqBooks.length} models: a bigger gap than between two GPTQ files.`,
  },
  {
    headline: "On the app's short questions, results moved between builds",
    line: qRtn?.firstRound
      ? `Rebuilt on another machine with the same 4-bit values, Qwen3's RTN file changed its first token on ${qRtn.firstRound.topChanged} of ${qwen.heldoutRows} questions; across both rounds, AWQ stayed further from the original than GPTQ only on ${names(appBoth)}.`
      : "",
  },
  {
    headline: `Writing its own replies, AWQ fell behind GPTQ on ${genBehind.length} of ${genRun.length} models`,
    line: `On ${names(genBehind)} its replies overlapped the original's clearly less than GPTQ's${genBehind.includes(qwen) ? ", Qwen3's after first words that changed in this build" : ""}${genRun.length > genBehind.length ? `; on ${names(genRun.filter((m) => !genBehind.includes(m)))} they did not differ` : ""}.`,
  },
  {
    headline: "AWQ then GPTQ was the best balance on Llama 3.2 1B",
    line:
      llamaBoth && llama.arm("awq_gptq")?.gen
        ? `It was ${sizes([llamaBoth[0]])} closer than GPTQ on long text, well past the ${sizes([llamaBand])} between two GPTQ files, and level with GPTQ in its own replies; on Qwen3 the long-text gain was marginal, and on LFM2.5 not clear.`
        : "",
  },
  {
    headline: "Plain rounding broke Llama's tool calls",
    line: llamaRtn ? `RTN kept ${llamaRtn.calls.kept} of the ${llamaRtn.calls.of} JSON calls Llama 3.2 1B makes, and none of its own replies began like the original's.` : "",
  },
  {
    headline: "Recall told the files apart little",
    line: `${names(fullRecall.map((r) => r.m))} answered all ${fullRecall[0]?.of ?? 21} facts hidden in the books with every file${partRecall.length ? `, and ${names(partRecall.map((r) => r.m))} ${partRecall.map((r) => `${r.lo} or ${r.hi} against the original's ${r.hf}`).join("; ")}` : ""}.`,
  },
];

export default function RoundingStudy() {
  const qOn = qwen.thinkingOn();
  const qOff = qwen.arm("gptq");
  return (
    <Post
      href={href}
      related={["/research/kv-cache/", "/research/a100-quantization/", "/research/window/"]}
      sources={[
        { label: "GPTQ paper", href: quantLinks.gptq },
        { label: "AWQ paper", href: quantLinks.awq },
        { label: "AutoAWQ, which our AWQ follows", href: quantLinks.autoawq },
        { label: "PG-19, the books", href: quantLinks.pg19 },
        { label: "The published files", href: quantLinks.hub },
      ]}
      sourcesNote={
        <>
          Every file was built with{" "}
          <Go href="/executorch/" className={link}>
            ExecuPack
          </Go>
          &apos;s recipe. This round&apos;s files were built with ExecuTorch 1.6.0; the published files and the second GPTQ files with older releases. The
          long-text measurements are the{" "}
          <Go href="/research/kv-cache/" className={link}>
            KV-cache study
          </Go>
          &apos;s, on the same books and positions.
        </>
      }
    >
      <Section id="methods" title="Four ways to round a model">
        <Figure
          id="ways"
          title="What each method does to the weights"
          lede="A model is layers that multiply inputs by weights and add up the results. A 4-bit file can store only a few values for each weight, so every weight gets rounded, and the answers move. In these examples a weight may only be a whole number."
          note="We also measured two more GPTQ files: “GPTQ again”, solved and built a second time to show how much GPTQ varies by itself, and “Published”, the GPTQ file the app downloads today. Simplified: real GPTQ spreads each error over all the weights not yet rounded, by how their inputs move together, and these files keep 16 values for each group of 32 weights."
        >
          <MethodCards />
        </Figure>
      </Section>

      <Section id="measuring" title="How we measured them">
        <Figure id="data" title="What we measured them on" lede="Every file read the same text." note="The books are from PG-19's test set; the questions from the OpenWeights phone benchmark. More under How we ran it.">
          <DataCards
            books={[
              { title: "Dragon's Blood", year: "1909" },
              { title: "Travels in Morocco", year: "1860" },
              { title: "Impressions of Theophrastus Such", year: "1879" },
            ]}
            positions={models[0].arm("gptq")?.booksAll?.positions ?? 768}
            needles={models[0].arm("gptq")?.needles.of ?? 21}
            questions={models[0].heldoutRows}
            examples={["What were this year's Coachella festival dates?", "Which US state was admitted to the Union in 1876?"]}
            replies={models[0].arm("gptq")?.gen?.replies ?? 47}
            calibration={32}
          />
        </Figure>
        <Figure
          id="close"
          title="How we tell which file is closer to the original"
        >
          <Closeness />
        </Figure>
        <Figure
          id="forcing"
          title="Two ways to read a file's guesses"
          lede="Most of the numbers here are teacher-forced. The recall answers and the replies figure let each file write freely instead, and the two can disagree."
        >
          <TeacherForcing
            forcedUse="long text, perplexity, the app questions' first word, and the replies' divergence"
            freeUse="the recall answers and each file's own replies"
          />
        </Figure>
      </Section>

      <Section id="findings" title="What we found">
        <Findings items={findings} />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="closeness"
          title="Reading long text, AWQ stayed closest to the original"
          lede="Divergence from the original model across three books. Shorter is closer."
          note={`GPTQ, GPTQ again and Published are three GPTQ files made separately; AWQ was closer than ${awqBeatsAll.length === models.length ? "all three on every model" : `all three on ${names(awqBeatsAll)}`}. Qwen3's GPTQ again and Published were calibrated with its step-by-step thinking switched on (see the Qwen3 figure below). Intervals are under Every number.`}
        >
          <ModelBars
            max={Math.max(...models.flatMap((m) => ORDER.map((f) => m.arm(f)?.booksAll?.kl ?? 0)))}
            groups={models.map((m) => ({
              label: m.name,
              rows: ORDER.flatMap((f) => {
                const a = m.arm(f)?.booksAll;
                const c = f === "awq" ? change(m, "awq", "books") : undefined;
                return a ? [{ label: SHORT[f], value: a.kl, shown: kl(a.kl), on: f === "awq", pill: c ? `${sizes([c[0]])} closer than GPTQ` : undefined }] : [];
              }),
            }))}
          />
        </Figure>

        <Figure
          id="perplexity"
          title="How well each file guesses the books' next word"
          lede="Perplexity: roughly how many words a file is choosing between, on average, when it guesses the next word of a book. 33 means it is as unsure as picking among 33 equally likely words. Lower is better; the dashed line is the original model."
          note="Each model has its own scale: LFM2.5 finds these books harder to guess than the others do. A file can guess the text better than the original and still have moved away from it."
        >
          <ModelBars
            groups={models.map((m) => {
              const rows = ORDER.flatMap((f) => (m.arm(f)?.booksAll ? [{ f, a: m.arm(f)!.booksAll! }] : []));
              const original = rows[0]?.a.hfPpl ?? 0;
              return {
                label: m.name,
                max: Math.max(original, ...rows.map((r) => r.a.ppl)) * 1.05,
                reference: { value: original, label: `original ${ppl(original)}` },
                rows: rows.map(({ f, a }) => ({ label: SHORT[f], value: a.ppl, shown: ppl(a.ppl), on: f === "awq" })),
              };
            })}
          />
        </Figure>

        <Figure
          id="writing"
          title="Writing its own replies, AWQ fell behind on two models"
          lede="Each file answers 47 app questions itself, up to 48 tokens: how many tokens match the original's reply before the first difference. Longer is closer."
        >
          <ModelBars
            max={Math.max(...models.flatMap((m) => ORDER.map((f) => m.arm(f)?.gen?.prefix ?? 0)))}
            groups={models.map((m) => ({
              label: m.name,
              rows: ORDER.flatMap((f) => {
                const g = m.arm(f)?.gen;
                return g ? [{ label: SHORT[f], value: g.prefix, shown: g.prefix.toFixed(1), on: f === "awq" }] : [];
              }),
            }))}
          />
        </Figure>

        <Figure
          id="app"
          title="The app's questions, first word only"
          lede="Divergence on the first word of 141 short app questions. Lower is closer."
          note={`These first words are fragile: the same RTN file, rebuilt on another machine, changed them on ${models.map((m) => m.arm("rtn")?.firstRound?.topChanged ?? 0).sort((a, b) => a - b).join(", ").replace(/, (\d+)$/, " and $1")} of the 141 questions. Bars past 1 are cut.`}
        >
          <ModelBars
            cap={1}
            max={1}
            groups={models.map((m) => ({
              label: m.name,
              rows: ORDER.flatMap((f) => {
                const a = m.arm(f);
                return a ? [{ label: SHORT[f], value: a.app.kl, shown: kl(a.app.kl), on: f === "awq" }] : [];
              }),
            }))}
          />
        </Figure>

        <Figure
          id="calls"
          title="Plain rounding broke Llama's tool calls"
          lede="The app offers the model a search tool. The bar: of the questions where the original model calls it, how many each file calls too. The orange +N: calls a file makes where the original just answered."
          note="Llama 3.2 1B's chat template tells it to answer with a function call whenever tools are offered, so its original calls on 138 of the 141 questions; LFM2.5's and Qwen3's call on only 6 and 12."
        >
          <ModelBars
            max={1}
            reserve={6.5}
            groups={models.map((m) => ({
              label: m.name,
              rows: ORDER.flatMap((f) => {
                const c = m.arm(f)?.calls;
                return c
                  ? [{ label: SHORT[f], value: c.kept / c.of, shown: `${c.kept} of ${c.of}`, flag: c.extra ? `+${c.extra}` : undefined, on: f === "rtn" && m.key === "llama32-1b" }]
                  : [];
              }),
            }))}
          />
        </Figure>

        <Figure
          id="recall"
          title={`Every file recalled within ${["no", "one", "two", "three", "four", "five"][recallGap] ?? recallGap} ${recallGap === 1 ? "fact" : "facts"} of the original`}
          lede="Each book hides seven sentences like “One of the special magic numbers for amber-lantern is: 8171597.” After reading 7,900 tokens, a file is asked for each number and answers greedily; it scores when the number is in its answer. 21 questions per file."
        >
          <RecallRows
            of={recall[0]?.of ?? 21}
            groups={models.map((m) => ({
              label: m.name,
              original: m.arm("gptq")?.needles.hf ?? 0,
              files: ORDER.flatMap((f) => (m.arm(f) ? [{ label: SHORT[f], found: m.arm(f)!.needles.found }] : [])),
            }))}
          />
        </Figure>

        {qOn && qOff && qwen.arm("gptq_kv") && (
          <Figure
            id="thinking"
            title="Qwen3: calibrating with thinking off did not measurably help"
            lede="Qwen3 can think before answering; the app turns that off. GPTQ calibrated with thinking off, against two GPTQ files calibrated with it on. Lower is closer."
            note="Each panel has its own scale. The two thinking-on files land on either side of the thinking-off one on the app's questions, so the calibration change is no bigger than solving again."
          >
            <ModelBars
              groups={(
                [
                  ["App questions", (a: Arm) => a.app.kl],
                  ["Long text", (a: Arm) => a.booksAll!.kl],
                ] as const
              ).map(([label, get]) => {
                const files = [
                  ["Thinking on", qOn],
                  ["On, again", qwen.arm("gptq_kv")!],
                  ["Thinking off", qOff],
                ] as const;
                return {
                  label,
                  max: Math.max(...files.map(([, a]) => get(a))),
                  rows: files.map(([name, a]) => ({ label: name, value: get(a), shown: kl(get(a)), on: name === "Thinking off" })),
                };
              })}
            />
          </Figure>
        )}

        <Figure
          id="time"
          title={`AWQ takes ${awqTimes} as long to make`}
          lede="Minutes to work out the 4-bit values, each method alone on the same kind of 8-core machine. RTN needs none."
          note="One run each, from a first round; Qwen3's calibrated with thinking on."
        >
          <ModelBars
            max={Math.max(...solveTimes.flatMap((s) => [s.gptq ?? 0, s.awq ?? 0, s.awq_gptq ?? 0])) / 60}
            groups={solveTimes.map((s) => ({
              label: s.model,
              rows: (["gptq", "awq", "awq_gptq"] as const).flatMap((method) =>
                s[method] ? [{ label: SHORT[method], value: s[method]! / 60, shown: minutes(s[method]!), on: method === "awq" }] : [],
              ),
            }))}
          />
        </Figure>

        <Figure id="numbers" title="Every number" lede="Each table folds open. KL is the divergence from the original model, 0 for identical; changes are against GPTQ, with 95% intervals.">
          <div className="grid gap-4">
            {models.map((m) => (
              <More key={m.key} title={`${m.name}: long text`} summary="Three books at 1.9k and 7.9k tokens: divergence, perplexity, top token, recall">
                <Table
                  label={`${m.name}, long text`}
                  min="78rem"
                  head={["File", "KL at 1.9k", "KL at 7.9k", "Against GPTQ", "KL median / 99th % / max", "Perplexity", "True token's probability: mean, RMS, 1st / 99th %", "Top token matches", "Recall"]}
                  right={[1, 2, 4, 5, 6, 7]}
                  rows={FILES.flatMap((f) => {
                    const a = m.arm(f);
                    if (!a?.booksAll) return [];
                    return [
                      [
                        methodName[f],
                        a.books["1900"]?.kl.toFixed(4) ?? "–",
                        a.books["7900"]?.kl.toFixed(4) ?? "–",
                        f === "gptq" ? "–" : ci(m.vs(f)?.books),
                        `${a.booksAll.klTails.median.toFixed(3)} / ${a.booksAll.klTails.p99.toFixed(2)} / ${a.booksAll.klTails.max.toFixed(1)}`,
                        `${ppl(a.booksAll.ppl)} (original ${ppl(a.booksAll.hfPpl)})`,
                        `${signed(a.booksAll.dp.mean)}, ${a.booksAll.dp.rms.toFixed(3)}, ${signed(a.booksAll.dp.p1, 2)} / ${signed(a.booksAll.dp.p99, 2)}`,
                        pct(a.booksAll.top1),
                        `${a.needles.found} of ${a.needles.of} (original ${a.needles.hf}; lost ${a.needles.lost}, gained ${a.needles.gained})`,
                      ],
                    ];
                  })}
                />
              </More>
            ))}
            {models.map((m) => (
              <More key={`${m.key}-app`} title={`${m.name}: the app's questions`} summary={`${m.heldoutRows} questions' first tokens, every third reply teacher-forced, tool calls and the publish gate`}>
                <Table
                  label={`${m.name}, app questions`}
                  min="60rem"
                  head={["File", "First-token KL", "Against GPTQ", "KL median / 99th %", "First token changed", "Reply KL", "Against GPTQ", "Tool calls kept", "Publish gate"]}
                  right={[1, 3, 4, 5]}
                  rows={FILES.flatMap((f) => {
                    const a = m.arm(f);
                    if (!a) return [];
                    const v = m.vs(f);
                    return [
                      [
                        methodName[f],
                        a.app.kl.toFixed(4),
                        f === "gptq" ? "–" : ci(v?.app),
                        `${a.app.klTails.median.toFixed(3)} / ${a.app.klTails.p99.toFixed(2)}`,
                        `${a.app.flips} of ${m.heldoutRows}`,
                        a.app.replyKl.toFixed(4),
                        f === "gptq" ? "–" : ci(v?.reply),
                        `${a.calls.kept} of ${a.calls.of}, +${a.calls.extra}`,
                        `${a.gate.passed ? "passes" : "fails"}: ${a.gate.exportMean.toFixed(2)} vs ${a.gate.fp32Mean.toFixed(2)}`,
                      ],
                    ];
                  })}
                />
              </More>
            ))}
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="What differs">
            Every file has the same format: 4-bit weights in groups of 32 with a scale per group, 8-bit activations rounded on the fly, 8-bit embeddings, a 32-bit cache and an 8k
            window. Between this round&apos;s files, only how the 4-bit values are chosen differs. RTN rounds each weight to the nearest of the 16 levels in its group.{" "}
            <Go href={quantLinks.gptq} className={link}>
              GPTQ
            </Go>{" "}
            rounds a column at a time and nudges the weights not yet rounded to cancel the error, using calibration text.{" "}
            <Go href={quantLinks.awq} className={link}>
              AWQ
            </Go>{" "}
            finds the input channels that matter most, scales their weights up before rounding (and the matching inputs down), and picks a clipping range per group. AWQ + GPTQ
            applies AWQ&apos;s scaling, then GPTQ. The published file is the one on Hugging Face, made with GPTQ by the release pipeline. It and the second GPTQ
            file were built with older ExecuTorch releases (1.4.0 to 1.5.1), so they differ from this round&apos;s files in toolchain as well as in their values.
          </Row>
          <Row label="Why AWQ may reach further here">
            AWQ multiplies the weights that meet the biggest inputs by a scale and divides those inputs by the same scale, folding the division into the layer in
            front (a normalisation layer or the projection that feeds it). That is exact in full precision, but in these files each linear&apos;s input is also rounded
            to 8 bits on the fly, and dividing the biggest inputs shrinks the outliers that rounding struggles with, as SmoothQuant does. That is a likely reason AWQ does so well on long text in this format; we did not test it directly.
          </Row>
          <Row label="A second GPTQ file">
            The KV-cache study solved GPTQ for the same three models from the same calibration text, separately, and built the files with ExecuTorch 1.5.1. They are
            measured here too, as &ldquo;GPTQ, solved again&rdquo;: the gap between two GPTQ files, from solving and building again, is the yardstick for a gap between
            methods.
          </Row>
          <Row label="Calibration">
            The same text for every method: committed prompts in each model&apos;s chat format, each continued by the original model&apos;s own reply. Qwen3&apos;s was written with
            thinking off, as the app sends a turn, except where marked.
          </Row>
          <Row label="Long text">
            The KV-cache study&apos;s books and positions: three public-domain books from PG-19, fed in 2,047-token chunks, scored at 128 consecutive positions ending 1.9k and 7.9k
            tokens in, with the true text fed at every step. At each position, the KL divergence from the original 32-bit model over its 64 likeliest tokens plus the rest, the
            perplexity of the true next token, and whether the file&apos;s likeliest token is the original&apos;s. Then seven recall questions per book, answered greedily.
          </Row>
          <Row label="Free-running replies">
            The same 47 replies, now written by each file itself, greedily, for as many tokens as the original model&apos;s greedy reply (at most 48, where the teacher-forced
            replies stop too), and compared with it token by token.
            Teacher forcing feeds the original&apos;s tokens back at every step, so it cannot show a mistake that compounds once a file follows its own text.
          </Row>
          <Row label="App questions">
            The first token of 141 held-out questions from the app under its system prompt, and every third question&apos;s reply, fed the original&apos;s own reply token by
            token. ExecuPack&apos;s publish gate, 12 questions where the original calls a search tool, is a release check rather than a measure of quality; its results are under
            Every number.
          </Row>
          <Row label="Where">
            On x86 Colab machines, through ExecuTorch 1.6.0&apos;s own runtime and the same file format the app runs on a phone; the low-level kernels differ (see Limits). We checked the measurement
            against the KV-cache study&apos;s phone: its Llama 3.2 1B file gave a divergence of 0.231 here and 0.229 on the phone at 1.9k tokens, each book within 6%, with
            115 to 123 of every 128 likeliest tokens the same.
            The solve times are from a first round with each method alone on an 8-core Modal machine.
          </Row>
          <Row label="Statistics">
            Every change against GPTQ is paired: both files read the same positions and questions. Its 95% interval is a percentile bootstrap of 4,000 resamples, drawing
            runs of 16 neighbouring positions for long text, and whole questions or whole replies for the app. The three books themselves are not resampled. Corrected
            for the twelve long-text comparisons with GPTQ (Bonferroni), AWQ&apos;s gain still clears zero on{" "}
            {`${names(fwClear("awq"))}${fwClear("awq").some((m) => m.key === "lfm25-1.2b") ? " (on LFM2.5 only just)" : ""}, and AWQ + GPTQ's only on ${names(fwClear("awq_gptq"))}.`}
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="One file per method">
            In this round each method made one file per model; GPTQ has three or four (this round&apos;s, the second file, the published one, and for Qwen3 one calibrated
            each way). Two GPTQ files of Qwen3 differed {qKv && qOnSolve ? times(Math.max(qKv.app.kl, qOnSolve.app.kl) / Math.min(qKv.app.kl, qOnSolve.app.kl)) : "severalfold"}{" "}
            on the app&apos;s questions, and rebuilding one file for another window moved its first tokens too, so the short-question results describe these builds, not the
            methods.
          </Row>
          <Row label="What we did not test">
            Graded tasks such as maths, where quantization is known to hurt most; languages other than English; and texts longer than 8k tokens. Three models of 1 to 2B.
          </Row>
          <Row label="Our AWQ">Our implementation follows AutoAWQ on this file format; it is not AutoAWQ itself.</Row>
          <Row label="Three books">
            The long-text figures read 768 positions per file in three books. The intervals cover the positions read, not other books.
          </Row>
          <Row label="Not on a phone">
            A phone runs the same file with different low-level kernels, which moved each book&apos;s divergence by up to 6% against x86 and the three books&apos; average by
            1 to 3%: less than the long-text differences between methods this post reports.
          </Row>
        </Rows>
        <Note>Solve times are single runs on one machine shape.</Note>
      </Section>
    </Post>
  );
}
