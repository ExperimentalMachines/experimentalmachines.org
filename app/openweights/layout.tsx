import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import { inter, interTight } from "@/lib/fonts";

// Every OpenWeights page wears the organisation's look: the homepage's header,
// typefaces, colours and footer. Each page renders its own <main id="main">,
// which the header's skip link points to.
export default function OpenWeightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`home ${inter.variable} ${interTight.variable} min-h-screen`}>
      <HomeHeader current="openweights" />
      {children}
      <HomeFooter />
    </div>
  );
}
