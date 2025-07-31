import Navbar from "./Navbar";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

function Layout({ children }) {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    return (
        <div className="background">
            <div id="kontener">
                <header id="upper">
                    <div id="upperb1">
                        <img src="../images/logo.png" alt="EMRU.PL Logo" id="logo" style={{ height: "80px" }} />
                    </div>
                    <div id="upperb2">
                        {user ? (
                            <span style={{ color: "white" }}>Witaj, {user.display_name}</span>
                        ) : (
                            <a href="/register">Zarejestruj</a>
                        )}
                    </div>
                    <div id="upperb3">
                        {user ? (
                            <a href="#" onClick={(e) => {
                                e.preventDefault();
                                logout();
                                navigate("/login", { state: { loggedOut: true } });
                            }}>Wyloguj</a>
                        ) : (
                            <a href="/login">Zaloguj</a>
                        )}
                    </div>
                </header>

                <div id="nawigacjakont">
                    <Navbar />
                </div>

                <main id="kontentkont">
                    <div id="kontent">{children}</div>
                </main>

                <footer id="stopkakont">
                    <div id="stopka">
                        <div id="podpis">
                            <a href="https://wojciechowski.emru.pl" target="_blank" rel="noopener noreferrer" className="footer-link">
                                © 2025 – Wojciechowski
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Layout;
