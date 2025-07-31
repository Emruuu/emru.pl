import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { getToken } from "../context/UserContext";
import Layout from "../components/Layout";

const API_URL = import.meta.env.VITE_API_URL;

function AdminPanel() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (user?.role === "admin") {
            if (activeTab === "users") fetchUsers();
            if (activeTab === "messages") fetchMessages();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Błąd pobierania użytkowników:", err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/messages`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error("Błąd pobierania wiadomości:", err);
        }
    };

    const handleToggleRole = async (u) => {
        const newRole = u.role === "admin" ? "user" : "admin";
        if (!confirm(`Na pewno zmienić rolę ${u.username} na ${newRole}?`)) return;
        try {
            await fetch(`${API_URL}/api/admin/users/${u.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ role: newRole })
            });
            fetchUsers();
        } catch (err) {
            console.error("Błąd zmiany roli:", err);
        }
    };

    const handleDeleteUser = async (u) => {
        if (!confirm(`Usunąć użytkownika ${u.username}?`)) return;
        try {
            await fetch(`${API_URL}/api/admin/users/${u.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            fetchUsers();
        } catch (err) {
            console.error("Błąd usuwania użytkownika:", err);
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!confirm("Na pewno usunąć ten post wraz z komentarzami?")) return;
        try {
            await fetch(`${API_URL}/api/messages/${id}`, {
                method: "DELETE"
            });
            fetchMessages();
        } catch (err) {
            console.error("Błąd usuwania posta:", err);
        }
    };

    const handleDeleteComment = async (id) => {
        if (!confirm("Na pewno usunąć komentarz?")) return;
        try {
            await fetch(`${API_URL}/api/comments/${id}`, {
                method: "DELETE"
            });
            fetchMessages();
        } catch (err) {
            console.error("Błąd usuwania komentarza:", err);
        }
    };

    if (!user || user.role !== "admin") {
        return (
            <Layout>
                <p style={{ textAlign: "center" }}>Brak dostępu do panelu administratora.</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Panel administratora</h2>
            <div className="admin-tabs">
                <button onClick={() => setActiveTab("users")} className={activeTab === "users" ? "active" : ""}>
                    Użytkownicy
                </button>
                <button onClick={() => setActiveTab("messages")} className={activeTab === "messages" ? "active" : ""}>
                    Posty i komentarze
                </button>
            </div>

            {activeTab === "users" && (
                <div className="admin-section">
                    <h3>Lista użytkowników</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Login</th>
                                <th>Email</th>
                                <th>Rola</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>
                                        <button onClick={() => handleToggleRole(u)} title="Zmień rolę">🛠️</button>
                                        <button onClick={() => handleDeleteUser(u)} title="Usuń użytkownika">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "messages" && (
                <div className="admin-section">
                    <h3>Posty z komentarzami</h3>
                    {messages.map((msg) => (
                        <div key={msg.id} className="admin-message">
                            <p>
                                <strong>{msg.author}</strong>: {msg.message}
                                <button onClick={() => handleDeleteMessage(msg.id)} title="Usuń post" style={{ marginLeft: "10px" }}>🗑️</button>
                            </p>
                            <p className="post-time">{new Date(msg.sent_at).toLocaleString()}</p>
                            {msg.comments.map((com) => (
                                <div key={com.id} className="admin-comment">
                                    <span><strong>{com.author}</strong>: {com.content}</span>
                                    <span className="post-time"> – {new Date(com.created_at).toLocaleString()}</span>
                                    <button onClick={() => handleDeleteComment(com.id)} title="Usuń komentarz" style={{ marginLeft: "10px" }}>🗑️</button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}

export default AdminPanel;
