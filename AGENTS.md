# General
This project is a static blog using Obsidian .md files.

Use bun (not npm or pnpm).

# UI Components
Prefer default shadcn components over custom components. Avoid applying custom styles to them, use their variant prop. Never modify the source schadcn components.

Use `bunx --bun shadcn@latest add [component]` to install components.

Typography for markdown content is handled by shadcn typeset. See https://ui.shadcn.com/docs/components/base/typography for guidance. Do not overwrite or customize fonts without checking the docs first.

# Managing Markdown Files
Use https://nextjs.org/docs/app/guides/mdx and https://github.com/vercel/next.js/tree/canary/examples/blog-starter as guides.

Blog posts are stored in `src/content/articles` as `.md` files.

The .md files will be loaded from an Obsidian vault GitHub repository at build time. For now, this system is not implemented so we use the existing files in `src/content`

The home page renders the content of `src/content/index.md`.

There is a CV rendering `src/content/cv.md`.

Posts can have a frontmatter section at the top with metadata such as title, date, and tags.

Image files embedded in the markdown files are stored in `public/images`, whereas in the source Obsidian vault they are stored in `/images`.