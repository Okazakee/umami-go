import { listWebsitesCached } from '@/lib/api/umamiData';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';

export async function ensureSelectedWebsiteId(options?: { websitesTtlMs?: number }): Promise<{
  selectedWebsiteId: string | null;
  didAutoSelect: boolean;
  hasWebsites: boolean;
}> {
  const existing = await getSelectedWebsiteId();
  const res = await listWebsitesCached(options?.websitesTtlMs);
  const websites = res.data ?? [];

  if (websites.length === 0) {
    return { selectedWebsiteId: null, didAutoSelect: false, hasWebsites: false };
  }

  const firstId = websites[0]?.id ?? null;
  if (!firstId) return { selectedWebsiteId: null, didAutoSelect: false, hasWebsites: false };

  if (!existing) {
    await setSelectedWebsiteId(firstId);
    return { selectedWebsiteId: firstId, didAutoSelect: true, hasWebsites: true };
  }

  const stillExists = websites.some((w) => w.id === existing);
  if (!stillExists) {
    await setSelectedWebsiteId(firstId);
    return { selectedWebsiteId: firstId, didAutoSelect: true, hasWebsites: true };
  }

  return { selectedWebsiteId: existing, didAutoSelect: false, hasWebsites: true };
}
