import { useState, useCallback, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useLikes = (postId, userId) => {
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkLike = async () => {
            if (!postId || !userId) return;

            try {
                const q = query(
                    collection(db, 'likes'),
                    where('postId', '==', postId),
                    where('userId', '==', userId)
                );
                const snapshot = await getDocs(q);
                setLiked(!snapshot.empty);
            } catch (err) {
                console.error('Failed to check like status:', err);
            }
        };

        checkLike();
    }, [postId, userId]);

    const toggleLike = useCallback(async (currentLikes) => {
        if (!postId || !userId) {
            throw new Error('Post ID and User ID are required');
        }

        try {
            setLoading(true);
            setError(null);

            const q = query(
                collection(db, 'likes'),
                where('postId', '==', postId),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Add like
                await addDoc(collection(db, 'likes'), {
                    postId,
                    userId,
                    createdAt: new Date(),
                });

                const newLikeCount = currentLikes + 1;
                await updateDoc(doc(db, 'posts', postId), {
                    likes: newLikeCount,
                });

                setLikes(newLikeCount);
                setLiked(true);
                return newLikeCount;
            } else {
                // Remove like
                const likeDoc = snapshot.docs[0];
                await deleteDoc(doc(db, 'likes', likeDoc.id));

                const newLikeCount = Math.max(currentLikes - 1, 0);
                await updateDoc(doc(db, 'posts', postId), {
                    likes: newLikeCount,
                });

                setLikes(newLikeCount);
                setLiked(false);
                return newLikeCount;
            }
        } catch (err) {
            console.error('Failed to toggle like:', err);
            setError(err.message || 'Failed to toggle like');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [postId, userId]);

    return {
        likes,
        liked,
        loading,
        error,
        toggleLike,
    };
};
