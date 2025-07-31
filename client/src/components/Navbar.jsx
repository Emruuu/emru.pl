import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Navbar() {
    const { user } = useUser();
    return (
        <nav>
            <ul>
                <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Strona główna</NavLink></li>
                <li><NavLink to="/teamspeak" className={({ isActive }) => isActive ? "active" : ""}>Teamspeak</NavLink></li>
                <li><NavLink to="/feed" className={({ isActive }) => isActive ? "active" : ""}>Społeczność</NavLink></li>
                <li><NavLink to="/kontakt" className={({ isActive }) => isActive ? "active" : ""}>Kontakt</NavLink></li>
                {user?.role === "admin" && (
                    <li><NavLink to="/admin" className="admin-link">Panel admina</NavLink></li>
                )}
            </ul>
        </nav>
    );
}

export default Navbar;
