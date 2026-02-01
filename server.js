const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Built-in Node module to handle files
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit to handle photo uploads

const DATA_FILE = './data.json';

// Helper: Read from file
const getData = () => {
    if (!fs.existsSync(DATA_FILE)) return { complaints: [], users: [] };
    const content = fs.readFileSync(DATA_FILE);
    return JSON.parse(content);
};

// Helper: Save to file
const saveToDisk = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- AUTHENTICATION ---
const GOV_USER = { email: "admin@gov.in", password: "HeavenlyPassword2026", role: "gov" };

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const data = getData();
    
    // Check Gov Account
    if (email === GOV_USER.email && password === GOV_USER.password) {
        return res.json({ success: true, user: { email: GOV_USER.email, role: 'gov' } });
    }
    
    // Check Citizen Accounts in Database
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) return res.json({ success: true, user });
    
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.post('/api/register', (req, res) => {
    const data = getData();
    if (data.users.find(u => u.email === req.body.email)) {
        return res.status(400).json({ message: "User exists" });
    }
    data.users.push({ ...req.body, role: 'user' });
    saveToDisk(data);
    res.json({ success: true });
});

// --- COMPLAINTS ---
app.get('/api/complaints', (req, res) => {
    res.json(getData().complaints);
});

app.post('/api/complaints', (req, res) => {
    const data = getData();
    data.complaints.unshift(req.body);
    saveToDisk(data);
    res.json({ success: true });
});

app.listen(port, () => console.log(`Database Server running at http://localhost:${port}`));