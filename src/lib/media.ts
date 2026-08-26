export type MediaManifest = {
  background: string | null;
  backgroundType: "video" | "image" | null;
  audio: string | null;
  avatar: string | null;
};

export const emptyMedia: MediaManifest = {
  background: null,
  backgroundType: null,
  audio: null,
  avatar: null,
};

/** Filenames in public/Media, used when the serverless filesystem cannot list that folder. */
export const bundledMediaFiles = [
  "activity.png",
  "avatar.jpg",
  "background.jpg",
  "d8354b6b-a186-4657-9a33-4e54ffbfcf1b.mov",
  "discord-avatar.webp",
  "song.mp3",
];

function pick(files: string[], candidates: string[]) {
  const lower = files.map((file) => file.toLowerCase());
  for (const candidate of candidates) {
    const index = lower.indexOf(candidate.toLowerCase());
    if (index !== -1) return `/Media/${files[index]}`;
  }
  return null;
}

function pickByExtension(files: string[], extensions: string[]) {
  const match = files.find((file) => extensions.some((extension) => file.toLowerCase().endsWith(extension)));
  return match ? `/Media/${match}` : null;
}

export function resolveMedia(files: string[]): MediaManifest {
  const video = pick(files, ["Background.mp4", "background.mp4", "Background.webm", "background.webm", "Background.mov", "background.mov"])
    ?? pickByExtension(files, [".mp4", ".webm", ".mov"]);
  const image = pick(files, [
    "Background.png",
    "Background.jpg",
    "Background.jpeg",
    "Background.webp",
    "Background.gif",
  ]);
  const audio = pick(files, ["sound.mp3", "Sound.mp3", "song.mp3", "Song.mp3"])
    ?? pickByExtension(files, [".mp3", ".wav", ".ogg"]);
  const avatar = pick(files, [
    "Avatar.png",
    "Avatar.jpg",
    "Avatar.jpeg",
    "Avatar.webp",
    "Avatar.gif",
  ]);

  return {
    background: video ?? image,
    backgroundType: video ? "video" : image ? "image" : null,
    audio,
    avatar,
  };
}
