// A measured comparison drawn as bars, to scale. Lower is better for every
// figure we show this way, so the shortest bar is the highlighted one, unless
// `highlight` names the row the caption is about.
export default function Bars({
  rows,
  caption,
  highlight,
}: {
  rows: { label: string; value: number; shown: string }[];
  caption: React.ReactNode;
  highlight?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  const min = Math.min(...rows.map((r) => r.value));
  const on = (r: { label: string; value: number }) => (highlight ? r.label === highlight : r.value === min);
  return (
    <figure>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr]">
            <span className="text-ink-soft">{r.label}</span>
            <span className="flex items-center gap-3">
              <span
                className={`h-2.5 rounded-full ${on(r) ? "bg-blue" : "bg-ink/15"}`}
                style={{ width: `${(r.value / max) * 70}%` }}
              />
              <span className={`shrink-0 tabular-nums ${on(r) ? "font-medium" : "text-ink-soft"}`}>
                {r.shown}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-4 text-sm leading-6 text-ink-soft">{caption}</figcaption>
    </figure>
  );
}
