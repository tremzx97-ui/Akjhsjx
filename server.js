const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const USERS_FILE = "./users.json";
const LOGS_FILE = "./logs.json";

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(data) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function logAction(action) {
    const logs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    logs.push({ action, time: new Date().toISOString() });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

// ✅ Login de usuário
app.post("/login", (req, res) => {
    const { username, key, hwid } = req.body;
    const data = readUsers();

    const user = data.users.find(u => u.username === username && u.key === key);

    if (!user) return res.json({ success: false, message: "Usuário ou key inválidos" });
    if (user.banned) return res.json({ success: false, message: "Usuário banido" });

    const now = new Date();
    if (new Date(user.expiry) < now) return res.json({ success: false, message: "Licença expirada" });

    if (user.hwid && user.hwid !== hwid) return res.json({ success: false, message: "HWID não autorizado" });
    user.hwid = hwid;

    writeUsers(data);
    logAction(`Login: ${username}`);
    res.json({ success: true, message: "Login bem-sucedido" });
});

// ✅ Admin login
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    const data = readUsers();

    const admin = data.admins.find(a => a.username === username && a.password === password);
    if (!admin) return res.json({ success: false, message: "Admin inválido" });

    res.json({ success: true, message: "Login de admin bem-sucedido" });
});

// ✅ Gerar nova key
app.post("/admin/generate-key", (req, res) => {
    const { username, expiryDays, newKey } = req.body;
    const data = readUsers();

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(expiryDays));

    data.users.push({
        username,
        key: newKey,
        expiry: expiry.toISOString(),
        hwid: "",
        banned: false
    });

    writeUsers(data);
    logAction(`Gerar Key: ${username} - ${newKey}`);
    res.json({ success: true, message: "Key gerada com sucesso" });
});

// ✅ Ban / Reset HWID
app.post("/admin/update-user", (req, res) => {
    const { username, action } = req.body;
    const data = readUsers();

    const user = data.users.find(u => u.username === username);
    if (!user) return res.json({ success: false, message: "Usuário não encontrado" });

    if (action === "ban") user.banned = true;
    if (action === "unban") user.banned = false;
    if (action === "resetHWID") user.hwid = "";

    writeUsers(data);
    logAction(`Admin ação: ${action} em ${username}`);
    res.json({ success: true, message: `Ação ${action} realizada` });
});

// ✅ Listar usuários
app.get("/admin/users", (req, res) => {
    const data = readUsers();
    res.json({ users: data.users });
});

// ✅ Listar logs
app.get("/admin/logs", (req, res) => {
    const logs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    res.json({ logs });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));