# PackForge v3.6 — Ghost / Jet / Odds Cleanup

Local-only optimized PackForge build. No Firebase or account system.

Highlights: fixed global odds button under the FPS counter, one active campaign and one active grading job, lore-first campaign cards, a unified Extra hub with Stats / Chances / Achievements, 150 achievements, sortable Minecraft-style lifetime stats, improved Chances/Achievement sub-tabs, Coin-page-only Lucky Coin, spectacular Ghost card styling, short high-end flash reveals, and Chromebook-friendly animation fallbacks.

The normal local save key remains `packforge_save_v1`.


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

## v3.4 highlights
- Fixed global Pack Odds `?` button beneath the FPS counter on Pack screens.
- One active campaign and one grading job at a time.
- Lore-first campaign selection cards.
- `Extra` replaces separate Stats/Achievements navigation with Stats, Chances, and Achievements tabs.
- Sortable Minecraft-style lifetime statistics.
- 150 achievements total; original 100-achievement reward remains unchanged.
- Ghost card visuals rebuilt; rare-pull cinematics shortened to flash sequences.
- Performance fallbacks preserved for weak Chromebooks.


Balance audit: premium pack prices were normalized after a Monte Carlo sell-value simulation. Odds were not reduced; prices now better reflect each pack's actual long-run value while keeping chase packs high-variance.


## v3.5 changes
- Specialty packs (Variant, High-Roller, Vintage, Secret Hunt, Graded) are no longer purchasable. Campaign special rewards are their normal gameplay source; Admin can grant them for testing.
- Campaign special rewards can award either a campaign-only specialty pack or a special mutation pack.
- Added Jet Lumagui: exact 1 in 1,000 card-roll rarity, Power 1, fixed $420 sell value, dedicated smoky card treatment.
- Admin Panel rebuilt as a tabbed Control Center with dashboard, economy, packs, cards, outcomes, Campaign/Event tools, diagnostics, and codes.
- Lucky Coin and public reward-code routes no longer grant campaign-only specialty packs.


## v3.6 notes
- Potions removed from playable UI/reward paths.
- Page-local Pack Odds button + Pack Chances tab.
- Ghost/Jet card FX upgraded; Crue reveal no longer uses normal 3D flip.
- Admin-only five-card rarity packs added.
