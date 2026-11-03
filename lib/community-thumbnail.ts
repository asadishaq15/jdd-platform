export const COMMUNITY_THUMBNAIL_BUCKET = "community-thumbnails";
export const COMMUNITY_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
export const COMMUNITY_THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const COMMUNITY_THUMBNAIL_EXT_BY_TYPE: Record<(typeof COMMUNITY_THUMBNAIL_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CommunityThumbnailFileLike = {
  name: string;
  type: string;
  size: number;
};

export function assertCommunityThumbnail(file: CommunityThumbnailFileLike | null | undefined): string | null {
  if (!file || file.size <= 0) return null;
  if (!(COMMUNITY_THUMBNAIL_TYPES as readonly string[]).includes(file.type)) {
    return "Thumbnail must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > COMMUNITY_THUMBNAIL_MAX_BYTES) {
    return "Thumbnail must be 2 MB or smaller.";
  }
  return null;
}

export function communityThumbnailHelpText() {
  return "JPEG, PNG, or WebP · max 2 MB";
}

export function storagePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${COMMUNITY_THUMBNAIL_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] || "");
}
