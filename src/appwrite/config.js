import { Client, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const storage = new Storage(client);

// Appwrite Storage Configuration (for image uploads only)
export const appwriteConfig = {
    bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID,
};

// Validation helper to check if config is set
export const isConfigured = () => {
    return (
        import.meta.env.VITE_APPWRITE_ENDPOINT &&
        import.meta.env.VITE_APPWRITE_PROJECT_ID &&
        import.meta.env.VITE_APPWRITE_BUCKET_ID &&
        !import.meta.env.VITE_APPWRITE_PROJECT_ID?.includes('your_')
    );
};

export default client;