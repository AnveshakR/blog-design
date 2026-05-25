"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useTabs } from "./TabsProvider";

interface TabBarProps {
  viewMode: "rendered" | "raw";
  onToggleView: () => void;
}

export function TabBar({ viewMode, onToggleView }: TabBarProps) {
  const { theme, toggle } = useTheme();
  const { tabs, closeTab } = useTabs();
  const pathname = usePathname();

  return (
    <div className="flex items-stretch border-b border-nvim-border bg-nvim-tabbar shrink-0 h-9 overflow-hidden">
      {/* open buffer tabs */}
      <div className="flex items-stretch overflow-x-auto flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.href === pathname;
          return (
            <div
              key={tab.href}
              className={`
                flex items-center gap-1 border-r border-nvim-border shrink-0
                ${isActive ? "bg-nvim-bg text-nvim-text" : "bg-nvim-tabbar text-nvim-subtext hover:bg-nvim-surface"}
              `}
            >
              <Link
                href={tab.href}
                className="flex items-center gap-1.5 pl-3 pr-1 h-full text-[13px] font-mono"
              >
                <span className={`text-[10px] ${isActive ? "text-nvim-icon" : "text-nvim-fold"}`}>
                  ▪
                </span>
                <span>{tab.title}</span>
              </Link>
              {/* close button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  closeTab(tab.href);
                }}
                className="pr-2 pl-1 h-full flex items-center text-nvim-fold hover:text-nvim-text text-[11px] leading-none"
                title="Close tab"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="flex items-center gap-1 px-2 shrink-0 border-l border-nvim-border">
        <button
          onClick={onToggleView}
          className="
            flex items-center gap-1 px-2 py-1 text-[12px] font-mono
            border border-nvim-border rounded
            text-nvim-subtext hover:text-nvim-text hover:bg-nvim-surface
            transition-colors
          "
          title={viewMode === "rendered" ? "Switch to raw" : "Switch to rendered"}
        >
          {viewMode === "rendered" ? "RAW" : "RENDERED"}
        </button>

        <button
          onClick={toggle}
          className="
            flex items-center justify-center w-7 h-7 text-[14px]
            border border-nvim-border rounded
            text-nvim-subtext hover:text-nvim-text hover:bg-nvim-surface
            transition-colors
          "
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "○" : "●"}
        </button>
      </div>
    </div>
  );
}
