# PackForge — Original Gameplay + Optional Google Cloud Save

This project is rebuilt from the exact v2.11 pre-progression PackForge source.

## What is intentionally NOT in this build
- No Collector Level system
- No Master Collector
- No progression locks/unlocks
- No new Showcase navigation
- No Lucky Room rename (the existing section remains Casino)
- No leaderboards

## What changed technically
- Original CSS/JS externalized without intentionally redesigning gameplay.
- Vercel Analytics runtime removed.
- PWA manifest/service worker added for static local caching.
- Optional Google sign-in + Firestore cloud save added inside Settings -> Save.
- The existing local key `packforge_save_v1` remains the source of truth for local play.

See docs/FIREBASE_SETUP.md for the only Firebase setup required.


## Firebase status
Firebase Web App config for `packforge-7b432` is installed. Google Auth and Firestore still need to be enabled in Firebase Console, and the final Vercel/custom domain must be added to Authentication Authorized Domains.

## Performance pass
- Combo countdown now updates on demand only while a combo exists instead of running a permanent 40 Hz interval.
- FPS measurement loop only runs while the FPS counter is enabled.
- Hidden tabs pause decorative CSS animation and skip nonessential status polling.
- Grading/campaign/achievement UI polling frequencies were reduced without changing their absolute timers or rewards.
- Static CSS/JS URLs are versioned so Vercel can keep long immutable browser caching without stale-code problems.
- The existing automatic FPS performance guard remains enabled for weak devices.

See `docs/GITHUB_VERCEL_UPLOAD.md` for deployment steps.
