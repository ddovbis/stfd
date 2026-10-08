# STFD — Sit the Fuck Down

A tiny, multilingual bathroom manifesto encouraging visitors to sit down to pee.
Built with plain HTML, CSS and JavaScript: no framework, backend, runtime packages,
external fonts, analytics, or build step.

- **Repository:** https://github.com/ddovbis/stfd (private)
- **Running instance:** http://168.119.226.28:8123/
- **Local checkout:** `/home/ddovbis/projects/web/stfd`
- **Languages:** English, Romanian, Russian and Hungarian

## Features

- Responsive layout, including narrow 320px screens.
- Language picker with saved preference and `?lang=en|ro|ru|hu` overrides.
- Interactive pledge button and rotating localized slogans.
- Downloadable PNG and SVG QR assets pointing to the running instance.
- CSS reduced-motion support; native emoji appearance depends on the device.
- Language switching still works when browser storage is blocked (without persistence).

## Structure

```text
public/                 Entire deployable website
  index.html
  styles.css
  script.js
  stfd-qr.png
  stfd-qr.svg
scripts/generate-qr.mjs  Regenerate both QR assets
scripts/size.mjs         Report deployment and estimated gzip sizes
tests/site.spec.js       Browser, interaction, layout, asset and QR checks
playwright.config.js    Desktop/mobile Chromium test configuration
```

Serve **only `public/`**, not the repository root. Git history, documentation,
Node development dependencies and tests do not belong in the published site.

## Run locally

From the checkout root, with Python 3 installed:

```bash
python3 -m http.server 8123 --bind 0.0.0.0 --directory public
```

Open `http://localhost:8123/`. Use the host's public IP and port for external access.
No `npm install` is needed to serve the site. `npm start` is an equivalent shortcut.
This Python server is a lightweight preview; use static hosting or an HTTPS web
server for a permanent deployment.

### Current server

The user-level `stfd.service` serves `public/` on port 8123. It is enabled at startup;
user lingering is enabled on this host. Its definition is at
`~/.config/systemd/user/stfd.service` (host configuration, not a website asset).

```bash
systemctl --user status stfd.service
systemctl --user restart stfd.service
journalctl --user -u stfd.service -n 30
```

## Development and tests

Requires Node.js 20+ and Python 3. Development dependencies are locked in
`package-lock.json`; there are no client-side package dependencies.

```bash
npm ci
npx playwright install chromium
npm test
```

On a Linux machine missing browser libraries, use Playwright's documented
`npx playwright install --with-deps chromium` setup (system privileges may be required).
Tests launch their own loopback-only server on port 8124; that port must be free.
To reuse an existing Chromium executable, as on the current server:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/home/ddovbis/.openclaw/browsers/openclaw-chrome npm test
```

The suite runs 24 checks across desktop and mobile Chromium: branding and
translation coverage in all four languages, pledge/slogan interaction, language
persistence and URL priority, invalid-language fallback, blocked storage, menu
keyboard behavior, 320px layout, PNG/SVG QR decoding and download, asset responses,
private-file exclusion, and project-site subpath compatibility.

## QR codes

```bash
npm ci
npm run qr -- http://168.119.226.28:8123/
```

The argument is the destination embedded in **both** assets. After changing the
hosting URL, regenerate the QR codes and update the expected target in
`tests/site.spec.js` before running the tests. Previously printed codes still
point to their original URL; they are not dynamic redirects.

## Deployment size

Run `npm run size` to measure the files in `public/`.

At the STFD rename: **33,252 bytes (32.47 KiB)** for all five deployment files.
Individually gzipped estimate: **11,297 bytes (11.03 KiB)**; actual transfer size
and compression depend on the host. These figures exclude Git history,
documentation, tests and development dependencies.

## Future GitHub Pages deployment

Only the contents of `public/` need uploading. There is no build step.
All asset references are relative, and `/stfd/` subpath behavior is tested.

1. Confirm the account plan supports Pages for a private repository.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Use a static-site deployment workflow with `actions/configure-pages`,
   `actions/upload-pages-artifact` (**path: `public`**) and `actions/deploy-pages`.
   Give the deployment job `pages: write` and `id-token: write` permissions and use
   the `github-pages` environment.
4. The usual project URL is `https://ddovbis.github.io/stfd/` unless a custom domain
   is configured. Regenerate both QR assets for the chosen URL.

Pages is **not enabled** by this repository setup. A private source repository
alone does not make a published Pages website private. Check current plan/access
rules in [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
