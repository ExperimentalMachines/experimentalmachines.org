import Go from "@/components/home/Go";
import { site } from "@/lib/content";
import { team, work, type Member } from "@/lib/home";

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const initials = (name: string) => {
  const parts = name.split(" ");
  return `${parts[0][0]}${parts.at(-1)![0]}`;
};

function Portrait({ m }: { m: Member }) {
  if (m.photo) {
    // eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files
    return <img src={m.photo} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" />;
  }
  return (
    <span
      aria-hidden
      className={`display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-medium text-white ${
        m.role === "Co-Founder" ? "bg-blue" : "bg-[#0e1638]"
      }`}
    >
      {initials(m.name)}
    </span>
  );
}

export default function Team() {
  return (
    <>
      <section id="people" className="scroll-mt-28 lg:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="display max-w-3xl text-4xl font-normal leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Built by {words[team.length] ?? team.length} people.
          </h2>
          {/* Four to a row at full width, so the founders fill the first row and the rest follow. Each person
              is one stretched link, which keeps the tap target large while the row stays small. */}
          <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {team.map((m) => (
              <li key={m.name} className="group relative flex items-center gap-4">
                <Portrait m={m} />
                <div className="min-w-0">
                  <p className="display text-lg leading-tight tracking-[-0.01em] group-hover:text-blue-deep">{m.name}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-soft">
                    <span>{m.role}</span>
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline decoration-rule underline-offset-4 after:absolute after:inset-0 group-hover:decoration-ink"
                    >
                      LinkedIn
                      <span className="sr-only">, {m.name}</span>
                    </a>
                  </p>
                </div>
              </li>
            ))}
            {/* The open seat turns a list of names into an invitation, and leads into the section below. */}
            <li className="group relative flex items-center gap-4 sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <span aria-hidden className="display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-ink/30 text-lg text-ink-soft group-hover:border-ink">
                ?
              </span>
              <div className="min-w-0">
                <p className="display text-lg leading-tight tracking-[-0.01em]">
                  <a href="#contact" className="text-blue-deep underline decoration-blue/30 underline-offset-4 after:absolute after:inset-0 group-hover:decoration-blue">
                    This could be you.
                  </a>
                </p>
                <p className="mt-1 text-sm text-ink-soft">Ship something with us and your name goes here.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* The page closes as it opens, in cobalt: the invitation is the last thing a reader should see. */}
      <section id="contact" className="on-blue scroll-mt-28 bg-blue text-white lg:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-base font-medium text-white/85">Work with us</p>
          <h2 className="display mt-4 max-w-5xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-7xl">
            Test what others assume.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            Everyone has a theory about what a phone can run. Bring yours, and we&apos;ll put it on real hardware and find out.
          </p>

          <ul className="mt-14 border-t border-white/25">
            {work.map((w) => (
              <li
                key={w.have}
                className="group relative grid gap-x-10 gap-y-2 border-b border-white/25 py-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)_8rem] lg:items-center"
              >
                <p className="display text-2xl leading-tight tracking-[-0.02em] decoration-white/50 underline-offset-[6px] group-hover:underline sm:text-3xl">{w.have}</p>
                <p className="max-w-xl leading-7 text-white/90">{w.offer}</p>
                <Go
                  href={w.href}
                  className="mt-2 justify-self-start whitespace-nowrap text-sm font-medium underline decoration-white/50 underline-offset-4 after:absolute after:inset-0 group-hover:decoration-white lg:mt-0 lg:justify-self-end"
                >
                  {w.label}
                </Go>
              </li>
            ))}
          </ul>

          <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-xl text-lg leading-8">
              Three lines is enough: what you want to test, on what, and why. It goes straight to Alpha, not a form.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="self-start rounded-full bg-white px-6 py-4 text-base font-medium text-blue-deep hover:bg-white/90 sm:text-lg lg:self-auto"
            >
              {site.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
