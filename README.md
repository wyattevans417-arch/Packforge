# PackForge v3.29 — Apology Pack Integrity

Built from v3.28.

## Player-facing changes
- Wyatt Apology God Pack can now be claimed only once per normal save flow.
- If the v3.28 triple-popup bug left multiple **unopened** Wyatt Apology God Packs, v3.29 keeps one and removes the accidental extras once.
- Wyatt Apology God Pack lineup is fixed and identical for everyone:
  1. Jet Lumagui
  2. Mythic serialized **#001/025**
  3. Wyatt Evans
  4. Mythic
  5. Common — **Holo + Serialized #001/001 + Grade 10 Perfect Black Label**
- Holo cards with a serial number are now correctly recognized by the serialized-card systems.
- Remaining visible 125-card Archive/Shop copy was updated to the current 250-card set size.

## Validation performed
- Browser runtime: only one apology overlay appears on v3.29.
- Double-click/repeated claim test: exactly one apology pack is granted.
- Re-entering the game after claim: no apology overlay reappears.
- Migration test: a save with 3 unopened apology packs is reduced to 1 once.
- Bag test: updated Wyatt Apology God Pack renders and opens through the current pack-opening flow.
- 10 permanent sets verified at 250 unique one-word cards each.
- Every set verified at 15 Ultra / 10 Secret / 7 Ghost / 5 God / 3 Ascendant.
- Pokémon Ascendants verified as Mew / Mewtwo / Arceus.
- No runtime errors during the v3.29 browser smoke tests.
- JavaScript syntax, static IDs, referenced assets, service-worker shell assets, Admin password digest, standalone dependencies, and ZIP integrity checked.

## Saves
Uses the existing local `packforge_save_v1` save key. No Firebase/cloud saving is added.

## Deploy
Upload the ZIP contents to the Vercel project root. `index.html`, CSS, core JS, tutorial JS, service worker, and `vercel.json` are included.
