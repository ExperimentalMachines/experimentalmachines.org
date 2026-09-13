# experimentalmachines.org

Site for Experimental Machines: GPU, NPU and ASIC benchmarks across server, laptop and mobile. Sibling site: experimentalintelligence.org.

Next.js (App Router, TypeScript) + Tailwind CSS v4. Static content, no API routes.

## Develop

```bash
npm run dev
```

## Edit content

Copy and the per-class result tables live in `lib/content.ts`. The hero figures read `lib/measurements.ts` and `lib/latency.ts`; the `/asic` page reads `lib/neuron.ts`. Every value is copied from a published benchmark report. The `/gguf` page reads `lib/gguf.ts`, which `scripts/build-gguf-data.mjs` generates from OpenGrad at the `study-001` tag (`OPENGRAD=../OpenGrad node scripts/build-gguf-data.mjs`).

## Deploy

Pushes to `main` deploy to production via the Vercel Git integration. The `experimentalmachines.org` domain is attached in the Vercel project settings.
