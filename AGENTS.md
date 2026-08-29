Use bun (not npm or pnpm).
This project is a static blog using .md files.
Use https://nextjs.org/docs/app/guides/mdx and https://github.com/vercel/next.js/tree/canary/examples/blog-starter as guides.
Blog posts are stored in `src/content/articles` as `.md` files.
The home page renders the content of `src/content/index.md`.
There is a CV rendering `src/content/cv.md`.
Posts can have a frontmatter section at the top with metadata such as title, date, and tags.
The .md files will be loaded from an Obsidian vault GitHub repository at build time. For now, this system is not implemented so we use the existing files in `src/content`