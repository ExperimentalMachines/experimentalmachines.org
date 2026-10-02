import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { execuserve } from "@/lib/execuserve";

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

function Section({ id, title, lede, plate, children }: { id: string; title: string; lede?: string; plate?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-14 border-t border-rule ${plate ? "bg-plate" : ""}`}>
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

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-md border border-rule bg-plate p-4 text-sm leading-6">
    <code>{children}</code>
  </pre>
);

export default function ExecuServe() {
  return (
    <>
      <Nav />
      <main>
        <section id="top" className="scroll-mt-14">
          <div className="mx-auto max-w-6xl px-6 pb-12 pt-14 sm:pt-20">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img src="/execuserve/lockup.svg" alt="ExecuServe" width={471} height={96} className="h-auto w-56 sm:w-72" />
            <h1 className="wide mt-8 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">ExecuTorch models, served from your phone.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
              ExecuServe keeps compiled <A href={execuserve.links.executorch}>ExecuTorch</A> models loaded on an Android phone and answers the OpenAI and
              Anthropic APIs over HTTP, in the background, for any app on the phone or, if you allow it, on your network. llama.cpp has{" "}
              <code className="text-ink">llama-server</code> for GGUF files; nothing equivalent existed for <code className="text-ink">.pte</code> exports,
              which on current phones are the fast path.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <a href={execuserve.links.repo} target="_blank" rel="noreferrer" className="rounded-md bg-ink px-4 py-2.5 font-medium text-bench hover:bg-blue-deep">
                Source on GitHub
              </a>
              <a href="#start" className="rounded-md border border-rule bg-plate px-4 py-2.5 font-medium hover:border-blue">
                Quick start
              </a>
              <a href="/execuserve/privacy/" className="rounded-md px-4 py-2.5 text-ink-soft hover:text-ink">
                Privacy policy
              </a>
            </div>
            <p className="mt-6 text-sm text-ink-soft">{execuserve.status}</p>
          </div>
          <div className="mx-auto max-w-6xl px-6 pb-14">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/execuserve/chat.png"
              alt="The browser chat served by the phone: a reply from Qwen3 1.7B running on the device, with its prefill and decode rates"
              width={1360}
              height={820}
              className="h-auto w-full rounded-md border border-rule"
            />
            <p className="mt-3 text-sm text-ink-soft">The browser chat, served by the phone and answering from Qwen3 1.7B running on it.</p>
          </div>
        </section>

        <Section id="different" title="What it does" plate>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {execuserve.points.map((p) => (
              <div key={p.title}>
                <dt className="font-bold">{p.title}</dt>
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
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Method and raw results: <A href={execuserve.links.results}>the POCO X8 Pro Max report</A>. The decode advantage of the XNNPACK export over
            llama.cpp was measured in <A href={execuserve.links.openweights}>OpenWeights</A>, on whose ExecuTorch engine ExecuServe is built.
          </p>
        </Section>

        <Section id="start" title="Quick start" lede="An arm64 phone on Android 12 or later, adb on your computer, and an ExecuTorch export with its tokenizer." plate>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm text-ink-soft">From a clone of the repository, with the app installed:</p>
              <Code>{execuserve.quickstart.shell}</Code>
            </div>
            <div>
              <p className="mb-3 text-sm text-ink-soft">Then any OpenAI client:</p>
              <Code>{execuserve.quickstart.python}</Code>
            </div>
          </div>
          <p className="mt-6 max-w-2xl leading-7 text-ink-soft">
            The script pushes the model, starts the server, forwards the port over adb, and prints the base URL and key. Anthropic SDKs, Open WebUI, the codex
            CLI and other apps on the same phone work too; the <A href={execuserve.links.readme}>README</A> has the settings for each.
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

        <Section id="privacy" title="Private by construction" plate>
          <p className="max-w-2xl leading-7 text-ink-soft">
            No account, no analytics, no crash reporter and no server of ours. Prompts and replies are answered on the phone and never sent to us; the run
            history keeps figures, never what was asked. Every request needs a key, loopback included, and the browser chat is served under a strict
            Content-Security-Policy. The <a href="/execuserve/privacy/" className="text-blue hover:text-blue-deep">privacy policy</a> says exactly what stays
            and what leaves.
          </p>
        </Section>

        <Section id="next" title="Open source, and what comes next">
          <p className="max-w-2xl leading-7 text-ink-soft">
            Apache-2.0, on <A href={execuserve.links.repo}>GitHub</A>. The server core is Kotlin Multiplatform and already compiles for iOS; next are the iOS
            app, the other ExecuTorch backends (Vulkan, QNN, MediaTek), server-side tools, vision input, and TLS for network mode. Not affiliated with, endorsed
            by or sponsored by the PyTorch Foundation or Meta.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
