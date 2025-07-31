import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
const API_URL = import.meta.env.VITE_API_URL;

function Activate() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Trwa aktywacja konta...");
    const token = searchParams.get("token");

    useEffect(() => {
        const activate = async () => {
            if (!token) {
                setMessage("Brak tokena aktywacyjnego.");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/activate?token=${token}`);
                const data = await res.json();
                setMessage(data.message || "Gotowe.");
            } catch (err) {
                setMessage("Błąd połączenia z serwerem.");
            }
        };

        activate();
    }, [token]);

    return (
        <Layout>
            <h2 style={{ textAlign: "center", marginTop: "50px" }}>{message}</h2>
        </Layout>
    );
}

export default Activate;