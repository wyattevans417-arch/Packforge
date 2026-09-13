# Firebase setup for PackForge Google cloud saves

You can send the Firebase **Web App configuration** to ChatGPT and it can fill the project files for you. Do **not** send a service-account JSON/private key.

## In Firebase Console
1. Create/open the Firebase project.
2. Project Settings -> General -> Your apps -> add a **Web app** if one does not exist.
3. The Firebase Web App configuration for project `packforge-7b432` is already wired into `js/firebase-config.js`.
4. Authentication -> Sign-in method -> enable **Google**.
5. Firestore Database -> Create database.
6. Authentication -> Settings -> Authorized domains -> add the final Vercel domain (for example `your-game.vercel.app`) and any custom domain.
7. Firestore -> Rules: publish the supplied `firestore.rules`.

## Current status
The Web App config is already installed. The only remaining value ChatGPT needs from you is the final Vercel/custom domain, after deployment, so the setup can be checked against Firebase Authorized Domains.

Do NOT send:
- service account private keys
- admin SDK credentials
- your Google password
- OAuth client secret

The Firebase Web App config is designed to be present in browser code. Security comes from Firebase Authentication + Firestore Rules.
