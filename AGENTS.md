# General

This project is a static blog using Obsidian .md files.

Use bun (not npm or pnpm).

# UI Components

Prefer default shadcn components over custom components. Avoid applying custom styles to them, use their variant prop. Never modify the source schadcn components.

Use `bunx --bun shadcn@latest add [component]` to install components.

Typography for markdown content is handled by shadcn typeset. See https://ui.shadcn.com/docs/components/base/typography for guidance. Do not overwrite or customize fonts without checking the docs first.

# Managing Markdown Files

Use https://nextjs.org/docs/app/guides/mdx and https://github.com/vercel/next.js/tree/canary/examples/blog-starter as guides.

The Obsidian vault is the single source of truth. Do not edit or commit the
generated `.obsidian-content` or `public/obsidian-images` directories.

For development, `bun dev` syncs `.md` files and images from the local vault
configured by `OBSIDIAN_VAULT_PATH` in `.env.local`. Run
`bun run sync-content:local` to refresh content while the dev server is running.

For production, `bun run build` always syncs from the public Obsidian vault
GitHub repository before building.

The home page renders the generated `.obsidian-content/index.md`. Blog posts
come from `.obsidian-content/articles`.

The CV page renders the generated `.obsidian-content/cv.md` with the same
Markdown renderer as articles.

Posts can have a frontmatter section at the top with metadata such as title, date, and tags.

Image files embedded in Markdown are stored in the vault's `/images` directory
and generated into `public/obsidian-images`. Regular site-owned images remain
in `public/images`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
