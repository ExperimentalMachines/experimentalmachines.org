import Go from "@/components/home/Go";
import { cardLink } from "@/components/home/ui";
import type { BlogPost } from "@/lib/blog";

// The blog's cards, laid out like the research index: the newest post as a wide feature, the rest in a grid of
// three. A cover is a panel in one of the site's colours with one large term on it, so the cards read as one set
// without stock photos.
const tones: Record<BlogPost["cover"]["tone"], string> = {
  cobalt: "var(--color-blue)",
  ink: "#0e1638",
  teal: "#0a3b3f",
  night: "#052B42",
};

export function Cover({ post, large }: { post: BlogPost; large?: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center text-white transition-transform motion-safe:group-hover:scale-[1.01] ${large ? "h-full min-h-64 p-8" : "aspect-[2/1] p-6"}`}
      style={{ backgroundColor: tones[post.cover.tone] }}
    >
      <span className={`display font-medium tracking-[-0.03em] ${large ? "text-7xl sm:text-8xl" : "text-5xl"}`}>{post.cover.mark}</span>
    </div>
  );
}

// The author's initials in a circle, as the byline's picture until there is a photo.
export function Byline({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <p className="flex items-center gap-3 text-sm font-medium">
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-xs text-white">
        {initials}
      </span>
      {name}
    </p>
  );
}

export function BlogFeature({ post }: { post: BlogPost }) {
  return (
    <article className="group relative grid overflow-hidden rounded-[1.75rem] border border-rule bg-white transition-colors hover:border-ink lg:grid-cols-[1.1fr_1fr]">
      <div className="overflow-hidden">
        <Cover post={post} large />
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="text-sm text-ink-soft">{post.date}</p>
        <h2 className="display mt-3 text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
          <Go href={`/blog/${post.slug}/`} className={`${cardLink} decoration-2 underline-offset-[6px] after:rounded-[1.75rem]`}>
            {post.title}
          </Go>
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-ink-soft">{post.summary}</p>
        <div className="mt-6">
          <Byline name={post.author} />
        </div>
      </div>
    </article>
  );
}

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <li key={p.slug} className="group relative">
          <div className="overflow-hidden rounded-[1.25rem]">
            <Cover post={p} />
          </div>
          <p className="mt-4 text-sm text-ink-soft">{p.date}</p>
          <p className="display mt-1 text-xl leading-snug">
            <Go href={`/blog/${p.slug}/`} className={`${cardLink} underline-offset-4 after:rounded-[1.25rem]`}>
              {p.title}
            </Go>
          </p>
        </li>
      ))}
    </ul>
  );
}
