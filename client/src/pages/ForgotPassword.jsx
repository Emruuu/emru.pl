import { useState } from "react";
import Layout from "../components/Layout";
const API_URL = import.meta.env.VITE_API_URL;

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_URL}/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setMessage(data.message || "Jeśli e-mail istnieje, link został wysłany.");
        } catch {
            setMessage("Błąd połączenia z serwerem.");
        }
    };

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Przypomnienie hasła</h2>
            <form onSubmit={handleSubmit} style={{ textAlign: "center" }}>
                <input
                    type="email"
                    placeholder="Twój e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "300px", padding: "10px", margin: "10px 0" }}
                />
                <br />
                <button type="submit" style={{ padding: "10px 20px" }}>Wyślij link resetujący</button>
                {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
            </form>
        </Layout>
    );
}

export default ForgotPassword;