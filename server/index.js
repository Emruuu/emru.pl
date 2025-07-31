require("dotenv").config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { TeamSpeak } = require("ts3-nodejs-library");

const app = express();
//app.use(cors());
app.use(cors({ origin: "https://emru.pl" }));
app.use(bodyParser.json());

function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokenu." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token nieprawidłowy lub wygasł." });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Brak uprawnień administratora." });
    }
    next();
}

// transporter e-mail
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.OVH_SMTP_USER,
        pass: process.env.OVH_SMTP_PASS,
    },
});

// LOGIN
app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;

    // Normalizacja nazwy użytkownika
    const usernameNormalized = username.trim().toLowerCase();

    try {
        // Logowanie niewrażliwe na wielkość liter
        const result = await db.query(
            'SELECT * FROM users WHERE LOWER(username) = $1',
            [usernameNormalized]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        const user = result.rows[0];

        // Sprawdzenie aktywacji konta
        if (!user.is_active) {
            return res.status(403).json({ message: "Konto nie zostało aktywowane." });
        }

        // Sprawdzenie hasła
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        // Tworzymy JWT z display_name
        const payload = {
            id: user.id,
            username: user.username,          // zawsze lowercase
            display_name: user.display_name,  // wersja wyświetlana
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: 'Zalogowano', token });
    } catch (err) {
        console.error("Błąd zapytania:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// REGISTER
app.post('/api/register', async (req, res) => {
    let { username, email, password } = req.body;

    // Normalizacja
    const usernameNormalized = username.trim().toLowerCase();
    const displayName = username.trim(); // zachowujemy oryginał
    const emailNormalized = email.trim().toLowerCase();

    try {
        const exists = await db.query(
            'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
            [usernameNormalized, emailNormalized]
        );

        if (exists.rows.length > 0) {
            return res.status(400).json({ message: 'Taki użytkownik lub email już istnieje.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = crypto.randomBytes(32).toString("hex");

        await db.query(
            'INSERT INTO users (username, display_name, email, password, activation_token) VALUES ($1, $2, $3, $4, $5)',
            [usernameNormalized, displayName, emailNormalized, hashedPassword, token]
        );

        const activationLink = `${process.env.CLIENT_URL}/activate?token=${token}`;

        await transporter.sendMail({
            from: process.env.OVH_SMTP_USER,
            to: emailNormalized,
            subject: "Aktywacja konta na emru.pl",
            text: `Witaj ${displayName}!\n\nKliknij poniższy link, aby aktywować swoje konto:\n\n${activationLink}\n\nPozdrawiamy,\nZespół Emru`,
        });

        res.status(201).json({ message: 'Użytkownik zarejestrowany. Sprawdź e-mail i aktywuj konto.' });
    } catch (err) {
        console.error("Błąd rejestracji:", err.message);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// KONTAKT
app.post("/api/contact", async (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ message: "Wszystkie pola są wymagane." });
    }

    try {
        await transporter.sendMail({
            from: email,
            to: "emru@emru.pl",
            subject: "Wiadomość z formularza kontaktowego emru.pl",
            text: message,
        });

        res.json({ message: "Wiadomość wysłana!" });
    } catch (err) {
        console.error("Błąd maila:", err.message);
        res.status(500).json({ message: "Nie udało się wysłać wiadomości." });
    }
});

// AKTYWACJA
app.get("/api/activate", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Brak tokena." });
    }

    try {
        const check = await db.query(
            "SELECT is_active FROM users WHERE activation_token = $1",
            [token]
        );

        if (check.rowCount === 0) {
            return res.status(400).json({ message: "Nieprawidłowy token lub konto już aktywowane." });
        }

        const user = check.rows[0];

        if (user.is_active) {
            return res.json({ message: "To konto już zostało aktywowane." });
        }

        await db.query(
            "UPDATE users SET is_active = TRUE, activation_token = NULL WHERE activation_token = $1",
            [token]
        );

        res.json({ message: "Konto zostało aktywowane!" });
    } catch (err) {
        console.error("Błąd aktywacji:", err.message);
        res.status(500).json({ message: "Błąd aktywacji konta." });
    }
});

// POST /api/messages
app.post("/api/messages", async (req, res) => {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
        return res.status(400).json({ message: "Brak wymaganych danych." });
    }

    try {
        await db.query(
            "INSERT INTO messages (user_id, message, sent_at) VALUES ($1, $2, NOW())",
            [user_id, message]
        );
        res.status(201).json({ message: "Post dodany." });
    } catch (err) {
        console.error("Błąd dodawania posta:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// POST /api/comments
app.post("/api/comments", async (req, res) => {
    const { user_id, message_id, content } = req.body;

    if (!user_id || !message_id || !content) {
        return res.status(400).json({ message: "Brak wymaganych danych." });
    }

    try {
        await db.query(
            "INSERT INTO comments (user_id, message_id, content, created_at) VALUES ($1, $2, $3, NOW())",
            [user_id, message_id, content]
        );
        res.status(201).json({ message: "Komentarz dodany." });
    } catch (err) {
        console.error("Błąd dodawania komentarza:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// GET /api/messages
app.get("/api/messages", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                m.id as message_id,
                m.message,
                m.sent_at,
                m.user_id,
                u.username,
                c.id as comment_id,
                c.content,
                c.created_at,
                c.user_id as comment_user_id,
                cu.username as commenter
            FROM messages m
            JOIN users u ON m.user_id = u.id
            LEFT JOIN comments c ON c.message_id = m.id
            LEFT JOIN users cu ON c.user_id = cu.id
            ORDER BY m.sent_at DESC, c.created_at ASC
        `);

        const messagesMap = new Map();

        result.rows.forEach(row => {
            if (!messagesMap.has(row.message_id)) {
                messagesMap.set(row.message_id, {
                    id: row.message_id,
                    message: row.message,
                    author: row.username,
                    user_id: row.user_id,
                    sent_at: row.sent_at,
                    comments: [],
                });
            }

            if (row.comment_id) {
                messagesMap.get(row.message_id).comments.push({
                    id: row.comment_id,
                    content: row.content,
                    author: row.commenter,
                    user_id: row.comment_user_id, // 👈 teraz dostępne
                    created_at: row.created_at,
                });
            }
        });

        res.json(Array.from(messagesMap.values()));
    } catch (err) {
        console.error("Błąd pobierania postów:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// DELETE /api/messages/:id
app.delete("/api/messages/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM comments WHERE message_id = $1", [id]);
        await db.query("DELETE FROM messages WHERE id = $1", [id]);

        res.json({ message: "Post usunięty." });
    } catch (err) {
        console.error("Błąd usuwania posta:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// DELETE /api/comments/:id
app.delete("/api/comments/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM comments WHERE id = $1", [id]);
        res.json({ message: "Komentarz usunięty." });
    } catch (err) {
        console.error("Błąd usuwania komentarza:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// PATCH /api/messages/:id
app.patch("/api/messages/:id", async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: "Brak treści posta." });

    try {
        await db.query("UPDATE messages SET message = $1 WHERE id = $2", [message, id]);
        res.json({ message: "Post zaktualizowany." });
    } catch (err) {
        console.error("Błąd aktualizacji posta:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// PATCH /api/comments/:id
app.patch("/api/comments/:id", async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: "Brak treści komentarza." });

    try {
        await db.query("UPDATE comments SET content = $1 WHERE id = $2", [content, id]);
        res.json({ message: "Komentarz zaktualizowany." });
    } catch (err) {
        console.error("Błąd aktualizacji komentarza:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// GENERATOR TOKENÓW
const PASSWORD_RESET_TOKENS = new Map();

// Zgłoszenie prośby o reset hasła
app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email jest wymagany." });

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(200).json({ message: "Jeśli e-mail istnieje, link został wysłany." });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minut

        PASSWORD_RESET_TOKENS.set(token, { email, expiresAt });

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

        await transporter.sendMail({
            from: process.env.OVH_SMTP_USER,
            to: email,
            subject: "Reset hasła – emru.pl",
            text: `Kliknij w link, aby ustawić nowe hasło:\n\n${resetLink}\n\nLink ważny 30 minut.`,
        });

        res.json({ message: "Link resetujący został wysłany, jeśli e-mail istnieje." });
    } catch (err) {
        console.error("Błąd resetu hasła:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// Zmiana hasła po kliknięciu w link
app.post("/api/reset-password", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Brak tokena lub hasła." });
    }

    const record = PASSWORD_RESET_TOKENS.get(token);
    if (!record || Date.now() > record.expiresAt) {
        return res.status(400).json({ message: "Token wygasł lub jest nieprawidłowy." });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        await db.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, record.email]);
        PASSWORD_RESET_TOKENS.delete(token);
        res.json({ message: "Hasło zaktualizowane." });
    } catch (err) {
        console.error("Błąd aktualizacji hasła:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

app.get("/api/admin/users", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, username, email, role FROM users ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Błąd pobierania użytkowników:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

app.get("/api/admin/messages", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                m.id AS message_id,
                m.message,
                m.sent_at,
                m.user_id,
                u.username AS author,
                c.id AS comment_id,
                c.content,
                c.created_at,
                cu.username AS commenter
            FROM messages m
            JOIN users u ON m.user_id = u.id
            LEFT JOIN comments c ON c.message_id = m.id
            LEFT JOIN users cu ON c.user_id = cu.id
            ORDER BY m.sent_at DESC, c.created_at ASC
        `);

        const messagesMap = new Map();

        result.rows.forEach(row => {
            if (!messagesMap.has(row.message_id)) {
                messagesMap.set(row.message_id, {
                    id: row.message_id,
                    message: row.message,
                    author: row.author,
                    sent_at: row.sent_at,
                    comments: [],
                });
            }

            if (row.comment_id) {
                messagesMap.get(row.message_id).comments.push({
                    id: row.comment_id,
                    content: row.content,
                    author: row.commenter,
                    created_at: row.created_at,
                });
            }
        });

        res.json(Array.from(messagesMap.values()));
    } catch (err) {
        console.error("Błąd pobierania postów:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// DELETE /api/admin/users/:id
app.delete("/api/admin/users/:id", verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Usuń komentarze, posty i dopiero użytkownika
        await db.query("DELETE FROM comments WHERE user_id = $1", [id]);
        await db.query("DELETE FROM messages WHERE user_id = $1", [id]);
        await db.query("DELETE FROM users WHERE id = $1", [id]);

        res.json({ message: "Użytkownik usunięty." });
    } catch (err) {
        console.error("Błąd usuwania użytkownika:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// PATCH /api/admin/users/:id
app.patch("/api/admin/users/:id", verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Nieprawidłowa rola." });
    }

    try {
        await db.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
        res.json({ message: "Rola zaktualizowana." });
    } catch (err) {
        console.error("Błąd zmiany roli:", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// DELETE /api/admin/messages/:id
app.delete("/api/admin/messages/:id", verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM comments WHERE message_id = $1", [id]);
        await db.query("DELETE FROM messages WHERE id = $1", [id]);

        res.json({ message: "Post usunięty." });
    } catch (err) {
        console.error("Błąd usuwania posta (admin):", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// DELETE /api/admin/comments/:id
app.delete("/api/admin/comments/:id", verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM comments WHERE id = $1", [id]);
        res.json({ message: "Komentarz usunięty." });
    } catch (err) {
        console.error("Błąd usuwania komentarza (admin):", err.message);
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// Teamspeak Backend

const tsConfig = {
    host: process.env.TS3_HOST,
    queryport: parseInt(process.env.TS3_QUERY_PORT || "10011"),
    serverport: parseInt(process.env.TS3_SERVER_PORT || "9987"),
    username: process.env.TS3_QUERY_USER,
    password: process.env.TS3_QUERY_PASS,
    nickname: process.env.TS3_QUERY_NICK || "API_Bot",
};

// Bufor danych TS
let tsCache = { status: "initializing", message: "Pobieranie danych..." };

function formatUptime(seconds) {
    if (!seconds || isNaN(seconds)) return "n/d";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// Funkcja aktualizacji danych TS
async function updateTeamSpeakData() {
    let ts3 = null;
    try {
        ts3 = await TeamSpeak.connect(tsConfig);

        await ts3.useBySid(1);

        const [serverInfo, clients] = await Promise.all([
            ts3.serverInfo(),
            ts3.clientList()
        ]);

        // Rzutowanie wartości na liczby
        const clientsOnline = parseInt(serverInfo.virtualserverClientsonline) || 0;
        const maxClients = parseInt(serverInfo.virtualserverMaxclients) || 0;
        const queryClients = parseInt(serverInfo.virtualserverQueryclientsonline) || 0;
        const uptimeRaw = parseInt(serverInfo.virtualserverUptime) || 0;

        tsCache = {
            status: "online",
            serverName: serverInfo.virtualserverName,
            clientsOnline: clientsOnline - queryClients,
            maxClients,
            uptime: formatUptime(uptimeRaw),
            platform: serverInfo.virtualserverPlatform,
            version: serverInfo.virtualserverVersion,
            channels: serverInfo.virtualserverChannelsonline,
            created: new Date(serverInfo.virtualserverCreated * 1000).toLocaleDateString("pl-PL"),
            clientList: clients
                .filter(c => c.propcache.clientNickname !== "TS Bot")
                .map(c => {
                    const groups = c.propcache.clientServergroups || [];
                    return {
                        nickname: c.propcache.clientNickname,
                        country: c.propcache.clientCountry || "Unknown",
                        isAdmin: groups.includes("6"),  // Admin
                        isBot: groups.includes("15"),   // Bot
                        isNormal: groups.includes("7"), // Normalny
                        isGuest: groups.includes("8")   // Gość
                    };
                })
        };
    } catch (err) {
        console.error("❌ Błąd TS:", err.message);
        tsCache = { status: "offline", error: "Nie można połączyć się z serwerem TS3." };
    } finally {
        if (ts3) await ts3.quit();
    }
}

// Odświeżanie cache co 30s
setInterval(updateTeamSpeakData, 30000);
updateTeamSpeakData();

// Endpoint API TS
app.get("/api/teamspeak", (req, res) => {
    res.json(tsCache);
});

app.listen(3001, () => {
    console.log('Backend działa na http://localhost:3001');
});
