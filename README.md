# experimentalmachines.org

Site for Experimental Machines, an independent software and machine-learning organisation building on ExecuTorch: OpenWeights, ExecuServe and ExecuPack, plus the research behind them. Sibling site: experimentalintelligence.org.

Next.js (App Router, TypeScript) + Tailwind CSS v4. Static content, no API routes.

## Develop

```bash
npm run dev
```

## Edit content

The homepage's copy lives in `lib/home.ts` and its sections in `components/home/`. It runs from the two apps people use (OpenWeights, ExecuServe) to the models under them (ExecuPack), and the fixes contributed to ExecuTorch, each with one real visual. ExecuBench is off the homepage until it has results; its section is still in `components/home/ExecuBench.tsx`. Project facts come from each repository's README, results and execupack's research log, upstream items from pytorch/executorch, and the ExecuPack build table from `lib/execupack-published.ts`; screenshots are in `public/home/`. Every page shares the organisation's look: Inter and Inter Tight from `lib/fonts.ts`, the `.home` colours in `app/globals.css`, and `components/home/HomeHeader.tsx` and `HomeFooter.tsx`, which `components/home/HomeShell.tsx` puts around every page but the homepage from each section's `layout.tsx` (`/openweights`, `/execuserve`, `/executorch`, `/asic`, `/gguf`), and `app/not-found.tsx` puts around the 404 page, which the export writes to `404.html`. `lib/content.ts` holds the site name, contact and sibling link that every page shares.

To add a conference talk: add its entry to `lib/talks.ts`, then write `app/conferences/<slug>/page.tsx` on the same frame, with the sections The talk, The evidence and Where and when. Copy the listing's details from the conference's own page.

To add a research post: add its entry to `lib/studies.ts` (title, date, one-sentence line, cover hook and chart), then write `app/research/<slug>/page.tsx` on `components/research/Post.tsx`. The frame supplies the banner, title, sizes, Sources and Keep reading. Every post has the same sections in the same order: What we found, The results, How we ran it, Limits. Use `Findings`, `Figure`, `Rows` and `Row` rather than bullets, and fold detail most readers skip into `More`. A post that sets two machines or setups against each other draws its results with `components/research/Compare.tsx`, and keeps the full table behind `More`. Rows of links use `components/home/Actions.tsx`, on posts and everywhere else, so they read as buttons.

Every research post lives at `/research/<slug>`, and `lib/studies.ts` lists them newest first for `/research` and the homepage: each post's cover is computed there from its own data module, so a cover cannot drift from its page. Old addresses under `/openweights`, `/asic` and `/gguf` stay as pages that forward. `/asic/` and `/gguf/` themselves forward to `/research/`. `/research/trainium-inferentia` reads `lib/neuron.ts`. The posts `/research/mi300x-h200`, `/research/m5-x2-elite`, `/research/8-elite-dimensity` and `/research/local-copilot` are short versions of reports kept in their own repositories, and read `lib/hardware-studies.ts`. Every value is copied from a published report.

The `/research/a100-quantization` page reads two generated modules, both from OpenGrad at the `study-001` tag. `lib/gguf.ts` (`scripts/build-gguf-data.mjs`) carries the BF16 GGUF and the nine llama.cpp quantizations on one A100. `lib/gguf-bf16.ts` (`scripts/build-gguf-bf16-data.mjs`) joins that BF16 GGUF against the same weights served by vLLM on an H200, for the engine-comparison section. Neither is edited by hand:

```bash
OPENGRAD=../OpenGrad node scripts/build-gguf-data.mjs
OPENGRAD=../OpenGrad node scripts/build-gguf-bf16-data.mjs
```

Both are committed, because CI builds without an OpenGrad checkout.

