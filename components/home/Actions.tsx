import Go from "@/components/home/Go";

// The one way a row of links looks on this site: buttons, not underlined words, because a passive reader
// took those for plain text. A section's main action stays filled in its own colour and sits first in the row.

const shape = "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-center text-sm font-medium transition-colors";

export const secondaryButton = `${shape} border border-ink/20 bg-white text-ink hover:border-ink`;

export const Actions = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>{children}</div>
);

export function Action({ href, context, children }: { href: string; context?: string; children: React.ReactNode }) {
  return (
    <Go href={href} className={secondaryButton}>
      {/* "Source" alone is ambiguous to a screen reader moving between links. */}
      {context && <span className="sr-only">{context} </span>}
      {children}
    </Go>
  );
}

export function PrimaryAction({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return (
    <Go href={href} className={`${shape} ${className}`}>
      {children}
    </Go>
  );
}
