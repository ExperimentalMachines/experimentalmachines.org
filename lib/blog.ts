// The blog's posts, in reading order. The first three are one series, the formulas behind running and training a
// model: the chip, then inference, then training. Each has its own page under app/blog/<slug>/.
export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  author: string;
  // The cover is drawn, not a photo: a panel in one of the site's colours with one large term on it.
  cover: { tone: "cobalt" | "ink" | "teal" | "night"; mark: string };
  // Its place in a series, shown under the title and linked from the other parts.
  part?: { n: number; of: number; series: string };
};

const author = "Alpha Romer Coma";
const series = "In formulas";

export const posts: BlogPost[] = [
  {
    slug: "chip-formulas",
    title: "What a chip's spec sheet means, in formulas",
    date: "November 2026",
    summary: "Memory capacity, memory bandwidth and compute: where each number comes from, how to work it out, and which one a model waits on.",
    author,
    cover: { tone: "cobalt", mark: "GB/s" },
    part: { n: 1, of: 3, series },
  },
  {
    slug: "inference-formulas",
    title: "Running a model, in formulas",
    date: "November 2026",
    summary: "Reading a long prompt usually waits on compute and writing a reply on memory: the formulas for both, the KV cache, batching, and what changes on a phone.",
    author,
    cover: { tone: "ink", mark: "tok/s" },
    part: { n: 2, of: 3, series },
  },
  {
    slug: "training-formulas",
    title: "Training a model, in formulas",
    date: "November 2026",
    summary: "Forward, loss, backward and update; why training costs about 6 × N × D operations and 16 bytes a parameter; and the choices that shape a model.",
    author,
    cover: { tone: "teal", mark: "6ND" },
    part: { n: 3, of: 3, series },
  },
];

export const seriesParts = (name: string) => posts.filter((p) => p.part?.series === name).sort((a, b) => a.part!.n - b.part!.n);
