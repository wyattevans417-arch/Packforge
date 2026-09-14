# v3.11 validation notes

- JavaScript syntax checked for game core, tutorial, PWA bootstrap, service worker, and the final inlined script.
- Mines exact source logic tested for:
  - idle 25-tile board
  - round start and bet deduction
  - safe reveal and multiplier increase
  - manual cash out
  - mine loss
  - 24-mine / one-safe automatic 25x payout
- Casino markup checked for the required Mines controls and IDs.
- Casino handler declarations checked for Coin Flip, Mines, Plinko, Slots, Blackjack, and Roulette.
- Final `index.html` has zero external stylesheet tags, zero external game-script tags, and zero manifest link; the favicon is a data URI.
- Service worker navigation is cache-first and has no stale-while-revalidate/background navigation fetch.
