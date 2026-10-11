import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import ExecuBench from "@/components/home/ExecuBench";
import ExecuPack from "@/components/home/ExecuPack";
import ExecuServe from "@/components/home/ExecuServe";
import Hero from "@/components/home/Hero";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import OpenWeights from "@/components/home/OpenWeights";
import Team from "@/components/home/Team";
import Upstream from "@/components/home/Upstream";
import { site } from "@/lib/content";
import { links } from "@/lib/home";

// The homepage's typefaces. They are scoped to this page; the other pages keep
// Archivo from the root layout.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });

const description =
  "A software and machine-learning organisation building on ExecuTorch: OpenWeights and ExecuServe run open models on phones, ExecuPack builds them for phone chips, and we contribute fixes upstream.";

// The layout's Open Graph and Twitter blocks are replaced whole, not merged,
// so they are restated here with the new description.
export const metadata: Metadata = {
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.name,
    description,
    url: site.url,
    siteName: site.name,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: site.name, description },
};

// Structured data for search engines: the organisation, its logo and where it
// publishes.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/brand/em-mark-1024.png`,
  description,
  email: site.email,
  sameAs: [links.github, links.huggingface],
};

// The story, top to bottom: what we make, the two apps people use, the models
// underneath them, what goes back to ExecuTorch, what comes next, and who we are.
export default function Home() {
  return (
    <div className={`home ${inter.variable} ${interTight.variable} min-h-screen`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeHeader />
      <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
        <Hero />
        <OpenWeights />
        <ExecuServe />
        <ExecuPack />
        <Upstream />
        <ExecuBench />
        <Team />
      </main>
      <HomeFooter />
    </div>
  );
}
