# PackForge v3.72.1 — GitHub / Vercel Production Build

This package is laid out like the older PackForge GitHub production ZIPs.

## Upload
1. Extract this ZIP on your computer.
2. Open the extracted folder.
3. Select **everything inside it**: `index.html`, `README.md`, `service-worker.js`, `vercel.json`, `css`, and `js`.
4. Drag those items directly into the GitHub repository upload area.
5. Commit the upload and allow Vercel to redeploy.
6. On the first visit after deployment, hard-refresh once if an older service worker was previously installed.

## Structure
- `index.html` — game page
- `css/packforge.css` — all game styles
- `js/packforge-core.js` — all game logic
- `service-worker.js` — local shell caching; deletes older PackForge caches on activation
- `vercel.json` — no-cache HTML/SW, long-lived versioned CSS/JS caching

No third-party framework, CDN asset, gameplay API, WebSocket, or server heartbeat is added by this package. Gameplay remains local after the static files load.
