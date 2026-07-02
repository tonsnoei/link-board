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
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
  } catch {
    return '';
  }
}

// Google's favicon proxy can't reach internal/self-hosted sites and can't
// follow inline data-URI icons, so try the site's own favicon.ico first
// (the browser fetches it directly) before falling back to Google's proxy.
export function faviconCandidatesFor(pageUrl) {
  try {
    const { origin } = new URL(pageUrl);
    return [`${origin}/favicon.ico`, faviconUrlFor(pageUrl)].filter(Boolean);
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
