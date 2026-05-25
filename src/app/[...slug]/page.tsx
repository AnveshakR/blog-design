import { notFound } from "next/navigation";
import { getFileTree, getFileContent, isMarkdownFile } from "@/lib/content";
import { EditorLayout } from "@/components/EditorLayout";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { FileNode } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string[] };
}

function findAllFiles(nodes: FileNode[]): string[] {
  const files: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") files.push(node.path);
    if (node.children) files.push(...findAllFiles(node.children));
  }
  return files;
}

export default async function SlugPage({ params }: PageProps) {
  const slugPath = params.slug.join("/");

  // try .md extension first, then .mdx, then treat as directory index
  const candidates = [
    `${slugPath}.md`,
    `${slugPath}.mdx`,
    `${slugPath}/index.md`,
    slugPath,
  ];

  const [tree] = await Promise.all([getFileTree()]);

  const allFiles = findAllFiles(tree);

  const resolvedPath = candidates.find((c) => allFiles.includes(c));
  if (!resolvedPath || !isMarkdownFile(resolvedPath)) {
    notFound();
  }

  const content = await getFileContent(resolvedPath).catch(() => null);
  if (!content) notFound();

  return (
    <div className="h-full flex flex-col">
      <EditorLayout tree={tree} currentPath={resolvedPath}>
        <MarkdownRenderer raw={content.raw} filePath={resolvedPath} />
      </EditorLayout>
    </div>
  );
}
