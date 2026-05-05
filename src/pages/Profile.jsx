import React, { useState } from 'react';
import { useUsername } from '../hooks/useUsername';
import { usePosts } from '../hooks/usePosts';
import UsernameDisplay from '../components/UsernameDisplay';
import PostCard from '../components/PostCard';
import { Heart, MessageCircle, Lock, Edit2, Sparkles } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.93); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes floatAvatar {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-4px); }
  }

  .profile-page { font-family: 'DM Sans', ui-sans-serif, system-ui; }
  .fade-slide-down { animation: fadeSlideDown 0.4s ease forwards; }
  .fade-slide-up   { animation: fadeSlideUp 0.45s ease forwards; }
  .scale-in        { animation: scaleIn 0.35s cubic-bezier(0.22, 0.68, 0, 1.2) forwards; }
  .post-item       { animation: fadeSlideUp 0.45s ease forwards; opacity: 0; }
  .avatar-float    { animation: floatAvatar 3.5s ease-in-out infinite; }

  /* Cover banner shimmer base */
  .cover-banner {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 80%, #10b981 100%);
    position: relative;
    overflow: hidden;
  }
  .cover-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255,255,255,0.12) 50%,
      transparent 100%);
    background-size: 600px 100%;
    animation: shimmer 3s infinite linear;
  }

  /* Stat card gradient borders */
  .stat-border-blue   { background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #93c5fd, #6366f1) border-box; border: 1.5px solid transparent; }
  .stat-border-rose   { background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #fda4af, #f43f5e) border-box; border: 1.5px solid transparent; }
  .stat-border-emerald{ background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #6ee7b7, #10b981) border-box; border: 1.5px solid transparent; }

  /* Posts section accent */
  .section-rule {
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
    width: 3px;
    border-radius: 99px;
  }

  .profile-card-bg {
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E");
    background-color: #ffffff;
  }

  /* Avatar ring */
  .avatar-ring {
    padding: 3px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
    border-radius: 9999px;
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

function Avatar({ name, size = 80 }) {
    const c = getAvatarColor(name);
    return (
        <div className="avatar-ring avatar-float" style={{ display: 'inline-flex' }}>
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: c.bg, color: c.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: size * 0.38,
                userSelect: 'none', letterSpacing: '-0.02em',
            }}>
                {getInitial(name)}
            </div>
        </div>
    );
}

function Profile({ user, userId }) {
    const { username, loading: usernameLoading, updateUsername } = useUsername(userId);
    const { posts, loading: postsLoading, error: postsError } = usePosts();

    const userPosts = posts.filter(p => p.userId === userId);
    const totalLikes = userPosts.reduce((sum, p) => sum + (Number(p.likes) || 0), 0);

    return (
        <>
            <style>{STYLES}</style>
            <div className="profile-page w-full min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 pb-24 sm:pb-12">
                <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-5 sm:space-y-7">

                    {/* ── Profile header card ── */}
                    <div className="fade-slide-down rounded-3xl overflow-hidden shadow-[0_8px_32px_-4px_rgba(99,102,241,0.18)] hover:shadow-[0_16px_48px_-4px_rgba(99,102,241,0.22)] transition-shadow duration-300">

                        {/* Gradient cover */}
                        <div className="cover-banner h-28 sm:h-36" />

                        {/* Body */}
                        <div className="profile-card-bg px-5 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16 flex flex-col items-center">

                            {/* Avatar — overlaps banner */}
                            <Avatar name={username || 'A'} size={76} />

                            {/* Name + badge */}
                            <div className="mt-3 text-center">
                                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 break-all leading-tight">
                                    {usernameLoading
                                        ? <span className="inline-block animate-pulse text-gray-400">Loading…</span>
                                        : (username || 'Anonymous')
                                    }
                                </h1>
                                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                    <Lock size={11} />
                                    Fully Anonymous · Fully Private
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-5 sm:my-6" />

                            {/* Edit username */}
                            <div className="w-full">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-3 flex items-center justify-center gap-1.5">
                                    <Edit2 size={11} /> Update Identity
                                </p>
                                <div className="rounded-2xl p-px bg-gradient-to-br from-indigo-200 via-violet-200 to-cyan-200">
                                    <div className="bg-white rounded-2xl px-4 py-4">
                                        <UsernameDisplay
                                            username={username}
                                            loading={usernameLoading}
                                            onUpdate={updateUsername}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats row ── */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 scale-in">

                        {/* Posts */}
                        <div className="stat-border-blue profile-card-bg rounded-2xl p-3 sm:p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className="mx-auto mb-2 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <MessageCircle size={18} />
                            </div>
                            <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">{userPosts.length}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Posts</p>
                        </div>

                        {/* Likes */}
                        <div className="stat-border-rose profile-card-bg rounded-2xl p-3 sm:p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className="mx-auto mb-2 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                <Heart size={18} />
                            </div>
                            <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">{totalLikes}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Likes</p>
                        </div>

                        {/* Privacy */}
                        <div className="stat-border-emerald profile-card-bg rounded-2xl p-3 sm:p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className="mx-auto mb-2 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <Sparkles size={18} />
                            </div>
                            <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">∞</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Privacy</p>
                        </div>
                    </div>

                    {/* ── Posts section ── */}
                    <div className="fade-slide-up">

                        {/* Section heading */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="section-rule h-7" />
                            <h2 className="text-base sm:text-xl font-bold text-gray-900">Your Posts</h2>
                            {userPosts.length > 0 && (
                                <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                    {userPosts.length}
                                </span>
                            )}
                        </div>

                        {/* Loading */}
                        {postsLoading && (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-indigo-500 animate-spin mb-4" />
                                <p className="text-gray-400 text-sm font-medium">Loading your posts…</p>
                            </div>
                        )}

                        {/* Error */}
                        {postsError && !postsLoading && (
                            <div className="rounded-2xl p-px bg-gradient-to-br from-red-200 to-rose-300">
                                <div className="bg-red-50 rounded-2xl p-6 text-center">
                                    <p className="text-red-700 font-bold text-sm">Failed to load posts</p>
                                    <p className="text-red-500 text-xs mt-1">{postsError}</p>
                                </div>
                            </div>
                        )}

                        {/* Empty */}
                        {!postsLoading && !postsError && userPosts.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                                    <MessageCircle size={26} className="text-gray-300" />
                                </div>
                                <p className="text-gray-600 font-semibold text-sm sm:text-base">No posts yet</p>
                                <p className="text-gray-400 text-xs mt-1.5">Share your first post to get started!</p>
                            </div>
                        )}

                        {/* Posts list */}
                        {userPosts.length > 0 && (
                            <div className="flex flex-col gap-4 sm:gap-5">
                                {userPosts.map((post, idx) => (
                                    <div
                                        key={post.id}
                                        className="post-item"
                                        style={{ animationDelay: `${idx * 55}ms` }}
                                    >
                                        <PostCard post={post} userId={userId} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

export default Profile;