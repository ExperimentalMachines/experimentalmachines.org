import HomeShell from "@/components/home/HomeShell";

// ExecuPack's table of ExecuTorch exports wears the organisation's look. ExecuPack
// has no page of its own to mark in the header, so the page's breadcrumb links
// back to its section on the homepage.
export default function ExecuTorchLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
