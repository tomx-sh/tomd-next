import { rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import next from "next";
import { type Browser, chromium } from "playwright";

// Use the built site so the PDF shares its Markdown renderer, CSS, and fonts.
// An existing dev server can also be used: bun run pdf:generate http://localhost:3000
const sourceUrl = process.argv[2];
const app = sourceUrl ? null : next({ dev: false });
const server = app ? createServer(app.getRequestHandler()) : null;
const output = path.join(process.cwd(), "public", "cv-tomd.pdf");
let browser: Browser | undefined;

try {
  let origin = sourceUrl;
  if (app && server) {
    await app.prepare();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not start the PDF build server");
    }
    origin = `http://127.0.0.1:${address.port}`;
  }
  if (!origin) throw new Error("Missing PDF source URL");

  // Keep missing CV content optional, just like /cv and /cv-md.
  const url = new URL("/cv", origin).href;
  const response = await fetch(url);
  if (response.status === 404) {
    // A removed CV must not leave a stale download in a reused build directory.
    await rm(output, { force: true });
    console.log("CV not found; skipped PDF generation.");
  } else {
    if (!response.ok) throw new Error(`CV returned HTTP ${response.status}`);

    browser = await chromium.launch();
    const page = await browser.newPage({ colorScheme: "light" });
    const navigation = await page.goto(url, { waitUntil: "networkidle" });
    if (!navigation?.ok())
      throw new Error("Could not load the CV for PDF generation");
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      scale: 0.85,
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    await writeFile(output, pdf);
    console.log("Generated public/cv-tomd.pdf from /cv.");
  }
} finally {
  await browser?.close();
  server?.closeAllConnections();
  server?.close();
  await app?.close();
}
