import Link from "next/link";
import type { HardwareClass } from "@/lib/content";

export default function ClassSection({
  cls,
  plate,
}: {
  cls: HardwareClass;
  plate?: boolean;
}) {
  return (
    <section
      id={cls.id}
      className={`scroll-mt-14 border-t border-rule ${plate ? "bg-plate" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <h2 className="wide text-4xl font-bold tracking-tight sm:text-5xl">
          {cls.title}
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">{cls.lede}</p>
        <table className="mt-8 w-full border-collapse text-sm">
          <thead className="text-left text-ink-soft">
            <tr className="border-b border-rule">
              <th className="py-2 pr-4 font-normal">Repository</th>
              <th className="hidden py-2 pr-4 font-normal sm:table-cell">
                What was measured
              </th>
              <th className="py-2 font-normal sm:text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {cls.rows.map((r) => (
              <tr key={r.repo} className="border-b border-rule align-top">
                <td className="py-3 pr-4">
                  {r.href.startsWith("/") ? (
                    <Link href={r.href} className="font-medium text-blue hover:text-blue-deep">
                      {r.repo}
                    </Link>
                  ) : (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue hover:text-blue-deep"
                    >
                      {r.repo}
                    </a>
                  )}
                  <div className="mt-1 text-ink-soft sm:hidden">{r.measured}</div>
                </td>
                <td className="hidden py-3 pr-4 text-ink-soft sm:table-cell">
                  {r.measured}
                </td>
                <td className={`py-3 sm:w-[17rem] sm:text-right ${/\d/.test(r.result) ? "font-medium" : "text-ink-soft"}`}>
                  {r.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
