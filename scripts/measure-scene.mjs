import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// Usage: bun run perf:scene <url> <output.json> [runs=5] [desktop|throttled]
// Set SCENE_BROWSER_PATH to use a local Chromium browser instead of Playwright's.
const [
  url = "http://localhost:3100",
  output = "/tmp/tomd-scene-results.json",
  count = "5",
  profile = "desktop",
] = process.argv.slice(2);
if (
  !["desktop", "throttled"].includes(profile) ||
  !Number.isInteger(Number(count)) ||
  Number(count) < 1
) {
  throw new Error(
    "Expected a positive run count and desktop or throttled profile.",
  );
}
const runs = [];
for (let run = 0; run < Number(count); run++) {
  const browser = await chromium.launch({
    executablePath: process.env.SCENE_BROWSER_PATH,
    headless: true,
    args: [
      "--enable-unsafe-webgpu",
      "--ignore-gpu-blocklist",
      "--disable-gpu-shader-disk-cache",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (profile === "throttled") {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 40,
        downloadThroughput: 10_000_000 / 8,
        uploadThroughput: 1_000_000 / 8,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.addInitScript(() => {
      const m = {
        events: [],
        longTasks: [],
        ready: 0,
        canvas: 0,
        adapter: undefined,
      };
      window.__sceneMetrics = m;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          m.longTasks.push({ start: e.startTime, duration: e.duration });
      }).observe({ type: "longtask", buffered: true });
      const observe = new MutationObserver(() => {
        const canvas = document.querySelector("canvas[data-webgpu-status]");
        if (canvas && !m.canvas) m.canvas = performance.now();
        if (canvas?.dataset.webgpuStatus === "ready" && !m.ready) {
          m.ready = performance.now();
          observe.disconnect();
        }
      });
      observe.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-webgpu-status"],
      });
      function wrap(proto, name) {
        if (!proto?.[name]) return;
        const original = proto[name];
        proto[name] = function (...args) {
          const event = {
            name,
            label: args[0]?.label,
            start: performance.now(),
          };
          if (name === "submit" && m.events.some((e) => e.name === "submit"))
            return original.apply(this, args);
          m.events.push(event);
          const result = original.apply(this, args);
          if (result?.then)
            return result.then((value) => {
              event.end = performance.now();
              if (name === "requestAdapter" && value?.info) {
                const {
                  vendor,
                  architecture,
                  device,
                  description,
                  isFallbackAdapter,
                } = value.info;
                m.adapter = {
                  vendor,
                  architecture,
                  device,
                  description,
                  isFallbackAdapter,
                };
              }
              return value;
            });
          event.end = performance.now();
          return result;
        };
      }
      wrap(globalThis.GPU?.prototype, "requestAdapter");
      wrap(globalThis.GPUAdapter?.prototype, "requestDevice");
      for (const name of [
        "createShaderModule",
        "createComputePipeline",
        "createComputePipelineAsync",
        "createRenderPipeline",
        "createRenderPipelineAsync",
      ])
        wrap(globalThis.GPUDevice?.prototype, name);
      wrap(globalThis.GPUShaderModule?.prototype, "getCompilationInfo");
      wrap(globalThis.GPUQueue?.prototype, "submit");
    });
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page
      .locator('canvas[data-webgpu-status="ready"]')
      .waitFor({ timeout: 60000 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const data = await page.evaluate(() => ({
      ...window.__sceneMetrics,
      navigation: performance.getEntriesByType("navigation")[0].toJSON(),
      paint: performance.getEntriesByType("paint").map((e) => e.toJSON()),
      resources: performance.getEntriesByType("resource").map((e) => ({
        url: e.name,
        start: e.startTime,
        end: e.responseEnd,
        transfer: e.transferSize,
        bytes: e.decodedBodySize,
        encoded: e.encodedBodySize,
      })),
      canvasSize: {
        width: document.querySelector("canvas").width,
        height: document.querySelector("canvas").height,
      },
      userAgent: navigator.userAgent,
    }));
    if (run === 0)
      await page.screenshot({ path: `${output.replace(/\.json$/i, "")}.png` });
    runs.push({ ...data, errors });
    console.log(
      JSON.stringify({
        run: run + 1,
        url,
        profile,
        ready: Math.round(data.ready),
        longestTask: Math.round(
          Math.max(0, ...data.longTasks.map((e) => e.duration)),
        ),
        errors,
      }),
    );
    if (errors.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
await writeFile(output, JSON.stringify({ url, profile, runs }, null, 2));
const values = runs.map((x) => x.ready).sort((a, b) => a - b);
console.log(
  JSON.stringify({
    medianReady: Math.round(values[Math.floor(values.length / 2)]),
    min: Math.round(values[0]),
    max: Math.round(values.at(-1)),
  }),
);
