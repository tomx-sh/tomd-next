import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readCvMarkdown() {
  try {
    return await readFile(
      path.join(process.cwd(), ".obsidian-content", "cv.md"),
      "utf8",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
