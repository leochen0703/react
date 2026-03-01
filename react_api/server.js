const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database('./notes.db');
const SECRET_KEY = 'your_secret_key_2026';

// --- 1. 中間件配置 ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// --- 2. 資料庫初始化 ---
db.serialize(() => {
    // 建立使用者資料表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // 建立留言資料表
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        author TEXT,
        owner TEXT,
        image_url TEXT,
        color TEXT DEFAULT 'rgba(255, 255, 255, 0.8)',
        created_at DATETIME DEFAULT (DATETIME('now', '+8 hours'))
    )`, () => {
        db.get("SELECT COUNT(*) as count FROM notes", (err, row) => {
            if (err) return console.error(err.message);

            if (row.count === 0) {
                const initialContent = "✨ 歡迎大家使用此系統！在這裡分享你的 2026 靈感與生活吧。";
                const initialAuthor = "系統管理員";
                const initialOwner = "system_admin";
                const initialColor = "#ffeb3b";

                // 初始公告插入 (確保 5 個欄位對應 5 個參數)
                db.run(
                    "INSERT INTO notes (content, author, owner, color, image_url) VALUES (?, ?, ?, ?, ?)",
                    [initialContent, initialAuthor, initialOwner, initialColor, null],
                    (err) => {
                        if (err) console.error("初始公告建立失敗:", err.message);
                        else console.log("📢 初始系統公告已建立！");
                    }
                );
            }
        });
    });
    
});

// --- 3. 圖片上傳配置 ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- 4. 驗證 Token Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "請先登入" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "憑證無效" });
        req.user = user;
        next();
    });
};

// --- 5. API 路由 ---

// [註冊]
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function (err) {
            if (err) return res.status(400).json({ error: "帳號已存在" });
            res.json({ success: true, message: "註冊成功" });
        });
    } catch (e) {
        res.status(500).json({ error: "伺服器錯誤" });
    }
});

// [登入]
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "資料庫錯誤" });
        if (!user) return res.status(401).json({ error: "帳號不存在" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ error: "密碼錯誤" });
        }
    });
});

// [取得所有留言]
app.get('/api/notes', (req, res) => {
    db.all("SELECT * FROM notes ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// [新增留言]
app.post('/api/notes', authenticateToken, upload.single('image'), (req, res) => {
    const { content, isAnonymous, color } = req.body;
    const realUser = req.user.username; 
    const displayAuthor = isAnonymous === 'true' ? "匿名" : realUser;
    const imageUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;
    const finalColor = color || 'rgba(255, 255, 255, 0.8)';

    const sql = "INSERT INTO notes (content, author, image_url, owner, color) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [content, displayAuthor, imageUrl, realUser, finalColor], function (err) {
        if (err) {
            console.error("發文失敗:", err.message);
            return res.status(500).json({ error: "發文失敗" });
        }
        
        res.json({ 
            id: this.lastID, 
            content, 
            author: displayAuthor, 
            image_url: imageUrl,
            color: finalColor,
            created_at: new Date().toISOString()
        });
    });
});

// [刪除留言]
app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    const noteId = req.params.id;
    const currentUser = req.user.username;

    db.get("SELECT owner FROM notes WHERE id = ?", [noteId], (err, note) => {
        if (err) return res.status(500).json({ error: "查詢失敗" });
        if (!note) return res.status(404).json({ error: "找不到留言" });

        if (note.owner !== currentUser) {
            return res.status(403).json({ error: "這不是你的靈感，不能刪除喔！" });
        }

        db.run("DELETE FROM notes WHERE id = ?", noteId, (err) => {
            if (err) return res.status(500).json({ error: "刪除失敗" });
            res.json({ success: true });
        });
    });
});

// --- 6. 啟動 ---
app.listen(3000, () => console.log('✅ SQLite 後端跑在 http://localhost:3000'));