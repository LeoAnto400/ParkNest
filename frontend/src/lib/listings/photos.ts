import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function photoUrls(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("listing-photos")
    .createSignedUrls([...new Set(paths)], 60);
  const urls: Record<string, string> = {};
  for (const photo of data || [])
    if (photo.path && photo.signedUrl) urls[photo.path] = photo.signedUrl;
  return urls;
}
