"use client";

interface StatusBarProps {
  filePath: string;
  viewMode: "rendered" | "raw";
  lineCount?: number;
  editorMode?: "normal" | "command";
}

export function StatusBar({ filePath, viewMode, lineCount, editorMode = "normal" }: StatusBarProps) {
  const parts = filePath ? filePath.split("/") : [];
  const filename = parts.pop() || "index.md";
  const dir = parts.join("/");

  return (
    <div className="flex items-center h-6 px-0 shrink-0 bg-nvim-statusbar border-t border-nvim-statusborder text-[12px] font-mono text-nvim-statustext">
      {/* mode pill */}
      <span className="px-3 h-full flex items-center bg-nvim-mode-bg text-nvim-mode-text font-bold tracking-wider">
        {editorMode === "command" ? "COMMAND" : "NORMAL"}
      </span>

      {/* separator */}
      <span className="px-2 text-nvim-statusborder shrink-0">›</span>

      {/* path — truncates on narrow screens */}
      <div className="min-w-0 flex-1 truncate">
        <span className="text-nvim-subtext">{dir ? `${dir}/` : ""}</span>
        <span className="text-nvim-statustext">{filename}</span>
      </div>

      {/* right side — never shrinks */}
      <div className="flex items-center shrink-0">
        <span className="px-3 text-nvim-subtext">{viewMode.toUpperCase()}</span>
        <span className="hidden sm:inline text-nvim-statusborder px-1">│</span>
        <span className="hidden sm:inline px-2 text-nvim-subtext">MARKDOWN</span>
        <span className="text-nvim-statusborder px-1">│</span>
        <span className="px-2 text-nvim-subtext">{lineCount ?? 0}L</span>
        <span className="hidden sm:inline text-nvim-statusborder px-1">│</span>
        <span className="hidden sm:inline px-3 text-nvim-subtext">utf-8</span>
      </div>
    </div>
  );
}
