import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: Setting up onAuthStateChanged");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("AuthContext: Auth state changed", currentUser?.email || "No user");
            setUser(currentUser);
            setLoading(false);
        });

        // Fallback to stop loading if firebase takes too long
        const timer = setTimeout(() => {
            console.log("AuthContext: Loading timeout reached");
            setLoading(false);
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
