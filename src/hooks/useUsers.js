import { useState, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUserPosts = useCallback(async (userId) => {
        try {
            setLoading(true);
            setError(null);

            const q = query(
                collection(db, 'posts'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (err) {
            console.error('Failed to fetch user posts:', err);
            setError(err.message || 'Failed to fetch user posts');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserStats = useCallback(async (userId) => {
        try {
            const postsSnapshot = await getDocs(
                query(
                    collection(db, 'posts'),
                    where('userId', '==', userId)
                )
            );

            const commentsSnapshot = await getDocs(
                query(
                    collection(db, 'comments'),
                    where('userId', '==', userId)
                )
            );

            const totalLikes = postsSnapshot.docs.reduce(
                (sum, doc) => sum + (doc.data().likes || 0),
                0
            );

            return {
                postsCount: postsSnapshot.size,
                commentsCount: commentsSnapshot.size,
                totalLikes,
            };
        } catch (err) {
            console.error('Failed to fetch user stats:', err);
            throw new Error(err.message || 'Failed to fetch user stats');
        }
    }, []);

    return {
        users,
        loading,
        error,
        fetchUserPosts,
        getUserStats,
    };
};
