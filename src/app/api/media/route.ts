import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { bundledMediaFiles, resolveMedia } from "@/lib/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function listMediaFiles() {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "Media"));
    const listed = files.filter((file) => !file.startsWith("."));
    if (listed.length > 0) return listed;
  } catch {
    // Vercel Functions do not always include public/ on the runtime filesystem.
  }

  return bundledMediaFiles;
}

export async function GET() {
  return NextResponse.json(resolveMedia(await listMediaFiles()));
}
