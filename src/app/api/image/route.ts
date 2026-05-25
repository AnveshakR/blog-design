import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

async function fromGithub(filePath: string): Promise<NextResponse> {
  const repo = process.env.GITHUB_REPO!;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return new NextResponse("not found", { status: 404 });

  const data = await res.json();
  const buffer = Buffer.from(data.content, "base64");
  const mime = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function fromLocal(filePath: string): NextResponse {
  const full = path.resolve(CONTENT_DIR, filePath);
  if (!full.startsWith(CONTENT_DIR + path.sep) && full !== CONTENT_DIR) {
    return new NextResponse("forbidden", { status: 403 });
  }
  try {
    const data = fs.readFileSync(full);
    const mime = MIME[path.extname(full).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get("path");
  if (!rawPath) return new NextResponse("missing path", { status: 400 });

  // Normalize away .. segments and guard against traversal above root
  const filePath = path.posix.normalize(rawPath);
  if (filePath.startsWith("..")) {
    return new NextResponse("forbidden", { status: 403 });
  }

  if (process.env.GITHUB_REPO) {
    return fromGithub(filePath);
  }

  return fromLocal(filePath);
}
