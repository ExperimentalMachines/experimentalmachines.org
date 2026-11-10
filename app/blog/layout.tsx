import HomeShell from "@/components/home/HomeShell";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="blog">{children}</HomeShell>;
}
