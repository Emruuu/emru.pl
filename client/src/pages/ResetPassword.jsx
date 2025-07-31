import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
const API_URL = import.meta.env.VITE_API_URL;

function ResetPassword() {
    const [params] = useSearchParams();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const token = params.get("token");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_URL}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            setMessage(data.message || "Hasło zmienione.");
        } catch {
            setMessage("Błąd połączenia z serwerem.");
        }
    };

    if (!token) return <Layout><p style={{ textAlign: "center", color: "red" }}>Brak tokena resetującego.</p></Layout>;

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Nowe hasło</h2>
            <form onSubmit={handleSubmit} style={{ textAlign: "center" }}>
                <input
                    type="password"
                    placeholder="Nowe hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "300px", padding: "10px", margin: "10px 0" }}
                />
                <br />
                <button type="submit" style={{ padding: "10px 20px" }}>Zapisz nowe hasło</button>
                {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
            </form>
        </Layout>
    );
}

export default ResetPassword;
