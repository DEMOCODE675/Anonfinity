import { useState, useCallback, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useComments = (postId) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!postId) return;

        try {
            setLoading(true);
            setError(null);

            const q = query(
                collection(db, 'comments'),
                where('postId', '==', postId),
                orderBy('createdAt', 'asc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const commentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setComments(commentsData);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Failed to fetch comments:', err);
            setError(err.message || 'Failed to fetch comments');
            setLoading(false);
        }
    }, [postId]);

    const addComment = useCallback(async (content, userId, username = 'Anonymous') => {
        if (!postId || !content.trim()) {
            throw new Error('Post ID and content are required');
        }
        try {
            const docRef = await addDoc(collection(db, 'comments'), {
                postId,
                userId,
                username,
                content: content.trim(),
                createdAt: serverTimestamp(),
            });
            return { id: docRef.id };
        } catch (err) {
            console.error('Failed to add comment:', err);
            throw new Error(err.message || 'Failed to add comment');
        }
    }, [postId]);

    const deleteComment = useCallback(async (commentId) => {
        try {
            await deleteDoc(doc(db, 'comments', commentId));
        } catch (err) {
            console.error('Failed to delete comment:', err);
            throw new Error(err.message || 'Failed to delete comment');
        }
    }, []);

    return {
        comments,
        loading,
        error,
        addComment,
        deleteComment,
    };
};
