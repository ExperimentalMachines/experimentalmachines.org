# experimentalmachines.org

Site for Experimental Machines, an independent software and machine-learning organisation building on ExecuTorch: OpenWeights, ExecuServe, ExecuPack and ExecuBench, plus the earlier GPU, NPU and ASIC benchmarks. Sibling site: experimentalintelligence.org.

Next.js (App Router, TypeScript) + Tailwind CSS v4. Static content, no API routes.

## Develop

```bash
npm run dev
```

## Edit content

The homepage's copy lives in `lib/home.ts` and its sections in `components/home/`; it has its own header and footer, so the other pages keep `components/Nav.tsx` and `components/Footer.tsx`. It runs from the two apps people use (OpenWeights, ExecuServe) to the models under them (ExecuPack), the fixes contributed to ExecuTorch, and what comes next (ExecuBench), each with one real visual. Project facts come from each repository's README, results and execupack's research log, upstream items from pytorch/executorch, and the ExecuPack build table from `lib/execupack-published.ts`; screenshots are in `public/home/`. The homepage and the pages under `/openweights` share the organisation's look: Inter and Inter Tight from `lib/fonts.ts`, the `.home` colours in `app/globals.css`, and `components/home/HomeHeader.tsx` and `HomeFooter.tsx`. The older pages keep Archivo from the root layout. `lib/content.ts` holds the site name, contact and sibling link that every page shares. The `/asic` page reads `lib/neuron.ts`. Every value is copied from a published report.

The `/gguf` page reads two generated modules, both from OpenGrad at the `study-001` tag. `lib/gguf.ts` (`scripts/build-gguf-data.mjs`) carries the BF16 GGUF and the nine llama.cpp quantizations on one A100. `lib/gguf-bf16.ts` (`scripts/build-gguf-bf16-data.mjs`) joins that BF16 GGUF against the same weights served by vLLM on an H200, for the engine-comparison section. Neither is edited by hand:

```bash
OPENGRAD=../OpenGrad node scripts/build-gguf-data.mjs
OPENGRAD=../OpenGrad node scripts/build-gguf-bf16-data.mjs
```

Both are committed, because CI builds without an OpenGrad checkout.

Everything about OpenWeights lives under `/openweights`, and `app/openweights/layout.tsx` gives each of its pages that look, with the header marking OpenWeights as the current project. The parent page reads `lib/openweights.ts`, which lists its research pages newest first; the privacy policy Google Play links to and the earlier research pages are still on the app's own GitHub Pages site and are linked from there. `/openweights/prefill-decode` reads `lib/prefill-decode.ts`, the nine CPU, GPU and NPU matrices from the Snapdragon 8 Elite Gen 5 run; its findings table is derived from those cells rather than stored. A new OpenWeights page goes under `app/openweights/` and into that list.

The `/execuserve` page and its privacy policy read `lib/execuserve.ts` and `app/execuserve/privacy/page.tsx`. The privacy page is the URL given to Google Play and mirrors `docs/privacy-policy.md` in the [ExecuServe repository](https://github.com/ExperimentalMachines/execuserve); change both together.

The `/executorch` page sets what execupack has published on Hugging Face against what ExecuTorch 1.5.1 can export. `lib/execupack.ts` is the hand-written family × accelerator table, each claim traced to a file at ExecuTorch's v1.5.1 tag. `lib/execupack-published.ts` is generated from the Hugging Face API and committed; re-run it after new exports land:

```bash
node scripts/build-execupack-data.mjs
```

## Deploy

Pushes to `main` build the static export and deploy it to GitHub Pages (`.github/workflows/pages.yml`); `public/CNAME` holds the `experimentalmachines.org` domain.
