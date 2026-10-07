import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import {
  type BackendKey,
  type ChipStatus,
  type Family,
  backends,
  chipBackends,
  excluded,
  execupackLinks,
  executorchVersion,
  families,
  runtimeNotes,
  sources,
} from "@/lib/execupack";
import { type PublishedBuild, type PublishedRepo, publishedAsOf, publishedRepos } from "@/lib/execupack-published";

export const metadata: Metadata = {
  title: "ExecuTorch exports",
  description:
    "Which open-weight LLMs execupack has exported to ExecuTorch and published on Hugging Face, per accelerator, against everything ExecuTorch 1.5.1 can export for Android.",
};

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-14 border-t border-rule">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {lede && <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-blue hover:text-blue-deep">
    {children}
  </a>
);

const hf = (id: string) => `https://huggingface.co/${id}`;
const etFile = (path: string) => `${execupackLinks.executorch}/${path}`;
const win = (n: number) => (n >= 1024 ? `${n / 1024}k` : `${n}`);
const npuBackends = new Set<BackendKey>(["qnn", "mtk"]);

const buildsOf = (repo: PublishedRepo, backend: BackendKey) => repo.builds.filter((b) => b.backend === backend);

// Can ExecuTorch 1.5.1 (or execupack's patch) build this checkpoint for this backend?
function possible(family: Family, backend: BackendKey, source: string | null) {
  const s = family.support[backend];
  if (family.blocked || s.kind === "refused") return false;
  if (s.kind === "checkpoints") return source !== null && s.ids.includes(source);
  return s.kind === "upstream" || s.kind === "patched";
}

type Cell =
  | { state: "published"; repos: PublishedRepo[]; note?: string }
  | { state: "todo"; note?: string }
  | { state: "refused"; note: string }
  | { state: "blocked"; note: string }
  | { state: "none"; note: string };

function familyCell(family: Family, backend: BackendKey): Cell {
  const s = family.support[backend];
  const repos = publishedRepos.filter((r) => r.family === family.key && buildsOf(r, backend).length > 0);
  if (repos.length) return { state: "published", repos, note: s.kind === "patched" ? s.note : undefined };
  if (s.kind === "none") return { state: "none", note: s.note };
  if (s.kind === "refused") return { state: "refused", note: s.note };
  if (family.blocked) return { state: "blocked", note: family.blocked };
  if (s.kind === "checkpoints") return { state: "todo", note: `${s.ids.map((id) => id.split("/")[1]).join(", ")}${s.note ? `; ${s.note}` : ""}` };
  return { state: "todo", note: s.note };
}

const familyByKey = new Map(families.map((f) => [f.key, f]));

// One row per published repo, plus each checkpoint ExecuTorch names that has no repo yet.
type ModelRow = { name: string; family: Family; source: string | null; repo: PublishedRepo | null };
const modelRows: ModelRow[] = [
  ...publishedRepos.map((repo) => ({ name: repo.name, family: familyByKey.get(repo.family)!, source: repo.source, repo })),
  ...families
    .filter((f) => !f.blocked)
    .flatMap((f) =>
      f.canonical
        .filter((id) => !publishedRepos.some((r) => r.source === id))
        .map((id) => ({ name: id.split("/")[1], family: f, source: id, repo: null })),
    ),
].sort((a, b) => families.indexOf(a.family) - families.indexOf(b.family) || Number(!a.repo) - Number(!b.repo) || a.name.localeCompare(b.name));

const modelBackends = backends.filter((b) => b.key !== "exynos");
const cells = families.flatMap((f) => backends.map((b) => familyCell(f, b.key)));
const count = (state: Cell["state"]) => cells.filter((c) => c.state === state).length;
const pteBuilds = publishedRepos.reduce((n, r) => n + r.builds.reduce((m, b) => m + b.windows.length, 0), 0);
const unpublished = modelRows.filter((r) => !r.repo);
const missingOnPublished = publishedRepos.reduce(
  (n, r) => n + modelBackends.filter((b) => possible(familyByKey.get(r.family)!, b.key, r.source) && buildsOf(r, b.key).length === 0).length,
  0,
);

