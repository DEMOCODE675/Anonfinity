import { Link, useLocation } from 'react-router-dom';
import infinityIcon from '../assets/infinity-black.svg';

const HomeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);

function Navbar({ user }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${isActive(path)
            ? 'text-indigo-600 bg-indigo-50'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        }`;

    return (
        <>
            {/* Desktop top bar */}
            <nav className="hidden sm:flex bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-3 w-full flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src={infinityIcon} alt="AnyChat" className="w-10 h-10 block" />
                        <span className="text-lg font-bold tracking-tight text-gray-900 drop-shadow-sm  transition-transform duration-200">
                            Anonfinity
                        </span>
                    </Link>

                    {user && (
                        <div className="flex items-center gap-1">
                            <Link
                                to="/"
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/')
                                    ? 'text-indigo-600 bg-indigo-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Home
                            </Link>
                            <Link
                                to="/profile"
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/profile')
                                    ? 'text-indigo-600 bg-indigo-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Profile
                            </Link>
                            <Link
                                to="/create"
                                className="ml-2 flex items-center gap-1.5 text-sm font-semibold py-2 px-4 rounded-xl bg-violet-500 text-white hover:bg-violet-700 active:scale-95 transition-all duration-200"
                            >
                                <PlusIcon />
                                Create
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile top bar (logo only) */}
            <nav className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-4 py-3 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={infinityIcon} alt="AnyChat" className="w-9 h-9 block" />

                    </Link>
                    {user && (
                        <Link
                            to="/create"
                            className="flex items-center gap-1.5 text-sm font-semibold py-1.5 px-3 rounded-xl bg-violet-500 text-white hover:bg-violet-700 active:scale-95 transition-all duration-200"
                        >
                            <PlusIcon />
                            Create
                        </Link>
                    )}
                </div>
            </nav>

            {/* Mobile bottom tab bar */}
            {user && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 pb-safe">
                    <div className="flex justify-around items-center py-2">
                        <Link to="/" className={navLinkClass('/')}>
                            <HomeIcon />
                            <span>Home</span>
                        </Link>
                        <Link to="/profile" className={navLinkClass('/profile')}>
                            <ProfileIcon />
                            <span>Profile</span>
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;