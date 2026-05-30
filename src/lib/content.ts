import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { FileNode, FileContent } from "./types";

// ── local filesystem ──────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), "content");

function readLocalTree(dir: string, basePath = ""): FileNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = readLocalTree(path.join(dir, entry.name), entryPath);
      if (children.length > 0) {
        nodes.push({ name: entry.name, path: entryPath, type: "dir", children });
      }
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      nodes.push({ name: entry.name, path: entryPath, type: "file" });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1;
    if (a.type !== "dir" && b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
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

  // filter out hidden paths and non-markdown files
  const visible = items.filter((item) => {
    if (item.path.split("/").some((seg) => seg.startsWith("."))) return false;
    if (item.type === "blob") return item.path.endsWith(".md") || item.path.endsWith(".mdx");
    return true;
  });

  // create all nodes
  for (const item of visible) {
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
  for (const item of visible) {
    const node = map.get(item.path)!;
    const parentPath = item.path.split("/").slice(0, -1).join("/");
    if (parentPath && map.has(parentPath)) {
      map.get(parentPath)!.children!.push(node);
    } else {
      root.push(node);
    }
  }

  // prune dirs with no markdown descendants, sort remaining
  function pruneAndSort(nodes: FileNode[]): FileNode[] {
    return nodes
      .filter((node) => {
        if (node.type === "file") return true;
        node.children = pruneAndSort(node.children ?? []);
        return node.children.length > 0;
      })
      .sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return pruneAndSort(root);
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
