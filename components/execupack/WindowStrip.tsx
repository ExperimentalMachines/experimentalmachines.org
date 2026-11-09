// A model's context windows on one target, as a row of blocks: one block per window execupack builds,
// smallest on the left, filled where a file exists. A gap in the row is a window that did not build or
// was not published, which a range like "2k–32k" would hide. No hooks, so the server-rendered page and
// the model finder can both use it.

export const k = (w: number) => (w >= 1024 ? `${w / 1024}k` : `${w}`);

// "2k, 4k and 8k", for the screen reader that cannot see the blocks.
export const spoken = (windows: number[]) => {
  const names = windows.map(k);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
};

export default function WindowStrip({ windows, slots }: { windows: number[]; slots: number[] }) {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      {slots.map((w) => (
        <span key={w} className={`h-3 w-3.5 rounded-[3px] ${windows.includes(w) ? "bg-blue" : "bg-ink/[0.07]"}`} />
      ))}
    </span>
  );
}

// The key to the strip, drawn at a size its labels fit under.
export function WindowKey({ slots }: { slots: number[] }) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 text-xs text-ink-soft">
      <span aria-hidden className="inline-flex gap-1">
        {slots.map((w) => (
          <span key={w} className="flex w-8 flex-col items-center gap-1">
            <span className="h-3 w-full rounded-[3px] bg-blue" />
            <span className="tabular-nums">{k(w)}</span>
          </span>
        ))}
      </span>
      <span className="max-w-sm leading-5">
        Each block is one context window, in tokens. A filled block is a published file; an empty one was not built or not published. Only
        MediaTek&apos;s column has a 512 block, because no other target is built at 512.
      </span>
    </div>
  );
}
