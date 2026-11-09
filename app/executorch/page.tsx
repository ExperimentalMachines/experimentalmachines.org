import type { Metadata } from "next";
import ModelFinder, { type FinderCell, type FinderRow, type FinderTarget, type TargetKey } from "@/components/execupack/ModelFinder";
import Punchcard from "@/components/execupack/Punchcard";
import { WindowKey } from "@/components/execupack/WindowStrip";
import { Action, Actions, PrimaryAction } from "@/components/home/Actions";
import { ProductSection, Steps } from "@/components/home/Docs";
import Go from "@/components/home/Go";
import { lede as ledeClass, link, ProjectLabel } from "@/components/home/ui";
import { More, Row, Rows } from "@/components/research/Post";
import {
  type BackendKey,
  type ChipStatus,
  type Family,
  backends,
  chipBackends,
  exceptions,
  excluded,
  execupackLinks,
  executorchVersion,
  families,
  gateEvidence,
  pipelineSteps,
  rollout,
  runtimeNotes,
  sources,
  windowSlots,
  windowTiers,
  withheld,
} from "@/lib/execupack";
import { type PublishedRepo, publishedAsOf, publishedRepos } from "@/lib/execupack-published";
import { links, projects } from "@/lib/home";

const description =
  "ExecuPack builds small open models into ExecuTorch files for phone CPUs, GPUs and Qualcomm and MediaTek NPUs and publishes them on Hugging Face. Every CPU file is checked against the model it came from before it ships.";

export const metadata: Metadata = {
  title: "ExecuPack: open models, packed for phone chips",
  description,
  alternates: { canonical: "/executorch/" },
  openGraph: { title: "ExecuPack", description, url: "/executorch/" },
};

// ExecuPack's page. It used to be one long table of ExecuTorch exports; it now leads with what a reader
// comes for, a model for their phone, and keeps the registry detail below in the order it is needed:
// which file to run, how each file was checked, what ExecuTorch can build, what is still missing, the
// chips, and the sources. Published files come from lib/execupack-published.ts (generated from the Hub);
// everything ExecuTorch can do comes from lib/execupack.ts (hand-written from its source).

const hf = (id: string) => `https://huggingface.co/${id}`;
const etFile = (path: string) => `${execupackLinks.executorch}/${path}`;
const date = (iso: string, month: "long" | "short" = "short") =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric", timeZone: "UTC" });

const status = projects.find((p) => p.id === "execupack")!.status;
const familyByKey = new Map(families.map((f) => [f.key, f]));
const familyOf = (r: PublishedRepo) => familyByKey.get(r.family)!;
const buildsOf = (repo: PublishedRepo, backend: BackendKey) => repo.builds.filter((b) => b.backend === backend);

// Can ExecuTorch (or execupack's patch) build this checkpoint for this backend?
function possible(family: Family, backend: BackendKey, source: string | null) {
  const s = family.support[backend];
  if (family.blocked || s.kind === "refused") return false;
  if (s.kind === "checkpoints") return source !== null && s.ids.includes(source);
  return s.kind === "upstream" || s.kind === "patched";
}

// The chip an NPU column is built for, named in its header; a build for another chip says so in its cell.
const usualChip = (backend: BackendKey) => {
  const chips = publishedRepos.flatMap((r) => buildsOf(r, backend).map((b) => b.chip));
  return chips.sort((a, b) => chips.filter((c) => c === b).length - chips.filter((c) => c === a).length)[0] ?? "";
};
const qnnChip = usualChip("qnn");
const mtkChip = usualChip("mtk");

// The windows each target is built at: the tiers, MediaTek's 512 too, and any other window a published file has.
const slotsFor = (key: TargetKey) =>
  [...new Set([...(key === "mtk" ? windowSlots : windowTiers), ...publishedRepos.flatMap((r) => buildsOf(r, key).flatMap((b) => b.windows))])].sort(
    (a, b) => a - b,
  );

const targets: FinderTarget[] = [
  { key: "xnnpack", label: "CPU", detail: "XNNPACK, any phone", slots: slotsFor("xnnpack") },
  { key: "vulkan", label: "GPU", detail: "Vulkan, any Vulkan GPU", slots: slotsFor("vulkan") },
  { key: "qnn", label: "Qualcomm NPU", detail: `${qnnChip} only`, slots: slotsFor("qnn") },
  { key: "mtk", label: "MediaTek NPU", detail: `${mtkChip} only`, slots: slotsFor("mtk") },
];
const targetLabel = (key: BackendKey) => targets.find((t) => t.key === key)?.label ?? backends.find((b) => b.key === key)!.name;

