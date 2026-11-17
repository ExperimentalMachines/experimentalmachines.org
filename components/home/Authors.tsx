import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { team } from "@/lib/home";

// Who wrote a research post: a face and a name, the same on its card and at the top of the page. A person
// without a committed photo shows their initials, as the People section does.
const member = (name: string) => team.find((m) => m.name === name)!;

const initials = (name: string) => {
  const parts = name.split(" ");
  return `${parts[0][0]}${parts.at(-1)![0]}`;
};

function Face({ name, size }: { name: string; size: "sm" | "lg" }) {
  const m = member(name);
  const box = size === "lg" ? "h-11 w-11 text-sm" : "h-7 w-7 text-[10px]";
  if (m.photo) {
    // eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files
    return <img src={m.photo} alt="" width={size === "lg" ? 44 : 28} height={size === "lg" ? 44 : 28} className={`${box} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span aria-hidden className={`display flex ${box} shrink-0 items-center justify-center rounded-full bg-blue font-medium text-white`}>
      {initials(name)}
    </span>
  );
}

// On a card the whole card is one link, so names here are plain text; on a post each name links to the person.
export default function Authors({ names, size = "sm", linked }: { names: string[]; size?: "sm" | "lg"; linked?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${size === "lg" ? "text-base" : "text-sm"}`}>
      {names.map((n) => (
        <span key={n} className="flex items-center gap-2.5">
          <Face name={n} size={size} />
          {linked ? (
            <Go href={member(n).linkedin} className={`${link} font-medium`}>
              {n}
            </Go>
          ) : (
            <span className="font-medium">{n}</span>
          )}
        </span>
      ))}
    </p>
  );
}
