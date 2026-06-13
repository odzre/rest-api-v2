const UserAuth = {
    TOKEN_KEY: 'user_token',
    NAME_KEY: 'user_name',
    EMAIL_KEY: 'user_email',
    getToken() { return localStorage.getItem(this.TOKEN_KEY); },
    getName() { return localStorage.getItem(this.NAME_KEY); },
    getEmail() { return localStorage.getItem(this.EMAIL_KEY); },
    setSession(token, name, email) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.NAME_KEY, name);
        localStorage.setItem(this.EMAIL_KEY, email);
    },
    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.NAME_KEY);
        localStorage.removeItem(this.EMAIL_KEY);
    },
    isLoggedIn() { return !!this.getToken(); },
    requireAuth() {
        if (!this.isLoggedIn()) { window.location.href = '/user/login'; return false; }
        return true;
    },
    async register(name, email, whatsapp, password, confirm_password) {
        const res = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, whatsapp, password, confirm_password })
        });
        return await res.json();
    },
    async login(email, password) {
        const res = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) this.setSession(data.data.token, data.data.name, data.data.email);
        return data;
    },
    async logout() {
        try { await fetch('/api/user/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${this.getToken()}` } }); } catch(e) {}
        this.clearSession();
        window.location.href = '/user/login';
    },
    async apiFetch(url, options = {}) {
        const token = this.getToken();
        if (!token) { window.location.href = '/user/login'; return null; }
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers };
        try {
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (res.status === 401) { this.clearSession(); window.location.href = '/user/login'; return null; }
            return data;
        } catch (err) { return { success: false, message: 'Koneksi ke server gagal.' }; }
    }
};
