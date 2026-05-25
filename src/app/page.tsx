import { getFileTree, getFileContent } from "@/lib/content";
import { EditorLayout } from "@/components/EditorLayout";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [tree, content] = await Promise.all([
    getFileTree(),
    getFileContent("welcome.md").catch(() => null),
  ]);

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center bg-nvim-bg text-nvim-subtext font-mono text-sm">
        <span>welcome.md not found in content root</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EditorLayout tree={tree} currentPath="welcome.md">
        <MarkdownRenderer raw={content.raw} filePath="welcome.md" />
      </EditorLayout>
    </div>
  );
}
