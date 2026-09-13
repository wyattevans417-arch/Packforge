# PackForge v3.2 — Odds & God Pack Update

Local-only optimized PackForge build. Normal gameplay remains fully browser-side and uses the stable `packforge_save_v1` save key.

## v3.2 highlights
- One centralized **Pack Odds & Pull Chances** browser on Shop and Bag → Packs; individual per-pack `?` buttons are gone.
- **Cards** tab renders real card previews and exact base pull chances, capped at **50 cards per page** for low-end hardware.
- Separate odds tabs for **Variants**, **Special Packs**, **Semi-God Packs**, and **God Packs**.
- Semi-God types: **Rare Rush**, **Holo Flood**, **Legendary Finish**.
- God types: **Epic+**, **Variant**, **Holo**, **Secret**, and the **1-in-1,000,000,000 Archive God Pack**.
- God/Semi-God wrappers visibly mutate and announce their exact type before opening.
- The Archive God Pack awards one of every card in the selected set and uses a paginated bulk reveal so it does not animate 100+ cards at once.
- Dev Board can force every new pack type and now includes a searchable-style **Codes** reference tab listing every current reward code.
- Eight new one-use force-test codes were added for the new Semi-God/God modes.
- Campaign-focus and Lucky Coin logic now execute inside the core game scope instead of disconnected external scripts, fixing a split-file scope hazard.
- Existing campaign-focused balance, campaign bonuses, Collector Requests, rare-card presentation, fullscreen inspect/zoom, Auto Open balance, PWA caching, and weak-device scaling remain intact.

## Upload
Upload the **contents of this folder** to the repository root so `index.html` is at the root. See `docs/GITHUB_VERCEL_UPLOAD.md`.
