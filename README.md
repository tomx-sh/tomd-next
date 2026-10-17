# tomd-next

A Next.js static blog whose content comes from the public
[`tomx-sh/tomd-obsidian-vault`](https://github.com/tomx-sh/tomd-obsidian-vault)
Obsidian vault.

The vault is the single source of truth. Markdown and attachments are copied to
gitignored generated directories before Next.js starts:

```text
Obsidian vault
├── index.md            → .obsidian-content/index.md
├── cv.md               → .obsidian-content/cv.md
├── articles/*.md       → .obsidian-content/articles/*.md
└── images/**           → public/obsidian-images/**
```

Obsidian configuration, `not-published`, and other vault files are never
copied.

The home page renders `index.md`, and `/cv` renders `cv.md` with the same
Markdown renderer as articles. All other posts are discovered automatically
from `articles/*.md` and rendered at `/articles/[slug]`.

`GET /cv.md` downloads `cv-tomd.md`, the Markdown body of `cv.md` without frontmatter, with
`Content-Type: text/markdown; charset=utf-8`. The response is generated at build
time, so production CV updates require a new deployment.
If the source vault has no `cv.md`, the route returns 404.

`GET /cv.pdf` downloads `cv-tomd.pdf`. Like `/cv.md`, its route uses
`force-static`: Next.js generates the response during the build and serves the
saved PDF in production. Ironpress runs as server-side WebAssembly without
Chromium or system libraries. Rendering errors fail the build; missing `cv.md`
returns 404.

The PDF uses the same Markdown plugins and shared typography CSS as the page,
with A4 margins and 85% text sizing. IBM Plex Sans TrueType fonts are bundled
under `src/assets/cv-fonts` with their SIL Open Font License. The WASM renderer
receives these bytes directly and needs no network or installed fonts.

In development, refresh the PDF download after `bun run sync-content:local` to
render the latest local content. There is no separate PDF generation command.

## Development

`/chat` is a minimal streaming chat with `gemma4:e2b-it-qat` at
`https://chat.tomd.sh/v1`. Set `CHAT_API_KEY` in `.env` (and in your hosting
environment for production). `/api/chat` adds the key as a Bearer token on the
server and proxies Chat Completions to avoid browser CORS requirements. The key
is never sent to the browser. History is saved in localStorage;
`/clear` resets it and Ctrl+C cancels a reply.

Development syncs from a local Obsidian vault, including changes that have not
been committed or pushed yet.

Create `.env.local` from the provided example and set the absolute vault path:

```bash
cp .env.example .env.local
```

```dotenv
OBSIDIAN_VAULT_PATH="/Users/you/path/to/your/obsidian/vault"
```

Then install dependencies and start the site:

```bash
bun install
bun dev
```

`bun dev` performs a local sync before starting Next.js. When the dev server is
already running, sync new Obsidian edits from another terminal with:

```bash
bun run sync-content:local
```

Refresh the browser after a manual sync to see the new content. This avoids
maintaining a second, committed copy of the vault. Make sure iCloud has
downloaded the vault files locally before syncing.

For a full local build, including the CV PDF, use:

```bash
bun run build:local
```

This syncs from the local vault, including uncommitted edits. Use it for local
build checks so the running dev server keeps the local content. `bun run build`
uses GitHub content and replaces the same generated content directory.

## Production and Vercel

`bun run build` always ignores the local vault setting and shallow-clones the
configured GitHub branch. This ensures deployments contain only content that
has been committed and pushed:

```bash
bun run build
```

The remote source defaults to:

```dotenv
OBSIDIAN_VAULT_REPOSITORY="https://github.com/tomx-sh/tomd-obsidian-vault.git"
OBSIDIAN_VAULT_REF="main"
```

These variables can be overridden in Vercel if the repository or branch
changes. The repository must be publicly cloneable unless authentication is
added to the sync script.

Each deployment downloads the latest vault commit. A push to the separate vault
repository does not automatically redeploy this project, so configure a Vercel
deploy hook or another trigger if every vault push should be published.

## Code quality

Biome is pinned in `package.json`, with a matching schema version in
`biome.json`. It checks formatting, recommended lint rules (including React and
Next.js), and import/export ordering. Warnings also fail the check.

```bash
bun run lint
bun run lint:fix
bun run format
```

`lint:fix` applies safe lint fixes, formatting, and import ordering. `format`
only formats files. Review changes before committing.

Biome respects `.gitignore` and excludes build output. Upstream shadcn UI,
Kibo UI, and `src/app/typeset.css` are excluded from linting and formatting to
preserve their generated source. TypeScript and the production build still
check the UI components.

When upgrading Biome, update its pinned package and schema together, then run
`bunx --bun biome migrate --write` and `bun run lint`.

## Generated data

The following directories are generated and must not be committed:

- `.obsidian-content`
- `public/obsidian-images`

Regular site assets remain in `public/images`, separate from vault-owned
attachments. `bun run sync-content` selects the local vault when
`OBSIDIAN_VAULT_PATH` is set and otherwise uses GitHub. The explicit `:local`
and `:remote` commands are preferable in scripts because they cannot choose the
wrong source accidentally.
