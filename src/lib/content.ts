import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { FileNode, FileContent } from "./types";

// ── local filesystem ──────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), "content");

function readLocalTree(dir: string, basePath = ""): FileNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => !e.name.startsWith("."))
    .sort((a, b) => {
      // dirs before files, then alphabetical
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? "dir" : "file",
        children: entry.isDirectory()
          ? readLocalTree(path.join(dir, entry.name), entryPath)
          : undefined,
      };
    });
}

function readLocalContent(filePath: string): FileContent {
  const fullPath = path.join(CONTENT_DIR, filePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = matter(raw);
  return {
    raw,
    frontmatter: parsed.data as Record<string, unknown>,
    body: parsed.content,
  };
}

// ── github api ────────────────────────────────────────────────────────────────

interface GithubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  url: string;
}

function buildTree(items: GithubTreeItem[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // create all nodes
  for (const item of items) {
    const name = item.path.split("/").pop()!;
    const node: FileNode = {
      name,
      path: item.path,
      type: item.type === "tree" ? "dir" : "file",
      children: item.type === "tree" ? [] : undefined,
    };
    map.set(item.path, node);
  }

  // build tree
  for (const item of items) {
    const node = map.get(item.path)!;
    const parentPath = item.path.split("/").slice(0, -1).join("/");
    if (parentPath && map.has(parentPath)) {
      map.get(parentPath)!.children!.push(node);
    } else {
      root.push(node);
    }
  }

  // sort each level: dirs first, then alphabetical
  function sortChildren(nodes: FileNode[]) {
    nodes.sort((a, b) => {
      if (a.type === "dir" && b.type !== "dir") return -1;
      if (a.type !== "dir" && b.type === "dir") return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortChildren(node.children);
    }
  }
  sortChildren(root);

  return root;
}

async function fetchGithubTree(): Promise<FileNode[]> {
  const repo = process.env.GITHUB_REPO!;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  const res = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return buildTree(data.tree as GithubTreeItem[]);
}

async function fetchGithubContent(filePath: string): Promise<FileContent> {
  const repo = process.env.GITHUB_REPO!;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  const parsed = matter(raw);
  return {
    raw,
    frontmatter: parsed.data as Record<string, unknown>,
    body: parsed.content,
  };
}

// ── public api ────────────────────────────────────────────────────────────────

export async function getFileTree(): Promise<FileNode[]> {
  if (process.env.GITHUB_REPO) {
    return fetchGithubTree();
  }
  return readLocalTree(CONTENT_DIR);
}

export async function getFileContent(filePath: string): Promise<FileContent> {
  if (process.env.GITHUB_REPO) {
    return fetchGithubContent(filePath);
  }
  return readLocalContent(filePath);
}

export function isMarkdownFile(filePath: string): boolean {
  return filePath.endsWith(".md") || filePath.endsWith(".mdx");
}
