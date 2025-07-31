import { useEffect, useState } from "react";
import Layout from "../components/Layout";

function Teamspeak() {
    const [tsData, setTsData] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/teamspeak`)
            .then(res => res.json())
            .then(setTsData)
            .catch(() => setTsData({ status: "offline" }));
    }, []);

    const roleIcon = (c) => {
        if (c.isAdmin) return "🔑";  // Admin
        if (c.isBot) return "🤖";    // Bot
        return "👤";                 // Normalny / Gość
    };

    return (
        <Layout>
            <h2 style={{ textAlign: "center" }}>Informacje o serwerze TeamSpeak</h2>

            {!tsData ? (
                <p style={{ textAlign: "center" }}>Ładowanie danych serwera...</p>
            ) : tsData.status === "offline" ? (
                <p style={{ textAlign: "center", color: "red" }}>
                    🔴 Serwer offline lub brak połączenia z TS.
                </p>
            ) : (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    {/* Baner TS */}
                    {tsData.banner && (
                        <div style={{ marginTop: "15px" }}>
                            <img src={tsData.banner} alt="Baner TS" style={{ maxWidth: "100%", borderRadius: "6px" }} />
                        </div>
                    )}

                    {/* Informacje o serwerze */}
                    <p><strong>Status:</strong> 🟢 Online</p>
                    <p><strong>Uptime:</strong> {tsData.uptime}</p>
                    <p><strong>Użytkownicy:</strong> {tsData.clientsOnline}/{tsData.maxClients}</p>
                    <p><strong>Kanały:</strong> {tsData.channels}</p>
                    <p><strong>Wersja:</strong> {tsData.version} ({tsData.platform})</p>
                    <p><strong>Serwer działa od:</strong> {tsData.created}</p>
                    
                    {/* Lista użytkowników */}
                    <h3 style={{ marginTop: "15px" }}>👥 Lista użytkowników</h3>
                    {tsData.clientList.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {[...tsData.clientList]
                                .sort((a, b) => {
                                    const rank = c =>
                                        c.isAdmin ? 1 : c.isNormal ? 2 : c.isBot ? 3 : 4;
                                    return rank(a) - rank(b) || a.nickname.localeCompare(b.nickname);
                                })
                                .map((c, idx) => {
                                    let color = "black";
                                    if (c.isAdmin) color = "red";
                                    else if (c.isBot) color = "purple";
                                    else if (c.isGuest) color = "gray";

                                    return (
                                        <li key={idx} style={{ color, fontWeight: c.isAdmin ? "bold" : "normal" }}>
                                            {roleIcon(c)} {c.nickname}{" "}
                                            <span style={{ fontSize: "0.9em", color: "#555" }}>
                                                {c.country !== "Unknown" ? (
                                                    <>
                                                        <img
                                                            src={`https://flagcdn.com/16x12/${c.country.toLowerCase()}.png`}
                                                            alt={c.country}
                                                            title={c.country}
                                                            style={{ width: "16px", height: "12px", marginLeft: "4px", verticalAlign: "middle" }}
                                                        />{" "}
                                                        {c.country}
                                                    </>
                                                ) : (
                                                    <>🌐</>
                                                )}
                                            </span>
                                        </li>
                                    );
                                })}
                        </ul>
                    ) : (
                        <p>Brak zalogowanych użytkowników.</p>
                    )}
                </div>
            )}

            {/* Przycisk do wejścia na TS */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <a
                    href="ts3server://emru.pl?port=9987"
                    style={{
                        display: "inline-block",
                        backgroundColor: "orange",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        fontSize: "16px",
                    }}
                >
                    💬 Zapraszamy na TS!
                </a>
            </div>
        </Layout>
    );
}

export default Teamspeak;