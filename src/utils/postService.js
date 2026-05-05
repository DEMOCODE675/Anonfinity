import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Search for posts by content
 */
export const searchPosts = async (searchTerm) => {
    try {
        const q = query(collection(db, 'posts'));
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(post =>
                post.content?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    } catch (err) {
        console.error('Search error:', err);
        throw new Error('Failed to search posts');
    }
};

/**
 * Get trending posts (most liked)
 */
export const getTrendingPosts = async (limitCount = 10) => {
    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('likes', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (err) {
        console.error('Trending error:', err);
        throw new Error('Failed to fetch trending posts');
    }
};

/**
 * Get recent posts
 */
export const getRecentPosts = async (limitCount = 20) => {
    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (err) {
        console.error('Recent posts error:', err);
        throw new Error('Failed to fetch recent posts');
    }
};

/**
 * Get post statistics
 */
export const getPostStats = async (postId) => {
    try {
        const post = doc(db, 'posts', postId);
        const postSnapshot = await getDocs(query(
            collection(db, 'posts'),
            where('__name__', '==', postId)
        ));

        if (postSnapshot.empty) {
            throw new Error('Post not found');
        }

        const postData = postSnapshot.docs[0].data();

        const commentsSnapshot = await getDocs(
            query(
                collection(db, 'comments'),
                where('postId', '==', postId)
            )
        );

        const reportsSnapshot = await getDocs(
            query(
                collection(db, 'reports'),
                where('postId', '==', postId)
            )
        );

        return {
            likes: postData.likes || 0,
            comments: commentsSnapshot.size,
            reports: reportsSnapshot.size,
        };
    } catch (err) {
        console.error('Stats error:', err);
        throw new Error('Failed to fetch post stats');
    }
};

/**
 * Delete post and related data
 */
export const deletePostWithRelated = async (postId) => {
    try {
        // Delete comments
        const commentsSnapshot = await getDocs(
            query(
                collection(db, 'comments'),
                where('postId', '==', postId)
            )
        );

        for (const commentDoc of commentsSnapshot.docs) {
            await deleteDoc(doc(db, 'comments', commentDoc.id));
        }

        // Delete reports
        const reportsSnapshot = await getDocs(
            query(
                collection(db, 'reports'),
                where('postId', '==', postId)
            )
        );

        for (const reportDoc of reportsSnapshot.docs) {
            await deleteDoc(doc(db, 'reports', reportDoc.id));
        }

        // Delete likes
        const likesSnapshot = await getDocs(
            query(
                collection(db, 'likes'),
                where('postId', '==', postId)
            )
        );

        for (const likeDoc of likesSnapshot.docs) {
            await deleteDoc(doc(db, 'likes', likeDoc.id));
        }

        // Delete post
        await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
        console.error('Delete error:', err);
        throw new Error('Failed to delete post');
    }
};
