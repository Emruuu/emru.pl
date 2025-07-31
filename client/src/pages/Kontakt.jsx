import Layout from "../components/Layout";
import { useUser } from "../context/UserContext";
import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function Kontakt() {
    const { user } = useUser();
    const [email, setEmail] = useState(user?.email || "");
    const [message, setMessage] = useState("");
    const [response, setResponse] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResponse("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, message }),
            });

            const data = await res.json();
            if (res.ok) {
                setResponse("Wiadomość została wysłana.");
                setMessage("");
            } else {
                setResponse(data.message || "Wystąpił błąd.");
            }
        } catch (err) {
            setResponse("Nie udało się połączyć z serwerem.");
        }
    };

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Skontaktuj się z nami</h2>

            {!user ? (
                <p style={{ textAlign: "center", fontSize: "18px", color: "red" }}>
                    Musisz być zalogowany, aby wysłać wiadomość.
                </p>
            ) : (
                <form onSubmit={handleSubmit} style={{ textAlign: "center", marginTop: "30px" }}>
                    <input
                        type="email"
                        placeholder="Twój e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                    /><br />
                    <textarea
                        placeholder="Wiadomość"
                        rows="5"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        style={inputStyle}
                    ></textarea><br />
                    <button type="submit" style={buttonStyle}>Wyślij</button>
                    {response && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{response}</p>}
                </form>
            )}
        </Layout>
    );
}

const inputStyle = {
    width: "400px",
    padding: "10px",
    margin: "10px 0",
    fontSize: "16px",
};

const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
};

export default Kontakt;
