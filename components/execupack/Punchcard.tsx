// ExecuPack's cover: every published build at once, one row per model and one block per context window
// on each target, lit where the file exists. Drawn in ExecuPack's own colours, from its mark, the way a
// research cover is drawn in its project's. The count above it is real text; the card itself is decoration.

export type PunchRow = { name: string; lit: number[][] };

const bg = "#262626";
const accent = "#EE4C2C";

export default function Punchcard({
  builds,
  models,
  rows,
  groups,
}: {
  builds: number;
  models: number;
  rows: PunchRow[];
  // One per target, with the windows that target is built at: MediaTek's has 512, the others start at 2k.
  groups: { label: string; slots: number[] }[];
}) {
  const widths = groups.map((g) => `${g.slots.length}fr`).join(" ");
  return (
    <div className="flex flex-col gap-10 rounded-[1.75rem] p-7 text-white sm:p-9" style={{ backgroundColor: bg }}>
      <div>
        <p className="display text-6xl font-medium leading-none tracking-[-0.03em] sm:text-7xl">{builds} builds</p>
        <p className="mt-3 max-w-md text-base leading-snug text-white/85">
          of {models} open models: one per context window, for phone CPUs, GPUs and two NPUs.
        </p>
      </div>
      <div aria-hidden>
        <div className="grid gap-2.5 sm:gap-4" style={{ gridTemplateColumns: widths }}>
          {groups.map((g, gi) => (
            <div key={g.label} className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${g.slots.length}, minmax(0, 1fr))` }}>
              {rows.flatMap((r) =>
                g.slots.map((w) => (
                  <span
                    key={`${r.name}-${w}`}
                    className="h-[7px] rounded-[2px] sm:h-[9px]"
                    style={{ backgroundColor: r.lit[gi].includes(w) ? accent : "rgba(255,255,255,0.09)" }}
                  />
                )),
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2.5 text-xs text-white/65 sm:gap-4" style={{ gridTemplateColumns: widths }}>
          {groups.map((g) => (
            <span key={g.label} className="truncate">
              {g.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
