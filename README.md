# experimentalmachines.org

Site for Experimental Machines: GPU, NPU and ASIC benchmarks across server, laptop and mobile. Sibling site: experimentalintelligence.org.

Next.js (App Router, TypeScript) + Tailwind CSS v4. Static content, no API routes.

## Develop

```bash
npm run dev
```

## Edit content

Copy and the per-class result tables live in `lib/content.ts`. The hero figures read `lib/measurements.ts` and `lib/latency.ts`; the `/asic` page reads `lib/neuron.ts`. Every value is copied from a published benchmark report.

The `/gguf` page reads two generated modules, both from OpenGrad at the `study-001` tag. `lib/gguf.ts` (`scripts/build-gguf-data.mjs`) carries the BF16 GGUF and the nine llama.cpp quantizations on one A100. `lib/gguf-bf16.ts` (`scripts/build-gguf-bf16-data.mjs`) joins that BF16 GGUF against the same weights served by vLLM on an H200, for the engine-comparison section. Neither is edited by hand:

```bash
OPENGRAD=../OpenGrad node scripts/build-gguf-data.mjs
OPENGRAD=../OpenGrad node scripts/build-gguf-bf16-data.mjs
```

Both are committed, because CI builds without an OpenGrad checkout.

## Deploy

Pushes to `main` deploy to production via the Vercel Git integration. The `experimentalmachines.org` domain is attached in the Vercel project settings.
