import { people, site } from "@/lib/content";

export default function People() {
  return (
    <section id="contact" className="scroll-mt-14 border-t border-rule bg-plate">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:py-20 md:grid-cols-2">
        <div>
          <h2 className="wide text-4xl font-bold tracking-tight sm:text-5xl">
            Have a claim worth testing?
          </h2>
          <a
            href={`mailto:${site.email}`}
            className="mt-5 inline-block text-lg text-blue underline underline-offset-4 hover:text-blue-deep"
          >
            {site.email}
          </a>
        </div>
        <ul className="self-end text-sm">
          {people.map((p) => (
            <li
              key={p.name}
              className="flex justify-between gap-6 border-b border-rule py-3"
            >
              <span>
                <span className="font-medium">{p.name}</span>
                <span className="text-ink-soft"> {p.role}</span>
              </span>
              <span className="flex shrink-0 gap-4">
                {p.email && (
                  <a
                    href={`mailto:${p.email}`}
                    className="text-blue hover:text-blue-deep"
                  >
                    Email
                  </a>
                )}
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue hover:text-blue-deep"
                >
                  LinkedIn
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
