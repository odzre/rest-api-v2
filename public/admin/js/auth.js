const Auth = {
    TOKEN_KEY: 'admin_token',
    USERNAME_KEY: 'admin_username',
    getToken() { return localStorage.getItem(this.TOKEN_KEY); },
    getUsername() { return localStorage.getItem(this.USERNAME_KEY); },
    setSession(token, username) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USERNAME_KEY, username);
    },
    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USERNAME_KEY);
    },
    isLoggedIn() { return !!this.getToken(); },
    requireAuth() {
        if (!this.isLoggedIn()) { window.location.href = '/admin/login.html'; return false; }
        return true;
    },
    async login(username, password) {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) this.setSession(data.data.token, data.data.username);
        return data;
    },
    async logout() {
        try { await fetch('/api/admin/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${this.getToken()}` } }); } catch(e) {}
        this.clearSession();
        window.location.href = '/admin/login.html';
    },
    async apiFetch(url, options = {}) {
        const token = this.getToken();
        if (!token) { window.location.href = '/admin/login.html'; return null; }
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers };
        try {
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (res.status === 401) { this.clearSession(); window.location.href = '/admin/login.html'; return null; }
            return data;
        } catch (err) { return { success: false, message: 'Koneksi ke server gagal.' }; }
    }
};

function initLoginPage() {
    if (Auth.isLoggedIn()) { window.location.href = '/admin/index.html'; return; }
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        btn.disabled = true; btn.textContent = 'Memproses...';
        const result = await Auth.login(document.getElementById('username').value, document.getElementById('password').value);
        if (result.success) { window.location.href = '/admin/index.html'; }
        else { errorEl.textContent = result.message; errorEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Masuk'; }
    });
}
