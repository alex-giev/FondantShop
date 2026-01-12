// Import Firebase modules (using CDN - see index.html for script tags)
// This file uses Firebase v9+ modular SDK

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVLzsXJpniSt6dj55Nkxoyu2YmkLBqHN8",
  authDomain: "fondant-shop.firebaseapp.com",
  projectId: "fondant-shop",
  storageBucket: "fondant-shop.firebasestorage.app",
  messagingSenderId: "128280684618",
  appId: "1:128280684618:web:680ec1c380302999211eb3",
  measurementId: "G-M4W120DHFK"
};

// Initialize Firebase (using global firebase from CDN)
try {
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Export for use in other files
  window.firebaseAuth = auth;
  window.firebaseApp = app;

  console.log('Firebase initialized successfully!');
  console.log('Auth Domain:', firebaseConfig.authDomain);
  console.log('Project ID:', firebaseConfig.projectId);
  
  // Test auth availability
  auth.onAuthStateChanged((user) => {
    console.log('Auth state changed. User:', user ? user.email : 'No user');
  }, (error) => {
    console.error('Auth state error:', error);
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
  alert('Firebase Error: ' + error.message + '\n\nPlease check:\n1. Email/Password authentication is enabled in Firebase Console\n2. localhost is added to authorized domains');
}
