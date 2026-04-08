import { getAuthToken } from "@/lib/auth";

/**
 * Deletes an image from Supabase Storage via the delete API.
 * Silently ignores non-storage URLs (e.g. /background.jpg, external URLs).
 */
export async function deleteStorageImage(url) {
  if (!url || !url.includes("portal-images")) return;
  try {
    const token = getAuthToken();
    await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    });
  } catch {
    // Non-critical — log but don't block UI
    console.warn("Failed to delete storage image:", url);
  }
}
