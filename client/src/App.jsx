import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Teamspeak from "./pages/Teamspeak";
import Kontakt from "./pages/Kontakt";
import Activate from "./pages/Activate";
import Feed from "./pages/Feed";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminPanel from "./pages/AdminPanel";

function App() {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/activate" element={<Activate />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/teamspeak" element={<Teamspeak />} />
                    <Route path="/kontakt" element={<Kontakt />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/admin" element={<AdminPanel />} />
                </Routes>
            </Router>
        </UserProvider>
    );
}

export default App;
