#!/usr/bin/env python3
"""Download Tabler icon SVGs into icons/ and (re)generate icons/manifest.json.

Gebruik:
  python3 tools/download_icons.py                # download de curated standaardset
  python3 tools/download_icons.py home star heart # download specifieke iconen
  python3 tools/download_icons.py --names-file namen.txt
  python3 tools/download_icons.py --all           # download de VOLLEDIGE Tabler set (~5900 iconen, duurt lang)

Bron: https://github.com/tabler/tabler-icons (outline-stijl, MIT-licentie)
"""
import argparse
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ICONS_DIR = Path(__file__).resolve().parent.parent / "icons"
RAW_BASE = "https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline"
API_LIST_URL = "https://api.github.com/repos/tabler/tabler-icons/contents/icons/outline"

# Curated standaardset die bij dit project wordt geleverd.
DEFAULT_ICONS = [
    'activity', 'adjustments', 'alarm', 'alert-circle', 'alert-triangle', 'anchor',
    'antenna', 'apple', 'apps', 'archive', 'award', 'backpack',
    'ball-basketball', 'ball-football', 'barcode', 'basket', 'battery', 'beer',
    'bell', 'bell-ringing', 'bike', 'binoculars', 'bluetooth', 'bolt',
    'book', 'book-2', 'bookmark', 'brain', 'brand-airbnb', 'brand-amazon',
    'brand-android', 'brand-apple', 'brand-bitbucket', 'brand-chrome', 'brand-css3', 'brand-discord',
    'brand-docker', 'brand-facebook', 'brand-figma', 'brand-firefox', 'brand-github', 'brand-gitlab',
    'brand-google', 'brand-html5', 'brand-instagram', 'brand-javascript', 'brand-linkedin', 'brand-mastercard',
    'brand-netflix', 'brand-notion', 'brand-npm', 'brand-office', 'brand-paypal', 'brand-pinterest',
    'brand-python', 'brand-reddit', 'brand-slack', 'brand-spotify', 'brand-stripe', 'brand-telegram',
    'brand-tiktok', 'brand-trello', 'brand-twitter', 'brand-uber', 'brand-vercel', 'brand-visa',
    'brand-vscode', 'brand-whatsapp', 'brand-windows', 'brand-x', 'brand-youtube', 'brand-zoom',
    'briefcase', 'brush', 'bug', 'building', 'building-bank', 'building-store',
    'bulb', 'bus', 'cake', 'calendar', 'calendar-event', 'camera',
    'camera-selfie', 'campfire', 'car', 'cards', 'cat', 'certificate',
    'chart-bar', 'chart-line', 'chart-pie', 'checklist', 'chess', 'circle-check',
    'circle-x', 'clipboard', 'clipboard-list', 'clock', 'clock-24', 'cloud',
    'cloud-computing', 'cloud-rain', 'code', 'coffee', 'coin', 'color-swatch',
    'compass', 'credit-card', 'currency-dollar', 'currency-euro', 'database', 'device-desktop',
    'device-gamepad', 'device-gamepad-2', 'device-laptop', 'device-mobile', 'device-tablet', 'device-tv',
    'dice', 'dna', 'dog', 'dots', 'download', 'edit',
    'external-link', 'file', 'file-text', 'files', 'filter', 'fingerprint',
    'first-aid-kit', 'fish', 'flag', 'flame', 'folder', 'folder-open',
    'gauge', 'gift', 'git-branch', 'git-commit', 'glass', 'globe',
    'grid-dots', 'hammer', 'headphones', 'heart', 'help', 'home',
    'id', 'image-in-picture', 'infinity', 'info-circle', 'key', 'language',
    'layout-grid', 'leaf', 'link', 'list', 'list-check', 'live-photo',
    'loader', 'lock', 'lock-open', 'luggage', 'mail', 'map',
    'map-pin', 'medal', 'menu-2', 'message', 'message-circle', 'microphone',
    'microscope', 'moon', 'mountain', 'movie', 'music', 'network',
    'news', 'note', 'notebook', 'palette', 'paperclip', 'paw',
    'paw-off', 'pencil', 'phone', 'phone-call', 'photo', 'pill',
    'pizza', 'plane', 'plant', 'plant-2', 'plug', 'power',
    'printer', 'puzzle', 'qrcode', 'question-mark', 'recycle', 'refresh',
    'robot', 'rocket', 'route', 'router', 'run', 'sailboat',
    'salad', 'satellite', 'scan', 'school', 'search', 'send',
    'server', 'settings', 'share', 'shield', 'shield-check', 'ship',
    'shopping-bag', 'shopping-cart', 'snowflake', 'speakerphone', 'star', 'star-half',
    'stethoscope', 'sun', 'swimming', 'tag', 'target', 'telescope',
    'temperature', 'tent', 'terminal', 'theater', 'ticket', 'ticket-off',
    'tool', 'tools', 'train', 'trash', 'trending-down', 'trending-up',
    'trophy', 'umbrella', 'upload', 'user', 'user-circle', 'users',
    'vaccine', 'video', 'volume', 'volume-2', 'walk', 'wallet',
    'weight', 'wifi', 'world', 'world-www', 'yoga',
]


def fetch_all_names():
    with urllib.request.urlopen(API_LIST_URL, timeout=15) as resp:
        entries = json.load(resp)
    return [e["name"][:-4] for e in entries if e["name"].endswith(".svg")]


def download_one(name, dest_dir):
    dest = dest_dir / f"{name}.svg"
    if dest.exists():
        return name, True
    url = f"{RAW_BASE}/{name}.svg"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            if resp.status == 200:
                dest.write_bytes(resp.read())
                return name, True
    except Exception:
        pass
    return name, False


def regenerate_manifest(dest_dir):
    names = sorted(p.stem for p in dest_dir.glob("*.svg"))
    (dest_dir / "manifest.json").write_text(json.dumps(names, indent=2) + "\n")
    return names


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("names", nargs="*", help="Iconennamen om te downloaden (standaard: curated set)")
    parser.add_argument("--names-file", help="Tekstbestand met een iconnaam per regel")
    parser.add_argument("--all", action="store_true", help="Download de volledige Tabler outline-set (~5900 iconen)")
    parser.add_argument("--workers", type=int, default=16, help="Aantal parallelle downloads (standaard 16)")
    args = parser.parse_args()

    if args.all:
        print("Volledige iconenlijst ophalen van GitHub...")
        names = fetch_all_names()
    elif args.names:
        names = args.names
    elif args.names_file:
        names = [l.strip() for l in Path(args.names_file).read_text().splitlines() if l.strip()]
    else:
        names = DEFAULT_ICONS

    ICONS_DIR.mkdir(exist_ok=True)
    ok, failed = 0, []

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(download_one, name, ICONS_DIR) for name in names]
        for future in as_completed(futures):
            name, success = future.result()
            if success:
                ok += 1
            else:
                failed.append(name)

    manifest = regenerate_manifest(ICONS_DIR)
    print(f"Klaar: {ok}/{len(names)} iconen beschikbaar. manifest.json bevat {len(manifest)} iconen.")
    if failed:
        print(f"Niet gevonden ({len(failed)}): {', '.join(sorted(failed))}")
        sys.exit(1 if not ok else 0)


if __name__ == "__main__":
    main()
