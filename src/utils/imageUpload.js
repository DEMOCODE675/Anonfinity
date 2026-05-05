import { Client, Storage, ID } from 'appwrite';

// Initialize Appwrite Client for both images and videos
const appwriteClient = new Client();
appwriteClient
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

const appwriteStorage = new Storage(appwriteClient);
const APPWRITE_IMAGES_BUCKET = import.meta.env.VITE_APPWRITE_IMAGES_BUCKET || 'images';
const APPWRITE_VIDEOS_BUCKET = import.meta.env.VITE_APPWRITE_VIDEOS_BUCKET || 'videos';

/**
 * Validate image file
 * @param {File} file - The image file to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export const validateImage = (file) => {
    const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedFormats.includes(file.type)) {
        return { valid: false, error: 'Image must be JPEG, PNG, GIF, or WebP' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true, error: null };
};

/**
 * Validate video/reel file
 * @param {File} file - The video file to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export const validateVideo = (file) => {
    const allowedFormats = ['video/mp4', 'video/webm', 'image/gif'];
    const maxSize = 50 * 1024 * 1024; // 50MB for videos

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedFormats.includes(file.type)) {
        return { valid: false, error: 'Video must be MP4, WebM, or GIF' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Video size must be less than 50MB' };
    }

    return { valid: true, error: null };
};

/**
 * Upload image to Appwrite Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - User ID for organization
 * @param {string} postId - Post ID (optional, for unique naming)
 * @returns {Promise<string>} - The file ID
 */
export const uploadImageToAppwrite = async (file, userId, postId = '') => {
    try {
        const validation = validateImage(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Check if Appwrite is configured
        if (!import.meta.env.VITE_APPWRITE_PROJECT_ID) {
            throw new Error('Appwrite not configured. Please set VITE_APPWRITE_PROJECT_ID in .env.local');
        }

        // Upload file to Appwrite Storage
        const response = await appwriteStorage.createFile(
            APPWRITE_IMAGES_BUCKET,
            ID.unique(),
            file
        );

        // Return file ID
        return response.$id;
    } catch (err) {
        console.error('Image upload error:', err);
        throw new Error(err.message || 'Failed to upload image. Make sure Appwrite is configured.');
    }
};

/**
 * Upload video/reel to Appwrite Storage (Videos Only)
 * @param {File} file - The video file to upload
 * @param {string} userId - User ID for organization
 * @param {string} postId - Post ID (optional, for unique naming)
 * @returns {Promise<string>} - The file ID for video URL
 */
export const uploadVideoToAppwrite = async (file, userId, postId = '') => {
    try {
        const validation = validateVideo(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Check if Appwrite is configured
        if (!import.meta.env.VITE_APPWRITE_PROJECT_ID) {
            throw new Error('Appwrite not configured. Please set VITE_APPWRITE_PROJECT_ID in .env.local');
        }

        // Upload file to Appwrite Storage
        const response = await appwriteStorage.createFile(
            APPWRITE_VIDEOS_BUCKET,
            ID.unique(),
            file
        );

        // Return file ID
        return response.$id;
    } catch (err) {
        console.error('Video upload error:', err);
        throw new Error(err.message || 'Failed to upload video. Make sure Appwrite is configured.');
    }
};

/**
 * Get Appwrite media URL (for both images and videos)
 * @param {string} fileId - File ID from Appwrite
 * @param {string} type - 'image' or 'video' (default: 'image')
 * @returns {string} - The media URL
 */
export const getAppwriteMediaUrl = (fileId, type = 'image') => {
    if (!fileId || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
        return null;
    }

    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const bucketId = type === 'video' 
        ? (import.meta.env.VITE_APPWRITE_VIDEOS_BUCKET || 'videos')
        : (import.meta.env.VITE_APPWRITE_IMAGES_BUCKET || 'images');

    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

/**
 * Get Appwrite video URL (legacy - use getAppwriteMediaUrl instead)
 * @param {string} fileId - File ID from Appwrite
 * @returns {string} - The video URL
 */
export const getAppwriteVideoUrl = (fileId) => {
    return getAppwriteMediaUrl(fileId, 'video');
};

/**
 * Detect media type from file
 * @param {File} file - The file to check
 * @returns {string} - 'image', 'video', or 'unknown'
 */
export const detectMediaType = (file) => {
    if (!file) return 'unknown';
    
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm'];

    if (imageTypes.includes(file.type)) return 'image';
    if (videoTypes.includes(file.type)) return 'video';
    if (file.type === 'image/gif') return 'video'; // GIF can be treated as video

    return 'unknown';
};

/**
 * Compress image before upload (optional)
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1200;
                const maxHeight = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
};
