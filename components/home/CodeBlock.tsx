// Code on the site's dark cards, coloured at build time so the page ships no highlighter. A few
// patterns cover the snippets we show; a new language or construct adds a line here. Every colour is
// at least 7:1 on the card's navy (#0e1638); the palette is the site's own blue, OpenWeights' lime and
// ExecuServe's orange, lightened where needed.

type Lang = "python" | "shell";

const colour = {
  keyword: "text-[#9db8ff]",
  string: "text-[#e0ff4f]",
  call: "text-[#7fdcff]",
  name: "text-[#ffb59e]",
  flag: "text-[#c9b8ff]",
  comment: "text-[#9aa3c7]",
};

// Order matters: the first pattern that matches at a position wins, so comments and strings come
// before anything that could match inside them.
const rules: Record<Lang, [keyof typeof colour, string][]> = {
  python: [
    ["comment", String.raw`#[^\n]*`],
    ["string", String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`],
    ["keyword", String.raw`\b(?:from|import|def|class|return|if|else|for|in|with|as|None|True|False)\b`],
    ["name", String.raw`\b[a-z_]\w*(?==[^=])`],
    ["call", String.raw`\b[A-Za-z_]\w*(?=\()`],
  ],
  shell: [
    ["comment", String.raw`(?<=^|\s)#[^\n]*|<[^>\n]+>`],
    ["keyword", String.raw`\bexport\b`],
    ["name", String.raw`\b[A-Z_][A-Z0-9_]*(?==)`],
    ["flag", String.raw`(?<=\s)--?[\w-]+`],
    ["string", String.raw`https?://\S+|(?<=\s)~?/\S+`],
    ["call", String.raw`^[\w./~-]+`],
  ],
};

const grammar = (lang: Lang) => new RegExp(rules[lang].map(([kind, source]) => `(?<${kind}>${source})`).join("|"), "gm");

function tokens(code: string, lang: Lang) {
  const out: React.ReactNode[] = [];
  let at = 0;
  for (const m of code.matchAll(grammar(lang))) {
    const kind = Object.entries(m.groups ?? {}).find(([, v]) => v !== undefined)?.[0] as keyof typeof colour;
    out.push(code.slice(at, m.index));
    out.push(
      <span key={m.index} className={colour[kind]}>
        {m[0]}
      </span>,
    );
    at = m.index + m[0].length;
  }
  out.push(code.slice(at));
  return out;
}

export default function CodeBlock({ code, lang, className = "" }: { code: string; lang: Lang; className?: string }) {
  return (
    <pre className={`overflow-x-auto text-[0.82rem] leading-6 text-white ${className}`}>
      <code>{tokens(code, lang)}</code>
    </pre>
  );
}
