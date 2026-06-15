// SVG ICONS
const IC = {
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};

const App = {
    currentPage: 'dashboard',
    _apiKey: null,

    init() {
        if (!Auth.requireAuth()) return;
        this.setupNav();
        this.setupAdminInfo();
        this.navigate(location.hash.slice(1) || 'dashboard');
    },

    setupNav() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => { e.preventDefault(); this.navigate(item.dataset.page); });
        });
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
    },

    setupAdminInfo() {
        const u = Auth.getUsername() || 'Admin';
        const el = document.getElementById('adminName');
        const av = document.getElementById('adminAvatar');
        if (el) el.textContent = u;
        if (av) av.textContent = u.charAt(0).toUpperCase();
    },

    navigate(page) {
        this.currentPage = page;
        location.hash = page;
        document.querySelectorAll('.nav-item[data-page]').forEach(i => i.classList.toggle('active', i.dataset.page === page));
        const titles = { dashboard: ['Dashboard','Overview sistem API kamu'], apikeys: ['API Keys','Kelola kunci akses API'], logs: ['Request Logs','Riwayat request API terbaru'], notification: ['Notifikasi','Konfigurasi notifikasi Telegram / WhatsApp'], langganan: ['Langganan','Kelola paket langganan'], users: ['Users','Kelola user terdaftar'], websettings: ['Web Settings','Pengaturan website & branding'] };
        const [t, s] = titles[page] || titles.dashboard;
        document.getElementById('pageTitle').textContent = t;
        document.getElementById('pageSubtitle').textContent = s;
        document.getElementById('headerActions').innerHTML = '';
        document.getElementById('mainBody').innerHTML = '<div class="page-content" id="pageContent"></div>';
        const r = { dashboard: () => this.renderDashboard(), apikeys: () => this.renderApiKeys(), logs: () => this.renderLogs(), notification: () => this.renderNotification(), langganan: () => this.renderLangganan(), users: () => this.renderUsersPage(), websettings: () => this.renderWebSettings() };
        (r[page] || r.dashboard)();
    },

    // DASHBOARD
    async renderDashboard() {
        const el = document.getElementById('pageContent');
        el.innerHTML = `<div class="stats-grid">${'<div class="stat-card"><div class="skeleton" style="height:80px"></div></div>'.repeat(4)}</div>`;
        const res = await Auth.apiFetch('/api/admin/stats');
        if (!res?.success) return;
        const s = res.data;
        el.innerHTML = `
        <div class="stats-grid page-content">
            <div class="stat-card"><div class="stat-icon">${IC.users}</div><div class="stat-label">Total Users</div><div class="stat-value">${s.totalUsers}</div><div class="stat-sub">Pengguna terdaftar</div></div>
            <div class="stat-card"><div class="stat-icon">${IC.key}</div><div class="stat-label">API Keys</div><div class="stat-value">${s.activeApiKeys}<span style="font-size:14px;color:var(--text-muted)">/${s.totalApiKeys}</span></div><div class="stat-sub">Aktif / total</div></div>
            <div class="stat-card"><div class="stat-icon">${IC.chart}</div><div class="stat-label">Total Requests</div><div class="stat-value">${s.totalRequests}</div><div class="stat-sub">Request tercatat</div></div>
            <div class="stat-card"><div class="stat-icon">${IC.clock}</div><div class="stat-label">Uptime</div><div class="stat-value" style="font-size:22px">${this.fmtUp(s.serverUptime)}</div><div class="stat-sub">Server aktif</div></div>
        </div>
        <div class="table-container">
            <div class="table-header"><span class="table-title">${IC.log} Request Terbaru</span><button class="btn btn-secondary btn-sm" onclick="App.navigate('logs')">${IC.arrow} Lihat Semua</button></div>
            <div class="table-scroll-wrapper" id="dashLogs"><div class="skeleton" style="height:160px;margin:16px"></div></div>
        </div>`;
        const lr = await Auth.apiFetch('/api/admin/logs?limit=5');
        const dl = document.getElementById('dashLogs');
        if (lr?.success && lr.data.length > 0) {
            dl.innerHTML = `<table><thead><tr><th>Waktu</th><th>Method</th><th>Path</th><th>Key</th></tr></thead><tbody>${lr.data.map(l => `<tr><td style="font-size:12px;color:var(--text-muted)">${this.fmtT(l.timestamp)}</td><td><span class="method method-${(l.method||'get').toLowerCase()}">${l.method}</span></td><td class="mono">${l.path}</td><td><span class="badge badge-purple">${l.apiKeyLabel||'-'}</span></td></tr>`).join('')}</tbody></table>`;
        } else {
            dl.innerHTML = `<div class="empty-state">${IC.inbox}<p>Belum ada request log.</p></div>`;
        }
    },

    // API KEYS
    async renderApiKeys() {
        const el = document.getElementById('pageContent');
        document.getElementById('headerActions').innerHTML = `<button class="btn btn-primary" onclick="App.showCreateKeyModal()">${IC.plus} Buat Key Baru</button>`;
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:200px;margin:16px"></div></div>';
        const res = await Auth.apiFetch('/api/admin/keys');
        if (!res?.success) return;
        if (res.data.length === 0) {
            el.innerHTML = `<div class="table-container"><div class="empty-state">${IC.key}<p>Belum ada API key. Buat key pertamamu!</p></div></div>`;
            return;
        }
        this._keysData = res.data;
        this._renderApiKeysTable(res.data);
    },
    _renderApiKeysTable(data, query) {
        const el = document.getElementById('pageContent');
        const filtered = query ? data.filter(k => k.label.toLowerCase().includes(query) || k.key.toLowerCase().includes(query)) : data;
        el.innerHTML = `<div class="search-bar"><input class="form-input" id="searchKeys" placeholder="Cari label atau key..." value="${query||''}" oninput="App._renderApiKeysTable(App._keysData,this.value.toLowerCase())"></div>
        <div class="table-container page-content"><div class="table-scroll-wrapper"><table><thead><tr><th>Label</th><th>Key</th><th>Status</th><th>Expired</th><th>Rate Limit</th><th>Penggunaan</th><th>Aksi</th></tr></thead><tbody>${filtered.length===0?'<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">Tidak ada hasil ditemukan</td></tr>':filtered.map(k => {
            const expText = k.expiredDays > 0 ? (k.isExpired ? `<span class="badge badge-red">Expired</span>` : `${k.expiredDays} hari`) : '<span class="badge badge-green">Unlimited</span>';
            const rlText = k.rateLimit > 0 ? `${k.rateLimit}/hari` : '<span class="badge badge-green">Unlimited</span>';
            return `<tr>
                <td style="font-weight:600">${k.label}</td>
                <td><span class="key-text" title="${k.key}">${k.key}</span></td>
                <td><span class="badge ${k.active && !k.isExpired ? 'badge-green' : 'badge-red'}">${k.active && !k.isExpired ? 'Aktif' : k.isExpired ? 'Expired' : 'Nonaktif'}</span></td>
                <td style="font-size:12px">${expText}</td>
                <td style="font-size:12px">${rlText}</td>
                <td>${k.usageCount}x</td>
                <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm" onclick="App.copyKey('${k.key}')" title="Copy">${IC.copy}</button>
                    <button class="btn btn-secondary btn-sm" onclick="App.showEditKeyModal('${k.id}')" title="Edit">${IC.edit}</button>
                    <button class="btn btn-secondary btn-sm" onclick="App.toggleKey('${k.id}')" title="${k.active?'Nonaktifkan':'Aktifkan'}">${k.active ? IC.pause : IC.play}</button>
                    <button class="btn btn-danger btn-sm" onclick="App.deleteKey('${k.id}','${k.label}')" title="Hapus">${IC.trash}</button>
                </td></tr>`;
        }).join('')}</tbody></table></div></div>`;
        if(query!==undefined){const inp=document.getElementById('searchKeys');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}}
    },

    showCreateKeyModal() {
        this.showModal('Buat API Key Baru', `
            <div class="form-group"><label class="form-label">Nama API Key</label><input class="form-input" id="keyLabel" placeholder="Contoh: Production Key" autofocus></div>
            <div class="form-group"><label class="form-label">Custom Key <span style="color:var(--text-muted);font-weight:400;text-transform:none">(opsional)</span></label><input class="form-input" id="keyCustom" placeholder="Kosongkan untuk auto-generate (sk-xxx...)" style="font-family:var(--font-mono);font-size:12px"><div class="form-hint">Minimal 8 karakter. Kosongkan untuk generate otomatis.</div></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Expired (Hari)</label><input class="form-input" id="keyExpired" type="number" min="0" value="0" placeholder="0"><div class="form-hint">0 = tidak pernah expired</div></div>
                <div class="form-group"><label class="form-label">Rate Limit / Hari</label><input class="form-input" id="keyRateLimit" type="number" min="0" value="1000" placeholder="1000"><div class="form-hint">0 = unlimited</div></div>
            </div>`, async () => {
            const label = document.getElementById('keyLabel').value.trim();
            const customKey = document.getElementById('keyCustom').value.trim();
            const expiredDays = parseInt(document.getElementById('keyExpired').value) || 0;
            const rateLimit = parseInt(document.getElementById('keyRateLimit').value) || 0;
            if (!label) return Toast.error('Nama API Key wajib diisi!');
            if (customKey && customKey.length < 8) return Toast.error('Custom key minimal 8 karakter!');
            const res = await Auth.apiFetch('/api/admin/keys', { method: 'POST', body: JSON.stringify({ label, customKey: customKey || undefined, expiredDays, rateLimit }) });
            if (res?.success) { Toast.success('API Key berhasil dibuat!'); this.closeModal(); this.renderApiKeys(); }
            else Toast.error(res?.message || 'Gagal');
        });
    },

    showEditKeyModal(id) {
        const k = this._keysData?.find(x => x.id === id);
        if (!k) return Toast.error('Data key tidak ditemukan.');
        this.showModal('Edit API Key', `
            <div class="form-group"><label class="form-label">Nama API Key</label><input class="form-input" id="keyLabel" value="${k.label}"></div>
            <div class="form-group"><label class="form-label">API Key Value</label><input class="form-input" id="keyCustom" value="${k.key}" style="font-family:var(--font-mono);font-size:12px"><div class="form-hint">Minimal 8 karakter. Hati-hati mengubah key yang sudah dipakai.</div></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Expired (Hari)</label><input class="form-input" id="keyExpired" type="number" min="0" value="${k.expiredDays || 0}"><div class="form-hint">0 = tidak pernah expired</div></div>
                <div class="form-group"><label class="form-label">Rate Limit / Hari</label><input class="form-input" id="keyRateLimit" type="number" min="0" value="${k.rateLimit || 0}"><div class="form-hint">0 = unlimited</div></div>
            </div>`, async () => {
            const label = document.getElementById('keyLabel').value.trim();
            const customKey = document.getElementById('keyCustom').value.trim();
            const expiredDays = parseInt(document.getElementById('keyExpired').value) || 0;
            const rateLimit = parseInt(document.getElementById('keyRateLimit').value) || 0;
            if (!label) return Toast.error('Nama wajib diisi!');
            if (customKey.length < 8) return Toast.error('Key minimal 8 karakter!');
            const res = await Auth.apiFetch(`/api/admin/keys/${id}`, { method: 'PUT', body: JSON.stringify({ label, customKey, expiredDays, rateLimit }) });
            if (res?.success) { Toast.success('API Key berhasil diupdate!'); this.closeModal(); this.renderApiKeys(); }
            else Toast.error(res?.message || 'Gagal update');
        });
    },

    async copyKey(key) { await navigator.clipboard.writeText(key); Toast.success('API Key disalin!'); },
    async toggleKey(id) { const r = await Auth.apiFetch(`/api/admin/keys/${id}/revoke`, { method: 'PATCH' }); if (r?.success) { Toast.success(r.message); this.renderApiKeys(); } },
    async deleteKey(id, label) { if (!confirm(`Hapus API Key "${label}"?`)) return; const r = await Auth.apiFetch(`/api/admin/keys/${id}`, { method: 'DELETE' }); if (r?.success) { Toast.success('Key dihapus!'); this.renderApiKeys(); } },

    // USERS
    async renderUsers() {
        const el = document.getElementById('pageContent');
        document.getElementById('headerActions').innerHTML = `<button class="btn btn-primary" onclick="App.showCreateUserModal()">${IC.plus} Tambah User</button>`;
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:200px;margin:16px"></div></div>';
        const keysRes = await Auth.apiFetch('/api/admin/keys');
        const activeKey = keysRes?.data?.find(k => k.active);
        if (!activeKey) { el.innerHTML = `<div class="table-container"><div class="empty-state">${IC.key}<p>Buat API Key aktif terlebih dahulu.</p></div></div>`; return; }
        this._apiKey = activeKey.key;
        const res = await fetch('/api/users', { headers: { 'x-api-key': activeKey.key } });
        const data = await res.json();
        if (!data.success || !data.data.length) { el.innerHTML = `<div class="table-container"><div class="empty-state">${IC.users}<p>Belum ada user terdaftar.</p></div></div>`; return; }
        el.innerHTML = `<div class="table-container page-content"><div class="table-scroll-wrapper"><table><thead><tr><th>ID</th><th>Nama</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>${data.data.map(u => `<tr>
            <td class="mono">#${u.id}</td><td style="font-weight:600">${u.name}</td>
            <td><span class="badge ${u.role==='Admin'?'badge-purple':'badge-blue'}">${u.role}</span></td>
            <td style="font-size:12px;color:var(--text-muted)">${this.fmtT(u.createdAt)}</td>
            <td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="App.showEditUserModal(${u.id},'${u.name.replace(/'/g,"\\'")}','${u.role}')">${IC.edit}</button> <button class="btn btn-danger btn-sm" onclick="App.deleteUser(${u.id},'${u.name.replace(/'/g,"\\'")}')">${IC.trash}</button></td>
        </tr>`).join('')}</tbody></table></div></div>`;
    },

    showCreateUserModal() {
        this.showModal('Tambah User Baru', `
            <div class="form-group"><label class="form-label">Nama</label><input class="form-input" id="userName" placeholder="Nama lengkap" autofocus></div>
            <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="userRole" placeholder="Admin / User / Editor"></div>`, async () => {
            const name = document.getElementById('userName').value.trim();
            const role = document.getElementById('userRole').value.trim();
            if (!name || !role) return Toast.error('Semua field wajib diisi!');
            const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': this._apiKey }, body: JSON.stringify({ name, role }) });
            const d = await res.json();
            if (d.success) { Toast.success('User ditambahkan!'); this.closeModal(); this.renderUsers(); } else Toast.error(d.message);
        });
    },

    showEditUserModal(id, name, role) {
        this.showModal('Edit User', `
            <div class="form-group"><label class="form-label">Nama</label><input class="form-input" id="userName" value="${name}"></div>
            <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="userRole" value="${role}"></div>`, async () => {
            const res = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-api-key': this._apiKey }, body: JSON.stringify({ name: document.getElementById('userName').value.trim(), role: document.getElementById('userRole').value.trim() }) });
            const d = await res.json();
            if (d.success) { Toast.success('User diupdate!'); this.closeModal(); this.renderUsers(); } else Toast.error(d.message);
        });
    },

    async deleteUser(id, name) {
        if (!confirm(`Hapus user "${name}"?`)) return;
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'x-api-key': this._apiKey } });
        const d = await res.json();
        if (d.success) { Toast.success('User dihapus!'); this.renderUsers(); }
    },

    // LOGS
    async renderLogs() {
        const el = document.getElementById('pageContent');
        document.getElementById('headerActions').innerHTML = `<button class="btn btn-secondary" onclick="App.renderLogs()">${IC.refresh} Refresh</button>`;
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:300px;margin:16px"></div></div>';
        const res = await Auth.apiFetch('/api/admin/logs?limit=100');
        if (!res?.success || !res.data.length) { el.innerHTML = `<div class="table-container"><div class="empty-state">${IC.inbox}<p>Belum ada request log.</p></div></div>`; return; }
        el.innerHTML = `<div class="table-container page-content"><div class="table-header"><span class="table-title">${IC.log} ${res.data.length} log terbaru</span></div>
            <div class="table-scroll-wrapper"><table><thead><tr><th>Waktu</th><th>Method</th><th>Path</th><th>API Key</th><th>IP</th></tr></thead><tbody>${res.data.map(l => `<tr>
            <td style="font-size:12px;color:var(--text-muted)">${this.fmtT(l.timestamp)}</td>
            <td><span class="method method-${(l.method||'get').toLowerCase()}">${l.method}</span></td>
            <td class="mono">${l.path}</td>
            <td><span class="badge badge-purple">${l.apiKeyLabel||'-'}</span></td>
            <td style="font-size:12px;color:var(--text-muted)">${l.ip||'-'}</td>
        </tr>`).join('')}</tbody></table></div></div>`;
    },

    // MODAL
    showModal(title, content, onConfirm) {
        const ov = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        this._modalConfirm = onConfirm;
        ov.classList.add('active');
        setTimeout(() => ov.querySelector('input')?.focus(), 100);
    },
    closeModal() { document.getElementById('modalOverlay').classList.remove('active'); },
    confirmModal() { if (this._modalConfirm) this._modalConfirm(); },

    // UTILS
    fmtT(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    },
    fmtUp(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        if (h > 0) return `${h}j ${m}m`;
        if (m > 0) return `${m}m ${sec}d`;
        return `${sec}d`;
    },

    // NOTIFICATION SETTINGS
    async renderNotification() {
        const el = document.getElementById('pageContent');
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:300px;margin:16px"></div></div>';

        const res = await Auth.apiFetch('/api/admin/notification-settings');
        const settings = res?.data || { enabled: false, telegram: { enabled: false, botToken: '', chatId: '' } };

        el.innerHTML = `
        <div class="page-content">
            <div class="table-container" style="margin-bottom:20px">
                <div class="table-header">
                    <span class="table-title">${IC.bell} Pengaturan Notifikasi</span>
                </div>
                <div style="padding:20px">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:16px">
                        <div>
                            <div style="font-weight:600;margin-bottom:4px">Aktifkan Notifikasi</div>
                            <div style="font-size:13px;color:var(--text-muted)">Kirim notifikasi setiap ada request API masuk</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="notifEnabled" ${settings.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="table-container" style="margin-bottom:20px">
                <div class="table-header">
                    <span class="table-title">${IC.send} Telegram Bot</span>
                    <span class="badge ${settings.telegram?.enabled ? 'badge-green' : 'badge-red'}" style="margin-left:8px">${settings.telegram?.enabled ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div style="padding:20px">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:20px">
                        <div>
                            <div style="font-weight:600;margin-bottom:4px">Aktifkan Telegram</div>
                            <div style="font-size:13px;color:var(--text-muted)">Kirim log request ke bot Telegram</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="telegramEnabled" ${settings.telegram?.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="form-group" style="margin-bottom:16px">
                        <label class="form-label">Bot Token</label>
                        <input class="form-input" id="telegramBotToken" type="text" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" value="${settings.telegram?.botToken || ''}" style="font-family:var(--font-mono);font-size:12px">
                        <div class="form-hint">Dapatkan dari <a href="https://t.me/BotFather" target="_blank" style="color:var(--primary)">@BotFather</a> di Telegram</div>
                    </div>

                    <div class="form-group" style="margin-bottom:20px">
                        <label class="form-label">Chat ID</label>
                        <input class="form-input" id="telegramChatId" type="text" placeholder="-1001234567890 atau 123456789" value="${settings.telegram?.chatId || ''}" style="font-family:var(--font-mono);font-size:12px">
                        <div class="form-hint">Chat ID user/group. Gunakan <a href="https://t.me/userinfobot" target="_blank" style="color:var(--primary)">@userinfobot</a> untuk mengetahui ID</div>
                    </div>

                    <div style="display:flex;gap:10px">
                        <button class="btn btn-secondary" onclick="App.testTelegram()" id="testTelegramBtn">${IC.send} Test Kirim</button>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button class="btn btn-primary" onclick="App.saveNotificationSettings()" id="saveNotifBtn">${IC.check} Simpan Pengaturan</button>
            </div>
        </div>`;
    },

    async saveNotificationSettings() {
        const btn = document.getElementById('saveNotifBtn');
        btn.disabled = true;
        btn.innerHTML = '⏳ Menyimpan...';

        try {
            const payload = {
                enabled: document.getElementById('notifEnabled').checked,
                telegram: {
                    enabled: document.getElementById('telegramEnabled').checked,
                    botToken: document.getElementById('telegramBotToken').value.trim(),
                    chatId: document.getElementById('telegramChatId').value.trim(),
                },
            };

            const res = await Auth.apiFetch('/api/admin/notification-settings', {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            if (res?.success) {
                Toast.success('Pengaturan notifikasi berhasil disimpan!');
            } else {
                Toast.error(res?.message || 'Gagal menyimpan pengaturan.');
            }
        } catch (err) {
            Toast.error('Gagal menyimpan: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${IC.check} Simpan Pengaturan`;
        }
    },

    async testTelegram() {
        const btn = document.getElementById('testTelegramBtn');
        const botToken = document.getElementById('telegramBotToken').value.trim();
        const chatId = document.getElementById('telegramChatId').value.trim();

        if (!botToken || !chatId) {
            return Toast.error('Bot Token dan Chat ID wajib diisi untuk test!');
        }

        btn.disabled = true;
        btn.innerHTML = '⏳ Mengirim...';

        try {
            const res = await Auth.apiFetch('/api/admin/notification-test', {
                method: 'POST',
                body: JSON.stringify({ botToken, chatId }),
            });

            if (res?.success) {
                Toast.success('Test notifikasi berhasil! Cek Telegram kamu.');
            } else {
                Toast.error(res?.message || 'Gagal mengirim test notifikasi.');
            }
        } catch (err) {
            Toast.error('Gagal: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${IC.send} Test Kirim`;
        }
    },    // LANGGANAN MANAGEMENT
    async renderLangganan() {
        const el = document.getElementById('pageContent');
        document.getElementById('headerActions').innerHTML = `<button class="btn btn-primary" onclick="App.showCreatePlanModal()">${IC.plus} Buat Paket</button>`;
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:200px;margin:16px"></div></div>';
        const res = await Auth.apiFetch('/api/admin/subscription-plans');
        if (!res?.success || !res.data.length) { el.innerHTML = '<div class="table-container"><div class="empty-state"><p>Belum ada paket langganan.</p></div></div>'; return; }
        this._plansData = res.data;
        this._renderLanggananTable(res.data);
    },
    _renderLanggananTable(data, query) {
        const el = document.getElementById('pageContent');
        const filtered = query ? data.filter(p => p.name.toLowerCase().includes(query)) : data;
        el.innerHTML = `<div class="search-bar"><input class="form-input" id="searchPlans" placeholder="Cari nama paket..." value="${query||''}" oninput="App._renderLanggananTable(App._plansData,this.value.toLowerCase())"></div>
        <div class="table-container page-content"><div class="table-scroll-wrapper"><table><thead><tr><th>Urutan</th><th>Nama</th><th>Harga</th><th>Durasi</th><th>Rate Limit</th><th>Fitur Akses</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${filtered.length===0?'<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">Tidak ada hasil ditemukan</td></tr>':filtered.map(p => `<tr>
            <td style="text-align:center;color:var(--text-muted);font-family:var(--font-mono);font-size:13px">${p.sort_order||0}</td>
            <td style="font-weight:600">${p.name}</td>
            <td>Rp ${p.price.toLocaleString('id-ID')}</td>
            <td>${p.duration_days} hari</td>
            <td>${(p.rate_limit||0) > 0 ? `${p.rate_limit}/hari` : '<span class="badge badge-green">Unlimited</span>'}</td>
            <td style="font-size:12px;line-height:1.8">${p.allow_gopay!==undefined?[p.allow_gopay?'<span class="badge badge-green">GoPay</span>':'',p.allow_orderkouta?'<span class="badge badge-green">OrderKuota</span>':'',p.allow_digiflazz?'<span class="badge badge-green">Digiflazz</span>':'',p.allow_wa_gateway?'<span class="badge badge-green">WA Gateway</span>':''].filter(Boolean).join(' ')||'<span class="badge badge-red">Tidak ada</span>':'<span class="badge badge-green">Semua</span>'}</td>
            <td><span class="badge ${p.active?'badge-green':'badge-red'}">${p.active?'Aktif':'Nonaktif'}</span></td>
            <td><button class="btn btn-secondary btn-sm" onclick="App.showEditPlanModal(${p.id})">${IC.edit}</button> <button class="btn btn-danger btn-sm" onclick="App.deletePlan(${p.id},'${p.name.replace(/'/g,"\\\'")}')">${IC.trash}</button></td>
        </tr>`).join('')}</tbody></table></div></div>`;
        if(query!==undefined){const inp=document.getElementById('searchPlans');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}}
    },
    showCreatePlanModal() {
        this.showModal('Buat Paket Langganan', `
            <div class="form-group"><label class="form-label">Nama Paket</label><input class="form-input" id="planName" placeholder="Contoh: Starter" autofocus></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Harga (Rp)</label><input class="form-input" id="planPrice" type="number" placeholder="50000"></div>
            <div class="form-group"><label class="form-label">Durasi (Hari)</label><input class="form-input" id="planDays" type="number" placeholder="30"></div></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Rate Limit / Hari</label><input class="form-input" id="planRateLimit" type="number" min="0" value="0" placeholder="0"><div class="form-hint">0 = unlimited</div></div>
            <div class="form-group"><label class="form-label">Urutan Tampil</label><input class="form-input" id="planSortOrder" type="number" min="0" value="0" placeholder="0"><div class="form-hint">Angka kecil tampil duluan</div></div></div>
            <div class="form-group"><label class="form-label">Fitur Akses</label><div class="feature-checks"><label class="checkbox-label"><input type="checkbox" id="planGopay" checked> GoPay Merchant</label><label class="checkbox-label"><input type="checkbox" id="planOrderkouta" checked> OrderKuota</label><label class="checkbox-label"><input type="checkbox" id="planDigiflazz" checked> Digiflazz Tools</label><label class="checkbox-label"><input type="checkbox" id="planWaGateway" checked> WA Gateway</label></div></div>
            <div class="form-group"><label class="form-label">Deskripsi</label><input class="form-input" id="planDesc" placeholder="Deskripsi paket"></div>
            <div class="form-group"><label class="form-label">Benefits (pisah koma)</label><input class="form-input" id="planBenefits" placeholder="1000 req/hari, Auto-polling, Webhook"></div>`, async () => {
            const name=document.getElementById('planName').value.trim();const price=document.getElementById('planPrice').value;const duration_days=document.getElementById('planDays').value;
            if (!name||!price||!duration_days) return Toast.error('Semua field wajib diisi!');
            const rate_limit=parseInt(document.getElementById('planRateLimit').value)||0;
            const sort_order=parseInt(document.getElementById('planSortOrder').value)||0;
            const benefits=document.getElementById('planBenefits').value.split(',').map(b=>b.trim()).filter(Boolean);
            const allow_gopay=document.getElementById('planGopay').checked;
            const allow_orderkouta=document.getElementById('planOrderkouta').checked;
            const allow_digiflazz=document.getElementById('planDigiflazz').checked;
            const allow_wa_gateway=document.getElementById('planWaGateway').checked;
            const r=await Auth.apiFetch('/api/admin/subscription-plans',{method:'POST',body:JSON.stringify({name,price,duration_days,description:document.getElementById('planDesc').value.trim(),benefits,rate_limit,sort_order,allow_gopay,allow_orderkouta,allow_digiflazz,allow_wa_gateway})});
            if(r?.success){Toast.success('Paket berhasil dibuat!');this.closeModal();this.renderLangganan();}else Toast.error(r?.message||'Gagal');
        });
    },
    showEditPlanModal(id) {
        const p=this._plansData?.find(x=>x.id===id);if(!p)return;
        this.showModal('Edit Paket', `
            <div class="form-group"><label class="form-label">Nama</label><input class="form-input" id="planName" value="${p.name}"></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Harga</label><input class="form-input" id="planPrice" type="number" value="${p.price}"></div>
            <div class="form-group"><label class="form-label">Durasi (Hari)</label><input class="form-input" id="planDays" type="number" value="${p.duration_days}"></div></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Rate Limit / Hari</label><input class="form-input" id="planRateLimit" type="number" min="0" value="${p.rate_limit||0}"><div class="form-hint">0 = unlimited</div></div>
            <div class="form-group"><label class="form-label">Urutan Tampil</label><input class="form-input" id="planSortOrder" type="number" min="0" value="${p.sort_order||0}"><div class="form-hint">Angka kecil tampil duluan</div></div></div>
            <div class="form-group"><label class="form-label">Fitur Akses</label><div class="feature-checks"><label class="checkbox-label"><input type="checkbox" id="planGopay" ${p.allow_gopay!==0?'checked':''}> GoPay Merchant</label><label class="checkbox-label"><input type="checkbox" id="planOrderkouta" ${p.allow_orderkouta!==0?'checked':''}> OrderKuota</label><label class="checkbox-label"><input type="checkbox" id="planDigiflazz" ${p.allow_digiflazz!==0?'checked':''}> Digiflazz Tools</label><label class="checkbox-label"><input type="checkbox" id="planWaGateway" ${p.allow_wa_gateway!==0?'checked':''}> WA Gateway</label></div></div>
            <div class="form-group"><label class="form-label">Deskripsi</label><input class="form-input" id="planDesc" value="${p.description||''}"></div>
            <div class="form-group"><label class="form-label">Benefits</label><input class="form-input" id="planBenefits" value="${(p.benefits||[]).join(', ')}"></div>`, async () => {
            const rate_limit=parseInt(document.getElementById('planRateLimit').value)||0;
            const sort_order=parseInt(document.getElementById('planSortOrder').value)||0;
            const allow_gopay=document.getElementById('planGopay').checked;
            const allow_orderkouta=document.getElementById('planOrderkouta').checked;
            const allow_digiflazz=document.getElementById('planDigiflazz').checked;
            const allow_wa_gateway=document.getElementById('planWaGateway').checked;
            const r=await Auth.apiFetch(`/api/admin/subscription-plans/${id}`,{method:'PUT',body:JSON.stringify({name:document.getElementById('planName').value.trim(),price:document.getElementById('planPrice').value,duration_days:document.getElementById('planDays').value,description:document.getElementById('planDesc').value.trim(),benefits:document.getElementById('planBenefits').value.split(',').map(b=>b.trim()).filter(Boolean),rate_limit,sort_order,allow_gopay,allow_orderkouta,allow_digiflazz,allow_wa_gateway})});
            if(r?.success){Toast.success(r.message);this.closeModal();this.renderLangganan();}else Toast.error(r?.message||'Gagal');
        });
    },
    async deletePlan(id,name){if(!confirm(`Hapus paket "${name}"?`))return;const r=await Auth.apiFetch(`/api/admin/subscription-plans/${id}`,{method:'DELETE'});if(r?.success){Toast.success('Paket dihapus!');this.renderLangganan();}},

    // USERS MANAGEMENT
    async renderUsersPage() {
        const el = document.getElementById('pageContent');
        el.innerHTML = '<div class="table-container"><div class="skeleton" style="height:200px;margin:16px"></div></div>';
        const [usersRes, plansRes] = await Promise.all([Auth.apiFetch('/api/admin/users-list'), Auth.apiFetch('/api/admin/subscription-plans')]);
        if (!usersRes?.success || !usersRes.data.length) { el.innerHTML = '<div class="table-container"><div class="empty-state"><p>Belum ada user terdaftar.</p></div></div>'; return; }
        this._userPlans = plansRes?.data || [];
        this._usersData = usersRes.data;
        this._renderUsersTable(usersRes.data);
    },
    _renderUsersTable(data, query) {
        const el = document.getElementById('pageContent');
        const filtered = query ? data.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.apiKey.toLowerCase().includes(query)) : data;
        el.innerHTML = `<div class="search-bar"><input class="form-input" id="searchUsers" placeholder="Cari nama, email, atau API key..." value="${query||''}" oninput="App._renderUsersTable(App._usersData,this.value.toLowerCase())"></div>
        <div class="table-container page-content"><div class="table-scroll-wrapper"><table><thead><tr><th>Nama</th><th>Email</th><th>API Key</th><th>Status</th><th>Expired</th><th>Aksi</th></tr></thead><tbody>${filtered.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">Tidak ada hasil ditemukan</td></tr>':filtered.map(u => {
            const exp = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID') : '—';
            return `<tr>
            <td style="font-weight:600">${u.name}<br><span style="font-size:11px;color:var(--text-muted)">${u.whatsapp||''}</span></td>
            <td style="font-size:12px">${u.email}</td>
            <td><span class="key-text">${u.apiKey}</span></td>
            <td><span class="badge ${u.apiKeyActive?'badge-green':'badge-red'}">${u.apiKeyActive?'Aktif':'Nonaktif'}</span></td>
            <td style="font-size:12px">${exp}</td>
            <td style="white-space:nowrap">${u.apiKeyActive?`<button class="btn btn-danger btn-sm" onclick="App.deactivateUser(${u.id},'${u.name.replace(/'/g,"\\\'")}')">Nonaktifkan</button>`:`<button class="btn btn-primary btn-sm" onclick="App.showActivateModal(${u.id},'${u.name.replace(/'/g,"\\\'")}')">Aktifkan</button>`}</td>
        </tr>`}).join('')}</tbody></table></div></div>`;
        if(query!==undefined){const inp=document.getElementById('searchUsers');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}}
    },
    showActivateModal(userId, userName) {
        const opts = (this._userPlans||[]).map(p => `<option value="${p.id}">${p.name} — Rp ${p.price.toLocaleString('id-ID')} (${p.duration_days} hari${(p.rate_limit||0)>0?', '+p.rate_limit+' req/hari':', unlimited'})</option>`).join('');
        this.showModal(`Aktifkan ${userName}`, `<div class="form-group"><label class="form-label">Pilih Paket</label><select class="form-input" id="activatePlan">${opts}</select></div>`, async () => {
            const planId = document.getElementById('activatePlan').value;
            const r = await Auth.apiFetch('/api/admin/activate-subscription', { method: 'POST', body: JSON.stringify({ userId, planId }) });
            if (r?.success) { Toast.success(r.message); this.closeModal(); this.renderUsersPage(); } else Toast.error(r?.message || 'Gagal');
        });
    },
    async deactivateUser(id, name) {
        if (!confirm(`Nonaktifkan user "${name}"?`)) return;
        const r = await Auth.apiFetch('/api/admin/deactivate-user', { method: 'POST', body: JSON.stringify({ userId: id }) });
        if (r?.success) { Toast.success(r.message); this.renderUsersPage(); }
    },

    // WEB SETTINGS
    async renderWebSettings() {
        const el = document.getElementById('pageContent');
        el.innerHTML = '<div class="skeleton" style="height:300px"></div>';
        const res = await Auth.apiFetch('/api/admin/site-config');
        const c = res?.data || { title: '', siteName: '', author: '', favicon: '', whatsapp: '' };
        el.innerHTML = `<div class="page-content">
            <div class="settings-section">
                <div class="settings-title">${IC.edit} General Settings</div>
                <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Pengaturan ini disimpan di file lokal server — tanpa database, load instan.</p>
                <div class="form-group"><label class="form-label">Title Website</label><input class="form-input" id="cfgTitle" value="${c.title}" placeholder="Judul yang tampil di tab browser"></div>
                <div class="form-group"><label class="form-label">Nama Website</label><input class="form-input" id="cfgSiteName" value="${c.siteName}" placeholder="Nama brand / logo text"></div>
                <div class="form-group"><label class="form-label">Author / Credit</label><input class="form-input" id="cfgAuthor" value="${c.author}" placeholder="Nama author untuk footer credit"></div>
                <div class="form-group"><label class="form-label">Favicon URL</label><input class="form-input" id="cfgFavicon" value="${c.favicon}" placeholder="URL atau path (contoh: /image/favicon.png)"><div class="form-hint">Taruh file favicon di /public/image/ lalu isi path: /image/favicon.png</div></div>
                <div class="form-group"><label class="form-label">WhatsApp Customer Service</label><input class="form-input" id="cfgWhatsapp" value="${c.whatsapp || ''}" placeholder="6283857794217 (format internasional tanpa +)"><div class="form-hint">Nomor WA untuk tombol CS di footer dan kontak di API Docs. Format: 62xxx (tanpa + atau 0).</div></div>
                <div style="display:flex;gap:10px;align-items:center;margin-top:20px">
                    <button class="btn btn-primary" onclick="App.saveSiteConfig()" id="saveCfgBtn">${IC.check} Simpan</button>
                    <span style="font-size:12px;color:var(--text-muted)" id="cfgSaveStatus"></span>
                </div>
            </div>
            <div class="settings-section">
                <div class="settings-title">${IC.chart} Preview</div>
                <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius);padding:20px">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                        ${c.favicon ? '<img src="'+c.favicon+'" style="width:24px;height:24px;border-radius:4px" onerror="this.style.display=\'none\'">' : ''}
                        <span style="font-weight:700;font-size:16px" id="previewName">${c.siteName || 'Odzreshop API'}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-muted)">Tab title: <span style="color:var(--text-primary)" id="previewTitle">${c.title || 'Odzreshop API'}</span></div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Footer credit: © 2025 <span id="previewAuthor">${c.author || 'Odzreshop'}</span></div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px">WhatsApp CS: <span style="color:var(--green)" id="previewWa">${c.whatsapp || '—'}</span></div>
                </div>
            </div>
        </div>`;
        ['cfgTitle','cfgSiteName','cfgAuthor','cfgWhatsapp'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                const pTitle = document.getElementById('previewTitle');
                const pName = document.getElementById('previewName');
                const pAuth = document.getElementById('previewAuthor');
                const pWa = document.getElementById('previewWa');
                if (pTitle) pTitle.textContent = document.getElementById('cfgTitle').value || 'Odzreshop API';
                if (pName) pName.textContent = document.getElementById('cfgSiteName').value || 'Odzreshop API';
                if (pAuth) pAuth.textContent = document.getElementById('cfgAuthor').value || 'Odzreshop';
                if (pWa) pWa.textContent = document.getElementById('cfgWhatsapp').value || '—';
            });
        });
    },
    async saveSiteConfig() {
        const btn = document.getElementById('saveCfgBtn');
        btn.disabled = true;
        const r = await Auth.apiFetch('/api/admin/site-config', { method: 'PUT', body: JSON.stringify({
            title: document.getElementById('cfgTitle').value.trim(),
            siteName: document.getElementById('cfgSiteName').value.trim(),
            author: document.getElementById('cfgAuthor').value.trim(),
            favicon: document.getElementById('cfgFavicon').value.trim(),
            whatsapp: document.getElementById('cfgWhatsapp').value.trim()
        })});
        btn.disabled = false;
        if (r?.success) {
            Toast.success('Site config berhasil disimpan!');
            document.getElementById('cfgSaveStatus').textContent = 'Tersimpan ✓';
            setTimeout(() => { const s = document.getElementById('cfgSaveStatus'); if(s) s.textContent = ''; }, 3000);
        } else Toast.error(r?.message || 'Gagal menyimpan.');
    }
};

const Toast = {
    show(msg, type='info') {
        const c = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.innerHTML = `<span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    },
    success(m) { this.show(m,'success'); },
    error(m) { this.show(m,'error'); },
    info(m) { this.show(m,'info'); }
};

document.addEventListener('DOMContentLoaded', () => App.init());
