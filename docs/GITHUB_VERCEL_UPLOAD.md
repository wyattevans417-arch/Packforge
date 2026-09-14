# GitHub + Vercel upload — v3.11

## Replace the deployed project
1. Unzip the PackForge v3.11 ZIP.
2. Open the GitHub repository connected to Vercel.
3. Upload the **contents** of the ZIP to the repository root.
4. Make sure `index.html`, `service-worker.js`, and `vercel.json` sit directly at the repository root.
5. Commit the changes. Vercel can deploy this as a plain static site with no build command.

## Low-request layout
`index.html` already contains the live CSS and JavaScript. The `css/` and `js/` folders are retained only as editable source copies for future updates; the deployed page does not request them during normal play.

The service worker caches the self-contained page and serves later navigations cache-first. A new release should bump both the service-worker registration query version and the cache name so players receive the new build without returning to the old per-navigation network-refresh behavior.
