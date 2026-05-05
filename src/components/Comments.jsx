import { useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useComments } from '../hooks/useComments';
import { useUsername } from '../hooks/useUsername';

function Comments({ postId, userId, onClose }) {
    const { comments, loading, error, addComment } = useComments(postId);
    const { username } = useUsername(userId);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddComment = async (e) => {
        e.preventDefault();
        const trimmed = newComment.trim();

        if (!trimmed) {
            toast.error('Comment cannot be empty');
            return;
        }

        setSubmitting(true);

        try {
            await addComment(trimmed, userId, username || 'Anonymous');
            setNewComment('');
            toast.success('Comment posted!');
        } catch (err) {
            console.error('Failed to add comment:', err);
            toast.error(err.message || 'Could not post comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-96 flex flex-col shadow-xl">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Comments</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading comments...</p>
                    ) : error ? (
                        <p className="text-red-500 text-sm">{error}</p>
                    ) : comments.length === 0 ? (
                        <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                    {comment.username || 'Anonymous'}
                                </div>
                                <p className="text-sm text-gray-900">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleAddComment} className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value.slice(0, 200))}
                            placeholder="Add a comment..."
                            rows="2"
                            maxLength={200}
                            className="flex-1 border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-2 focus:outline-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-sm disabled:opacity-60 hover:bg-blue-700 transition flex items-center gap-1"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{newComment.length}/200</p>
                </form>
            </div>
        </div>
    );
}

export default Comments;
