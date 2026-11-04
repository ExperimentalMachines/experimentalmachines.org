// Small pieces the homepage's sections share.

export const link = "text-blue-deep underline decoration-blue/40 underline-offset-4 hover:decoration-blue";

export const h2 = "display text-4xl font-normal leading-[1.05] tracking-[-0.03em] sm:text-5xl";

export const lede = "text-lg leading-8 text-ink-soft";

// A project's name, with its mark where it has one, and its status.
export function ProjectLabel({
  name,
  status,
  mark,
  pending,
}: {
  name: string;
  status: string;
  mark?: string;
  pending?: boolean;
}) {
  return (
    <p className="flex items-center gap-3 text-base">
      {mark && (
        // eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files
        <img src={mark} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
      )}
      <span className="font-medium">{name}</span>
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs text-ink-soft ${
          pending ? "border-dashed border-ink/30" : "border-rule"
        }`}
      >
        {status}
      </span>
    </p>
  );
}

// A card's title link: blue and underlined so it reads as a link, and stretched over the whole card
// (the card is `group relative`), so the card clicks anywhere while a screen reader hears only the title.
export const cardLink =
  "text-blue-deep underline decoration-blue/30 after:absolute after:inset-0 group-hover:decoration-blue focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-blue";
