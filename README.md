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

`GET /cv-md` returns the complete `cv.md` file with
`Content-Type: text/markdown; charset=utf-8`. The response is generated at build
time, so production CV updates require a new deployment.
If the source vault has no `cv.md`, the route returns 404.

`GET /cv-rich` displays the CV in a terminal with ANSI colors, headings,
emphasis, links, and wrapped text. Frontmatter is hidden and Obsidian callouts
are formatted as quotes. It uses the same build-time content and 404 behavior.

```bash
curl -sS http://localhost:3000/cv-rich
```

## Development

`/chat` embeds the [fx WebAssembly terminal](https://fx.sh/docs/lib/terminal)
with xterm.js and uses `gemma4:e2b-it-qat` at `https://chat.tomd.sh/v1`.
No provider API key is needed. `/api/chat` adapts fx's Gateway stream to OpenAI
Chat Completions and proxies model discovery, avoiding browser CORS requirements.
The terminal requires browser JSPI support, such as current Chrome or Edge.
Conversations live in the page's memory and reset on reload.

`prepare:chat` copies the installed SDK's terminal WASM into a gitignored public
asset directory before development and production builds. `libfx` is pinned to
its published development build for its TypeScript declarations; the terminal
transport is adapted because it currently supports only Gateway in WASM.

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
