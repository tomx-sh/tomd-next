# tomd-next

A Next.js static blog whose content comes from the public
[`tomx-sh/tomd-obsidian-vault`](https://github.com/tomx-sh/tomd-obsidian-vault)
Obsidian vault.

The vault is the single source of truth. Markdown and attachments are copied to
gitignored generated directories before Next.js starts:

```text
Obsidian vault
├── index.md            → .obsidian-content/index.md
├── articles/*.md       → .obsidian-content/articles/*.md
└── images/**           → public/obsidian-images/**
```

Obsidian configuration, `not-published`, and other vault files are never
copied.

## Development

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

## Generated data

The following directories are generated and must not be committed:

- `.obsidian-content`
- `public/obsidian-images`

Regular site assets remain in `public/images`, separate from vault-owned
attachments. `bun run sync-content` selects the local vault when
`OBSIDIAN_VAULT_PATH` is set and otherwise uses GitHub. The explicit `:local`
and `:remote` commands are preferable in scripts because they cannot choose the
wrong source accidentally.
