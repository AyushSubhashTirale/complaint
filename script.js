// --- Keep Existing Data Storage Logic ---
let complaints = JSON.parse(localStorage.getItem('gov_heavenly_feed')) || [];
let users = JSON.parse(localStorage.getItem('gov_heavenly_users')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('active_session')) || null;
let isLoginMode = true;

window.onload = () => { if (currentUser) startApp(); };

// --- Feature: Registration toggle (Kept Original) ---
function toggleAuth() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Welcome Back" : "Create Account";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Sign In" : "Register";
    
    // Feature: Registration is ONLY for citizens (Kept Original)
    document.getElementById('role-container').classList.add('hidden');
}

// --- Combined Auth Logic (Fixing the double-onsubmit error) ---
document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isLoginMode) {
        // Feature: Contact the server for the Government ID
        try {
            const response = await fetch('http://localhost:3000/api/login', { // Added /api/ to match your server
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (result.success) {
                currentUser = result.user;
            } else {
                // Fallback: Check local storage for regular users
                const found = users.find(u => u.email === email && u.password === password);
                if (!found) return alert("Invalid credentials.");
                currentUser = found;
            }
        } catch (err) {
            // Feature: If server is down, check local storage (Kept Original)
            const found = users.find(u => u.email === email && u.password === password);
            if (!found) return alert("Server error or invalid credentials.");
            currentUser = found;
        }
    } else {
        // Feature: Regular Registration (Always creates 'user' role)
        if (users.find(u => u.email === email)) return alert("Email already exists!");
        const newUser = { email, password, role: 'user' }; 
        users.push(newUser);
        localStorage.setItem('gov_heavenly_users', JSON.stringify(users));
        currentUser = newUser;
    }
    sessionStorage.setItem('active_session', JSON.stringify(currentUser));
    startApp();
};

// --- App Navigation & Display (Kept Original) ---
function startApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('user-display').innerText = currentUser.email;
    document.getElementById('role-badge').innerText = currentUser.role;
    if (currentUser.role === 'user') document.getElementById('post-box').classList.remove('hidden');
    renderFeed();
}

// --- Feature: Photo Upload & Complaint Submission (Kept Original)
function handlePostSubmit() {
    const text = document.getElementById('post-text').value;
    const file = document.getElementById('post-image').files[0];
    if (!text) return alert("Description is required.");

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => savePost(text, e.target.result);
        reader.readAsDataURL(file);
    } else {
        savePost(text, null);
    }
}

function savePost(text, img) {
    complaints.unshift({
        id: Date.now(),
        author: currentUser.email,
        text: text,
        photo: img,
        status: 'Pending',
        likedBy: [],
        resolution: null
    });
    sync();
    document.getElementById('post-text').value = '';
}

// --- Feature: Supported/Likes System (Kept Original)
function handleLike(id) {
    complaints = complaints.map(p => {
        if (p.id === id) {
            const idx = p.likedBy.indexOf(currentUser.email);
            idx === -1 ? p.likedBy.push(currentUser.email) : p.likedBy.splice(idx, 1);
        }
        return p;
    });
    sync();
}

// --- Feature: Government Resolution (Kept Original)
function resolveIssue(id) {
    const proof = prompt("Paste proof image URL:");
    complaints = complaints.map(p => {
        if (p.id === id) {
            p.status = 'Resolved';
            p.resolution = proof || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400";
        }
        return p;
    });
    sync();
}

// --- Feature: Dynamic Feed Rendering & Stats (Kept Original)
function renderFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '';

    complaints.forEach(p => {
        const liked = p.likedBy.includes(currentUser.email);
        const govBtn = (currentUser.role === 'gov' && p.status === 'Pending') ? 
            `<button class="btn-resolve" onclick="resolveIssue(${p.id})">Resolve</button>` : '';

        container.innerHTML += `
            <div class="card">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <strong>@${p.author.split('@')[0]}</strong>
                    <span class="status ${p.status}">${p.status}</span>
                </div>
                <p style="font-size:18px;">${p.text}</p>
                ${p.photo ? `<img src="${p.photo}" class="feed-img">` : ''}
                ${p.status === 'Resolved' ? `<div style="margin-top:20px; border-top:1px solid #ddd; padding-top:10px;">
                    <b style="color:green">Resolved Proof:</b><br><img src="${p.resolution}" class="feed-img">
                </div>` : ''}
                <div style="margin-top:20px; display:flex; justify-content:space-between;">
                    <button onclick="handleLike(${p.id})" class="${liked ? 'btn-liked' : 'btn-plain'}">
                        ${liked ? '❤️' : '👍'} Supported (${p.likedBy.length})
                    </button>
                    ${govBtn}
                </div>
            </div>`;
    });
    document.getElementById('stat-total').innerText = complaints.length;
    document.getElementById('stat-resolved').innerText = complaints.filter(p => p.status === 'Resolved').length;
}

function sync() {
    localStorage.setItem('gov_heavenly_feed', JSON.stringify(complaints));
    renderFeed();
}

function logout() { sessionStorage.removeItem('active_session'); location.reload(); }