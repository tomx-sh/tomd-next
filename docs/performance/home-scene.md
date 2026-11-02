# Home scene cold-load performance

This records the initial loading optimization. The subsequent larger, higher-quality
tile and its updated measurements are described in [the quality follow-up](home-scene-quality.md).

Measured on 2026-11-02 on this Mac, using headless Brave/Chromium and its Intel
Gen 9 hardware GPU (not a software adapter). Each run launches a fresh browser,
blocks service workers, disables the HTTP cache and GPU shader disk cache, and
uses a 1440×900 viewport at DPR 2 in dark mode. Local measurements use
`next build` / `next start`, not the development server.

The primary metric is navigation → `data-webgpu-status="ready"`. The package
sets this after the first frame's `GPUQueue.onSubmittedWorkDone()` resolves.
`load`, DOM ready, and text LCP do not measure when a GPU canvas is ready.

| Target                              | Profile   | Runs | Median first GPU frame | Median longest main-thread task |
| ----------------------------------- | --------- | ---: | ---------------------: | ------------------------------: |
| https://tomd.sh, current deployment | Desktop   |    5 |               1,208 ms |                          825 ms |
| Local production build, before      | Desktop   |    5 |               1,086 ms |                          828 ms |
| Local production build, optimized   | Desktop   |    5 |                 326 ms |                 No tasks ≥50 ms |
| https://tomd.sh, current deployment | Throttled |    3 |               4,384 ms |                        3,394 ms |
| Local production build, before      | Throttled |    3 |               4,298 ms |                        3,373 ms |
| Local production build, optimized   | Throttled |    3 |                 994 ms |                          165 ms |

The throttled profile uses 4× CPU slowdown, 10 Mbps download, 1 Mbps upload, and
40 ms network latency. These are lab measurements, not field percentiles.
The baseline local desktop runs ranged from 1,083–3,169 ms (including one cold
server outlier); optimized desktop runs ranged from 320–345 ms. The production
optimization has not been deployed, so there is no production after measurement.

## Bottleneck and fix

The package's first mount generated a deterministic blue-noise rank tile,
including repeated Gaussian filtering and sorting, synchronously on the main
thread **before requesting a GPU adapter**. The 128×128 tile cost approximately
825 ms in Chromium, or 3.4 seconds under CPU throttling. GPU initialization and
the first frame then took only about 50 ms on the original desktop path.

`react-floyd-steinberg` now contains precomputed 64×64 and 128×128 rank tiles for
the default seed. They decode in about 1 ms and are cached. Every rank matches
the procedural generator; custom sizes and seeds still use that generator.
The shaders, simulation grid, pressure iterations, canvas DPR, pixel scale,
contrast, and color behavior are unchanged. The page now explicitly requests
128 rather than 256; the renderer already clamped 256 to 128.

This trades approximately 40 KiB of additional compressed JavaScript for
eliminating 825 ms of synchronous computation on this CPU. Local first-contentful
paint remained approximately 156 ms. There were no browser errors in the
measured runs.

During the audit, a temporary Bun dependency patch supplied the source-package
changes before publication. A clean install with Bun 1.3.14 reproduced the built
source package byte for byte. The completed package is now versioned as
`react-floyd-steinberg` v0.7.0, and the app references its GitHub release tag
without a dependency patch. See the quality follow-up for the final tile and
updated measurements.

## Ready versus visible paint

The existing paint shader starts empty, eases in its pigment sources over two
seconds, then thresholds the accumulating pigment. This deliberate entrance
remains unchanged. Screenshot sampling below the text showed the first visible
paint at roughly 3.4 seconds on the live site and 2.6 seconds locally after the
fix (sampling resolution approximately 370 ms). The GPU is already rendering
before those pixels become visible. Changing that entrance would be a separate
visual decision.

## Repeat the benchmark

Install Playwright's Chromium once, or set `SCENE_BROWSER_PATH` to an installed
Chromium browser executable. WebGPU requires a compatible GPU/browser.

```sh
bun install
bunx playwright install chromium
bun run build
bun run start --port 3100
```

In another terminal:

```sh
bun run perf:scene http://localhost:3100 /tmp/local-scene.json 5
bun run perf:scene http://localhost:3100 /tmp/local-scene-slow.json 3 throttled
bun run perf:scene https://tomd.sh /tmp/live-scene.json 5
```

For Brave on this Mac:

```sh
SCENE_BROWSER_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" bun run perf:scene http://localhost:3100 /tmp/local-scene.json 5
```

The script saves per-run navigation, paint, GPU calls, long tasks, resources,
adapter information, and browser errors as JSON, plus a first-run screenshot.
`home-scene-results.json` keeps the measured timings from this audit.
