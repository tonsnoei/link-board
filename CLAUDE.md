# CLAUDE.md

## Testing UI changes

This is a static HTML/CSS/JS app (no build step). To verify UI changes in a real browser:

1. Serve the project root: `python3 -m http.server 8811`
2. Drive it with **Python Playwright** (`python3 -c "import playwright"` — already installed), not `chromium-cli` or Node/Playwright (not available in this environment).
3. Use `sync_playwright()`, launch Chromium, `page.goto("http://localhost:8811/")`, interact, and take a `page.screenshot(...)` to confirm visually.

Note: the tile-add/tab-add forms use `<input type="url" required>` — fill URLs with a full scheme (e.g. `https://example.com`), not a bare domain, or native HTML5 validation silently blocks submission.
