import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    setPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAWruVe4mrXGGUb_iAmE6291bDtOSe_hp0",
    authDomain: "smart-doctor-crop.firebaseapp.com",
    projectId: "smart-doctor-crop",
    storageBucket: "smart-doctor-crop.firebasestorage.app",
    messagingSenderId: "525906345906",
    appId: "1:525906345906:web:c174c68e337d0868da6eab",
    measurementId: "G-E1KE9XBHZ1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to session checking to ensure user is logged out when tab/browser is closed
// This fulfills the requirement: "when ever if i open newly website at that time also have to ask login first"
setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.error("Error setting persistence:", error);
});

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth Helpers
export const loginUser = async (email, password) => {
    await setPersistence(auth, browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = async (email, password, name) => {
    await setPersistence(auth, browserSessionPersistence);
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
        await updateProfile(res.user, { displayName: name });
    }
    return res;
};

export const signInWithGoogle = async () => {
    await setPersistence(auth, browserSessionPersistence);
    return signInWithPopup(auth, googleProvider);
};

export default app;
