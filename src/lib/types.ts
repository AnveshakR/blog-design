export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export interface FileContent {
  raw: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface BreadcrumbSegment {
  name: string;
  path: string;
}
