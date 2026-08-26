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
