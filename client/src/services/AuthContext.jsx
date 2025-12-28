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

    const logout = React.useCallback(() => signOut(auth), []);

    // Auto-logout on inactivity (15 minutes)
    useEffect(() => {
        if (!user) return;

        const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
        let activityTimer;

        const resetTimer = () => {
            if (activityTimer) clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                console.log("User inactive for 15 mins. Auto-logging out...");
                logout();
            }, TIMEOUT_MS);
        };

        // Events to detect user activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Throttle the reset to avoid performance issues on mousemove
        let isThrottled = false;
        const handleActivity = () => {
            if (!isThrottled) {
                resetTimer();
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 1000);
            }
        };

        // Start the timer initially
        resetTimer();

        // Add event listeners
        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (activityTimer) clearTimeout(activityTimer);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user, logout]);

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
