import HomeShell from "@/components/home/HomeShell";

export default function ConferencesLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="conferences">{children}</HomeShell>;
}
