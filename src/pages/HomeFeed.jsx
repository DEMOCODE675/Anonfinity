import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';

// ─── Injected styles for animations Tailwind can't handle ─────────────────────
const FEED_STYLES = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.75); }
  }
  .skeleton-line {
    background: linear-gradient(90deg, #ede9e3 25%, #f5f3ef 50%, #ede9e3 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }
  .feed-item {
    opacity: 0;
    animation: fadeSlideUp 0.4s ease forwards;
  }
  .live-dot {
    animation: pulse-dot 1.8s ease-in-out infinite;
  }
`;

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard({ lines = 3 }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)]">
            {/* Avatar + name row */}
            <div className="flex items-center gap-3">
                <div className="skeleton-line w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="skeleton-line h-3 w-28" />
                    <div className="skeleton-line h-2.5 w-16" />
                </div>
            </div>
            {/* Text lines */}
            <div className="space-y-2 pt-1">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className="skeleton-line h-3"
                        style={{ width: i === lines - 1 ? '60%' : '100%' }}
                    />
                ))}
            </div>
            {/* Action row */}
            <div className="flex gap-4 pt-1">
                <div className="skeleton-line h-3 w-10" />
                <div className="skeleton-line h-3 w-10" />
            </div>
        </div>
    );
}

// ─── Loading state ─────────────────────────────────────────────────────────────
function LoadingFeed() {
    return (
        <section className="w-full min-h-screen bg-[#f8f8f6] pb-24 sm:pb-12">
            <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
                {/* Header skeleton */}
                <div className="mb-8 space-y-2">
                    <div className="skeleton-line h-7 w-36 rounded-lg" />
                    <div className="skeleton-line h-3.5 w-52" />
                </div>
                {/* Card skeletons — varied line counts for realism */}
                <div className="flex flex-col gap-4">
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={2} />
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={2} />
                </div>
            </div>
        </section>
    );
}

// ─── Error state ───────────────────────────────────────────────────────────────
function ErrorFeed({ message }) {
    return (
        <section className="w-full min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
            <div className="max-w-sm w-full bg-white rounded-2xl border border-red-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Accent bar */}
                <div className="h-1 w-full bg-red-400" />
                <div className="p-8 text-center space-y-3">
                    {/* Icon */}
                    <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 text-base">Couldn't load feed</h3>
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{message}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.87" />
                        </svg>
                        Try again
                    </button>
                </div>
            </div>
        </section>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyFeed() {
    return (
        <section className="w-full min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
            <div className="text-center max-w-xs">
                {/* Decorative stacked-card illustration */}
                <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-indigo-100 rounded-2xl rotate-6 opacity-60" />
                    <div className="absolute inset-0 bg-indigo-200 rounded-2xl -rotate-3 opacity-60" />
                    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm w-full h-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg tracking-tight">Nothing here yet</h3>
                <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                    Your campus feed is empty. Be the first to start a conversation.
                </p>
            </div>
        </section>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
function HomeFeed({ userId }) {
    const { posts, loading, error } = usePosts();

    if (loading) return <LoadingFeed />;
    if (error) return <ErrorFeed message={error} />;
    if (!posts.length) return <EmptyFeed />;

    return (
        <>
            <style>{FEED_STYLES}</style>

            <section className="w-full min-h-screen bg-[#f8f8f6] pb-24 sm:pb-12">
                <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">

                    {/* Header */}
                    <header className="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-gray-900 tracking-tight leading-tight">
                                Campus feed
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-400">
                                See what your campus is talking about
                            </p>
                        </div>

                        {/* Live badge + count */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Live
                            </span>
                            <span className="text-xs text-gray-400 tabular-nums">
                                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                            </span>
                        </div>
                    </header>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-7" />

                    {/* Post list — staggered fade-in */}
                    <div className="flex flex-col gap-3.5">
                        {posts.map((post, i) => (
                            <div
                                key={post.id}
                                className="feed-item"
                                style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                            >
                                <PostCard post={post} userId={userId} />
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <p className="mt-10 text-center text-xs text-gray-300 select-none">
                        You've seen all {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </p>
                </div>
            </section>
        </>
    );
}

export default HomeFeed;