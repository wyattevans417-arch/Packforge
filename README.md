# PackForge v3.11 — Mines Fix + Low-Edge Vercel Build

This build keeps the existing `packforge_save_v1` browser save and fixes the Casino Mines game while reducing repeat Vercel requests as aggressively as practical for a static deployment.

## Fixed
- Casino Mines round state is now declared correctly instead of throwing a JavaScript `ReferenceError` on Start.
- Mines builds all 25 tiles, resolves safe/mine picks, updates the exact multiplier/potential payout, supports Cash Out, and automatically pays when every safe tile is found.
- The Mines board is visible in an idle state before a round starts and uses real buttons for more reliable input handling.

## Vercel / request optimization
- `index.html` is self-contained: all game CSS and JavaScript are inlined into the page.
- No external stylesheet, game-script, analytics, or manifest request is needed for normal play.
- The only required runtime companion is `service-worker.js`.
- The service worker uses cache-first navigation. Once its shell cache is installed, it does not perform the old background `fetch()` on every page navigation.
- The service worker URL is versioned (`v=3.11.0`). Existing installs do at most one explicit service-worker update check per browser tab/session, instead of a network check on every reload.
- `vercel.json` keeps the service-worker script and first-load `index.html` revalidatable so a new deployment can be discovered without bringing back per-navigation refresh traffic.

## Save compatibility
PackForge still uses `packforge_save_v1`. This update does not intentionally reset player data.

## Deployment
Upload the contents of this folder to the repository root. `index.html`, `service-worker.js`, and `vercel.json` should sit at the root. No build command, serverless function, database, or API route is required.
