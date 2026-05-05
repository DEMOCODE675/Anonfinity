# AnyChat Setup Guide

## Project Overview

AnyChat is an anonymous college social app built with React, Vite, and Appwrite.

**Features:**

- 🔐 Anonymous authentication
- 📱 Post to the campus feed
- ❤️ Like posts
- 💬 Comment on posts
- ⚠️ Report inappropriate content
- 📱 Mobile-responsive design

---

## Prerequisites

- Node.js 16+ installed
- An Appwrite account (https://cloud.appwrite.io)

---

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Appwrite

#### A. Create a Project

1. Sign in to [Appwrite Cloud](https://cloud.appwrite.io)
2. Create a new project and note your **Project ID**

#### B. Create a Database

1. Go to your project > Databases
2. Create a new database and note your **Database ID**

#### C. Create Collections

Create 3 collections with the following attributes:

**Collection 1: posts** (Collection ID: `posts`)

- `content` (String, required)
- `userId` (String, required)
- `createdAt` (DateTime, required)
- `likes` (Integer, required, default: 0)
- `username` (String, optional)

**Collection 2: comments** (Collection ID: `comments`)

- `postId` (String, required)
- `userId` (String, required)
- `content` (String, required)
- `createdAt` (DateTime, required)

**Collection 3: reports** (Collection ID: `reports`)

- `postId` (String, required)
- `reason` (String, optional)
- `reportedAt` (DateTime, required)

#### D. Set Permissions

For each collection:

1. Click the collection
2. Go to "Permissions"
3. Add:
   - **Read**: Any (role)
   - **Create**: Any (role)
   - **Update**: Any (role)

### 3. Update Configuration

Edit `src/appwrite/config.js`:

```javascript
export const appwriteConfig = {
  databaseId: "YOUR_DATABASE_ID", // Replace with your Database ID
  collectionId: "YOUR_COLLECTION_ID", // Replace with 'posts'
};

// Also update PROJECT_ID in setProject():
client.setProject("YOUR_PROJECT_ID"); // Replace with your Project ID
```

### 4. Run the App

```bash
npm run dev
```

The app will start at `http://localhost:5173` (or another available port).

---

## Troubleshooting

### "App is not configured"

- Check that all IDs in `src/appwrite/config.js` are correctly set
- Verify no placeholder values remain (like `YOUR_PROJECT_ID`)

### "Could not load posts"

- Ensure your database and collections exist in Appwrite
- Check that permissions are set to allow anonymous users to read/create documents
- Verify network connection

### "Could not create post"

- Ensure your Appwrite IDs are correct
- Check collection permissions (Create should be allowed for anonymous users)
- Try refreshing the page

### Comments not showing

- Make sure the `comments` collection exists
- Check Query syntax is compatible with Appwrite v25
- Verify collection ID is `comments`

### Likes not working

- Check browser localStorage is enabled
- Verify `posts` collection can be updated by anonymous users

---

## Project Structure

```
src/
├── appwrite/
│   └── config.js           # Appwrite configuration
├── components/
│   ├── Navbar.jsx          # Navigation bar
│   ├── PostCard.jsx        # Individual post component
│   ├── Comments.jsx        # Comments modal
│   └── Report.jsx          # Report modal
├── hooks/
│   └── useAuth.js          # Authentication hook
├── pages/
│   ├── HomeFeed.jsx        # Feed page
│   └── CreatePost.jsx      # Create post page
├── App.jsx                 # Main app with routing
├── main.jsx                # Entry point
└── index.css               # Global styles (Tailwind)
```

---

## Development

### Build for Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

---

## Key Technologies

- **React 19.2.5** - UI framework
- **Vite 8.0.10** - Build tool
- **Tailwind CSS 4.2.4** - Styling
- **React Router 7.14.2** - Routing
- **Appwrite 25.0.0** - Backend

---

## Features Implemented

✅ Anonymous authentication
✅ Post creation and display
✅ Like system with localStorage tracking
✅ Comments with modal interface
✅ Report functionality
✅ React Router navigation
✅ Mobile responsive design
✅ Error handling and validation
✅ Loading states
✅ Configuration validation

---

## Next Steps

1. **User Profiles** - Add user profile pages
2. **Search** - Add post search functionality
3. **Real-time Updates** - Use Appwrite subscriptions
4. **Moderation Dashboard** - View and manage reports
5. **Image Support** - Allow users to upload images to posts
6. **Tags/Categories** - Organize posts by topic

---

## Support

For issues with:

- **Appwrite**: https://appwrite.io/docs
- **React**: https://react.dev
- **Vite**: https://vite.dev
- **Tailwind**: https://tailwindcss.com/docs

---

**Happy posting! 🚀**
