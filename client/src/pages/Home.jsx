import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseContent } from "../utils/formatting"; 

const API_URL = import.meta.env.VITE_API_URL;

function Home() {
    const [latestPosts, setLatestPosts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatestPosts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/messages`);
                const data = await res.json();
                setLatestPosts(data.slice(0, 3));
            } catch (err) {
                console.error("Błąd pobierania postów:", err);
            }
        };

        fetchLatestPosts();
    }, []);

    return (
        <Layout>
            {/* Sekcja powitalna */}
            <section className="home-welcome">
                <h1>
                    Witaj na <span className="highlight">emru.pl</span>!
                </h1>
                <p>
                    To miejsce stworzone dla społeczności TeamSpeaka <strong>emru.pl</strong>, gdzie możesz dzielić się opiniami, pomysłami i poznawać innych użytkowników.
                </p>
                <button onClick={() => navigate("/register")} className="cta-button">
                    Dołącz teraz ➜
                </button>
            </section>

            {/* Sekcja mini-feed */}
            <section className="home-feed">
                <h2>📰 Ostatnie posty społeczności</h2>
                {latestPosts.length === 0 ? (
                    <p className="no-posts">
                        Brak postów. <a href="/feed">Zobacz społeczność</a>
                    </p>
                ) : (
                    <ul className="feed-list">
                        {latestPosts.map((post) => (
                            <li key={post.id} className="feed-item">
                                <strong>{post.author}</strong> napisał:
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: parseContent(
                                            post.message.length > 200
                                                ? post.message.slice(0, 200) + "..."
                                                : post.message
                                        ),
                                    }}
                                />
                                <small>{new Date(post.sent_at).toLocaleString()}</small>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="feed-more">
                    <a href="/feed" className="feed-button">
                        Zobacz więcej postów
                    </a>
                </div>
            </section>
        </Layout>
    );
}

export default Home;