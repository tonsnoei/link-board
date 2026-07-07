export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function faviconUrlFor(pageUrl) {
  try {
    const { hostname } = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
  } catch {
    return '';
  }
}

// Asks the local Python server to fetch the page itself and read its real
// <link rel="icon"> tags — exactly what a browser does to pick a tab icon.
// This has to happen server-side: a page on another origin usually has no
// Access-Control-Allow-Origin header, so the browser blocks reading its HTML
// via fetch() (CORS), but the Python server isn't subject to that restriction.
async function resolveFaviconViaServer(pageUrl) {
  try {
    const res = await fetch(`/api/favicon?url=${encodeURIComponent(pageUrl)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.faviconUrl || null;
  } catch {
    return null;
  }
}

// Tells the server to drop its cached favicon for this URL and resolve it
// again from the live site. The server otherwise caches a resolved favicon
// indefinitely (no time-based expiry), so this is the only way it gets
// refreshed — called right before a tile is saved, so the cache only ever
// changes when the tile itself is edited, not on a timer.
export async function refreshFaviconCache(pageUrl) {
  try {
    await fetch(`/api/favicon?url=${encodeURIComponent(pageUrl)}&refresh=1`, {
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // best effort — the normal candidate chain still falls back if this fails
  }
}

// Try the site's real favicon first (resolved server-side, see above). If
// that fails (site unreachable, no icon tags), fall back to guessing common
// filenames: apple-touch-icon.png is a near-universal high-res (180x180)
// convention, favicon.ico is near-universal but usually tiny. Google's proxy
// is the last resort since it always "succeeds" with a generic icon even when
// it has nothing real for the domain.
export async function faviconCandidatesFor(pageUrl) {
  try {
    const { origin } = new URL(pageUrl);
    const resolved = await resolveFaviconViaServer(pageUrl);
    return [
      resolved,
      `${origin}/apple-touch-icon.png`,
      `${origin}/favicon.ico`,
      faviconUrlFor(pageUrl),
    ].filter(Boolean);
  } catch {
    return [];
  }
}

export function loadImageWithFallbacks(img, urls, onExhausted) {
  const queue = [...urls];
  const tryNext = () => {
    const next = queue.shift();
    if (next === undefined) {
      onExhausted();
      return;
    }
    img.src = next;
  };
  img.onerror = tryNext;
  tryNext();
}

export function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

export function isLightColor(hex) {
  const clean = (hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}
