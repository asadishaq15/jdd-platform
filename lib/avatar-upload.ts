import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertAvatarFile,
  AVATAR_BUCKET,
  AVATAR_EXT_BY_TYPE,
  AVATAR_TYPES,
  avatarStoragePathFromPublicUrl,
  isCustomAvatarUrl,
} from "./avatar";

export type AvatarUploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function extensionForType(type: string) {
  return AVATAR_EXT_BY_TYPE[type as (typeof AVATAR_TYPES)[number]] || "jpg";
}

export async function uploadAvatar(input: {
  supabase: SupabaseClient;
  userId: string;
  file: AvatarUploadFile;
  previousUrl?: string | null;
}): Promise<{ url?: string; error?: string }> {
  const validationError = assertAvatarFile(input.file);
  if (validationError) return { error: validationError };

  const ext = extensionForType(input.file.type);
  const path = `${input.userId}/avatar.${ext}`;
  const bytes = new Uint8Array(await input.file.arrayBuffer());

  const { error } = await input.supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) return { error: error.message || "Unable to upload photo." };

  const { data } = input.supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) return { error: "Unable to resolve photo URL." };

  // Cache-bust so the UI refreshes after replace.
  const url = `${data.publicUrl}?t=${Date.now()}`;

  if (input.previousUrl && isCustomAvatarUrl(input.previousUrl)) {
    const previousPath = avatarStoragePathFromPublicUrl(input.previousUrl);
    if (previousPath && previousPath !== path) {
      await input.supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    }
  }

  return { url };
}

export async function deleteAvatarByUrl(supabase: SupabaseClient, url: string | null | undefined) {
  const path = avatarStoragePathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}
