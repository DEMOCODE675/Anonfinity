import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useReports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submitReport = useCallback(async (postId, reason) => {
        if (!postId || !reason.trim()) {
            throw new Error('Post ID and reason are required');
        }

        try {
            setLoading(true);
            setError(null);

            const docRef = await addDoc(collection(db, 'reports'), {
                postId,
                reason: reason.trim(),
                reportedAt: serverTimestamp(),
                status: 'pending',
            });

            return { id: docRef.id };
        } catch (err) {
            console.error('Failed to submit report:', err);
            setError(err.message || 'Failed to submit report');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        submitReport,
    };
};