OpenWeights' own page is `/openweights`, and its layout marks OpenWeights as the current project in the header. It reads `lib/openweights.ts`, which lists its research pages newest first. The studies themselves live under `/research`, which has an index of its own; their old `/openweights/<study>` addresses still exist as pages that forward to the new ones, `#section` included (`components/home/Moved.tsx`), because GitHub Pages has no server redirects. The privacy policy stays on the app's own GitHub Pages site, because that is the address registered in Google Play. `/research/prefill-decode` reads `lib/prefill-decode-data.ts`, the nine CPU, GPU and NPU matrices at reply length from the Snapdragon 8 Elite Gen 5 runs, generated from OpenWeights' raw results at a pinned commit and committed because CI builds without that checkout; `lib/prefill-decode.ts` adds the links and the few clock and thermal notes taken from its report. `/research/decode-stall`, on why CPU decode stalls in the phone's hard throttle and the guard OpenWeights carries, reads the same module (`pdStall`, `pdFix`), whose figures come from the same report and are changed there first. Its charts read `lib/decode-stall-data.ts`, generated by `scripts/build-decode-stall-data.mjs` from the same results at a pinned commit (`OPENWEIGHTS=../mobile-inference node scripts/build-decode-stall-data.mjs <commit>`). Its charts are the shared ones in `components/research/Compare.tsx`, with `TimeLines` added there for measures over time. Re-run after new results land:

```bash
OPENWEIGHTS=../mobile-inference node scripts/build-prefill-decode-data.mjs <commit>
```

`/research/latency`, `/research/window` and `/research/reruns` were first published on that GitHub Pages site; `lib/openweights-latency.ts`, `lib/openweights-window.ts` and `lib/openweights-reruns.ts` carry their data as published there, and their charts are in `components/openweights/`, with each phone's colour and marker in `chips.tsx`. The homepage's OpenWeights figure reads the latency data. A new OpenWeights study goes under `app/research/` and into that list.

`public/home/openweights-chat.png` is an unedited capture of a real conversation, cropped to the app: LFM2.5-1.2B-Instruct-QAD-Q4_0 on the CPU, in a debug build of OpenWeights at 88614a7e, on a Qualcomm Device Cloud Snapdragon 8 Elite Gen 5 phone, 2026-11-04. It was picked from 23 conversations. Its first turn searches the web; a forecast checked the same day agreed on the rain and the high to within 2 °F. Its second turn states the rate because no wording that asked for the live rate came back right: replies ranged from ¥30,000 to ¥150,000 for 500 USD, against about ¥79,200. The model did the sum without running the script the prompt mentions. A replacement should be just as real: pick the prompt, never edit the reply.

The `/execuserve` page and its privacy policy read `lib/execuserve.ts` and `app/execuserve/privacy/page.tsx`. The privacy page is the URL given to Google Play and mirrors `docs/privacy-policy.md` in the [ExecuServe repository](https://github.com/ExperimentalMachines/execuserve); change both together.

`/executorch` is ExecuPack's page (it keeps the address it had as the table of ExecuTorch exports, and its layout marks ExecuPack as the current project in the header). It opens on a cover of every published build (`components/execupack/Punchcard.tsx`), then a model finder that filters by target and draws each model's context windows as a strip of blocks (`components/execupack/ModelFinder.tsx`, `WindowStrip.tsx`), then which file to run, how each file is checked, what ExecuTorch 1.5.1 can export, what is still to build, the chips, and the sources. `lib/execupack.ts` is hand-written: the family × accelerator table, each claim traced to a file at ExecuTorch's v1.5.1 tag, the chips, the pipeline's steps, the gate's evidence, and the published files that differ from the recipe (`exceptions`, and `withheld` for a build measured and kept off the Hub). `lib/execupack-published.ts` is generated from the Hugging Face API and committed; re-run it after new exports land, and check `exceptions` and `withheld` against execupack's research log:

```bash
node scripts/build-execupack-data.mjs
```

## Deploy

Pushes to `main` build the static export and deploy it to GitHub Pages (`.github/workflows/pages.yml`); `public/CNAME` holds the `experimentalmachines.org` domain.
