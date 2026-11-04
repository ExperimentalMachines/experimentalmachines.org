import HomeShell from "@/components/home/HomeShell";

export default function GgufLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="research">{children}</HomeShell>;
}
