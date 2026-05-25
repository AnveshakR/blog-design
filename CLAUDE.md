# Blog Design — Claude Context

## Project overview

A personal blog website for `anveshakr.com` (subdomain `blog.anveshakr.com`), styled to look like a Neovim editor window (Catppuccin Mocha dark / Catppuccin Latte light themes). Content is written in Markdown and sourced from a separate public GitHub repository at runtime via the GitHub API.

**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · Node.js 18

## Running locally

```bash
npm run dev      # starts on localhost:3000
npm run build    # production build check
```

No environment variables needed for local dev — the app reads from `./content/` directly via `fs`.

## Content sources

- **Local dev**: `./content/` directory — edit files here to prototype. This is the dummy/example content and is committed to this repo.
- **Production**: a separate **private** GitHub repo. Set `GITHUB_REPO=owner/repo` and `GITHUB_TOKEN=ghp_...` in Netlify environment variables. The token needs **Contents: read-only** scope on the content repo. The `content.ts` abstraction handles switching automatically.

Copy `.env.local.example` → `.env.local` to test against the real content repo locally.

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # root layout, JetBrains Mono font, ThemeProvider + TabsProvider
│   ├── page.tsx                # renders about.md as homepage
│   ├── globals.css             # Catppuccin CSS variables + Tailwind layers
│   └── [...slug]/page.tsx      # catch-all route for all other markdown files
│   └── api/image/route.ts      # serves images from ./content/images/ locally
├── components/
│   ├── EditorLayout.tsx        # outer shell: sidebar + main pane
│   ├── FileTree.tsx            # ASCII tree file explorer (neo-tree style)
│   ├── MarkdownRenderer.tsx    # rendered/raw toggle, react-markdown pipeline
│   ├── StatusBar.tsx           # bottom neovim statusline
│   ├── TabBar.tsx              # open buffer tabs with close buttons
│   ├── TabsProvider.tsx        # client context: open tabs state, persisted in localStorage
│   └── ThemeProvider.tsx       # dark/light toggle, persisted in localStorage
└── lib/
    ├── content.ts              # getFileTree() + getFileContent() — fs or GitHub API
    └── types.ts                # FileNode, FileContent, BreadcrumbSegment
content/                        # dummy content (local dev only)
├── images/                     # images referenced by markdown files
├── about.md                    # rendered at /
├── projects/
└── notes/
```

## Design decisions

### Neovim UI
- Layout mirrors neovim: sidebar (neo-tree), tab bar (buffers), editor pane, statusline
- Font: JetBrains Mono via `next/font/google`
- Colors: Catppuccin Mocha (dark default) and Catppuccin Latte (light), toggled via `.light` class on `<html>`
- Theme toggle persists to `localStorage`; default is dark

### File tree
- ASCII connectors: `├──`, `└──`, `│` — no arrow indicators
- Clicking a directory toggles expand/collapse
- Clicking a file opens it as a new tab (does not replace existing)

### Tabs
- Open tabs persist in `localStorage` across page navigations
- Cannot close the last remaining tab
- `TabsProvider` lives in the root layout so state survives route changes

### Raw / rendered toggle
- "RENDERED": react-markdown with remark-gfm + rehype-highlight (Catppuccin syntax colors)
- "RAW": source markdown with line numbers
- Toggle button in the tab bar, top-right

### Images in markdown
- External URLs (http/https) used as-is
- Relative paths (e.g. `../images/foo.svg`) resolved through `/api/image?path=...`
- The API route (`src/app/api/image/route.ts`) serves files from `./content/` with path traversal protection
- In production, images should live in the content repo and be fetched via the GitHub API (same token as content) — reference them with a relative path like `../images/foo.png` and the renderer resolves them through `/api/image`; that API route will need updating for production to use the GitHub API instead of `fs`

### Content repo conventions
- `welcome.md` at the root maps to `/` (homepage) — this file is hardcoded and must always be present
- All other `.md` / `.mdx` files map to their path without extension (`projects/foo.md` → `/projects/foo`)
- Images should go in an `images/` folder at the root of the content repo
- Frontmatter fields used: `title`, `date`, `description`, `tags`

## Deployment

### Netlify (hosting)
- `netlify.toml` configures build: `npm run build`, publish `.next`, plugin `@netlify/plugin-nextjs`
- Set `GITHUB_REPO=owner/repo` and `GITHUB_TOKEN=ghp_...` in Netlify environment variables
- Token needs **Contents: read-only** scope (fine-grained PAT) on the content repo
- Node version: 18

### Auto-rebuild on content push
- In Netlify: Site settings → Deploy hooks → create a hook, copy the URL
- In the content repo: add `.github/workflows/trigger-rebuild.yml` (example in `content-repo-example/`)
- Add the deploy hook URL as `NETLIFY_DEPLOY_HOOK` secret in the content repo

### Cloudflare DNS
- Add a `CNAME` record: name `blog`, target `your-site.netlify.app`
- Add with **proxy off** first so Netlify can provision the TLS cert
- After cert is provisioned in Netlify, proxy can be turned back on
- Cloudflare SSL/TLS mode must be set to **Full** (not Flexible, not Full Strict) when proxying to Netlify
- Then add `blog.anveshakr.com` as a custom domain in Netlify → Domain management

## Conventions

- No comments in code unless the why is non-obvious
- No TypeScript `any` — use proper types or `unknown`
- Tailwind custom color utilities are defined via `@layer utilities` in `globals.css` and map to CSS variables (e.g. `bg-nvim-bg` → `var(--nvim-bg)`) — do not add them to `tailwind.config.ts` as that breaks hex-variable opacity handling
- All content fetching goes through `src/lib/content.ts` — do not call `fs` or `fetch` directly in page components
- Dark theme is the CSS default (`:root`); light theme overrides via `.light` class on `<html>`
