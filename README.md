# PackForge v4.0.1 — Arena Season 2 + Admin Core

GitHub/Vercel production drop-in build using the same layout as the earlier PackForge production ZIPs.

## Upload
1. Extract this ZIP.
2. Select everything inside it: `index.html`, `README.md`, `service-worker.js`, `vercel.json`, `css`, and `js`.
3. Drag those items directly into the GitHub repository root and replace the old files.
4. Commit and allow Vercel to redeploy.
5. Hard-refresh once after deployment if an older cached build is still open.

## Structure
- `index.html` — page markup
- `css/packforge.css` — all styles
- `js/packforge-core.js` — all game logic, Season 2, and redesigned Admin Core
- `service-worker.js` — shell caching and old-cache cleanup
- `vercel.json` — no-cache HTML/SW and immutable versioned CSS/JS
- `README.md` — deployment notes

This is the same v4.0.1 game content as the standalone build, split back into the production file layout used by the earlier versions. No third-party framework, CDN dependency, gameplay API, WebSocket, or server heartbeat is added.
