// The four phones of the window and reruns studies, each with one colour and
// one marker shape on every chart, so colour is never the only cue. The colours
// were checked as a set on white (dataviz validate_palette.js, all pairs): every
// pair clears the normal-vision floor and 3:1 contrast; the magenta and green
// pair sits in the colour-blind warning band, which the shapes cover.

export type ChipId = "D9400" | "8 Elite" | "Tensor G5" | "Exynos 2400";
export type Shape = "circle" | "square" | "diamond" | "triangle";

export const chips: { id: ChipId; name: string; where: string; color: string; shape: Shape }[] = [
  { id: "D9400", name: "Dimensity 9400", where: "Poco, in hand", color: "#d97706", shape: "circle" },
  { id: "8 Elite", name: "Snapdragon 8 Elite", where: "Galaxy S25 Ultra, Test Lab", color: "#2b44e6", shape: "square" },
  { id: "Tensor G5", name: "Tensor G5", where: "Pixel 10 Pro XL, Test Lab", color: "#0f9f6e", shape: "diamond" },
  { id: "Exynos 2400", name: "Exynos 2400", where: "Galaxy S24+, Test Lab", color: "#c0397a", shape: "triangle" },
];

export const chip = (id: string) => chips.find((c) => c.id === id);

// A chip's marker centred on (x, y). Filled for a first run; hollow (fill
// "none", a thicker stroke in the chip's colour) for a second run of a file.
export function Mark({
  shape,
  x,
  y,
  r,
  fill,
  stroke,
  strokeWidth,
  ...rest
}: { shape: Shape; x: number; y: number; r: number; fill: string; stroke: string; strokeWidth: number } & React.SVGProps<SVGElement>) {
  const common = { fill, stroke, strokeWidth, ...rest } as React.SVGProps<SVGRectElement & SVGPolygonElement & SVGCircleElement>;
  if (shape === "square") return <rect x={x - r} y={y - r} width={2 * r} height={2 * r} {...common} />;
  if (shape === "diamond") return <polygon points={`${x},${y - r * 1.3} ${x + r * 1.3},${y} ${x},${y + r * 1.3} ${x - r * 1.3},${y}`} {...common} />;
  if (shape === "triangle") return <polygon points={`${x},${y - r * 1.25} ${x + r * 1.2},${y + r * 0.9} ${x - r * 1.2},${y + r * 0.9}`} {...common} />;
  return <circle cx={x} cy={y} r={r} {...common} />;
}

// A legend entry: the chip's marker and its name.
export function ChipKey({ id }: { id: ChipId }) {
  const c = chip(id)!;
  return (
    <span className="inline-flex items-center gap-2">
      <svg aria-hidden width={14} height={14} viewBox="0 0 14 14">
        <Mark shape={c.shape} x={7} y={7} r={4.5} fill={c.color} stroke={c.color} strokeWidth={0} />
      </svg>
      {c.name}
    </span>
  );
}
