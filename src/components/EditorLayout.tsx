"use client";

import { useState, useEffect } from "react";
import { FileTree } from "./FileTree";
import type { FileNode } from "@/lib/types";

interface EditorLayoutProps {
  tree: FileNode[];
  currentPath: string;
  children: React.ReactNode;
}

export function EditorLayout({ tree, currentPath, children }: EditorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-nvim-bg">
      {/* sidebar */}
      <aside
        className={`
          flex flex-col shrink-0 border-r border-nvim-border overflow-hidden
          transition-all duration-150
          ${sidebarOpen ? "w-52" : "w-0"}
        `}
      >
        <FileTree tree={tree} currentPath={currentPath} />
      </aside>

      {/* main editor pane */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* sidebar toggle strip */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            w-3 h-12 flex items-center justify-center
            bg-nvim-surface border border-nvim-border rounded-r
            text-nvim-subtext hover:text-nvim-text hover:bg-nvim-selection
            transition-colors text-[10px]
            md:hidden
          "
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? "‹" : "›"}
        </button>

        {children}
      </main>
    </div>
  );
}
