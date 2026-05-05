import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const storageKey = 'firebaseUserId';

    useEffect(() => {
        const checkAndCreateSession = async () => {
            try {
                // Check if user is already authenticated
                const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                        localStorage.setItem(storageKey, currentUser.uid);
                    } else {
                        // Create anonymous session
                        try {
                            const result = await signInAnonymously(auth);
                            setUser(result.user);
                            localStorage.setItem(storageKey, result.user.uid);
                        } catch (anonError) {
                            console.error('Failed to create anonymous session:', anonError);
                        }
                    }
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Auth check failed:', error);
                setLoading(false);
            }
        };

        checkAndCreateSession();
    }, []);

    return { user, loading };
};