import HomeShell from "@/components/home/HomeShell";

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="research">{children}</HomeShell>;
}
