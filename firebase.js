// Firebase imports
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
    import { CONFIG } from './config.js';
    
    // Your Firebase config
    const firebaseConfig = {
        apiKey: CONFIG.API_KEY,
        authDomain: CONFIG.AUTH_DOMAIN,
        projectId: CONFIG.PROJECT_ID,
        storageBucket: CONFIG.STORAGE_BUCKET,
        messagingSenderId: CONFIG.MESSAGING_SENDER_ID,
        appId: CONFIG.APP_ID
    };

    // === Comment ===
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Make db available globally so your app.js can use it
    window.db = db;
    window.firebaseModules = { collection, addDoc, getDocs, query, orderBy, limit };
  