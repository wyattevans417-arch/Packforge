// PackForge Firebase Web App configuration.
// Browser Firebase config is intentionally client-visible; access control is enforced by Firebase Authentication + Firestore Security Rules.
export const firebaseConfig = {
  apiKey: "AIzaSyD9ZsBIlX74ltZVmkunkmQvc9NZ9h8_eM4",
  authDomain: "packforge-7b432.firebaseapp.com",
  projectId: "packforge-7b432",
  storageBucket: "packforge-7b432.firebasestorage.app",
  messagingSenderId: "794168596522",
  appId: "1:794168596522:web:10f698a7ee7b0db3324b53",
  measurementId: "G-DPPW94SNC6"
};

// Analytics is deliberately not imported/initialized by PackForge; it is not required for auth or cloud saves.
export const firebaseConfigured = true;
