import HomeShell from "@/components/home/HomeShell";

// The GGUF research wears the organisation's look.
export default function GgufLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
