# PackForge v3.10 — Cleanup & Card Polish

This build keeps PackForge local-first and save-compatible while removing the old live-event framework and simplifying several interfaces.

## Main changes
- All live events removed. The rare 50,000-Power campaign is a normal Campaign offer, not an event system.
- Coin keeps its reactor/shockwave/crit feedback but loses the orbiting sparks and cursor-follow highlight.
- Settings reduced to Audio, Video, Codes, Reset, and Admin. Reset requires three confirmations.
- Casino Coin Flip supports Heads/Tails selection with a two-sided H/T coin and stronger result feedback. Other casino games show floating net win/loss amounts.
- Ghost / The Unlisted Print receives a much stronger animated card treatment; Ghost Power always equals its actual sell value.
- Negative and Glitched variants retired. Gold and Shattered receive upgraded visual treatments. Golden Wave mutation removed.
- Serialized cards show only the serial number under Amount.
- High-end card sales require confirmation.
- A rare 50,000-Power Campaign offer can replace the hard Campaign slot and pays premium rewards.
- God/Semi-God wrapper badge is suppressed while the ripped wrapper disappears.

## Save compatibility
PackForge continues using `packforge_save_v1`. Retired Negative, Glitched, and Golden Wave copies are migrated forward rather than deleted.

## Deployment
Upload the contents of this folder to the repository root so `index.html` sits at `/index.html`. Vercel can serve the project directly with no build command.
