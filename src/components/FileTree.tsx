"use client";

import { useState } from "react";
import type { FileNode } from "@/lib/types";
import { useTabs } from "./TabsProvider";

interface FileTreeProps {
  tree: FileNode[];
  currentPath: string;
}

interface NodeProps {
  node: FileNode;
  currentPath: string;
  prefix: string;
  isLast: boolean;
}

function TreeNode({ node, currentPath, prefix, isLast }: NodeProps) {
  const { openTab } = useTabs();
  const [open, setOpen] = useState(
    currentPath.startsWith(node.path + "/") || currentPath === node.path
  );

  const connector = isLast ? "└── " : "├── ";
  const childPrefix = prefix + (isLast ? "    " : "│   ");
  const isActive = currentPath === node.path;

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left flex items-baseline hover:bg-nvim-surface transition-colors py-[1px] pr-2"
        >
          <span className="text-nvim-fold font-mono text-[13px] leading-5 whitespace-pre select-none">
            {prefix}{connector}
          </span>
          <span className="text-nvim-folder font-mono text-[13px] leading-5 truncate">
            {node.name}
          </span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child, i) => (
              <TreeNode
                key={child.path}
                node={child}
                currentPath={currentPath}
                prefix={childPrefix}
                isLast={i === node.children!.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const href =
    node.name === "welcome.md" && node.path === "welcome.md"
      ? "/"
      : `/${node.path.replace(/\.mdx?$/, "")}`;

  return (
    <button
      onClick={() => openTab({ href, title: node.name })}
      className={`
        w-full text-left flex items-baseline py-[1px] pr-2 transition-colors
        ${isActive ? "bg-nvim-selection" : "hover:bg-nvim-surface"}
      `}
    >
      <span className="text-nvim-fold font-mono text-[13px] leading-5 whitespace-pre select-none">
        {prefix}{connector}
      </span>
      <span
        className={`font-mono text-[13px] leading-5 truncate ${
          isActive ? "text-nvim-text" : "text-nvim-file"
        }`}
      >
        {node.name}
      </span>
    </button>
  );
}

export function FileTree({ tree, currentPath }: FileTreeProps) {
  return (
    <nav className="flex flex-col h-full select-none" aria-label="File explorer">
      <div className="px-2 py-1 text-[11px] font-mono text-nvim-subtext uppercase tracking-widest border-b border-nvim-border shrink-0">
        EXPLORER
      </div>
      <div className="flex-1 overflow-y-auto py-1 px-1">
        {tree.map((node, i) => (
          <TreeNode
            key={node.path}
            node={node}
            currentPath={currentPath}
            prefix=""
            isLast={i === tree.length - 1}
          />
        ))}
      </div>
    </nav>
  );
}
