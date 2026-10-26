import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import { inter, interTight } from "@/lib/fonts";

// The organisation's look around a page other than the homepage: its header,
// typefaces, colours and footer. Every page's layout but the homepage's wraps
// it in this. Each page renders its own <main id="main">, which the header's
// skip link points to.
export default function HomeShell({ current, children }: { current?: "openweights" | "execuserve"; children: React.ReactNode }) {
  return (
    <div className={`home ${inter.variable} ${interTight.variable} min-h-screen`}>
      <HomeHeader current={current} />
      {children}
      <HomeFooter />
    </div>
  );
}
