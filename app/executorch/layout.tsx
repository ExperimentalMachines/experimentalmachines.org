import HomeShell from "@/components/home/HomeShell";

// ExecuPack's own page, at the address it had as the table of ExecuTorch exports, so the header marks
// ExecuPack as the current project.
export default function ExecuTorchLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="execupack">{children}</HomeShell>;
}
