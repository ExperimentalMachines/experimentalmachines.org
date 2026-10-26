import HomeShell from "@/components/home/HomeShell";

// ExecuServe's page and its privacy policy wear the organisation's look, with
// ExecuServe marked in the header. The policy's URL is the one given to Google
// Play, so it stays at /execuserve/privacy/.
export default function ExecuServeLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="execuserve">{children}</HomeShell>;
}
