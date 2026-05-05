import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import HomeFeed from './pages/HomeFeed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import infinityIcon from './assets/infinity-black.svg';



const SpinnerRing = () => (
    <svg className="animate-spin" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" stroke="#e0e7ff" strokeWidth="4" />
        <path d="M20 4 A16 16 0 0 1 36 20" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <>
                <Navbar user={user} />
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center p-4 sm:p-10 bg-gradient-to-b from-white-50 to-gray/50">
                    <img src={infinityIcon} alt="AnyChat" className="w-20 h-20 mb-4" />
                    <p className="text-gray-600 font-bold text-lg">Anonfinity</p>
                    <SpinnerRing />
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar user={user} />
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center p-4 sm:p-10 bg-gradient-to-b from-red-50 to-orange-50">
                    <img src={infinityIcon} alt="AnyChat" className="w-20 h-20 mb-4" />
                    <div className="text-5xl mb-4">❌</div>
                    <p className="text-red-700 text-lg sm:text-xl font-semibold mb-2">Connection failed</p>
                    <p className="text-red-600 text-sm">Could not establish secure connection. Please refresh the page.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Toaster position="top-center" />
            <Navbar user={user} />
            <main className="max-w-4xl mx-auto px-0 py-0 pb-16">
                <Routes>
                    <Route path="/" element={<HomeFeed userId={user.uid} />} />
                    <Route path="/create" element={<CreatePost userId={user.uid} />} />
                    <Route path="/profile" element={<Profile user={user} userId={user.uid} />} />
                    <Route path="/post/:id" element={<PostDetail userId={user.uid} />} />
                </Routes>
            </main>
        </>
    );
}

export default App;