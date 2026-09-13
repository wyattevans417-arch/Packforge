# Upload PackForge to GitHub + Vercel

The files are split for maintainability, but the browser still sees one website. `index.html` is the entry page and loads the files in `css/`, `js/`, and `assets/` automatically.

## GitHub web upload
1. Unzip the PackForge ZIP on your computer.
2. Open the **PackForge_v3_CloudOnly** folder.
3. In your GitHub repository choose **Add file → Upload files**.
4. Drag the **contents** of `PackForge_v3_CloudOnly` into the uploader: `index.html`, `css`, `js`, `assets`, `docs`, `manifest.json`, `service-worker.js`, `vercel.json`, and `firestore.rules`.
5. Commit the upload. `index.html` should be at the repository root, not one folder deeper.

## Vercel
- Import the GitHub repository into Vercel.
- Framework Preset: **Other**.
- Root Directory: repository root (`./`).
- No build command is required.
- No output directory is required; this is a static site.
- Deploy.

Then add the deployed Vercel domain in Firebase Authentication → Settings → Authorized domains.

Do not combine the split files back into one HTML file. Keeping them split allows browsers and the service worker to cache unchanged JS/CSS between updates, reducing repeat downloads and making maintenance safer.
