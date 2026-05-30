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
│   └── api/image/[...path]/route.ts  # serves images by path — local fs or GitHub API
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
    ├── commands.ts             # user-configurable vim command map
    └── types.ts                # FileNode, FileContent, BreadcrumbSegment, CommandContext
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
- Only `.md` / `.mdx` files are shown; image files and directories containing no markdown are pruned
- Clicking a directory toggles expand/collapse
- Clicking a file opens it as a new tab (does not replace existing)
- Sidebar is collapsed by default on mobile (< 768px); a `›` toggle strip on the left opens it

### Tabs
- Open tabs persist in `localStorage` across page navigations
- Cannot close the last remaining tab
- `TabsProvider` lives in the root layout so state survives route changes

### Raw / rendered toggle
- "RENDERED": react-markdown with remark-gfm + rehype-highlight (Catppuccin syntax colors)
- "RAW": source markdown with line numbers
- Toggle button in the tab bar, top-right

### Vim cursor and command mode
- A blinking block cursor is shown in RAW view at the exact character position (line + col)
- Arrow keys move the cursor; any printable/edit key shows a readonly warning above the status bar
- Pressing `:` enters COMMAND mode — a command line appears above the status bar, status pill changes to `COMMAND`
- Escape cancels; Enter executes; Backspace on empty buffer exits command mode
- `q` in normal mode while in RAW view switches back to RENDERED (no colon needed)
- Built-in commands: `:w` → raw view, `:q` → rendered view, `:wq` → raw view, `:w!` → E212 error, `:set wrap` / `:set nowrap` → toggle line wrapping in RAW view
- Add or override commands in `src/lib/commands.ts` — each entry maps a string to `(ctx: CommandContext) => void`
- `CommandContext` provides: `viewMode`, `setViewMode`, `showWarning`, `wrap`, `setWrap`
- Unknown commands show `E492: Not an editor command: <cmd>` as a warning
- Readonly warning displays as a compact red box above the status bar; command line uses the status bar's styling

### Images in markdown
- External URLs (http/https) used as-is
- Relative paths (e.g. `../images/foo.svg`) are pre-normalized (resolving `../`) and served via `/api/image/<normalized-path>`
- The API route (`src/app/api/image/[...path]/route.ts`) serves files from `./content/` locally or via the GitHub API in production — switching is automatic based on `GITHUB_REPO` env var
- Path-based URLs (not query params) are used deliberately so mobile browsers (Safari) cache each image as a distinct resource
- Add `?display=inline-block` to any image path to render it inline with surrounding text: `![](../images/icon.png?display=inline-block)`

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
