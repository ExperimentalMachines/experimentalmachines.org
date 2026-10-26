import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { h2, lede as ledeClass, link, ProjectLabel } from "@/components/home/ui";
import { execuserve } from "@/lib/execuserve";
import { links, projects } from "@/lib/home";

export const metadata: Metadata = {
  title: "ExecuServe: ExecuTorch models, served from your phone",
  description:
    "An OpenAI- and Anthropic-compatible server for compiled ExecuTorch models, running in the background on Android. Open source, by Experimental Machines.",
  openGraph: {
    title: "ExecuServe",
    description: "ExecuTorch models, served from your phone: an OpenAI- and Anthropic-compatible server running in the background on Android.",
    url: "/execuserve/",
    images: ["/execuserve/chat.png"],
  },
};

function Section({ id, title, lede, tint, children }: { id: string; title: string; lede?: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className={h2}>{title}</h2>
        {lede && <p className={`${ledeClass} mt-5 max-w-3xl`}>{lede}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

// The homepage's dark code card.
const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-2xl bg-[#0e1638] p-5 text-[0.82rem] leading-6 text-white sm:p-6">
    <code>{children}</code>
  </pre>
);

const status = projects.find((p) => p.id === "execuserve")!.status;

export default function ExecuServe() {
  const l = execuserve.links;
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20">
          <ProjectLabel name="ExecuServe" status={status} mark="/execuserve/mark.svg" />
          <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            ExecuTorch models, served from your phone.
          </h1>
          <p className={`${ledeClass} mt-6 max-w-3xl`}>
            ExecuServe keeps compiled{" "}
            <Go href={l.executorch} className={link}>
              ExecuTorch
            </Go>{" "}
            models loaded on an Android phone and answers the OpenAI and Anthropic APIs over HTTP, in the background, for any app on the phone or, if you
            allow it, on your network. llama.cpp has <code className="text-ink">llama-server</code> for GGUF files; nothing equivalent existed for{" "}
            <code className="text-ink">.pte</code> exports, which on current phones are the fast path.
          </p>
          <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-base">
            <a
              href={links.execuservePlay}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#c4381c] px-6 py-3 font-medium text-white hover:bg-[#a52f17]"
            >
              Get it on Google Play
            </a>
            <Go href={l.repo} className={link}>
              Source on GitHub
            </Go>
            <a href="#start" className={link}>
              Quick start
            </a>
            <Go href="/execuserve/privacy/" className={link}>
              Privacy policy
            </Go>
          </p>
          <p className="mt-6 text-sm text-ink-soft">{execuserve.status}</p>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24">
          <figure className="overflow-hidden rounded-[1.75rem] border border-rule bg-bench">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/execuserve/chat.png"
              alt="The browser chat served by the phone: a reply from Qwen3 1.7B running on the device, with its prefill and decode rates"
              width={1360}
              height={820}
              className="h-auto w-full"
            />
            <figcaption className="border-t border-rule bg-white px-5 py-4 text-sm leading-6 text-ink-soft">
              The browser chat, served by the phone and answering from Qwen3 1.7B running on it.
            </figcaption>
          </figure>
        </div>
      </section>

      <Section id="different" title="What it does" tint>
        <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {execuserve.points.map((p) => (
            <div key={p.title} className="border-t-2 border-blue pt-4">
              <dt className="display text-xl">{p.title}</dt>
              <dd className="mt-2 leading-7 text-ink-soft">{p.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="measured" title="Measured on a phone" lede={`On a ${execuserve.phone}, over Wi-Fi, with the minified release build.`}>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Phone results, scrolls sideways on small screens">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead className="text-left text-ink-soft">
              <tr className="border-b border-rule">
                <th className="py-2 pr-4 font-normal">Check</th>
                <th className="py-2 font-normal">Result</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {execuserve.measured.map((m) => (
                <tr key={m.check} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-4">{m.check}</td>
                  <td className="py-2.5">{m.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
          Method and raw results:{" "}
          <Go href={l.results} className={link}>
            the POCO X8 Pro Max report
          </Go>
          . The decode advantage of the XNNPACK export over llama.cpp was measured in{" "}
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
          , on whose ExecuTorch engine ExecuServe is built.
        </p>
      </Section>

      <Section id="start" title="Quick start" lede="An arm64 phone on Android 12 or later, adb on your computer, and an ExecuTorch export with its tokenizer." tint>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* min-w-0, so a long command scrolls inside its card instead of widening the page. */}
          <div className="min-w-0">
            <p className="mb-3 text-sm text-ink-soft">From a clone of the repository, with the app installed:</p>
            <Code>{execuserve.quickstart.shell}</Code>
          </div>
          <div className="min-w-0">
            <p className="mb-3 text-sm text-ink-soft">Then any OpenAI client:</p>
            <Code>{execuserve.quickstart.python}</Code>
          </div>
        </div>
        <p className="mt-6 max-w-3xl leading-7 text-ink-soft">
          The script pushes the model, starts the server, forwards the port over adb, and prints the base URL and key. Anthropic SDKs, Open WebUI, the codex
          CLI and other apps on the same phone work too; the{" "}
          <Go href={l.readme} className={link}>
            README
          </Go>{" "}
          has the settings for each.
        </p>
      </Section>

      <Section id="api" title="The API" lede="OpenAI's and Anthropic's shapes, error codes and streaming, checked with their official SDKs.">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="API endpoints, scrolls sideways on small screens">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <tbody>
              {execuserve.endpoints.map((e) => (
                <tr key={e.path} className="border-b border-rule align-top">
                  <td className="whitespace-nowrap py-2.5 pr-6 font-mono text-[13px]">{e.path}</td>
                  <td className="py-2.5 text-ink-soft">{e.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="privacy" title="Private by construction" tint>
        <p className={`${ledeClass} max-w-3xl`}>
          No account, no analytics, no crash reporter and no server of ours. Prompts and replies are answered on the phone and never sent to us; the run
          history keeps figures, never what was asked. Every request needs a key, loopback included, and the browser chat is served under a strict
          Content-Security-Policy. The{" "}
          <Go href="/execuserve/privacy/" className={link}>
            privacy policy
          </Go>{" "}
          says exactly what stays and what leaves.
        </p>
      </Section>

      <Section id="next" title="Open source, and what comes next">
        <p className={`${ledeClass} max-w-3xl`}>
          Apache-2.0, on{" "}
          <Go href={l.repo} className={link}>
            GitHub
          </Go>
          . The server core is Kotlin Multiplatform and already compiles for iOS; next are the iOS app, server-side tools, vision input, and TLS for network
          mode. Not affiliated with, endorsed by or sponsored by the PyTorch Foundation or Meta.
        </p>
      </Section>
    </main>
  );
}
