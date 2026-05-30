"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { TabBar } from "./TabBar";
import { StatusBar } from "./StatusBar";
import { commands as builtinCommands } from "@/lib/commands";

interface MarkdownRendererProps {
  raw: string;
  filePath: string;
}

function RawView({
  raw,
  cursorLine,
  cursorCol,
  wrap,
}: {
  raw: string;
  cursorLine: number;
  cursorCol: number;
  wrap: boolean;
}) {
  const lines = raw.split("\n");
  return (
    <div className="flex-1 overflow-auto">
      <div className={`pt-4 pb-4 text-[13px] font-mono leading-6 text-nvim-text ${wrap ? "" : "min-w-max"}`}>
        {lines.map((line, i) => {
          const numEl = (
            <div className={`select-none text-right shrink-0 w-[3rem] pr-3 pl-2 border-r border-nvim-border ${
              i === cursorLine ? "text-nvim-text font-bold" : "text-nvim-lineno"
            }`}>
              {i + 1}
            </div>
          );

          if (i !== cursorLine) {
            return (
              <div key={i} className="flex leading-6">
                {numEl}
                <span className={`pl-4 ${wrap ? "whitespace-pre-wrap break-words min-w-0 flex-1" : "whitespace-pre"}`}>
                  {line || " "}
                </span>
              </div>
            );
          }

          const col = Math.min(cursorCol, line.length);
          const before = line.slice(0, col);
          const cursorChar = line[col] ?? " ";
          const after = line.slice(col + 1);
          return (
            <div key={i} className="flex leading-6 bg-nvim-cursorline">
              {numEl}
              <span className={`pl-4 ${wrap ? "whitespace-pre-wrap break-words min-w-0 flex-1" : "whitespace-pre"}`}>
                {before}
                <span className="vim-cursor">{cursorChar}</span>
                {after}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RenderedView({ body, filePath }: { body: string; filePath: string }) {
  const baseDir = filePath.split("/").slice(0, -1).join("/");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-6 prose-nvim">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSlug]}
          components={{
            img({ src, alt }) {
              if (!src || typeof src !== "string") return null;
              const isInline = /[?&]display=inline(-block)?(\b|$)/.test(src);
              const cleanSrc = src.replace(/([?&])display=inline(-block)?(&|$)/, (_m, pre, _d, post) =>
                post === "&" ? pre : ""
              ).replace(/[?&]$/, "");
              const resolvedSrc =
                cleanSrc.startsWith("http") || cleanSrc.startsWith("/")
                  ? cleanSrc
                  : `/api/image?path=${baseDir ? `${baseDir}/` : ""}${cleanSrc}`;
              // eslint-disable-next-line @next/next/no-img-element
              const imgEl = <img src={resolvedSrc} alt={alt ?? ""} className="rounded border border-nvim-border max-w-full" />;
              return isInline
                ? <span className="inline-block align-middle mx-1">{imgEl}</span>
                : <span className="block my-4">{imgEl}</span>;
            },
            a({ href, children }) {
              const isExternal = href?.startsWith("http");
              return (
                <a
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="text-nvim-link hover:underline"
                >
                  {children}
                </a>
              );
            },
            code({ className, children, ...props }) {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-nvim-surface text-nvim-inline-code px-1 py-0.5 rounded text-[0.85em] font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            pre({ children }) {
              return (
                <pre className="bg-nvim-codeblock border border-nvim-border rounded p-4 overflow-x-auto text-[13px] leading-6 my-4">
                  {children}
                </pre>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="border-collapse w-full text-[13px]">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="border border-nvim-border px-3 py-1 text-left bg-nvim-surface text-nvim-keyword font-mono font-semibold">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="border border-nvim-border px-3 py-1 text-nvim-text">
                  {children}
                </td>
              );
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-2 border-nvim-accent pl-4 my-4 text-nvim-subtext italic">
                  {children}
                </blockquote>
              );
            },
            h1({ children, id }) {
              return (
                <h1 id={id} className="text-2xl font-bold font-mono text-nvim-h1 mt-6 mb-3 border-b border-nvim-border pb-2">
                  {children}
                </h1>
              );
            },
            h2({ children, id }) {
              return (
                <h2 id={id} className="text-xl font-bold font-mono text-nvim-h2 mt-5 mb-2">
                  {children}
                </h2>
              );
            },
            h3({ children, id }) {
              return (
                <h3 id={id} className="text-lg font-semibold font-mono text-nvim-h3 mt-4 mb-2">
                  {children}
                </h3>
              );
            },
            p({ children }) {
              return (
                <p className="my-3 leading-7 text-nvim-text text-[14px]">
                  {children}
                </p>
              );
            },
            ul({ children }) {
              return (
                <ul className="my-3 ml-4 space-y-1 list-none">{children}</ul>
              );
            },
            ol({ children }) {
              return (
                <ol className="my-3 ml-4 space-y-1 list-decimal list-inside text-nvim-text text-[14px]">
                  {children}
                </ol>
              );
            },
            li({ children }) {
              return (
                <li className="text-nvim-text text-[14px] flex gap-2">
                  <span className="text-nvim-bullet shrink-0 mt-1">-</span>
                  <span>{children}</span>
                </li>
              );
            },
            hr() {
              return <hr className="border-nvim-border my-6" />;
            },
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ raw, filePath }: MarkdownRendererProps) {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"normal" | "command">("normal");
  const [commandBuffer, setCommandBuffer] = useState("");
  const [wrap, setWrap] = useState(false);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleView = useCallback(() => {
    setViewMode((v) => (v === "rendered" ? "raw" : "rendered"));
  }, []);

  const lines = raw.split("\n");
  const lineCount = lines.length;
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");

  // Clamp col to new line length when line changes
  useEffect(() => {
    const lineLen = (raw.split("\n")[cursorLine] ?? "").length;
    setCursorCol((c) => Math.min(c, lineLen));
  }, [cursorLine, raw]);

  // Reset cursor to top when file changes
  useEffect(() => {
    setCursorLine(0);
    setCursorCol(0);
  }, [filePath]);

  const showWarning = useCallback((msg: string) => {
    setWarning(msg);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    warnTimerRef.current = setTimeout(() => setWarning(null), 4000);
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      const handler = builtinCommands[trimmed];
      if (handler) {
        handler({ viewMode, setViewMode, showWarning, wrap, setWrap });
      } else if (trimmed) {
        showWarning(`E492: Not an editor command: ${trimmed}`);
      }
    },
    [viewMode, showWarning, wrap, setWrap]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editorMode === "command") {
        e.preventDefault();
        if (e.key === "Escape") {
          setEditorMode("normal");
          setCommandBuffer("");
        } else if (e.key === "Enter") {
          executeCommand(commandBuffer);
          setEditorMode("normal");
          setCommandBuffer("");
        } else if (e.key === "Backspace") {
          setCommandBuffer((buf) => {
            if (buf.length === 0) { setEditorMode("normal"); return ""; }
            return buf.slice(0, -1);
          });
        } else if (e.key.length === 1) {
          setCommandBuffer((buf) => buf + e.key);
        }
        return;
      }

      // Normal mode
      const currentLines = raw.split("\n");
      switch (e.key) {
        case ":":
          e.preventDefault();
          setEditorMode("command");
          setCommandBuffer("");
          break;
        case "q":
          e.preventDefault();
          if (viewMode === "raw") setViewMode("rendered");
          break;
        case "ArrowUp":
          e.preventDefault();
          setCursorLine((l) => Math.max(0, l - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setCursorLine((l) => Math.min(currentLines.length - 1, l + 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCursorCol((c) => Math.max(0, c - 1));
          break;
        case "ArrowRight": {
          e.preventDefault();
          const lineLen = (currentLines[cursorLine] ?? "").length;
          setCursorCol((c) => Math.min(lineLen, c + 1));
          break;
        }
        default:
          if (
            e.key.length === 1 ||
            e.key === "Enter" ||
            e.key === "Backspace" ||
            e.key === "Delete"
          ) {
            e.preventDefault();
            showWarning("E45: 'readonly' option is set (add ! to override)");
          }
      }
    },
    [editorMode, commandBuffer, executeCommand, raw, cursorLine, viewMode, showWarning]
  );

  useEffect(() => {
    containerRef.current?.focus();
  }, [filePath]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col flex-1 min-h-0 overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <TabBar viewMode={viewMode} onToggleView={toggleView} />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {viewMode === "raw" ? (
          <RawView raw={raw} cursorLine={cursorLine} cursorCol={cursorCol} wrap={wrap} />
        ) : (
          <RenderedView body={body} filePath={filePath} />
        )}
      </div>
      {editorMode === "command" && (
        <div className="flex items-center h-6 px-2 bg-nvim-statusbar border-t border-nvim-statusborder text-[12px] font-mono shrink-0">
          <span className="text-nvim-text">:{commandBuffer}</span>
          <span className="vim-cursor"> </span>
        </div>
      )}
      {warning && editorMode === "normal" && (
        <div className="flex shrink-0 px-2 py-1">
          <span className="px-2 py-0.5 bg-nvim-error text-nvim-error text-[12px] font-mono">
            {warning}
          </span>
        </div>
      )}
      <StatusBar filePath={filePath} viewMode={viewMode} lineCount={lineCount} editorMode={editorMode} />
    </div>
  );
}
