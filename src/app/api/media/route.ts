import { existsSync } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function pick(files: string[], candidates: string[]) {
  const lower = files.map((file) => file.toLowerCase());
  for (const candidate of candidates) {
    const index = lower.indexOf(candidate.toLowerCase());
    if (index !== -1) return `/Media/${files[index]}`;
  }
  return null;
}

export async function GET() {
  const dir = path.join(process.cwd(), "public", "Media");

  if (!existsSync(dir)) {
    return NextResponse.json({
      background: null,
      backgroundType: null,
      audio: null,
      avatar: null,
    });
  }

  const files = (await readdir(dir)).filter((file) => !file.startsWith("."));
  const video = pick(files, ["Background.mp4", "background.mp4"]);
  const image = pick(files, [
    "Background.png",
    "Background.jpg",
    "Background.jpeg",
    "Background.webp",
    "Background.gif",
  ]);
  const audio = pick(files, ["sound.mp3", "Sound.mp3"]);
  const avatar = pick(files, [
    "Avatar.png",
    "Avatar.jpg",
    "Avatar.jpeg",
    "Avatar.webp",
    "Avatar.gif",
  ]);

  return NextResponse.json({
    background: video ?? image,
    backgroundType: video ? "video" : image ? "image" : null,
    audio,
    avatar,
  });
}
