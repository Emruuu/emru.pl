import { useState } from "react";
import { useUser } from "../context/UserContext";
import { parseContent } from "../utils/formatting";

const API_URL = import.meta.env.VITE_API_URL;


function Post({ post, onCommentAdded }) {
    const { user } = useUser();
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingPost, setEditingPost] = useState(false);
    const [editedPostText, setEditedPostText] = useState(post.message);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentText, setEditedCommentText] = useState("");

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setLoading(true);
        try {
            await fetch(`${API_URL}/api/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    message_id: post.id,
                    content: comment,
                }),
            });
            setComment("");
            onCommentAdded();
        } catch (err) {
            console.error("Błąd dodawania komentarza:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("Na pewno chcesz usunąć ten post?")) return;
        try {
            await fetch(`${API_URL}/api/messages/${post.id}`, { method: "DELETE" });
            onCommentAdded();
        } catch (err) {
            console.error("Błąd usuwania posta:", err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Usunąć komentarz?")) return;
        try {
            await fetch(`${API_URL}/api/comments/${commentId}`, { method: "DELETE" });
            onCommentAdded();
        } catch (err) {
            console.error("Błąd usuwania komentarza:", err);
        }
    };

    const handleUpdatePost = async () => {
        if (!editedPostText.trim()) return;
        try {
            await fetch(`${API_URL}/api/messages/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: editedPostText }),
            });
            setEditingPost(false);
            onCommentAdded();
        } catch (err) {
            console.error("Błąd edycji posta:", err);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editedCommentText.trim()) return;
        try {
            await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editedCommentText }),
            });
            setEditingCommentId(null);
            setEditedCommentText("");
            onCommentAdded();
        } catch (err) {
            console.error("Błąd edycji komentarza:", err);
        }
    };

    return (
        <div className="post">
            <div className="post-header">
                <span><strong>{post.author}</strong> napisał:</span>
            </div>

            {editingPost ? (
                <>
                    <textarea
                        className="form-post"
                        value={editedPostText}
                        onChange={(e) => setEditedPostText(e.target.value)}
                        rows={3}
                    />
                    <div className="post-meta">
                        <button className="btn-save" onClick={handleUpdatePost}>Zapisz</button>
                        <button className="btn-cancel" onClick={() => setEditingPost(false)}>Anuluj</button>
                    </div>
                </>
            ) : (
                <>
                    {/* ✅ Wyświetlanie z parserem BBCode */}
                    <p dangerouslySetInnerHTML={{ __html: parseContent(post.message) }} />
                    <p className="post-time">{new Date(post.sent_at).toLocaleString()}</p>
                    {user?.id === post.user_id && (
                        <div className="post-meta">
                            <button className="btn-delete-comment" onClick={handleDeletePost}>Usuń 🗑️</button>
                            <button className="btn-edit" onClick={() => { setEditingPost(true); setEditedPostText(post.message); }}>Edytuj ✏️</button>
                        </div>
                    )}
                </>
            )}

            {post.comments.map((com) => (
                <div key={com.id} className="comment">
                    <span><strong>{com.author}</strong>: </span>
                    {editingCommentId === com.id ? (
                        <>
                            <input
                                type="text"
                                className="form-post"
                                value={editedCommentText}
                                onChange={(e) => setEditedCommentText(e.target.value)}
                            />
                            <div className="comment-meta">
                                <button className="btn-save" onClick={() => handleUpdateComment(com.id)}>Zapisz</button>
                                <button className="btn-cancel" onClick={() => setEditingCommentId(null)}>Anuluj</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ✅ Komentarze z parserem BBCode */}
                            <span dangerouslySetInnerHTML={{ __html: parseContent(com.content) }} />
                            <div className="comment-meta">
                                <span>{new Date(com.created_at).toLocaleString()}</span>
                                {user?.id === com.user_id && (
                                    <>
                                        <button className="btn-delete-comment" onClick={() => handleDeleteComment(com.id)}>Usuń 🗑️</button>
                                        <button className="btn-edit" onClick={() => { setEditingCommentId(com.id); setEditedCommentText(com.content); }}>Edytuj ✏️</button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}

            {user && (
                <form className="comment-form" onSubmit={handleComment}>
                    <input
                        type="text"
                        placeholder="Dodaj komentarz..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>Wyślij</button>
                </form>
            )}
        </div>
    );
}

export default Post;