// The recipe a CPU or GPU file is expected to have; anything else is named in its cell.
const usualRecipe = "8da4w GPTQ";

function finderCell(repo: PublishedRepo, key: TargetKey): FinderCell {
  const builds = buildsOf(repo, key);
  if (builds.length) {
    const windows = [...new Set(builds.flatMap((b) => b.windows))].sort((a, b) => a - b);
    const npu = key === "qnn" || key === "mtk";
    const usual = key === "qnn" ? qnnChip : mtkChip;
    const odd = [...new Set(builds.map((b) => (npu ? b.chip : b.recipe)).filter((x) => x && x !== (npu ? usual : usualRecipe)))];
    return { kind: "built", windows, detail: odd.length ? odd.join(", ") : undefined };
  }
  if (withheld[repo.name]?.[key]) return { kind: "withheld" };
  return possible(familyOf(repo), key, repo.source) ? { kind: "todo" } : { kind: "none" };
}

const sortedRepos = [...publishedRepos].sort(
  (a, b) => families.indexOf(familyOf(a)) - families.indexOf(familyOf(b)) || a.name.localeCompare(b.name, "en", { numeric: true }),
);

const finderRows: FinderRow[] = sortedRepos.map((r) => ({
  name: r.name,
  href: hf(r.id),
  family: familyOf(r).name,
  updated: date(r.lastModified),
  cells: Object.fromEntries(targets.map((t) => [t.key, finderCell(r, t.key)])) as Record<TargetKey, FinderCell>,
}));

const buildCount = publishedRepos.reduce((n, r) => n + r.builds.reduce((m, b) => m + b.windows.length, 0), 0);
const punchRows = sortedRepos.map((r) => ({
  name: r.name,
  lit: targets.map((t) => buildsOf(r, t.key).flatMap((b) => b.windows)),
}));
const modelsFor = (key: TargetKey) => publishedRepos.filter((r) => buildsOf(r, key).length > 0).length;

// What ExecuTorch can export, per family and backend.
type Coverage = "published" | "todo" | "refused" | "blocked" | "none";
function coverage(family: Family, backend: BackendKey): { state: Coverage; patched: boolean } {
  const s = family.support[backend];
  const published = publishedRepos.some((r) => r.family === family.key && buildsOf(r, backend).length > 0);
  if (published) return { state: "published", patched: s.kind === "patched" };
  if (s.kind === "none") return { state: "none", patched: false };
  if (s.kind === "refused") return { state: "refused", patched: false };
  if (family.blocked) return { state: "blocked", patched: false };
  return { state: "todo", patched: s.kind === "patched" };
}

// The reason behind each cell that is not a plain "published", for the fold under the table.
const gapNotes = families.map((f) => ({
  family: f,
  notes: [
    ...(f.blocked ? [{ backend: "Every target", note: f.blocked }] : []),
    ...backends.flatMap((b) => {
      const s = f.support[b.key];
      const c = coverage(f, b.key);
      if (s.kind === "checkpoints" && c.state === "todo") {
        return [{ backend: targetLabel(b.key), note: `Qualcomm's registry lists ${s.ids.map((id) => id.split("/")[1]).join(", ")}${s.note ? `, ${s.note}` : ""}` }];
      }
      return "note" in s && s.note && b.key !== "exynos" ? [{ backend: targetLabel(b.key), note: s.note }] : [];
    }),
  ],
}));

// Still to build: on published models, and checkpoints ExecuTorch names that have no repo yet.
const modelBackends = backends.filter((b) => b.key !== "exynos");
const missingOnPublished = sortedRepos
  .map((r) => ({
    name: r.name,
    href: hf(r.id),
    family: familyOf(r).name,
    targets: modelBackends.filter((b) => possible(familyOf(r), b.key, r.source) && !buildsOf(r, b.key).length && !withheld[r.name]?.[b.key]).map((b) => targetLabel(b.key)),
  }))
  .filter((m) => m.targets.length);
