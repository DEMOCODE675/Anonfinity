import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLikes } from '../hooks/useLikes';
import { getAppwriteMediaUrl } from '../utils/imageUpload';
import Comments from './Comments';
import Report from './Report';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes cardEnter {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes likePop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.4); }
    70%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }

  .post-card {
    animation: cardEnter 0.38s cubic-bezier(.22,.68,0,1.1) both;
    font-family: 'DM Sans', ui-sans-serif, system-ui;
  }
  .post-card-inner {
    background-color: #ffffff;
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E");
  }
  .like-pop { animation: likePop 0.35s cubic-bezier(.22,.68,0,1.2) both; }

  .action-btn {
    position: relative;
    overflow: hidden;
  }
  .action-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.15s ease;
    border-radius: inherit;
  }
  .action-btn:hover::after { opacity: 0.06; }
  .action-btn:active::after { opacity: 0.12; }

  .media-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 45%);
    z-index: 1;
    pointer-events: none;
  }
`;

const AVATAR_COLORS = [
    { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
    { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
    { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
];

const getInitial = (name) => (name || 'A').trim().slice(0, 1).toUpperCase();
const getAvatarColor = (name) => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

function formatTime(val) {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d)) return '';
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function renderContent(content) {
    if (!content) return '';
    const parts = [];
    let lastIndex = 0;
    const regex = /(#[\w]+|@[\w]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
        parts.push({ type: match[0].startsWith('#') ? 'hashtag' : 'mention', content: match[0] });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < content.length) parts.push({ type: 'text', content: content.substring(lastIndex) });
    return parts.map((p, i) => {
        if (p.type === 'hashtag') return <span key={i} className="text-sky-600 font-semibold hover:text-sky-700 cursor-pointer transition-colors">{p.content}</span>;
        if (p.type === 'mention') return <span key={i} className="font-bold text-violet-800 hover:text-violet-900 cursor-pointer transition-colors">{p.content}</span>;
        return <span key={i}>{p.content}</span>;
    });
}

function Avatar({ name, size = 40 }) {
    const c = getAvatarColor(name);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: c.bg, color: c.text,
            border: `1.5px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
            letterSpacing: '-0.02em', userSelect: 'none',
        }}>
            {getInitial(name)}
        </div>
    );
}

function PostCard({ post, userId }) {
    const username = post.username || 'Anonymous';
    const content = post.content || '';
    const [likes, setLikes] = useState(Number(post.likes ?? 0));
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const videoRef = useRef(null);
    const autoMutedRef = useRef(false);
    const wasPlayingRef = useRef(false);

    const { liked, loading: isLiking, toggleLike } = useLikes(post.id, userId);

    const handleLike = async () => {
        if (isLiking) return;
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 400);
        try {
            const newCount = await toggleLike(likes);
            setLikes(newCount);
        } catch {
            alert('Could not like post. Please try again.');
        }
    };

    useEffect(() => {
        if (!post.videoUrl || post.mediaType !== 'video') return;
        const el = videoRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                wasPlayingRef.current = !el.paused;
                if (!el.muted) { el.muted = true; autoMutedRef.current = true; }
                else autoMutedRef.current = false;
            } else {
                if (autoMutedRef.current) { el.muted = false; autoMutedRef.current = false; }
                if (wasPlayingRef.current) el.play()?.catch(() => { });
            }
        }, { threshold: 0.25 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [post.videoUrl, post.mediaType]);

    const mediaUrl = post.mediaType === 'video'
        ? post.videoUrl && getAppwriteMediaUrl(post.videoUrl, 'video')
        : post.imageUrl && getAppwriteMediaUrl(post.imageUrl, 'image');

    return (
        <>
            <style>{STYLES}</style>

            {/* ── Gradient border wrapper (kept from original) ── */}
            <div className="group post-card rounded-2xl p-px bg-gradient-to-br from-pink-200 via-sky-200 to-rose-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.13)] transition-shadow duration-300">
                <article className="post-card-inner relative rounded-2xl overflow-hidden">

                    {/* ── Author row — TOP of card ── */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
                        <Avatar name={username} size={40} />
                        <div className="flex-1 min-w-0">
                            <Link
                                to={`/post/${post.id}`}
                                className="block font-semibold text-gray-900 text-[13.5px] leading-tight hover:text-indigo-600 transition-colors truncate"
                            >
                                {username}
                            </Link>
                            {post.createdAt && (
                                <span className="text-[11px] text-gray-400">{formatTime(post.createdAt)}</span>
                            )}
                        </div>
                        {/* Like pill — top right */}
                        <span className="shrink-0 inline-flex items-center gap-1.5 bg-white text-rose-500 text-xs font-semibold px-3 py-1 rounded-full border border-rose-100 shadow-sm">
                            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                            {likes}
                        </span>
                    </div>

                    {/* ── Post content ── */}
                    {content && (
                        <div className="px-4 sm:px-5 pb-3">
                            <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-3.5 py-3 text-slate-700 text-sm sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                {renderContent(content)}
                            </div>
                        </div>
                    )}

                    {/* ── Media ── */}
                    {mediaUrl && (
                        <Link to={`/post/${post.id}`} className="media-wrap relative block mx-4 sm:mx-5 mb-4 rounded-xl overflow-hidden bg-black">
                            {post.mediaType === 'video' ? (
                                <video
                                    ref={videoRef}
                                    src={mediaUrl}
                                    className="w-full h-auto max-h-96 object-cover block"
                                    controls controlsList="nodownload"
                                    onContextMenu={e => e.preventDefault()}
                                    preload="metadata"
                                />
                            ) : (
                                <img
                                    src={mediaUrl}
                                    alt="Post"
                                    className="w-full h-auto max-h-96 object-cover block"
                                    loading="lazy"
                                />
                            )}
                        </Link>
                    )}

                    {/* ── Actions ── */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 bg-gradient-to-r from-white via-slate-50/70 to-white">
                        <div className="grid grid-cols-3 gap-2 pt-3">

                            {/* Like */}
                            <button
                                onClick={handleLike}
                                disabled={isLiking}
                                className={`action-btn text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 ${liked
                                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'
                                    }`}
                            >
                                <Heart
                                    size={16}
                                    fill={liked ? 'currentColor' : 'none'}
                                    className={likeAnimating ? 'like-pop' : ''}
                                />
                                <span className="hidden sm:inline">{isLiking ? 'Updating…' : liked ? 'Unlike' : 'Like'}</span>
                            </button>

                            {/* Comment */}
                            <Link
                                to={`/post/${post.id}`}
                                className="action-btn text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                            >
                                <MessageCircle size={16} />
                                <span className="hidden sm:inline">Comments</span>
                            </Link>

                            {/* Report */}
                            <button
                                onClick={() => setShowReport(true)}
                                className="action-btn text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                            >
                                <AlertTriangle size={16} />
                                <span className="hidden sm:inline">Report</span>
                            </button>
                        </div>
                    </div>

                </article>
            </div>

            {showComments && <Comments postId={post.id} userId={userId} onClose={() => setShowComments(false)} />}
            {showReport && <Report postId={post.id} onClose={() => setShowReport(false)} />}
        </>
    );
}

export default PostCard;