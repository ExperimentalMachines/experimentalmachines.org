import type { Metadata } from "next";
import { BlogFeature, BlogGrid } from "@/components/blog/BlogCards";
import { lede } from "@/components/home/ui";
import { posts } from "@/lib/blog";

const description = "Notes from building and running models: the formulas, the code and what we learned along the way.";

export const metadata: Metadata = {
  title: "Blog: Experimental Machines",
  description,
  openGraph: { title: "Blog", description, url: "/blog/" },
};

const [latest, ...rest] = posts;

// One feed: the first post as a feature, the rest under it.
export default function Blog() {
  return (
    <main id="main" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">Blog.</h1>
      <p className={`${lede} mt-4 max-w-4xl`}>{description}</p>
      <div className="mt-10">
        <BlogFeature post={latest} />
      </div>
      {rest.length > 0 && (
        <section aria-labelledby="more" className="mt-16">
          <h2 id="more" className="display text-2xl font-normal tracking-[-0.02em]">
            {rest.every((p) => p.part && p.part.series === latest.part?.series) ? "The rest of the series" : "More posts"}
          </h2>
          <div className="mt-6">
            <BlogGrid posts={rest} />
          </div>
        </section>
      )}
    </main>
  );
}
