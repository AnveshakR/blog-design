"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import Image from "next/image";
import { TabBar } from "./TabBar";
import { StatusBar } from "./StatusBar";

interface MarkdownRendererProps {
  raw: string;
  filePath: string;
}

function LineNumbers({ count }: { count: number }) {
  return (
    <div className="select-none text-right text-nvim-lineno text-[13px] font-mono leading-6 pr-3 pl-2 shrink-0 border-r border-nvim-border min-w-[3rem]">
      {Array.from({ length: count }, (_, i) => (
        <div key={i + 1}>{i + 1}</div>
      ))}
    </div>
  );
}

function RawView({ raw }: { raw: string }) {
  const lines = raw.split("\n");
  return (
    <div className="flex flex-1 overflow-auto">
      <LineNumbers count={lines.length} />
      <pre className="flex-1 p-4 text-[13px] font-mono leading-6 text-nvim-text overflow-auto whitespace-pre-wrap break-words">
        {lines.map((line, i) => (
          <div key={i} className="leading-6">
            {line || " "}
          </div>
        ))}
      </pre>
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
              // resolve relative image paths
              const resolvedSrc =
                src.startsWith("http") || src.startsWith("/")
                  ? src
                  : `/api/image?path=${baseDir ? `${baseDir}/` : ""}${src}`;
              return (
                <span className="block my-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedSrc}
                    alt={alt ?? ""}
                    className="rounded border border-nvim-border max-w-full"
                  />
                </span>
              );
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
            h1({ children }) {
              return (
                <h1 className="text-2xl font-bold font-mono text-nvim-h1 mt-6 mb-3 border-b border-nvim-border pb-2">
                  {children}
                </h1>
              );
            },
            h2({ children }) {
              return (
                <h2 className="text-xl font-bold font-mono text-nvim-h2 mt-5 mb-2">
                  {children}
                </h2>
              );
            },
            h3({ children }) {
              return (
                <h3 className="text-lg font-semibold font-mono text-nvim-h3 mt-4 mb-2">
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
                <ul className="my-3 ml-4 space-y-1 list-none">
                  {children}
                </ul>
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

  const toggleView = useCallback(() => {
    setViewMode((v) => (v === "rendered" ? "raw" : "rendered"));
  }, []);

  const lineCount = raw.split("\n").length;

  // strip frontmatter from body for rendered view
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <TabBar viewMode={viewMode} onToggleView={toggleView} />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {viewMode === "raw" ? (
          <RawView raw={raw} />
        ) : (
          <RenderedView body={body} filePath={filePath} />
        )}
      </div>
      <StatusBar
        filePath={filePath}
        viewMode={viewMode}
        lineCount={lineCount}
      />
    </div>
  );
}
