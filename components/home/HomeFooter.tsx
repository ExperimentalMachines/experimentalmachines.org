import { sibling, site } from "@/lib/content";
import { links } from "@/lib/home";

export default function HomeFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display text-xl tracking-tight">
            Experimental <span className="font-semibold">Machines</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-soft">
            An independent software and machine-learning organisation. Our sister lab,{" "}
            <a href={sibling.url} className="underline decoration-rule underline-offset-4 hover:text-ink">
              {sibling.name}
            </a>
            , trains small models in the open.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          <a href={links.github} target="_blank" rel="noreferrer" className="hover:text-ink">
            GitHub
          </a>
          <a href={links.huggingface} target="_blank" rel="noreferrer" className="hover:text-ink">
            Hugging Face
          </a>
          <a href={`mailto:${site.email}`} className="hover:text-ink">
            {site.email}
          </a>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
