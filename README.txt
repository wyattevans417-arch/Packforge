PackForge v4.4.22 SHOP FAST / 3-request Vercel build

Cold browser visit requests:
  1. index.html
  2. css/pf-core.v4422.shopfast.3667b5d68ce5.css
  3. assets/pf-code.v4422.shopfast.84291a1674a0.pack.js

Refresh after first visit:
  - index.html may revalidate (1 network request)
  - hashed CSS and code pack are immutable/browser cached (0 network requests unless the build filename changes)

No service worker is installed by this build. It unregisters older PackForge service workers and clears only older PackForge CacheStorage entries so an old deployment cannot trap the site forever.

Shop optimization:
  - pack cards are built once and kept in the DOM
  - one delegated Buy listener instead of one handler per card every render
  - entering Shop only updates price/availability text
  - hidden Upgrades UI is not rebuilt while the Packs tab is active
  - decorative Shop animations/transitions are disabled
  - Shop pack-card shadows are simplified
  - cards are prepared while the game shell is idle/hidden
