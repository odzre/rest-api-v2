const IC={check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',dollar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'};
//ini diupdate
const App={
    currentPage:'dashboard',
    init(){
        if(!UserAuth.requireAuth())return;
        this.setupNav();this.setupUserInfo();
        this.navigate(location.hash.slice(1)||'dashboard');
    },
    setupNav(){
        document.querySelectorAll('.nav-item[data-page]').forEach(i=>{
            i.addEventListener('click',e=>{e.preventDefault();this.navigate(i.dataset.page);});
        });
        document.getElementById('logoutBtn')?.addEventListener('click',e=>{e.preventDefault();UserAuth.logout();});
    },
    setupUserInfo(){
        const n=UserAuth.getName()||'User';
        const el=document.getElementById('userName');
        const av=document.getElementById('userAvatar');
        if(el)el.textContent=n;
        if(av)av.textContent=n.charAt(0).toUpperCase();
    },
    navigate(page){
        this.currentPage=page;location.hash=page;
        document.querySelectorAll('.nav-item[data-page]').forEach(i=>i.classList.toggle('active',i.dataset.page===page));
        const titles={dashboard:['Dashboard','Overview transaksi Anda'],langganan:['Langganan','Paket langganan API'],gopay:['GoPay Merchant','Setup dan kelola token GoPay'],orderkouta:['OrderKuota','Setup dan kelola token OrderKuota'],pengaturan:['Pengaturan','Profil dan keamanan akun']};
        const[t,s]=titles[page]||titles.dashboard;
        document.getElementById('pageTitle').textContent=t;
        document.getElementById('pageSubtitle').textContent=s;
        document.getElementById('headerActions').innerHTML='';
        document.getElementById('mainBody').innerHTML='<div class="page-content" id="pageContent"></div>';
        const r={dashboard:()=>this.renderDashboard(),langganan:()=>this.renderLangganan(),gopay:()=>this.renderGopay(),orderkouta:()=>this.renderOrderkouta(),pengaturan:()=>this.renderPengaturan()};
        (r[page]||r.dashboard)();
    },

    // DASHBOARD
    async renderDashboard(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="stats-grid">'+('<div class="stat-card"><div class="skeleton" style="height:80px"></div></div>').repeat(2)+'</div>';
        const res=await UserAuth.apiFetch('/api/user/dashboard-stats');
        if(!res?.success){el.innerHTML='<div class="empty-state"><p>Gagal memuat data.</p></div>';return;}
        const d=res.data;const g=d.gopayMerchant;const o=d.orderKuota;
        el.innerHTML=`
        <div class="page-content">
            <div class="stat-card-wide"><div class="stat-label">TOTAL REQUEST API</div><div class="stat-value">${d.totalRequests}</div><div class="stat-sub">Request tercatat dari API key Anda</div></div>

            <div class="section-title">${IC.dollar} TRANSAKSI GOPAY MERCHANT</div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Total Transaksi</div><div class="stat-value">${g.total}</div></div>
                <div class="stat-card"><div class="stat-label">Transaksi Sukses</div><div class="stat-value" style="color:var(--green)">${g.success}</div></div>
                <div class="stat-card"><div class="stat-label">Transaksi Expired</div><div class="stat-value" style="color:var(--red)">${g.expired}</div></div>
                <div class="stat-card"><div class="stat-label">Total Pendapatan</div><div class="stat-value" style="color:var(--accent-light)">Rp ${g.revenue.toLocaleString('id-ID')}</div></div>
            </div>

            <div class="section-title">${IC.chart} TRANSAKSI ORDERKOUTA</div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Total Transaksi</div><div class="stat-value">${o.total}</div></div>
                <div class="stat-card"><div class="stat-label">Transaksi Sukses</div><div class="stat-value" style="color:var(--green)">${o.success}</div></div>
                <div class="stat-card"><div class="stat-label">Transaksi Expired</div><div class="stat-value" style="color:var(--red)">${o.expired}</div></div>
                <div class="stat-card"><div class="stat-label">Total Pendapatan</div><div class="stat-value" style="color:var(--accent-light)">Rp ${o.revenue.toLocaleString('id-ID')}</div></div>
            </div>
        </div>`;
    },

    // LANGGANAN
    async renderLangganan(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const[plansRes,profileRes]=await Promise.all([UserAuth.apiFetch('/api/user/subscription-plans'),UserAuth.apiFetch('/api/user/profile')]);
        const plans=plansRes?.data||[];const profile=profileRes?.data||{};
        let statusHtml='';
        if(profile.apiKeyActive){
            const exp=profile.subscriptionExpiresAt?new Date(profile.subscriptionExpiresAt).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}):'—';
            statusHtml=`<div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS LANGGANAN</div><div class="stat-value" style="color:var(--green);font-size:20px">${IC.check} Aktif</div><div class="stat-sub">Berlaku hingga: ${exp}</div></div><span class="badge badge-green">Active</span></div></div>`;
        }else{
            statusHtml=`<div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS LANGGANAN</div><div class="stat-value" style="color:var(--red);font-size:20px">${IC.x} Tidak Aktif</div><div class="stat-sub">Beli paket langganan untuk mengaktifkan API Key</div></div><span class="badge badge-red">Inactive</span></div></div>`;
        }
        if(plans.length===0){
            el.innerHTML=statusHtml+'<div class="empty-state"><p>Belum ada paket langganan tersedia.</p></div>';return;
        }
        el.innerHTML=statusHtml+`<div class="section-title">${IC.box} Pilih Paket Langganan</div><div class="plans-grid page-content">${plans.map(p=>{
            const benefits=(p.benefits||[]).map(b=>`<li>${IC.check} ${b}</li>`).join('');
            return`<div class="plan-card"><div class="plan-name">${p.name}</div><div class="plan-price">Rp ${p.price.toLocaleString('id-ID')}</div><div class="plan-duration">${p.duration_days} hari masa aktif</div><div class="plan-desc">${p.description||''}</div>${benefits?`<ul class="plan-benefits">${benefits}</ul>`:''}<button class="btn btn-primary plan-cta" onclick="App.requestSubscription(${p.id},'${p.name.replace(/'/g,"\\'")}')">Hubungi Admin</button></div>`;
        }).join('')}</div>`;
    },
    requestSubscription(planId,planName){
        Toast.info(`Untuk berlangganan paket "${planName}", silakan hubungi admin untuk aktivasi.`);
    },

    // GOPAY MERCHANT
    async renderGopay(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const status=await UserAuth.apiFetch('/api/user/gopay/token-status');
        const hasToken=status?.data?.hasToken;
        el.innerHTML=`<div class="page-content">
            <div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS TOKEN GOPAY</div><div class="stat-value" style="font-size:18px;color:${hasToken?'var(--green)':'var(--red)'};">${hasToken?IC.check+' Token Tersimpan':IC.x+' Belum Setup'}</div><div class="stat-sub">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan setup token GoPay Merchant Anda'}</div></div>${hasToken?'<button class="btn btn-danger btn-sm" onclick="App.deleteGopayToken()">Hapus Token</button>':''}</div></div>
            <div class="section-title">${IC.dollar} Setup GoPay Merchant</div>
            <div class="otp-steps"><div class="otp-step active" id="gopayStep1">1. Request OTP</div><div class="otp-step" id="gopayStep2">2. Verifikasi OTP</div><div class="otp-step" id="gopayStep3">3. Simpan Token</div></div>
            <div class="settings-section">
                <div class="otp-panel active" id="gopayPanel1">
                    <div class="form-group"><label class="form-label">Nomor HP GoPay</label><input class="form-input" id="gopayPhone" placeholder="83xxxxxxx (tanpa 0 atau 62)"></div>
                    <button class="btn btn-primary" onclick="App.gopayRequestOtp()" id="gopayOtpBtn">Kirim OTP</button>
                </div>
                <div class="otp-panel" id="gopayPanel2">
                    <div class="form-group"><label class="form-label">Kode OTP</label><input class="form-input" id="gopayOtp" placeholder="Masukkan kode OTP"></div>
                    <button class="btn btn-primary" onclick="App.gopayVerifyOtp()" id="gopayVerifyBtn">Verifikasi OTP</button>
                </div>
                <div class="otp-panel" id="gopayPanel3">
                    <p style="color:var(--green);font-weight:600;margin-bottom:12px">${IC.check} Token berhasil didapatkan dan disimpan!</p>
                    <p style="color:var(--text-muted);font-size:13px">Token GoPay Merchant Anda telah dienkripsi dan tersimpan dengan aman. Anda sekarang bisa menggunakan endpoint order tanpa memasukkan token manual.</p>
                </div>
            </div>
        </div>`;
    },
    _gopayOtpData:null,
    async gopayRequestOtp(){
        const phone=document.getElementById('gopayPhone').value.trim();
        if(!phone)return Toast.error('Nomor HP wajib diisi.');
        const btn=document.getElementById('gopayOtpBtn');btn.disabled=true;btn.textContent='Mengirim...';
        const profile=await UserAuth.apiFetch('/api/user/profile');
        if(!profile?.data?.apiKey)return Toast.error('API Key tidak ditemukan.');
        const res=await fetch('/api/v5/gopay/get-otp-gopaymerchant',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.data.apiKey},body:JSON.stringify({phone_number:phone})});
        const data=await res.json();btn.disabled=false;btn.textContent='Kirim OTP';
        if(!data.success)return Toast.error(data.message);
        if(data.data.requires_otp===false){
            this._gopayOtpData={x_uniqueid:data.data.x_uniqueid};
            await this._saveGopayTokens(data.data.access_token,data.data.refresh_token,data.data.x_uniqueid);
            return;
        }
        this._gopayOtpData=data.data;Toast.success('OTP telah dikirim!');
        document.getElementById('gopayStep1').classList.replace('active','done');
        document.getElementById('gopayStep2').classList.add('active');
        document.getElementById('gopayPanel1').classList.remove('active');
        document.getElementById('gopayPanel2').classList.add('active');
    },
    async gopayVerifyOtp(){
        const otp=document.getElementById('gopayOtp').value.trim();
        if(!otp)return Toast.error('OTP wajib diisi.');
        const btn=document.getElementById('gopayVerifyBtn');btn.disabled=true;btn.textContent='Memverifikasi...';
        const profile=await UserAuth.apiFetch('/api/user/profile');
        const res=await fetch('/api/v5/gopay/get-token-gopaymerchant',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.data.apiKey},body:JSON.stringify({otp,otp_token:this._gopayOtpData.otp_token,x_uniqueid:this._gopayOtpData.x_uniqueid})});
        const data=await res.json();btn.disabled=false;btn.textContent='Verifikasi OTP';
        if(!data.success)return Toast.error(data.message);
        await this._saveGopayTokens(data.data.access_token,data.data.refresh_token,data.data.x_uniqueid);
    },
    async _saveGopayTokens(at,rt,uid){
        const res=await UserAuth.apiFetch('/api/user/gopay/save-token',{method:'POST',body:JSON.stringify({access_token:at,refresh_token:rt,x_uniqueid:uid})});
        if(res?.success){
            Toast.success('Token GoPay berhasil disimpan!');
            document.getElementById('gopayStep2').classList.replace('active','done');
            document.getElementById('gopayStep3').classList.add('active');
            document.getElementById('gopayPanel2').classList.remove('active');
            document.getElementById('gopayPanel3').classList.add('active');
        }else Toast.error(res?.message||'Gagal menyimpan token.');
    },
    async deleteGopayToken(){
        if(!confirm('Hapus token GoPay?'))return;
        const r=await UserAuth.apiFetch('/api/user/gopay/delete-token',{method:'DELETE'});
        if(r?.success){Toast.success('Token dihapus.');this.renderGopay();}
    },

    // ORDERKOUTA
    async renderOrderkouta(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const status=await UserAuth.apiFetch('/api/user/orderkouta/token-status');
        const hasToken=status?.data?.hasToken;
        el.innerHTML=`<div class="page-content">
            <div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS TOKEN ORDERKOUTA</div><div class="stat-value" style="font-size:18px;color:${hasToken?'var(--green)':'var(--red)'};">${hasToken?IC.check+' Token Tersimpan':IC.x+' Belum Setup'}</div><div class="stat-sub">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan setup token OrderKuota Anda'}</div></div>${hasToken?'<button class="btn btn-danger btn-sm" onclick="App.deleteOrkutToken()">Hapus Token</button>':''}</div></div>
            <div class="section-title">${IC.chart} Setup OrderKuota</div>
            <div class="otp-steps"><div class="otp-step active" id="orkutStep1">1. Login</div><div class="otp-step" id="orkutStep2">2. Verifikasi OTP</div><div class="otp-step" id="orkutStep3">3. Simpan Token</div></div>
            <div class="settings-section">
                <div class="otp-panel active" id="orkutPanel1">
                    <div class="form-group"><label class="form-label">Username OrderKuota</label><input class="form-input" id="orkutUsername" placeholder="Username"></div>
                    <div class="form-group"><label class="form-label">Password OrderKuota</label><input class="form-input" type="password" id="orkutPassword" placeholder="Password"></div>
                    <button class="btn btn-primary" onclick="App.orkutRequestOtp()" id="orkutOtpBtn">Login & Kirim OTP</button>
                </div>
                <div class="otp-panel" id="orkutPanel2">
                    <div class="form-group"><label class="form-label">Kode OTP</label><input class="form-input" id="orkutOtp" placeholder="Masukkan kode OTP"></div>
                    <button class="btn btn-primary" onclick="App.orkutVerifyOtp()" id="orkutVerifyBtn">Verifikasi OTP</button>
                </div>
                <div class="otp-panel" id="orkutPanel3">
                    <p style="color:var(--green);font-weight:600;margin-bottom:12px">${IC.check} Token berhasil didapatkan dan disimpan!</p>
                    <p style="color:var(--text-muted);font-size:13px">Token OrderKuota Anda telah dienkripsi dan tersimpan. Anda bisa menggunakan endpoint order tanpa memasukkan token manual.</p>
                </div>
            </div>
        </div>`;
    },
    _orkutUsername:null,
    async orkutRequestOtp(){
        const u=document.getElementById('orkutUsername').value.trim();
        const p=document.getElementById('orkutPassword').value.trim();
        if(!u||!p)return Toast.error('Username dan password wajib diisi.');
        const btn=document.getElementById('orkutOtpBtn');btn.disabled=true;btn.textContent='Mengirim...';
        const profile=await UserAuth.apiFetch('/api/user/profile');
        const res=await fetch('/api/v5/orderkouta/get-otp-orderkouta',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.data.apiKey},body:JSON.stringify({username:u,password:p})});
        const data=await res.json();btn.disabled=false;btn.textContent='Login & Kirim OTP';
        if(!data.success)return Toast.error(data.message);
        this._orkutUsername=u;Toast.success('OTP telah dikirim!');
        document.getElementById('orkutStep1').classList.replace('active','done');
        document.getElementById('orkutStep2').classList.add('active');
        document.getElementById('orkutPanel1').classList.remove('active');
        document.getElementById('orkutPanel2').classList.add('active');
    },
    async orkutVerifyOtp(){
        const otp=document.getElementById('orkutOtp').value.trim();
        if(!otp)return Toast.error('OTP wajib diisi.');
        const btn=document.getElementById('orkutVerifyBtn');btn.disabled=true;btn.textContent='Memverifikasi...';
        const profile=await UserAuth.apiFetch('/api/user/profile');
        const res=await fetch('/api/v5/orderkouta/get-token-orderkouta',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':profile.data.apiKey},body:JSON.stringify({username:this._orkutUsername,otp})});
        const data=await res.json();btn.disabled=false;btn.textContent='Verifikasi OTP';
        if(!data.success)return Toast.error(data.message);
        // Support semua kemungkinan path token dari API OrderKuota
        const authToken=data.data?.auth_token||data.data?.token||data.data?.results?.token;
        if(!authToken)return Toast.error('auth_token tidak ditemukan di response. Raw: '+JSON.stringify(data.data));
        const saveRes=await UserAuth.apiFetch('/api/user/orderkouta/save-token',{method:'POST',body:JSON.stringify({username:this._orkutUsername,auth_token:authToken})});
        if(saveRes?.success){
            Toast.success('Token OrderKuota berhasil disimpan!');
            document.getElementById('orkutStep2').classList.replace('active','done');
            document.getElementById('orkutStep3').classList.add('active');
            document.getElementById('orkutPanel2').classList.remove('active');
            document.getElementById('orkutPanel3').classList.add('active');
        }else Toast.error(saveRes?.message||'Gagal menyimpan.');
    },
    async deleteOrkutToken(){
        if(!confirm('Hapus token OrderKuota?'))return;
        const r=await UserAuth.apiFetch('/api/user/orderkouta/delete-token',{method:'DELETE'});
        if(r?.success){Toast.success('Token dihapus.');this.renderOrderkouta();}
    },

    // PENGATURAN
    async renderPengaturan(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:300px"></div>';
        const res=await UserAuth.apiFetch('/api/user/profile');
        if(!res?.success){el.innerHTML='<div class="empty-state"><p>Gagal memuat profil.</p></div>';return;}
        const u=res.data;
        el.innerHTML=`<div class="page-content">
            <div class="settings-section">
                <div class="settings-title">${IC.shield} Profil</div>
                <div class="form-group"><label class="form-label">Nama</label><input class="form-input" id="setName" value="${u.name}"></div>
                <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${u.email}" disabled style="opacity:0.6"></div>
                <div class="form-group"><label class="form-label">Nomor WhatsApp</label><input class="form-input" id="setWa" value="${u.whatsapp||''}"></div>
                <div class="form-group"><label class="form-label">API Key</label><div style="display:flex;gap:8px;align-items:center"><input class="form-input" value="${u.apiKey}" disabled style="font-family:var(--font-mono);opacity:0.8"><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${u.apiKey}');Toast.success('API Key disalin!')">${IC.copy}</button></div><div class="form-hint">${u.apiKeyActive?'<span style="color:var(--green)">'+IC.check+' Aktif</span>':'<span style="color:var(--red)">'+IC.x+' Tidak aktif — Beli paket langganan untuk mengaktifkan</span>'}</div></div>
                <button class="btn btn-primary" onclick="App.saveProfile()" id="saveProfileBtn">Simpan Profil</button>
            </div>
            <div class="settings-section">
                <div class="settings-title">${IC.shield} Ubah Password</div>
                <div class="form-group"><label class="form-label">Password Sekarang</label><input class="form-input" type="password" id="curPass" placeholder="Masukkan password saat ini"></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Password Baru</label><input class="form-input" type="password" id="newPass" placeholder="Min. 6 karakter"></div>
                    <div class="form-group"><label class="form-label">Konfirmasi</label><input class="form-input" type="password" id="confPass" placeholder="Ulangi password baru"></div>
                </div>
                <button class="btn btn-primary" onclick="App.changePassword()" id="changePassBtn">Ubah Password</button>
            </div>
            <div class="settings-section" style="text-align:center">
                <a href="/docs" target="_blank" class="btn btn-secondary btn-lg">${IC.chart} Buka API Docs</a>
            </div>
        </div>`;
    },
    async saveProfile(){
        const btn=document.getElementById('saveProfileBtn');btn.disabled=true;btn.textContent='Menyimpan...';
        const r=await UserAuth.apiFetch('/api/user/profile',{method:'PUT',body:JSON.stringify({name:document.getElementById('setName').value.trim(),whatsapp:document.getElementById('setWa').value.trim()})});
        btn.disabled=false;btn.textContent='Simpan Profil';
        if(r?.success){Toast.success('Profil berhasil diupdate.');if(r.data.name){localStorage.setItem('user_name',r.data.name);this.setupUserInfo();}}
        else Toast.error(r?.message||'Gagal update.');
    },
    async changePassword(){
        const btn=document.getElementById('changePassBtn');btn.disabled=true;btn.textContent='Mengubah...';
        const r=await UserAuth.apiFetch('/api/user/password',{method:'PUT',body:JSON.stringify({current_password:document.getElementById('curPass').value,new_password:document.getElementById('newPass').value,confirm_password:document.getElementById('confPass').value})});
        btn.disabled=false;btn.textContent='Ubah Password';
        if(r?.success){Toast.success('Password berhasil diubah.');document.getElementById('curPass').value='';document.getElementById('newPass').value='';document.getElementById('confPass').value='';}
        else Toast.error(r?.message||'Gagal ubah password.');
    },

    // MODAL
    showModal(t,c,fn){const o=document.getElementById('modalOverlay');document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML=c;this._mc=fn;o.classList.add('active');},
    closeModal(){document.getElementById('modalOverlay').classList.remove('active');},
    confirmModal(){if(this._mc)this._mc();}
};

const Toast={
    show(m,t='info'){const c=document.getElementById('toastContainer');const e=document.createElement('div');e.className=`toast toast-${t}`;e.innerHTML=`<span>${m}</span>`;c.appendChild(e);setTimeout(()=>{e.style.opacity='0';setTimeout(()=>e.remove(),300);},3000);},
    success(m){this.show(m,'success');},error(m){this.show(m,'error');},info(m){this.show(m,'info');}
};

document.addEventListener('DOMContentLoaded',()=>App.init());
