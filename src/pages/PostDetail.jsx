import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc, getDoc, collection, query, where,
    getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAppwriteMediaUrl } from '../utils/imageUpload';
import { useLikes } from '../hooks/useLikes';
import { useUsername } from '../hooks/useUsername';
import { MessageCircle, ArrowLeft, Heart, Send, AlertCircle, Share2 } from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.95) translateY(8px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes commentIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .skeleton {
    background: linear-gradient(90deg, #edebe6 25%, #f5f3ee 50%, #edebe6 75%);
    background-size: 600px 100%;
    animation: shimmer 1.5s infinite linear;
    border-radius: 8px;
  }
  .fade-up  { animation: fadeSlideUp 0.35s ease forwards; }
  .pop-in   { animation: popIn 0.32s cubic-bezier(.22,.68,0,1.15) forwards; }
  .comment-in { animation: commentIn 0.28s ease forwards; opacity: 0; }
  .toast-in { animation: fadeSlideUp 0.25s ease forwards; }

  /* Mobile: push compose above keyboard */
  .compose-bar {
     position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  @media (min-width: 640px) {
    .compose-bar {
      position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Auto-grow textarea */
  .auto-textarea {
    field-sizing: content;
    min-height: 40px;
    max-height: 120px;
  }

  textarea:focus { outline: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(val) {
    if (!val) return 'Just now';
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d)) return 'Just now';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = [
    { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
    { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
    { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
];

const getInitial = (name) => (name || 'A').trim().slice(0, 1).toUpperCase();
const getAvatarColor = (name) => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

function Avatar({ name, size = 'md' }) {
    const initials = getInitial(name);
    const color = getAvatarColor(name);
    const px = size === 'xs'
        ? 24
        : size === 'sm'
            ? 32
            : size === 'lg'
                ? 44
                : 36;
    return (
        <div
            style={{
                width: px,
                height: px,
                borderRadius: '50%',
                background: color.bg,
                color: color.text,
                border: `1.5px solid ${color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: Math.round(px * 0.38),
                flexShrink: 0,
                letterSpacing: '-0.02em',
                userSelect: 'none',
            }}
        >
            {initials}
        </div>
    );
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

    return parts.map((part, i) => {
        if (part.type === 'hashtag') return <span key={i} className="text-indigo-500 font-semibold">{part.content}</span>;
        if (part.type === 'mention') return <span key={i} className="text-violet-800 font-bold">{part.content}</span>;
        return <span key={i}>{part.content}</span>;
    });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <section className="w-full min-h-screen bg-[#f7f7f5] pb-24 sm:pb-12">
            <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
                <div className="skeleton h-4 w-20" />
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="skeleton w-11 h-11 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <div className="skeleton h-3 w-28" />
                            <div className="skeleton h-2.5 w-16" />
                        </div>
                    </div>
                    {[100, 88, 65].map((w, i) => <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />)}
                    <div className="skeleton h-48 w-full rounded-xl" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-16 w-full rounded-xl" />
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="skeleton w-8 h-8 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <div className="skeleton h-2.5 w-24" />
                                <div className="skeleton h-3 w-full" />
                                <div className="skeleton h-3 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ErrorScreen({ message, onBack }) {
    return (
        <section className="w-full min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4">
            <div className="max-w-sm w-full bg-white rounded-2xl border border-red-100 overflow-hidden text-center">
                <div className="h-1 bg-red-400 w-full" />
                <div className="p-8 space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                        <AlertCircle size={22} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Couldn't load post</h3>
                        <p className="text-gray-400 text-sm mt-1">{message}</p>
                    </div>
                    <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
                        <ArrowLeft size={14} /> Back to feed
                    </button>
                </div>
            </div>
        </section>
    );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, index }) {
    return (
        <div
            className="comment-in flex gap-3 group"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            <Avatar name={comment.username} size="sm" />
            <div className="flex-1 min-w-0">
                {/* Username + time inline above bubble */}
                <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[13px] font-bold text-violet-800 leading-none">
                        @{comment.username}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                {/* Bubble */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-gray-800 leading-relaxed break-words">
                        {renderContent(comment.content)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function PostDetail({ userId }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const textareaRef = useRef(null);

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitErr, setSubmitErr] = useState('');
    const [shareCopied, setShareCopied] = useState(false);
    const { username: currentUsername, loading: usernameLoading } = useUsername(userId);
    const { liked, loading: likeLoading, toggleLike } = useLikes(id, userId);
    const [localLikes, setLocalLikes] = useState(0);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const postSnap = await getDoc(doc(db, 'posts', id));
                if (!postSnap.exists()) { setError('Post not found'); return; }
                const data = postSnap.data();
                setPost({ id: postSnap.id, ...data });
                setLocalLikes(data.likes || 0);

                const snap = await getDocs(query(collection(db, 'comments'), where('postId', '==', id)));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => {
                    const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
                    const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
                    return tb - ta;
                });
                setComments(list);
            } catch {
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleAddComment = async (e) => {
        e?.preventDefault();
        const trimmed = newComment.trim();
        if (!trimmed) { setSubmitErr("Comment can't be empty."); return; }
        if (!currentUsername || usernameLoading) { setSubmitErr('Loading your username — try again.'); return; }
        setSubmitErr('');
        try {
            setSubmitting(true);
            const ref = await addDoc(collection(db, 'comments'), {
                postId: id, userId, username: currentUsername,
                content: trimmed, createdAt: serverTimestamp(),
            });
            setComments(prev => [{ id: ref.id, postId: id, userId, username: currentUsername, content: trimmed, createdAt: new Date() }, ...prev]);
            setNewComment('');
            textareaRef.current?.blur(); // dismiss keyboard on mobile after post
        } catch {
            setSubmitErr('Failed to post. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAddComment(e);
    };

    const handleLikeClick = async () => {
        if (isLiking || likeLoading) return;
        try {
            setIsLiking(true);
            await toggleLike(localLikes);
            setLocalLikes(prev => liked ? prev - 1 : prev + 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${id}`;
        if (navigator.share) {
            try { await navigator.share({ title: `AnyChat — ${post?.username}`, url }); return; } catch { }
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 1800);
        } catch { }
    };

    const canSubmit = newComment.trim().length > 0 && !submitting && !usernameLoading;

    if (loading) return <LoadingSkeleton />;
    if (error || !post) return <ErrorScreen message={error || 'Post not found'} onBack={() => navigate('/')} />;

    const mediaUrl = post.mediaType === 'video'
        ? post.videoUrl && getAppwriteMediaUrl(post.videoUrl, 'video')
        : post.imageUrl && getAppwriteMediaUrl(post.imageUrl, 'image');

    return (
        <>
            <style>{STYLES}</style>

            {/* On mobile the compose bar sticks to the bottom above the keyboard,
                so we need the page to be a flex column that fills the screen */}
            <div className="flex flex-col min-h-screen bg-[#f7f7f5]">

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-xl mx-auto px-4 pt-8 pb-4 sm:py-10 space-y-4">

                        {/* Back */}
                        <button
                            onClick={() => navigate('/')}
                            className="fade-up inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors group"
                        >
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to feed
                        </button>

                        {/* ── Post card ── */}
                        <article className="pop-in bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.07)] overflow-hidden">
                            {mediaUrl && (
                                <div className="bg-gray-900 w-full">
                                    {post.mediaType === 'video' ? (
                                        <video src={mediaUrl} className="w-full max-h-[22rem] object-cover" controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} preload="metadata" />
                                    ) : (
                                        <img src={mediaUrl} alt="Post media" className="w-full max-h-[22rem] object-cover" />
                                    )}
                                </div>
                            )}

                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar name={post.username || 'Anonymous'} size="lg" />
                                    <div>
                                        <p className="font-bold text-[13px] text-violet-800">@{post.username || 'anonymous'}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(post.createdAt)}</p>
                                    </div>
                                </div>

                                <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words mb-5">
                                    {renderContent(post.content)}
                                </p>

                                <div className="flex items-center gap-5 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={handleLikeClick}
                                        disabled={isLiking || likeLoading}
                                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition-all duration-200 group disabled:opacity-50"
                                    >
                                        <Heart size={16} className={`transition-all duration-300 ${liked ? 'fill-rose-500 text-rose-400 scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={liked ? 'text-rose-600 font-semibold' : ''}>{localLikes} like{localLikes !== 1 ? 's' : ''}</span>
                                    </button>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <MessageCircle size={16} className="text-indigo-400" />
                                        <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition-colors">
                                        <Share2 size={16} className="text-indigo-400" />
                                        <span>Share</span>
                                    </button>
                                </div>
                            </div>
                        </article>

                        {/* ── Comments list card ── */}
                        <div className="pop-in bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]" style={{ animationDelay: '60ms' }}>

                            {/* Header */}
                            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <MessageCircle size={16} className="text-indigo-400" />
                                    Comments
                                </h2>
                                {comments.length > 0 && (
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                        {comments.length}
                                    </span>
                                )}
                            </div>

                            {/* Comments list */}
                            <div className="px-5 sm:px-6 py-5">
                                {comments.length === 0 ? (
                                    <div className="text-center py-10 space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                            <MessageCircle size={18} className="text-gray-200" />
                                        </div>
                                        <p className="text-gray-400 text-sm">No comments yet — be the first!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {comments.map((c, i) => <CommentItem key={c.id} comment={c} index={i} />)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom spacer so last comment isn't hidden behind compose bar on mobile */}
                        <div className="h-2 sm:hidden" />
                    </div>
                </div>

                {/* ── Compose bar — sticks above keyboard on mobile, static on desktop ── */}
                <div className="compose-bar">
                    <div className="max-w-xl mx-auto px-4 py-3">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] px-5 py-4">
                            {/* "Commenting as" label */}
                            <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                                <Avatar name={currentUsername || '?'} size="xs" />
                                <span>
                                    Commenting as{' '}
                                    <span className="font-bold text-violet-800">@{currentUsername || '…'}</span>
                                </span>
                            </div>

                            {/* Input row */}
                            <div className="flex items-end gap-2.5">
                                <textarea
                                    ref={textareaRef}
                                    value={newComment}
                                    onChange={e => { setNewComment(e.target.value); setSubmitErr(''); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Add a comment…"
                                    rows={1}
                                    className="auto-textarea flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all leading-relaxed"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!canSubmit}
                                    className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90
                                        ${canSubmit
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {submitting
                                        ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        : <Send size={15} />
                                    }
                                </button>
                            </div>

                            {submitErr && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                                    <AlertCircle size={11} /> {submitErr}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {shareCopied && (
                <div className="toast-in fixed left-1/2 bottom-24 sm:bottom-6 z-50 -translate-x-1/2 rounded-full bg-gray-900 text-white text-xs font-medium px-4 py-2 shadow-lg whitespace-nowrap">
                    Link copied to clipboard
                </div>
            )}
        </>
    );
}

export default PostDetail;