const unpublished = families
  .filter((f) => !f.blocked)
  .flatMap((f) =>
    f.canonical
      .filter((id) => !publishedRepos.some((r) => r.source === id))
      .map((id) => ({
        name: id.split("/")[1],
        href: hf(id),
        family: f.name,
        targets: modelBackends.filter((b) => possible(f, b.key, id)).map((b) => targetLabel(b.key)),
      })),
  );

const chipLabels: Record<ChipStatus, [string, string]> = {
  ran: ["Runs on it", "bg-ink text-white"],
  targeted: ["Built for it", "bg-blue text-white"],
  exportable: ["Can export", "border border-dashed border-ink/50"],
  sdk: ["Needs a newer SDK", "border border-rule text-ink-soft"],
  scripts: ["Delegate only", "border border-rule text-ink-soft"],
  "no-llm": ["No LLM path", "border border-rule text-ink-soft"],
};

function ChipBadge({ status: s }: { status: ChipStatus }) {
  const [label, style] = chipLabels[s];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

function CoverageMark({ state, patched }: { state: Coverage; patched: boolean }) {
  if (state === "none") {
    return (
      <>
        <span aria-hidden className="text-ink-soft">
          —
        </span>
        <span className="sr-only">No path in {executorchVersion}</span>
      </>
    );
  }
  const glyph = {
    published: "bg-blue",
    todo: "border-[1.5px] border-dashed border-ink/60",
    refused: "border-[1.5px] border-ink/60 bg-[linear-gradient(135deg,transparent_45%,rgba(17,22,51,0.6)_45%,rgba(17,22,51,0.6)_55%,transparent_55%)]",
    blocked: "border-[1.5px] border-rule",
  }[state];
  const label = { published: "Published", todo: "Not yet", refused: "Refused", blocked: "Blocked" }[state];
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${glyph}`} />
      <span className={state === "published" ? "font-medium" : "text-ink-soft"}>
        {label}
        {patched && <span className="block text-xs font-normal text-ink-soft">with a patch</span>}
      </span>
    </span>
  );
}

// The delegate that builds each target, under its name in the coverage table.
const delegate: Record<BackendKey, string> = { xnnpack: "XNNPACK", vulkan: "Vulkan", qnn: "QNN", mtk: "NeuroPilot", exynos: "Exynos" };

const h3 = "display text-2xl leading-snug tracking-[-0.015em]";
const plate = "rounded-[1.75rem] bg-white p-6 sm:p-8";

export default function ExecuPackPage() {
  const [qnn, mtk, exynos] = ["qnn", "mtk", "exynos"].map((key) => chipBackends.find((b) => b.key === key)!);
  const qnnPhones = qnn.chips.filter((c) => c.kind === "phone");
  const qnnOther = qnn.chips.filter((c) => c.kind !== "phone");
  const which = [
    {
      key: "xnnpack" as const,
      name: "XNNPACK",
      body: "Runs on any arm64 Android phone, and both apps load it, except LFM3's until they have its chat template. Linear layers hold int4 weights solved with GPTQ, except in two small models that keep fp32 ones, and activations are quantized to int8 as it runs. The file to start with on any phone.",
    },
    {
      key: "vulkan" as const,
      name: "Vulkan",
      body: "Runs on any phone with Vulkan, in both apps, from the same int4 weights as a CPU build of its window. Which is faster depends on the GPU. In October, with a Qwen3-0.6B file at 2k since withdrawn, a Snapdragon 8 Elite Gen 5's GPU read a 702-token prompt faster than its CPU and wrote faster after it, 61 to 64 tokens per second against 50 to 51, but slower after a 27-token prompt; on a Mali-G925 the CPU wrote 2.2 to 3.9 times faster.",
    },
    {
      key: "qnn" as const,
      name: `QNN, ${qnnChip}`,
      body: `Compiled for the Snapdragon 8 Elite (${qnnChip}) and loads only there, in ExecuServe. Qualcomm's scripts build a fixed list of checkpoints, each with its own quantization recipe, so a fine-tune of a listed model is not covered.`,
    },
    {
      key: "mtk" as const,
      name: `NeuroPilot, ${mtkChip}`,
      body: `Compiled for the ${mtkChip} (Dimensity 9400, 9500s) and loads only there, in ExecuServe. The files keep 8-bit weights (A16W8), not the 4-bit ones of MediaTek's stock recipe, whose KL divergence from fp32 measured about 110 times higher (0.75 against 0.0068, LFM2.5-1.2B at a 4k window). LFM2.5-1.2B at 2k runs with the NPU reading the prompt and the CPU writing the reply.`,
    },
  ];

  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <ProjectLabel name="ExecuPack" status={status} mark="/execupack/mark-small.svg" />
            <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Open models, packed for phone chips.
            </h1>
            <p className={`${ledeClass} mt-6 max-w-2xl`}>
              ExecuPack builds small open models from Hugging Face into ExecuTorch files for phone CPUs, GPUs and Qualcomm and MediaTek NPUs, and
              publishes them for{" "}
              <Go href="/openweights/" className={link}>
                OpenWeights
              </Go>
              ,{" "}
              <Go href="/execuserve/" className={link}>
                ExecuServe
              </Go>{" "}
              and anyone else. Every CPU file is checked against the model it came from before it ships.
            </p>
            <Actions className="mt-10">
              <PrimaryAction href={execupackLinks.hub} className="bg-[#262626] text-white hover:bg-black">
                Browse on Hugging Face
              </PrimaryAction>
              <Action href="#models">Find a model</Action>
              <Action href={execupackLinks.repo}>Source on GitHub</Action>
            </Actions>
            <p className="mt-6 text-sm text-ink-soft">
              Built with ExecuTorch {executorchVersion}, the version both apps ship. Listing as of {date(publishedAsOf, "long")}.
            </p>
          </div>
          <Punchcard
            builds={buildCount}
            models={publishedRepos.length}
            rows={punchRows}
            groups={targets.map((t, i) => ({ label: ["CPU", "GPU", "Qualcomm", "MediaTek"][i], slots: t.slots }))}
          />
        </div>
      </section>

      <ProductSection
        id="models"
        tint
        title="Find a model"
        lede="Pick a target to keep only the models built for it. A name opens its repository on Hugging Face, with a folder per target and the tokenizer at its root."
      >
        <WindowKey slots={windowSlots} />
        <div className="mt-8">
          <ModelFinder rows={finderRows} targets={targets} version={executorchVersion} />
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-ink-soft">
          Not yet: ExecuTorch {executorchVersion} can build it and nothing is published. Withheld: built, measured and kept off the Hub, with the
          reason under <a href="#exceptions" className={link}>exceptions</a>. A dash: no path in {executorchVersion}. Each target folder also holds a{" "}
          <code>config.json</code> the apps read. Read from the Hugging Face API on {date(publishedAsOf, "long")}.
        </p>
      </ProductSection>

      <ProductSection id="which" title="Which file to run" lede="A CPU file runs on any arm64 Android phone, and a GPU file on any phone with Vulkan. An NPU file is compiled for one chip and loads only on it.">
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {which.map((w) => (
            <li key={w.key} className="flex flex-col border-t-2 border-blue pt-4">
              <p className="display text-2xl">{targetLabel(w.key)}</p>
              <p className="text-sm text-ink-soft">{w.name}</p>
              <p className="mt-4 text-sm font-medium">
                <span className="tabular-nums">{modelsFor(w.key)}</span> models
              </p>
              <p className="mt-2 leading-7 text-ink-soft">{w.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-sm leading-6 text-ink-soft">{runtimeNotes.vulkanAar}</p>
      </ProductSection>

      <ProductSection
        id="checks"
        tint
        title="Checked before it ships"
        lede="The recipe for a CPU file, step by step. A GPU file is built from the same weights as a gated CPU build of its window. Where a published file differs from the recipe, the exceptions below say how and why. NPU files are quantized by Qualcomm's and MediaTek's own tools and checked for structure."
      >
        <Steps items={pipelineSteps} />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <figure className={plate}>
            <h3 className={h3}>Why the weights are solved, not rounded</h3>
            <p className="mt-2 leading-7 text-ink-soft">
              The gate&apos;s thresholds come from real files. Of the 12 decisions their fp32 model is sure of, each block is one the build still makes
              the same way.
            </p>
            <ul className="mt-6 space-y-5">
              {gateEvidence.map((g) => (
                <li key={g.label}>
                  <p className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium">{g.label}</span>
                    <span className="tabular-nums text-ink-soft">
                      {g.kept} of {g.of} kept, mean {g.mean.toFixed(3)}
                    </span>
                  </p>
                  <span aria-hidden className="mt-2 grid grid-cols-12 gap-1">
                    {Array.from({ length: g.of }, (_, i) => (
                      <span key={i} className={`h-5 rounded-[4px] ${i < g.kept ? "bg-blue" : "border border-dashed border-ink/30"}`} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <figcaption className="mt-6 text-sm leading-6 text-ink-soft">
              The rounded build lost its tool calls on a phone, finding 10% of them against 49% for a solved build. Mean is the probability each build
              gives the fp32 model&apos;s token. From execupack&apos;s{" "}
              <Go href={`${execupackLinks.repo}/blob/main/pipeline/gate.py`} className={link}>
                gate
              </Go>
              .
            </figcaption>
          </figure>

          <div id="exceptions" className={`${plate} scroll-mt-28 lg:scroll-mt-16`}>
            <h3 className={h3}>Exceptions</h3>
            <p className="mt-2 leading-7 text-ink-soft">{rollout} These files differ from the recipe, and each repo&apos;s export report says why.</p>
            <dl className="mt-4 divide-y divide-rule">
              {exceptions.map((e) => (
                <div key={e.model} className="py-4 last:pb-0">
                  <dt className="font-medium">{e.model}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink-soft">{e.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </ProductSection>

      <ProductSection
        id="coverage"
        title={`What ExecuTorch ${executorchVersion} can export`}
        lede={`Each cell is one model family on one target, read from ExecuTorch's source at the v${executorchVersion} tag. With a patch: the export needs one of execupack's own.`}
      >
        <div className={`${plate} border border-rule`}>
          <div
            role="region"
            aria-label="Families by target, scrolls sideways on small screens"
            tabIndex={0}
            className="relative overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
          >
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">What ExecuTorch {executorchVersion} can export, by model family and target</caption>
              <thead>
                <tr className="align-bottom text-xs text-ink-soft">
                  <th scope="col" className="pb-3 pr-4 text-left font-normal">
                    Family
                  </th>
                  {backends.map((b) => (
                    <th key={b.key} scope="col" className="w-[16%] pb-3 pr-4 text-left font-normal">
                      <span className="block text-sm font-medium text-ink">{b.key === "exynos" ? "Samsung NPU" : targetLabel(b.key)}</span>
                      <span className="block">{delegate[b.key]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.key} className="border-t border-rule align-top">
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      <span className="block font-medium">{f.name}</span>
                      <span className="block text-xs text-ink-soft">{f.sizes}</span>
                    </th>
                    {backends.map((b) => (
                      <td key={b.key} className="py-3 pr-4">
                        <CoverageMark {...coverage(f, b.key)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6">
          <More title="Why each gap is there" summary="The reason behind every cell that is not a plain published, family by family, and what each patch does.">
            <Rows>
              {gapNotes
                .filter((g) => g.notes.length)
                .map((g) => (
                  <Row key={g.family.key} label={g.family.name}>
                    {g.notes.map((n) => (
                      <span key={n.backend} className="mt-2 block first:mt-0">
                        <span className="font-medium text-ink">{n.backend}:</span> {n.note}.
                      </span>
                    ))}
                  </Row>
                ))}
              <Row label="LFM3 on phones">{runtimeNotes.lfm3}</Row>
              <Row label="Samsung Exynos">The delegate exists in every family&apos;s column, and ExecuTorch {executorchVersion} has no LLM example for it.</Row>
              <Row label="Next release">{runtimeNotes.nextRelease}</Row>
            </Rows>
          </More>
        </div>
      </ProductSection>

      <ProductSection
        id="next"
        tint
        title="Still to build"
        lede={`Every target ExecuTorch ${executorchVersion} can build for these models that has no files on Hugging Face yet. On a target that has some, the missing windows are the empty blocks in the finder.`}
      >
        <div className="space-y-12">
          {[
            { title: "Targets missing from published models", items: missingOnPublished },
            { title: "Checkpoints with no repo yet", items: unpublished },
          ].map((group) => (
            <div key={group.title}>
              <h3 className={h3}>{group.title}</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((m) => (
                  <li key={m.name} className="flex flex-col rounded-[1.25rem] border border-rule bg-white p-5">
                    <a href={m.href} target="_blank" rel="noreferrer" className="font-medium text-blue-deep underline decoration-blue/30 underline-offset-4 hover:decoration-blue">
                      {m.name}
                    </a>
                    <span className="mt-0.5 text-xs text-ink-soft">{m.family}</span>
                    <span className="mt-4 flex flex-wrap gap-1.5">
                      {m.targets.map((t) => (
                        <span key={t} className="rounded-full border border-dashed border-ink/40 px-2.5 py-0.5 text-xs">
                          {t}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection
        id="chips"
        title="Chips"
        lede={`Every chip is its own NPU build. These are the phone chips each NPU delegate in ExecuTorch ${executorchVersion} can compile for, and what has run on them.`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {[
            { b: qnn, chips: qnnPhones },
            { b: mtk, chips: mtk.chips },
            { b: exynos, chips: exynos.chips },
          ].map(({ b, chips }, i) => (
            <div key={b.key} className={`rounded-[1.75rem] bg-bench p-6 sm:p-8 ${i === 0 ? "lg:row-span-2" : ""}`}>
              <h3 className={h3}>{b.name}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {b.summary} Source:{" "}
                <Go href={etFile(b.source)} className={link}>
                  {/* break-all: a long path would otherwise widen the page on a phone. */}
                  <code className="break-all">{b.source}</code>
                </Go>
                .
              </p>
              <ul className="mt-5 divide-y divide-rule">
                {chips.map((c) => (
                  <li key={c.id} className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1 py-3 text-sm">
                    <code className="font-medium">{c.id}</code>
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span>
                        {c.name}
                        {c.arch && <span className="text-ink-soft">, {c.arch}</span>}
                      </span>
                      <ChipBadge status={c.status} />
                    </span>
                    {c.note && <span className="col-start-2 text-xs leading-5 text-ink-soft">{c.note}</span>}
                  </li>
                ))}
              </ul>
              {i === 0 && (
                <div className="mt-6">
                  <More title={`Qualcomm's other ${qnnOther.length} chips`} summary="IoT, automotive, XR and wearable chips in the same registry. ExecuTorch can export to each.">
                    <ul className="divide-y divide-rule">
                      {qnnOther.map((c) => (
                        <li key={c.id} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-2.5 text-sm">
                          <code>{c.id}</code>
                          <span className="text-ink-soft">
                            {c.name}
                            {c.arch && `, ${c.arch}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </More>
                </div>
              )}
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection id="sources" tint title="Sources">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <p className="max-w-2xl leading-7 text-ink-soft">
              What ExecuTorch can export is read from its source at the{" "}
              <Go href={execupackLinks.executorch} className={link}>
                v{executorchVersion} tag
              </Go>
              . ExecuPack pins the same version, because a newer exporter can emit methods the apps&apos; runtime lacks.
            </p>
            <ul className="mt-6 divide-y divide-rule border-y border-rule">
              {sources.map((s) => (
                <li key={s.file} className="grid gap-x-6 gap-y-1 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Go href={etFile(s.file)} className={link}>
                    <code className="break-all">{s.file}</code>
                  </Go>
                  <span className="text-ink-soft">{s.what}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <More title="Left out on purpose" summary="The same registries list these, and ExecuPack does not export them.">
                <ul className="divide-y divide-rule">
                  {excluded.map((e) => (
                    <li key={e.what} className="grid gap-x-6 gap-y-1 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <span>{e.what}</span>
                      <span className="text-ink-soft">{e.why}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-6 text-ink-soft">iOS accelerators (Core ML, MPS) are outside this page: ExecuPack builds for Android only.</p>
              </More>
            </div>
          </div>
          <div>
            <p className="max-w-md leading-7 text-ink-soft">The decisions and measurements behind every backend, and every finding from running the pipeline, with its evidence.</p>
            <Actions className="mt-6">
              <Action href={execupackLinks.plan}>Plan</Action>
              <Action href={links.execupackFindings}>Research log</Action>
              <Action href={execupackLinks.repo}>Source on GitHub</Action>
              <Action href={execupackLinks.hub}>Hugging Face</Action>
            </Actions>
          </div>
        </div>
      </ProductSection>
    </main>
  );
}
