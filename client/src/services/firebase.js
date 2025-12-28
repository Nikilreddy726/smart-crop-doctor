import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile
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
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth Helpers
export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerUser = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
        await updateProfile(res.user, { displayName: name });
    }
    return res;
};
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export default app;
