"use client";

import { useEffect, useState } from "react";

// Orientation for a long post: a thin line under the site header showing how far through it the reader is, and on
// wide screens a rail of the post's sections in the left margin, the current one marked. Both are quiet and neither
// covers a heading.
export function PostNav({ sections }: { sections: { id: string; short: string }[] }) {
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      // The current section is the last whose top has passed a third of the way down the screen.
      let here: string | null = null;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight / 3) here = s.id;
      }
      setCurrent(here);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);
  return (
    <>
      <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
        <div className="h-full origin-left bg-white/90" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <nav aria-label="On this page" className="fixed left-6 top-36 z-10 hidden w-36 2xl:left-12 xl:block">
        <ol className="space-y-2.5 border-l border-rule">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={current === s.id ? "location" : undefined}
                className={`-ml-px block border-l-2 pl-3 text-[13px] leading-5 transition-colors ${current === s.id ? "border-blue font-medium text-blue-deep" : "border-transparent text-ink-soft hover:text-ink"}`}
              >
                {s.short}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
