import { useState } from "react";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

function NewPostForm({ onPostAdded }) {
    const { user } = useUser();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            await fetch(`${API_URL}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, message }),
            });
            setMessage("");
            onPostAdded();
        } catch (err) {
            console.error("Błąd dodawania posta:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ textAlign: "center", marginBottom: "20px" }}>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Co chcesz napisać?"
                rows={3}
                style={{ width: "90%", padding: "10px", fontSize: "16px" }}
                required
            />
            <br />
            <button type="submit" style={{ padding: "10px 20px", fontSize: "16px" }} disabled={loading}>
                {loading ? "Dodawanie..." : "Dodaj post"}
            </button>
        </form>
    );
}

export default NewPostForm;
