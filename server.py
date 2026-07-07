#!/usr/bin/env python3
"""Statische file-server die favicons oplost zoals een echte browser dat doet.

Gebruik:
  python3 server.py [poort]        # standaard poort 8000

Serveert de huidige map als statische site (zoals `python3 -m http.server`)
en voegt daar één endpoint aan toe: GET /api/favicon?url=<pagina-url>.

Dat endpoint haalt de opgegeven pagina zelf op -- server-side, dus zonder de
CORS-beperkingen die een browser wel heeft -- en parsed de <head> op
<link rel="icon">-achtige tags, precies zoals een browser dat doet bij het
bepalen van het tabblad-icoon. De opgeloste, absolute favicon-URL komt terug
als JSON. Lukt dat niet (pagina onbereikbaar, geen icon-tags), dan komt er
`{"faviconUrl": null}` terug en valt de frontend terug op de bestaande
gok-strategie (favicon.ico, apple-touch-icon.png, Google's favicon-proxy).

Het resultaat wordt per URL in-memory gecached (voor de levensduur van het
serverproces) om niet bij elke render de doelpagina opnieuw te bevragen.
Voeg `&refresh=1` toe aan de query om die cache voor die URL te negeren en
opnieuw op te lossen -- de frontend doet dat op het moment dat een tegel
wordt opgeslagen, zodat de cache pas ververst als de tegel echt wordt
aangepast, niet op een vaste tijd.
"""
import json
import sys
import threading
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen

# Deliberately NOT a spoofed Chrome UA: some sites (e.g. web.whatsapp.com) run
# bot-detection that 400s a request claiming to be Chrome but missing the rest
# of Chrome's header set (Accept-Encoding, sec-ch-ua, ...). A plain/generic UA
# reads as "some HTTP client", not "a browser lying about itself", and is
# waved through by sites that would otherwise block it.
USER_AGENT = "LinkBoard-FaviconResolver/1.0"
FETCH_TIMEOUT = 5
MAX_HTML_BYTES = 1_000_000  # ruim genoeg voor de <head>, voorkomt te grote downloads

ICON_RELS = {"icon", "shortcut icon", "apple-touch-icon", "apple-touch-icon-precomposed", "mask-icon"}

_cache = {}
_cache_lock = threading.Lock()


class IconLinkParser(HTMLParser):
    """Verzamelt <link rel="...icon..."> tags uit de <head>, zoals een browser dat doet.

    Sommige pagina's (bijv. Adminer) hebben helemaal geen <head>/<body> tags --
    <link>/<meta>/<title> staan dan los onder <html>. Browsers bouwen daar zelf
    een impliciete <head> omheen; dat nabootsen we door alles vóór <body> als
    head-content te behandelen, in plaats van te wachten op een letterlijke
    <head>-starttag die er misschien nooit komt.
    """

    def __init__(self):
        super().__init__()
        self.icons = []
        self._done = False

    def handle_starttag(self, tag, attrs):
        if self._done:
            return
        if tag == "body":
            self._done = True
        elif tag == "link":
            attrs_dict = {k.lower(): (v or "") for k, v in attrs}
            rel = attrs_dict.get("rel", "").strip().lower()
            href = attrs_dict.get("href", "").strip()
            if rel in ICON_RELS and href:
                self.icons.append((rel, href, attrs_dict.get("sizes", "")))

    def handle_endtag(self, tag):
        if tag == "head":
            self._done = True


def _icon_size(sizes):
    if not sizes or sizes.strip().lower() == "any":
        return 0
    try:
        return max(int(part.split("x")[0]) for part in sizes.split() if "x" in part.lower())
    except ValueError:
        return 0


def _pick_best(icons):
    if not icons:
        return None
    # Grotere afmeting wint; bij ontbrekende sizes heeft apple-touch-icon de
    # voorkeur omdat die conventie bijna altijd hoge resolutie is.
    def score(entry):
        rel, _href, sizes = entry
        return (_icon_size(sizes), 1 if "apple-touch-icon" in rel else 0)

    return max(icons, key=score)


def resolve_favicon(page_url):
    req = Request(page_url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urlopen(req, timeout=FETCH_TIMEOUT) as resp:
        final_url = resp.geturl()
        raw = resp.read(MAX_HTML_BYTES)
        charset = resp.headers.get_content_charset() or "utf-8"

    html = raw.decode(charset, errors="replace")
    parser = IconLinkParser()
    parser.feed(html)
    best = _pick_best(parser.icons)
    if best:
        _rel, href, _sizes = best
        return urljoin(final_url, href)

    parsed = urlparse(final_url)
    return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"


def resolve_favicon_cached(page_url, force_refresh=False):
    if not force_refresh:
        with _cache_lock:
            if page_url in _cache:
                return _cache[page_url]
    try:
        result = resolve_favicon(page_url)
    except Exception:
        result = None
    with _cache_lock:
        _cache[page_url] = result
    return result


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/favicon":
            self._handle_favicon(parsed)
            return
        super().do_GET()

    def _handle_favicon(self, parsed):
        params = parse_qs(parsed.query)
        page_url = (params.get("url") or [""])[0]
        force_refresh = (params.get("refresh") or [""])[0] in ("1", "true")
        favicon_url = (
            resolve_favicon_cached(page_url, force_refresh)
            if page_url.startswith(("http://", "https://"))
            else None
        )
        body = json.dumps({"faviconUrl": favicon_url}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"LinkBoard server draait op http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
