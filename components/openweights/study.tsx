// The opening facts and the findings of an OpenWeights study page. Kept to a line each because a
// reader decides from these whether to read on; the detail lives in each page's method section.

export function Facts({ items }: { items: [label: string, value: string][] }) {
  return (
    <dl className="mt-12 grid max-w-5xl gap-x-10 gap-y-5 border-t border-rule pt-6 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-ink-soft">{label}</dt>
          <dd className="mt-1 text-lg leading-7">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Findings({ items, four }: { items: { headline: string; line: string }[]; four?: boolean }) {
  return (
    <ul className={`grid gap-x-12 gap-y-10 sm:grid-cols-2 ${four ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {items.map((f) => (
        <li key={f.headline} className="border-t-2 border-blue pt-4">
          <p className="display text-balance text-2xl leading-tight">{f.headline}</p>
          <p className="mt-2 max-w-sm leading-7 text-ink-soft">{f.line}</p>
        </li>
      ))}
    </ul>
  );
}
