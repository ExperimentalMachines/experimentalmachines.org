import HomeShell from "@/components/home/HomeShell";

// Every OpenWeights page wears the organisation's look, with OpenWeights marked
// in the header.
export default function OpenWeightsLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell current="openweights">{children}</HomeShell>;
}
