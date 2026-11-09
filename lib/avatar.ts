export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const AVATAR_EXT_BY_TYPE: Record<(typeof AVATAR_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AvatarFileLike = {
  name: string;
  type: string;
  size: number;
};

export function assertAvatarFile(file: AvatarFileLike | null | undefined): string | null {
  if (!file || file.size <= 0) return "Choose a photo to upload.";
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return "Photo must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Photo must be 2 MB or smaller.";
  }
  return null;
}

export function avatarHelpText() {
  return "JPEG, PNG, or WebP · max 2 MB";
}

export function isCustomAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes(`/object/public/${AVATAR_BUCKET}/`);
}

export function avatarStoragePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] || "");
}

export function resolveProviderAvatarUrl(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;
  const picture = typeof metadata.picture === "string" ? metadata.picture : null;
  if (avatarUrl && !isCustomAvatarUrl(avatarUrl)) return avatarUrl;
  if (picture) return picture;
  return null;
}
