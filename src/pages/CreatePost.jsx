import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useUsername } from '../hooks/useUsername';
import {
    validateImage,
    validateVideo,
    uploadImageToAppwrite,
    uploadVideoToAppwrite,
    detectMediaType,
} from '../utils/imageUpload';
import { X, ImagePlus, Film, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 500;
const ACCEPTED_TYPES = 'image/*,video/*';

const MEDIA_HINTS = [
    { label: 'Images', detail: 'JPEG · PNG · GIF · WebP · max 5 MB' },
    { label: 'Videos', detail: 'MP4 · WebM · GIF · max 50 MB' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractTags(text) {
    const hashtags = [...new Set(text.match(/#\w+/g) || [])];
    const mentions = [...new Set(text.match(/@\w+/g) || [])];
    return { hashtags, mentions };
}

function CharCount({ value, max }) {
    const remaining = max - value;
    const pct = value / max;
    const color =
        pct >= 1 ? 'text-red-500' : pct >= 0.85 ? 'text-amber-500' : 'text-gray-400';
    return (
        <span className={`text-xs tabular-nums transition-colors duration-200 ${color}`}>
            {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
        </span>
    );
}

function TagPills({ tags, colorClass, bgClass }) {
    if (!tags.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
                <span
                    key={t}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass}`}
                >
                    {t}
                </span>
            ))}
        </div>
    );
}

function UploadZone({ onFile, dragActive, onDragEnter, onDragLeave, onDragOver, onDrop }) {
    const inputRef = useRef(null);
    return (
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            aria-label="Upload image or video"
            className={`
                group relative border-2 border-dashed rounded-xl p-6 text-center
                cursor-pointer select-none transition-all duration-200 outline-none
                focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                ${dragActive
                    ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-50'
                }
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />

            {/* Icon cluster */}
            <div className="flex justify-center gap-3 mb-3">
                <div className={`p-2 rounded-lg transition-colors duration-200 ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 group-hover:text-gray-500 shadow-sm border border-gray-100'}`}>
                    <ImagePlus size={20} />
                </div>
                <div className={`p-2 rounded-lg transition-colors duration-200 ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 group-hover:text-gray-500 shadow-sm border border-gray-100'}`}>
                    <Film size={20} />
                </div>
            </div>

            <p className={`text-sm font-medium mb-2 transition-colors duration-200 ${dragActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                {dragActive ? 'Drop to attach' : 'Drag & drop or click to upload'}
            </p>

            <div className="flex justify-center gap-6 mt-1">
                {MEDIA_HINTS.map(({ label, detail }) => (
                    <div key={label} className="text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                        <p className="text-[11px] text-gray-400">{detail}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MediaPreview({ preview, type, onRemove }) {
    return (
        <div className="relative rounded-xl overflow-hidden bg-gray-900 ring-1 ring-gray-200">
            {type === 'image' ? (
                <img
                    src={preview}
                    alt="Upload preview"
                    className="w-full max-h-80 object-cover"
                />
            ) : (
                <video
                    src={preview}
                    className="w-full max-h-80 object-cover"
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    preload="metadata"
                />
            )}
            {/* Gradient overlay for remove button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />
            <button
                type="button"
                onClick={onRemove}
                aria-label="Remove media"
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors duration-150 backdrop-blur-sm"
            >
                <X size={16} />
            </button>
            <span className="absolute bottom-2 left-2.5 text-[11px] font-medium text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {type === 'image' ? '🖼 Image' : '🎬 Video'}
            </span>
        </div>
    );
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen() {
    return (
        <section className="w-full min-h-screen flex items-center justify-center px-4">
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Post published!</h2>
                <p className="text-gray-500 text-sm">Redirecting you home…</p>
            </div>
        </section>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
function CreatePost({ userId }) {
    const navigate = useNavigate();
    const { username } = useUsername(userId);
    const { createPost, loading: submitting } = usePosts();

    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { hashtags, mentions } = extractTags(content);
    const isOverLimit = content.length > MAX_CHARS;
    const isEmpty = !content.trim() && !media;
    const isSubmitting = submitting || uploading;

    // ── Media handling ──────────────────────────────────────────────────────
    const handleMediaSelect = useCallback((file) => {
        setError('');
        const type = detectMediaType(file);

        if (type === 'unknown') {
            setError('Unsupported file. Please upload a JPEG, PNG, GIF, WebP, MP4, or WebM.');
            return;
        }

        const validation =
            type === 'image' ? validateImage(file) : validateVideo(file);

        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setMedia(file);
        setMediaType(type);

        const reader = new FileReader();
        reader.onload = (e) => setMediaPreview(e.target.result);
        reader.readAsDataURL(file);
    }, []);

    const removeMedia = useCallback(() => {
        setMedia(null);
        setMediaType(null);
        setMediaPreview(null);
    }, []);

    // ── Drag handlers ───────────────────────────────────────────────────────
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleMediaSelect(file);
    }, [handleMediaSelect]);

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = content.trim();

        if (!trimmed && !media) {
            setError('Your post needs some text or media before you can share it.');
            return;
        }
        if (!userId) {
            setError('You must be logged in to post.');
            return;
        }
        if (isOverLimit) {
            setError(`Please shorten your post by ${content.length - MAX_CHARS} characters.`);
            return;
        }

        setError('');

        try {
            setUploading(true);
            let mediaUrl = null;

            if (media) {
                const upload =
                    mediaType === 'image'
                        ? uploadImageToAppwrite
                        : uploadVideoToAppwrite;
                mediaUrl = await upload(media, userId, Date.now());
            }

            await createPost(
                trimmed,
                userId,
                username || 'Anonymous',
                mediaUrl,
                mediaType
            );

            setContent('');
            removeMedia();
            setSuccess(true);
            setTimeout(() => navigate('/'), 1200);
        } catch (err) {
            console.error('Failed to create post:', err);
            setError(err.message || 'Something went wrong. Check your connection and try again.');
        } finally {
            setUploading(false);
        }
    };

    if (success) return <SuccessScreen />;

    return (
        <section className="w-full min-h-screen bg-[#f8f8f6] pb-24 sm:pb-12">
            <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">

                {/* Header */}
                <header className="mb-7">
                    <h1 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-gray-900 tracking-tight leading-tight">
                        New post
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Anonymous · use{' '}
                        <span className="text-indigo-500 font-medium">#hashtags</span> and{' '}
                        <span className="text-pink-500 font-medium">@mentions</span>
                    </p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden"
                    noValidate
                >
                    {/* Textarea section */}
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <label
                                htmlFor="postContent"
                                className="text-sm font-semibold text-gray-700"
                            >
                                What's on your mind?
                            </label>
                            <CharCount value={content.length} max={MAX_CHARS} />
                        </div>

                        <textarea
                            id="postContent"
                            rows={5}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={"Share something with your campus…\n\nTip: Use #hashtags and @mentions!"}
                            className={`
                                w-full resize-none text-sm text-gray-800 placeholder-gray-400
                                bg-transparent outline-none leading-relaxed transition-all duration-150
                                ${isOverLimit ? 'text-red-600' : ''}
                            `}
                            aria-describedby={error ? 'post-error' : undefined}
                        />
                    </div>

                    {/* Tag preview strip */}
                    {(hashtags.length > 0 || mentions.length > 0) && (
                        <div className="px-5 py-2 border-t border-gray-50 flex flex-wrap gap-1.5 items-center">
                            <TagPills
                                tags={hashtags}
                                bgClass="bg-indigo-50"
                                colorClass="text-indigo-600"
                            />
                            <TagPills
                                tags={mentions}
                                bgClass="bg-pink-50"
                                colorClass="text-pink-600"
                            />
                        </div>
                    )}

                    {/* Media preview */}
                    {mediaPreview && (
                        <div className="px-5 py-3 border-t border-gray-50">
                            <MediaPreview
                                preview={mediaPreview}
                                type={mediaType}
                                onRemove={removeMedia}
                            />
                        </div>
                    )}

                    {/* Upload zone */}
                    {!mediaPreview && (
                        <div className="px-5 py-3 border-t border-gray-50">
                            <UploadZone
                                onFile={handleMediaSelect}
                                dragActive={dragActive}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            />
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div
                            id="post-error"
                            role="alert"
                            className="mx-5 mb-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700"
                        >
                            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Footer / submit */}
                    <div className="px-5 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                            Fully anonymous
                        </p>

                        <button
                            type="submit"
                            disabled={isSubmitting || isEmpty || isOverLimit}
                            className={`
                                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                                transition-all duration-200 outline-none
                                focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                                ${isSubmitting || isEmpty || isOverLimit
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm hover:shadow-indigo-200/60 hover:shadow-md'
                                }
                            `}
                        >
                            {uploading
                                ? <>
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Uploading
                                </>
                                : submitting
                                    ? <>
                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Posting
                                    </>
                                    : <>
                                        Share post
                                        <ArrowRight size={15} />
                                    </>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default CreatePost;