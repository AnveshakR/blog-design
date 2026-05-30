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

export interface CommandContext {
  viewMode: "rendered" | "raw";
  setViewMode: (mode: "rendered" | "raw") => void;
  showWarning: (msg: string) => void;
  wrap: boolean;
  setWrap: (wrap: boolean) => void;
}
