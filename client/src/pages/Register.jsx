import { useState } from "react";
import Layout from "../components/Layout";
const API_URL = import.meta.env.VITE_API_URL;

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Rejestracja zakończona sukcesem! Link aktywacyjny został wysłany!");
                setUsername(""); setEmail(""); setPassword("");
            } else {
                setMessage(data.message || "Błąd rejestracji.");
            }
        } catch (err) {
            setMessage("Błąd połączenia z serwerem.");
        }
    };

    return (
        <Layout>
            <h1 style={{ textAlign: "center" }}>Rejestracja</h1>
            <form onSubmit={handleRegister} style={{ textAlign: "center" }}>
                <input
                    type="text"
                    placeholder="Nazwa użytkownika"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={inputStyle}
                />
                <br />
                <input
                    type="email"
                    placeholder="Adres e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                />
                <br />
                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
                <br />
                <input type="submit" value="Zarejestruj" style={buttonStyle} />
                {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
            </form>
        </Layout>
    );
}

const inputStyle = {
    width: "300px",
    padding: "10px",
    margin: "10px 0",
    fontSize: "16px",
};

const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
};

export default Register;
