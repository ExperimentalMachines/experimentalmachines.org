import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { openweights } from "@/lib/openweights";

export const metadata: Metadata = {
  title: "OpenWeights: open-weight models on your Android phone",
  description:
    "Search Hugging Face from inside the app, find out whether a model will run on your phone before you download it, and chat with it on the device. No account, no cloud, no telemetry.",
  openGraph: {
    title: "OpenWeights",
    description: "Run open-weight language models on your Android phone. No account, no cloud, no telemetry.",
    url: "/openweights/",
    images: ["/home/openweights-chat.png"],
  },
};

function Section({ id, title, plate, children }: { id: string; title: string; plate?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-14 border-t border-rule ${plate ? "bg-plate" : ""}`}>
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
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

export default function OpenWeights() {
  const { links } = openweights;
  return (
    <>
      <Nav />
      <main>
        <section id="top" className="scroll-mt-14">
          <div className="mx-auto grid max-w-6xl items-end gap-12 px-6 pb-14 pt-14 sm:pt-20 lg:grid-cols-[1fr_16rem]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
              <img src="/home/openweights-icon.png" alt="" width={512} height={512} className="h-16 w-16 rounded-2xl" />
              <p className="mt-6 text-lg font-medium">OpenWeights</p>
              <h1 className="wide mt-2 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Run open-weight language models on your Android phone.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
                Search Hugging Face from inside the app, find out whether a model will actually run on your device before you download it, and chat with it.
                Every token is produced by your own hardware: no account, no cloud, no telemetry. GGUF files run in llama.cpp and compiled{" "}
                <code className="text-ink">.pte</code> files in ExecuTorch, both in the same app.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <a href={links.play} target="_blank" rel="noreferrer" className="rounded-md bg-ink px-4 py-2.5 font-medium text-bench hover:bg-blue-deep">
                  Get it on Google Play
                </a>
                <a href={links.repo} target="_blank" rel="noreferrer" className="rounded-md border border-rule bg-plate px-4 py-2.5 font-medium hover:border-blue">
                  Source on GitHub
                </a>
                <a href={links.privacy} className="rounded-md px-4 py-2.5 text-ink-soft hover:text-ink">
                  Privacy policy
                </a>
              </div>
              <p className="mt-6 text-sm text-ink-soft">
                {openweights.status} · <A href={links.ios}>iPhone, experimental</A>
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/home/openweights-chat.png"
              alt="OpenWeights on a phone with LFM2.5 1.2B loaded, ready for a first message"
              width={600}
              height={1222}
              className="hidden h-auto w-full rounded-[1.75rem] border border-rule lg:block"
            />
          </div>
        </section>

        <Section id="research" title="Research and benchmarks" plate>
          <ul className="border-t border-rule">
            {openweights.research.map((r) => {
              const title = <span className="wide text-xl font-bold tracking-tight">{r.title}</span>;
              return (
                <li key={r.href} className="border-b border-rule py-6">
                  <p className="text-sm text-ink-soft">{r.date}</p>
                  <p className="mt-1">
                    {r.href.startsWith("/") ? (
                      <Link href={r.href} className="hover:text-blue-deep">
                        {title}
                      </Link>
                    ) : (
                      <a href={r.href} className="hover:text-blue-deep">
                        {title}
                      </a>
                    )}
                  </p>
                  <p className="mt-2 max-w-2xl leading-7 text-ink-soft">{r.line}</p>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section id="source" title="Open source">
          <p className="max-w-2xl leading-7 text-ink-soft">
            Apache-2.0, on <A href={links.repo}>GitHub</A>, where problems can be <A href={links.issues}>reported</A>. Models are published by third parties
            and their licences are their own.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
