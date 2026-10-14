import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sdkDirectory = dirname(fileURLToPath(import.meta.resolve("libfx/wasm")));
const assetDirectory = fileURLToPath(new URL("../public/fx/", import.meta.url));

await mkdir(assetDirectory, { recursive: true });
await copyFile(
  join(sdkDirectory, "fx-term.wasm"),
  join(assetDirectory, "fx-term.wasm"),
);
