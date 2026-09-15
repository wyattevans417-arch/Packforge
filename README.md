# PackForge v3.13 — Ascendant Expansion

Deploy the contents of this folder at the Vercel project root.

## v3.13
- Removes the v3.12 deployment-triggered reset. Existing `packforge_save_v1` local saves are preserved; no automatic upgrade reset is performed either.
- Saves remain browser/device-local only. There is no Google/Firebase/cloud save path.
- Expands every set to exactly 125 cards without changing existing card IDs.
- Moves the actual five Campaign reward collections — Dinosaurs, Superheroes, Pokémon, Villains, and Mythology — into the permanent Shop.
- Adds God rarity (1 in 2,000,000 card rolls) and Ascendant rarity (1 in 20,000,000 card rolls), with one unique chase card of each rarity per set and lightweight premium visual effects.
- Gives all 10 permanent packs their own rarity profile so pack identities differ instead of sharing one table.
- Dinosaurs, Superheroes, and Pokémon cost $1,250. Villains costs $750. Mythology costs $900.
- Cards from those five promoted Campaign sets sell for 1.30×–1.80× normal-set values.
- Cleans player reward codes so normal codes award useful cash/packs rather than potions, upgrade levels, punishments, or developer-only forced-pack tests.
- Adds Card Foundry passive income while the game is open. Foundry progress is local and creates no server requests.
- Keeps the Mines fix from v3.11.

## Vercel / bandwidth
- `index.html` is self-contained: game CSS and JavaScript are inline.
- The service worker remains cache-first for the app shell.
- Card Foundry, saves, codes, pack rolls, Casino, and collection logic all run locally in the browser.
- There are no analytics, cloud-save, or gameplay API calls in this build.

## Save behavior
This build does **not** wipe progress on launch. Manual Settings → Reset Save still exists for players who intentionally want a fresh local vault.
