import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Byline, Cover } from "@/components/blog/BlogCards";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { posts } from "@/lib/blog";

// A post's page. The site is a static export, so every slug is built ahead of time.
export function generateStaticParams() {
  return posts.filter((p) => !p.custom).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title}: Experimental Machines`,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <main id="main" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <Go href="/blog/" className={`${link} text-sm`}>
        All posts
      </Go>
      <p className="mt-8 text-sm text-ink-soft">{post.date}</p>
      <h1 className="display mt-2 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">{post.title}</h1>
      <div className="mt-6">
        <Byline name={post.author} />
      </div>
      <div className="mt-10 overflow-hidden rounded-[1.5rem]">
        <Cover post={post} />
      </div>
      <div className="mt-10 space-y-5 text-lg leading-8 text-ink-soft">
        {post.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </main>
  );
}
