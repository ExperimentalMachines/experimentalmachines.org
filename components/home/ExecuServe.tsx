import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { links } from "@/lib/home";

const code = `from openai import OpenAI

client = OpenAI()  # reads OPENAI_BASE_URL and OPENAI_API_KEY
reply = client.chat.completions.create(
    model="qwen3-1.7b",
    messages=[{"role": "user", "content": "Hello"}],
)`;

export default function ExecuServe() {
  return (
    <section id="execuserve" className="scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <ProjectLabel name="ExecuServe" status="On Google Play" mark="/execuserve/mark.svg" />
            <h2 className={`${h2} mt-6`}>Your phone is the server.</h2>
          </div>
          <p className={`${lede} max-w-xl`}>
            ExecuServe turns an Android phone into a local AI server. It keeps compiled models loaded and answers the
            OpenAI and Anthropic APIs, for apps on the phone or, if you allow it, on your network. It runs CPU and GPU
            builds, and NPU builds made for the phone&apos;s own chip.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-stretch">
          <figure className="flex flex-col overflow-hidden rounded-[1.75rem] bg-bench">
            <div className="flex flex-1 items-end justify-center px-8 pt-8">
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
              <img
                src="/home/execuserve-phone-chat.png"
                alt="ExecuServe's Chat tab on a phone: two haiku from qwen3-1.7b, each with its prefill and decode speed"
                width={600}
                height={1181}
                loading="lazy"
                className="h-auto max-h-[440px] w-full max-w-[260px] rounded-t-[1.5rem] border-x-[5px] border-t-[5px] border-white object-cover object-top"
              />
            </div>
            <figcaption className="border-t border-rule bg-white px-5 py-4 text-sm leading-6 text-ink-soft">
              The app, with a chat for trying any installed model.
            </figcaption>
          </figure>
          <figure className="min-w-0 overflow-hidden rounded-[1.75rem] border border-rule bg-bench">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/execuserve/chat.png"
              alt="ExecuServe's browser chat: a question answered by qwen3-1.7b running on the phone, with its prefill and decode speed"
              width={1360}
              height={820}
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="border-t border-rule bg-white px-5 py-4 text-sm leading-6 text-ink-soft">
              A laptop using the browser chat built into the server, answered by Qwen3 1.7B on the phone.
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="min-w-0 rounded-[1.75rem] bg-[#0e1638] p-6 text-white sm:p-8">
            <p className="text-sm leading-6 text-white/70">
              Call it with the OpenAI SDK you already use: set OPENAI_BASE_URL to the address the app shows, and
              OPENAI_API_KEY to its key.
            </p>
            <pre className="mt-4 overflow-x-auto text-[0.82rem] leading-6">
              <code>{code}</code>
            </pre>
          </div>
          <div className="flex flex-col rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <p className="text-sm font-medium">Time to the first token, ~700-token prompt</p>
            <div className="mt-5">
              <Bars
                rows={[
                  { label: "NPU (Qualcomm)", value: 0.41, shown: "0.41 s" },
                  { label: "GPU", value: 1.0, shown: "1.0 s" },
                  { label: "CPU", value: 2.0, shown: "2.0 s" },
                ]}
                caption={
                  <>
                    Qwen3 1.7B on a Snapdragon 8 Elite Gen 5, through ExecuServe.{" "}
                    <Go href={links.execuserveNpu} className={link}>
                      The NPU report
                    </Go>
                  </>
                }
              />
            </div>
            <p className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-8 text-base">
              <a
                href={links.execuservePlay}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#c4381c] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a52f17]"
              >
                Get it on Google Play
              </a>
              <Go href={links.execuserve} className={link}>
                About ExecuServe
              </Go>
              <Go href={links.execuserveRepo} className={link}>
                <span className="sr-only">ExecuServe </span>Source
              </Go>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
