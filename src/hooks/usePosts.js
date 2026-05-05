import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const usePosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            setLoading(true);
            setError(null);

            const q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setPosts(postsData);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Failed to fetch posts:', err);
            setError(err.message || 'Failed to fetch posts');
            setLoading(false);
        }
    }, []);

    const createPost = useCallback(async (content, userId, username = 'Anonymous', mediaUrl = null, mediaType = null) => {
        try {
            const postData = {
                content: content.trim(),
                userId,
                username,
                likes: 0,
                createdAt: serverTimestamp(),
            };

            // Add media URL and type if provided
            if (mediaUrl) {
                if (mediaType === 'video' || mediaType === 'image/gif') {
                    postData.videoUrl = mediaUrl;
                    postData.mediaType = 'video';
                } else {
                    postData.imageUrl = mediaUrl;
                    postData.mediaType = 'image';
                }
            }

            const docRef = await addDoc(collection(db, 'posts'), postData);
            return { id: docRef.id };
        } catch (err) {
            console.error('Failed to create post:', err);
            throw new Error(err.message || 'Failed to create post');
        }
    }, []);

    const updatePost = useCallback(async (postId, data) => {
        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, data);
            return { id: postId, ...data };
        } catch (err) {
            console.error('Failed to update post:', err);
            throw new Error(err.message || 'Failed to update post');
        }
    }, []);

    const deletePost = useCallback(async (postId) => {
        try {
            await deleteDoc(doc(db, 'posts', postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
            throw new Error(err.message || 'Failed to delete post');
        }
    }, []);

    return {
        posts,
        loading,
        error,
        createPost,
        updatePost,
        deletePost,
    };
};
