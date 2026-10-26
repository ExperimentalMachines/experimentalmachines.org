import HomeShell from "@/components/home/HomeShell";

// The ASIC research wears the organisation's look.
export default function AsicLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