function Badge({ state }: { state: Cell["state"] }) {
  const style = {
    published: "bg-blue text-white",
    todo: "border border-dashed border-ink text-ink",
    refused: "border border-ink text-ink",
    blocked: "border border-rule text-ink-soft",
    none: "text-ink-soft",
  }[state];
  const label = { published: "published", todo: "not yet", refused: "refused", blocked: "blocked", none: "not in " + executorchVersion }[state];
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

const chipLabels: Record<ChipStatus, [string, string]> = {
  ran: ["runs on it", "bg-ink text-white"],
  targeted: ["execupack targets it", "bg-blue text-white"],
  exportable: ["can export", "border border-dashed border-ink text-ink"],
  sdk: ["needs a newer SDK", "border border-rule text-ink-soft"],
  scripts: ["delegate only", "border border-rule text-ink-soft"],
  "no-llm": ["no LLM path", "text-ink-soft"],
};

function ChipBadge({ status }: { status: ChipStatus }) {
  const [label, style] = chipLabels[status];
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

function BuildCell({ builds }: { builds: PublishedBuild[] }) {
  return (
    <div className="space-y-1">
      {builds.map((b) => (
        <div key={`${b.chip}-${b.recipe}`}>
          <span className="font-medium">{b.windows.map(win).join(" ")}</span>
          <span className="block text-xs text-ink-soft">{[b.chip, b.recipe].filter(Boolean).join(", ")}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExecuTorchExports() {
  return (
    <>
      <Nav />
      <main>
        <section id="top" className="scroll-mt-14">
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-14 sm:pt-20">
            <h1 className="wide max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              ExecuTorch exports: what is published, and what is still missing.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
              <A href={execupackLinks.repo}>execupack</A> exports small dense open-weight LLMs, 4B parameters or fewer, from Hugging Face to ExecuTorch{" "}
              <code>.pte</code> files for the <A href={execupackLinks.app}>openweights</A> and{" "}
              <a href="/execuserve" className="text-blue hover:text-blue-deep">
                ExecuServe
              </a>{" "}
              Android apps, and publishes them under <A href={execupackLinks.hub}>experimentalmachines</A>. This page sets every published file against
              what ExecuTorch {executorchVersion}, the version both apps&apos; runtimes ship, can export at all, family by family and accelerator by
              accelerator.
            </p>
            <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                [publishedRepos.length, "models published"],
                [pteBuilds, "builds (window × chip)"],
                [count("todo"), "family × accelerator pairs ExecuTorch supports, not yet published"],
                [unpublished.length, "checkpoints ExecuTorch names, no repo yet"],
              ].map(([n, label]) => (
                <div key={label} className="border-t border-ink pt-3">
                  <dt className="sr-only">{label}</dt>
                  <dd className="wide text-3xl font-bold tabular-nums">{n}</dd>
                  <dd className="mt-1 text-sm leading-5 text-ink-soft">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <Section
          id="coverage"
          title="By family and accelerator"
          lede={`Each cell is one model family on one accelerator. "Not yet" means ExecuTorch ${executorchVersion} can export it and nothing is on Hugging Face; "not in ${executorchVersion}" means there is no export path to follow.`}
        >
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Family by accelerator table, scrolls sideways on small screens">
            <table className="w-full min-w-[60rem] border-collapse text-sm">
              <thead className="text-left align-bottom text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Family</th>
                  {backends.map((b) => (
                    <th key={b.key} className="w-[17%] py-2 pr-4 font-normal">
                      <span className="block font-medium text-ink">{b.name}</span>
                      <span className="block text-xs">{b.hardware}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.key} className="border-b border-rule align-top">
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      <span className="block font-medium">{f.name}</span>
                      <span className="block text-xs text-ink-soft">{f.sizes}</span>
                    </th>
                    {backends.map((b) => {
                      const c = familyCell(f, b.key);
                      return (
                        <td key={b.key} className="py-3 pr-4">
                          <Badge state={c.state} />
                          {c.state === "published" && (
                            <span className="mt-1 block text-xs leading-5">{c.repos.map((r) => r.name).join(", ")}</span>
                          )}
                          {c.note && <span className="mt-1 block text-xs leading-5 text-ink-soft">{c.note}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            XNNPACK and Vulkan files run on any phone; NPU files are compiled for one chip and load only on it, so a published QNN or MediaTek cell covers the
            chips listed in the next table, not every Snapdragon or Dimensity. Vulkan uses the same <code>export_llm</code> recipe as XNNPACK with the GPU
            delegate, and ExecuTorch accepts it for every model class it lists. {runtimeNotes.vulkanDevice} {runtimeNotes.vulkanAar} Qualcomm&apos;s scripts
            export a fixed list of checkpoints, each with its own quantization recipe, so a fine-tune of a listed model is not covered.
          </p>
        </Section>

        <Section
          id="models"
          title="By model"
          lede={`Every published repo, with the context windows present for each accelerator, followed by the checkpoints ExecuTorch names that have no repo yet. ${missingOnPublished} accelerator ${missingOnPublished === 1 ? "build is" : "builds are"} possible for published models and missing.`}
        >
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Per-model table, scrolls sideways on small screens">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead className="text-left align-bottom text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Model</th>
                  {modelBackends.map((b) => (
                    <th key={b.key} className="w-[18%] py-2 pr-4 font-normal">
                      {b.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {modelRows.map((row) => (
                  <tr key={row.name} className={`border-b border-rule align-top ${row.repo ? "" : "text-ink-soft"}`}>
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      {row.repo ? (
                        <A href={hf(row.repo.id)}>{row.name}</A>
                      ) : (
                        <a href={hf(row.source!)} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4 hover:text-ink">
                          {row.name}
                        </a>
                      )}
                      <span className="block text-xs text-ink-soft">
                        {row.family.name}
                        {row.repo ? ` · updated ${row.repo.lastModified}` : " · no repo yet"}
                      </span>
                    </th>
                    {modelBackends.map((b) => {
                      const builds = row.repo ? buildsOf(row.repo, b.key) : [];
                      if (builds.length) {
                        return (
                          <td key={b.key} className="py-3 pr-4">
                            <BuildCell builds={builds} />
                          </td>
                        );
                      }
                      const can = possible(row.family, b.key, row.source);
                      return (
                        <td key={b.key} className="py-3 pr-4">
                          {can ? <Badge state="todo" /> : <span className="text-ink-soft">—</span>}
                          {can && npuBackends.has(b.key) && <span className="mt-1 block text-xs text-ink-soft">compiled per chip</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Windows are context lengths in tokens (2k = 2,048). {runtimeNotes.gate} A dash means ExecuTorch {executorchVersion} has no path for that model on that accelerator.
            Every repo also carries the tokenizer at its root and a <code>config.json</code> per backend folder that the apps read. The file list is
            generated from the Hugging Face API; the newest change it saw was on {publishedAsOf}.
          </p>
        </Section>

        <Section
          id="chips"
          title="Chips ExecuTorch can export to"
          lede={`XNNPACK and Vulkan files run on any Android phone. NPU files are compiled for one chip and load only on that chip, so every chip is its own export. These are the chips each NPU delegate in ExecuTorch ${executorchVersion} can compile for.`}
        >
          <div className="space-y-12">
            {chipBackends.map((b) => (
              <div key={b.key}>
                <h3 className="wide text-xl font-bold tracking-tight">{b.name}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
                  {b.summary} Source: <A href={etFile(b.source)}><code>{b.source}</code></A>.
                </p>
                <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={`${b.name} chips, scrolls sideways on small screens`}>
                  <table className="w-full min-w-[40rem] border-collapse text-sm">
                    <thead className="text-left text-ink-soft">
                      <tr className="border-b border-rule">
                        <th className="py-2 pr-4 font-normal">Chip</th>
                        <th className="py-2 pr-4 font-normal">Product</th>
                        <th className="py-2 pr-4 font-normal">Architecture</th>
                        <th className="py-2 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...b.chips]
                        .sort((x, y) => Number(x.kind !== "phone") - Number(y.kind !== "phone"))
                        .map((c) => (
                          <tr key={c.id} className={`border-b border-rule align-top ${c.kind === "phone" ? "" : "text-ink-soft"}`}>
                            <td className="py-2.5 pr-4 font-medium">
                              <code>{c.id}</code>
                            </td>
                            <td className="py-2.5 pr-4">{c.name}</td>
                            <td className="py-2.5 pr-4">{c.arch ?? "—"}</td>
                            <td className="py-2.5">
                              <ChipBadge status={c.status} />
                              {c.note && <span className="mt-1 block text-xs leading-5 text-ink-soft">{c.note}</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="sources" title="Sources">
          <p className="max-w-2xl text-sm leading-6 text-ink-soft">
            What ExecuTorch can export is read from its source at the <A href={execupackLinks.executorch}>v{executorchVersion} tag</A>, which defines the
            registries below. execupack pins the same version because a newer exporter can emit methods the apps&apos; runtime lacks. Decisions and
            measurements behind each backend are in execupack&apos;s <A href={execupackLinks.plan}>plan</A>.
          </p>
          <table className="mt-6 w-full max-w-4xl border-collapse text-sm">
            <tbody>
              {sources.map((s) => (
                <tr key={s.file} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-6">
                    <A href={etFile(s.file)}>
                      <code className="break-all">{s.file}</code>
                    </A>
                  </td>
                  <td className="py-2.5 text-ink-soft">{s.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="wide mt-10 text-xl font-bold tracking-tight">Left out on purpose</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">The same registries list these, and execupack does not export them:</p>
          <table className="mt-4 w-full max-w-4xl border-collapse text-sm">
            <tbody>
              {excluded.map((e) => (
                <tr key={e.what} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-6">{e.what}</td>
                  <td className="py-2.5 text-ink-soft">{e.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-soft">
            iOS accelerators (Core ML, MPS) are outside this page: execupack exports for Android only, and iOS is deferred.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
