import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateRandomUsername, checkUsernameAvailability } from '../utils/generateUsername';

/**
 * Hook to manage user username
 * Generates random name on first login, allows changing it, and persists to Firestore
 * Prevents duplicate usernames
 */
export const useUsername = (userId) => {
    const [username, setUsernameState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const loadOrCreateUsername = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));

                if (userDoc.exists() && userDoc.data().username) {
                    // Username already exists
                    setUsernameState(userDoc.data().username);
                    setIsAvailable(true); // Own username is always "available" to them
                } else {
                    // Generate new username (unique)
                    let newUsername;
                    let isUnique = false;
                    let attempts = 0;
                    
                    while (!isUnique && attempts < 50) {
                        newUsername = generateRandomUsername();
                        isUnique = await checkUsernameAvailability(newUsername);
                        attempts++;
                    }
                    
                    if (!isUnique) {
                        newUsername = `User${Math.random().toString(36).substring(7)}`; // Fallback
                    }
                    
                    // Save to Firestore
                    await setDoc(doc(db, 'users', userId), {
                        username: newUsername,
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                    }, { merge: true });
                    
                    setUsernameState(newUsername);
                    setIsAvailable(true);
                }
            } catch (err) {
                console.error('Error loading/creating username:', err);
                setError(err.message);
                // Fallback to generated username even if save fails
                setUsernameState(generateRandomUsername());
            } finally {
                setLoading(false);
            }
        };

        loadOrCreateUsername();
    }, [userId]);

    /**
     * Update the username - checks availability first
     * @param {string} newUsername - New username to set
     */
    const updateUsername = async (newUsername) => {
        if (!userId) {
            setError('No user ID available');
            return false;
        }

        if (!newUsername || newUsername.trim().length === 0) {
            setError('Username cannot be empty');
            return false;
        }

        if (newUsername.length > 20) {
            setError('Username must be 20 characters or less');
            return false;
        }

        // Check if username is same as current
        if (newUsername.trim() === username) {
            setError('You already have this username');
            return false;
        }

        try {
            setLoading(true);
            
            // Check if username is available (not taken by others)
            const isUsernameTaken = await checkUsernameAvailability(newUsername.trim());
            
            if (!isUsernameTaken) {
                setError('Username is already taken! Try another.');
                setIsAvailable(false);
                return false;
            }
            
            // Username is available - save it to user profile
            await setDoc(doc(db, 'users', userId), {
                username: newUsername.trim(),
                lastUpdated: new Date().toISOString(),
            }, { merge: true });

            // Update all posts by this user with the new username
            const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
            const postsSnapshot = await getDocs(postsQuery);
            
            // Batch update all posts
            const updatePromises = postsSnapshot.docs.map(postDoc => 
                updateDoc(postDoc.ref, { username: newUsername.trim() })
            );
            
            await Promise.all(updatePromises);

            // Update all comments by this user
            const commentsQuery = query(collection(db, 'comments'), where('userId', '==', userId));
            const commentsSnapshot = await getDocs(commentsQuery);
            
            const commentUpdatePromises = commentsSnapshot.docs.map(commentDoc =>
                updateDoc(commentDoc.ref, { username: newUsername.trim() })
            );
            
            await Promise.all(commentUpdatePromises);

            setUsernameState(newUsername.trim());
            setIsAvailable(true);
            setError(null);
            return true;
        } catch (err) {
            console.error('Error updating username:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { username, loading, error, updateUsername, isAvailable };
};
