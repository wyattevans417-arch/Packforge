# PackForge v3.16 — Admin Lab + Black Hole Ascendant

## Major changes
- Rebuilt the owner Admin panel into a six-page developer console: Overview, 100 Packs, Card Lab, Casino Lab, 100 Codes, and System.
- Added exactly 100 searchable admin pack presets: 10 permanent sets × 10 test-pack profiles.
- Added exactly 100 new positive PF16 reward codes. Rewards are cash/cards/packs/chase packs only; no punishment, potion, or upgrade-level code rewards.
- Cash controls accept typed values for add/set/subtract.
- Exact Card Lab can grant a specific card, quantity, variant, raw/graded state, or PSA 10 Black Label.
- Direct God, Ascendant, specialty, mutation, Semi-God, God Pack, Foundry, Overdrive, campaign, grading, upgrade-state, save JSON, and queue controls.
- Casino Lab can independently skew Coin, Mines, Plinko, Slots, Blackjack, Roulette, payout multipliers, and Lucky Return. Neutral defaults preserve normal game behavior.
- Ascendant card presentation rebuilt as an embedded animated black hole with event horizon, photon ring, accretion disk, gravitational-lensing treatment, star pull, and a dedicated full-screen reveal.
- Foundry enlarged to fill the full right-side column next to the Coin while keeping the quieter dark presentation.
- Existing local save key remains `packforge_save_v1`; this update does not reset players.

## Vercel / network behavior
- `index.html` is still self-contained.
- New Admin and black-hole systems use only local HTML/CSS/JS and add no asset fetches or API calls.
- Service worker remains cache-first and is bumped to the v3.16 cache so the new build replaces v3.15 cleanly.

## Deployment
Deploy `index.html`, `service-worker.js`, and `vercel.json` at the Vercel project root.
