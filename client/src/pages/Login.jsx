import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { useUser } from "../context/UserContext";
const API_URL = import.meta.env.VITE_API_URL;

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const { login: loginUser } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.loggedOut) {
            setMessage("Zostałeś wylogowany.");
        }
    }, [location.state]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            let data;
            try {
                data = await response.json();
            } catch (err) {
                console.error("Nie udało się sparsować JSON:", err);
                setMessage("Odpowiedź serwera nieprawidłowa.");
                return;
            }

            if (response.ok) {
                loginUser(data.token);
                navigate("/");
            } else {
                setMessage(data.message || "Błąd logowania");
            }
        } catch (error) {
            console.error("Błąd logowania:", error);
            setMessage("Błąd połączenia z serwerem");
        }
    };

    return (
        <Layout>
            <h1 style={{ textAlign: "center" }}>Logowanie</h1>
            <form onSubmit={handleLogin} style={{ textAlign: "center" }}>
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
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
                <br />
                <input type="submit" value="Zaloguj" style={buttonStyle} />
                {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
                <p className="forgot-password-link">
                    <a href="/forgot-password">Nie pamiętasz hasła?</a>
                </p>
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

export default Login;
