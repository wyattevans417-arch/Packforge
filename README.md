# PackForge v3.15 — Unique Names + Chase Rarity FX

## What changed
- Every one of the 10 permanent packs now has exactly 125 unique one-word card names.
- Removed numbered filler names and generated adjective/suffix names from those sets.
- God and Ascendant keep their existing odds and IDs, but now have dedicated animated card treatments.
- Fixed Admin God/Ascendant test packs so they actually generate the real God/Ascendant chase cards instead of falling back to normal cards.
- God manual pulls have a full gold/cosmic reveal cinematic.
- Ascendant manual pulls have a longer dimensional/aurora reveal cinematic.
- Existing local save IDs are preserved; this update does not reset players.
- Effects are CSS/DOM only and require no external assets or extra Vercel requests.
- Service worker cache bumped to v3.15.

## Deployment
Deploy `index.html`, `service-worker.js`, and `vercel.json` at the Vercel project root.
