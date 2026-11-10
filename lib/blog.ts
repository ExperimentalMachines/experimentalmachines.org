// The blog's posts, newest first. Placeholders until the first post is written: every one says so in its
// summary and body, so none can be mistaken for a real post if this branch is previewed.
export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  author: string;
  // The cover is drawn, not a photo: a panel in one of the site's colours with one large term on it.
  cover: { tone: "cobalt" | "ink" | "teal" | "night"; mark: string };
  body: string[];
  // A post with its own page under app/blog/<slug>/, which the generic template then skips.
  custom?: boolean;
};

const author = "Alpha Romer Coma";
const placeholder = ["Placeholder content while the blog is set up. This post has not been written yet."];

export const posts: BlogPost[] = [
  {
    slug: "training-and-inference-formulas",
    title: "Training and inference, in formulas",
    date: "November 2026",
    summary: "Three numbers on a chip's spec sheet, and a handful of formulas, explain how fast a model trains and runs, on a phone or in a datacenter.",
    author,
    cover: { tone: "cobalt", mark: "6ND" },
    body: [],
    custom: true,
  },
  {
    slug: "placeholder-two",
    title: "Placeholder post two",
    date: "October 2026",
    summary: "Placeholder summary.",
    author,
    cover: { tone: "ink", mark: "tok/s" },
    body: placeholder,
  },
  {
    slug: "placeholder-three",
    title: "Placeholder post three",
    date: "October 2026",
    summary: "Placeholder summary.",
    author,
    cover: { tone: "teal", mark: "KV" },
    body: placeholder,
  },
  {
    slug: "placeholder-four",
    title: "Placeholder post four",
    date: "September 2026",
    summary: "Placeholder summary.",
    author,
    cover: { tone: "night", mark: "GB/s" },
    body: placeholder,
  },
  {
    slug: "placeholder-five",
    title: "Placeholder post five",
    date: "September 2026",
    summary: "Placeholder summary.",
    author,
    cover: { tone: "cobalt", mark: "FLOPs" },
    body: placeholder,
  },
  { slug: "placeholder-six", title: "Placeholder post six", date: "August 2026", summary: "Placeholder summary.", author, cover: { tone: "teal", mark: "∂L" }, body: placeholder },
  {
    slug: "placeholder-seven",
    title: "Placeholder post seven",
    date: "August 2026",
    summary: "Placeholder summary.",
    author,
    cover: { tone: "ink", mark: "Σ" },
    body: placeholder,
  },
];
