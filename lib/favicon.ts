export function faviconUrlForDomain(domainOrUrl: string, size = 64): string {
  const clean = domainOrUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim();

  // Google S2 favicon service. Later we can swap providers without touching UI code.
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=${size}`;
}
