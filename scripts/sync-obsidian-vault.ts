import { spawnSync } from "node:child_process";
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SyncMode = "auto" | "local" | "remote";

type VaultSource = {
  directory: string;
  label: string;
  revision: string | null;
  type: "local" | "remote";
};

type SyncManifest = {
  articleFiles: string[];
  imageFiles: string[];
  revision: string | null;
  source: string;
  sourceType: VaultSource["type"];
};

const repository =
  process.env.OBSIDIAN_VAULT_REPOSITORY ??
  "https://github.com/tomx-sh/tomd-obsidian-vault.git";
const ref = process.env.OBSIDIAN_VAULT_REF ?? "main";
const localVaultPath = process.env.OBSIDIAN_VAULT_PATH;

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const generatedContentDirectory = path.join(
  projectDirectory,
  ".obsidian-content",
);
const publicImagesDirectory = path.join(
  projectDirectory,
  "public",
  "obsidian-images",
);
const stagedContentDirectory = path.join(
  projectDirectory,
  `.obsidian-content-next-${process.pid}`,
);
const stagedImagesDirectory = path.join(
  projectDirectory,
  "public",
  `.obsidian-images-next-${process.pid}`,
);

function getMode(): SyncMode {
  const arguments_ = process.argv.slice(2);

  if (arguments_.length > 1) {
    throw new Error("Pass at most one of --auto, --local, or --remote");
  }

  const argument = arguments_[0] ?? "--auto";
  if (!["--auto", "--local", "--remote"].includes(argument)) {
    throw new Error(`Unknown sync option: ${argument}`);
  }

  return argument.slice(2) as SyncMode;
}

function runGit(args: string[], cwd?: string) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Git command failed");
  }

  return result.stdout.trim();
}

function tryGit(args: string[], cwd: string) {
  try {
    return runGit(args, cwd);
  } catch {
    return null;
  }
}

function safeDestination(root: string, relativePath: string) {
  const destination = path.resolve(root, relativePath);
  const relativeDestination = path.relative(root, destination);

  if (
    relativeDestination.startsWith("..") ||
    path.isAbsolute(relativeDestination)
  ) {
    throw new Error(`Refusing to write outside ${root}: ${relativePath}`);
  }

  return destination;
}

async function assertVaultLayout(vaultDirectory: string) {
  await Promise.all([
    access(path.join(vaultDirectory, "index.md")),
    access(path.join(vaultDirectory, "articles")),
    access(path.join(vaultDirectory, "images")),
  ]);
}

async function copyFiles(
  sourceDirectory: string,
  destinationDirectory: string,
  include: (filename: string) => boolean,
) {
  const copiedFiles: string[] = [];

  async function visit(currentSource: string, relativeDirectory = "") {
    const entries = await readdir(currentSource, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);
      const sourcePath = path.join(currentSource, entry.name);

      if (entry.isDirectory()) {
        await visit(sourcePath, relativePath);
      } else if (entry.isFile() && include(entry.name)) {
        const destination = safeDestination(destinationDirectory, relativePath);
        await mkdir(path.dirname(destination), { recursive: true });
        await copyFile(sourcePath, destination);
        copiedFiles.push(relativePath);
      }
    }
  }

  await visit(sourceDirectory);
  return copiedFiles.sort();
}

async function getLocalVault(): Promise<VaultSource> {
  if (!localVaultPath) {
    throw new Error(
      "OBSIDIAN_VAULT_PATH is required for local sync. Add it to .env.local.",
    );
  }

  const directory = path.resolve(localVaultPath);
  await assertVaultLayout(directory);

  const commit = tryGit(["rev-parse", "HEAD"], directory);
  const changes = tryGit(["status", "--porcelain"], directory);
  const revision = commit
    ? `${commit}${changes ? " (with local changes)" : ""}`
    : null;

  return {
    directory,
    label: directory,
    revision,
    type: "local",
  };
}

async function downloadRemoteVault(
  temporaryDirectory: string,
): Promise<VaultSource> {
  if (!repository || repository.startsWith("-")) {
    throw new Error("OBSIDIAN_VAULT_REPOSITORY is invalid");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref)) {
    throw new Error("OBSIDIAN_VAULT_REF contains unsupported characters");
  }

  const directory = path.join(temporaryDirectory, "vault");
  console.log(`Downloading ${repository} (${ref})...`);
  runGit([
    "clone",
    "--depth",
    "1",
    "--single-branch",
    "--branch",
    ref,
    "--",
    repository,
    directory,
  ]);
  await assertVaultLayout(directory);

  return {
    directory,
    label: `${repository}#${ref}`,
    revision: runGit(["rev-parse", "HEAD"], directory),
    type: "remote",
  };
}

async function syncVault() {
  const mode = getMode();
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "tomd-obsidian-vault-"),
  );

  try {
    const source =
      mode === "local" || (mode === "auto" && localVaultPath)
        ? await getLocalVault()
        : await downloadRemoteVault(temporaryDirectory);

    console.log(`Syncing from ${source.label}...`);
    await Promise.all([
      rm(stagedContentDirectory, { force: true, recursive: true }),
      rm(stagedImagesDirectory, { force: true, recursive: true }),
    ]);
    await Promise.all([
      mkdir(path.join(stagedContentDirectory, "articles"), {
        recursive: true,
      }),
      mkdir(stagedImagesDirectory, { recursive: true }),
    ]);
    await copyFile(
      path.join(source.directory, "index.md"),
      path.join(stagedContentDirectory, "index.md"),
    );

    const [articleFiles, imageFiles] = await Promise.all([
      copyFiles(
        path.join(source.directory, "articles"),
        path.join(stagedContentDirectory, "articles"),
        (filename) => filename.endsWith(".md"),
      ),
      copyFiles(
        path.join(source.directory, "images"),
        stagedImagesDirectory,
        (filename) => !filename.startsWith("."),
      ),
    ]);
    const manifest: SyncManifest = {
      articleFiles,
      imageFiles,
      revision: source.revision,
      source: source.label,
      sourceType: source.type,
    };

    await writeFile(
      path.join(stagedContentDirectory, "sync-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    await Promise.all([
      rm(generatedContentDirectory, { force: true, recursive: true }),
      rm(publicImagesDirectory, { force: true, recursive: true }),
    ]);
    await Promise.all([
      rename(stagedContentDirectory, generatedContentDirectory),
      rename(stagedImagesDirectory, publicImagesDirectory),
    ]);

    const revision = source.revision?.slice(0, 7) ?? "unknown revision";
    console.log(
      `Synced ${articleFiles.length} Markdown files and ${imageFiles.length} images from ${revision}.`,
    );
  } finally {
    await Promise.all([
      rm(temporaryDirectory, { force: true, recursive: true }),
      rm(stagedContentDirectory, { force: true, recursive: true }),
      rm(stagedImagesDirectory, { force: true, recursive: true }),
    ]);
  }
}

await syncVault();
