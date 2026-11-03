import { createAdminClient } from "./supabase/admin";
import {
  assertCommunityThumbnail,
  COMMUNITY_THUMBNAIL_BUCKET,
  COMMUNITY_THUMBNAIL_EXT_BY_TYPE,
  COMMUNITY_THUMBNAIL_TYPES,
  storagePathFromPublicUrl,
} from "./community-thumbnail";

export type CommunityThumbnailFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function extensionForType(type: string) {
  return COMMUNITY_THUMBNAIL_EXT_BY_TYPE[type as (typeof COMMUNITY_THUMBNAIL_TYPES)[number]] || "jpg";
}

export async function uploadCommunityThumbnail(input: {
  propertyId: string;
  category: string;
  file: CommunityThumbnailFile;
}): Promise<{ url?: string; error?: string }> {
  const validationError = assertCommunityThumbnail(input.file);
  if (validationError) return { error: validationError };

  const ext = extensionForType(input.file.type);
  const path = `${input.propertyId}/${input.category}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from(COMMUNITY_THUMBNAIL_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) return { error: error.message || "Unable to upload thumbnail." };

  const { data } = admin.storage.from(COMMUNITY_THUMBNAIL_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) return { error: "Unable to resolve thumbnail URL." };
  return { url: data.publicUrl };
}

export async function deleteCommunityThumbnailByUrl(url: string | null | undefined) {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(COMMUNITY_THUMBNAIL_BUCKET).remove([path]);
}
