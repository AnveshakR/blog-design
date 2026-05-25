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

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) return new NextResponse("missing path", { status: 400 });

  // Resolve and guard against path traversal
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
