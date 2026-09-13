# GitHub + Vercel upload

## Replace the deployed project
1. Unzip the PackForge local-only ZIP.
2. Open your GitHub PackForge repository.
3. Upload the **contents** of the ZIP to the repository root.
4. `index.html` must sit directly at the root beside `manifest.json`, `service-worker.js`, and `vercel.json`.
5. Keep the `css/`, `js/`, `assets/`, and `docs/` folders intact.
6. Remove old Firebase-only files if they still exist in the repo: `firestore.rules`, `css/cloud-save.css`, `js/cloud-save.js`, `js/firebase-config.js`, and `docs/FIREBASE_SETUP.md`.
7. Commit the changes. If Vercel is connected to the repository it should redeploy automatically.

## Vercel
This is a static vanilla site. No build command or server function is required.

The player opens the single site URL; `index.html` automatically loads the split CSS/JS files.
