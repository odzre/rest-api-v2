const IC={check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><polyline points="20 6 9 17 4 12"/></svg>',dollar:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',chart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',copy:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',refresh:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',shield:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',box:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'};

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
        const titles={dashboard:['Dashboard','Overview transaksi Anda'],langganan:['Langganan','Paket langganan API'],gopay:['GoPay Merchant','Setup dan kelola token GoPay'],orderkouta:['OrderKuota','Setup dan kelola token OrderKuota'],digiflazz:['Digiflazz Tools','Update seller produk Digiflazz'],wagateway:['WA Gateway','Kelola WhatsApp Gateway'],pengaturan:['Pengaturan','Profil dan keamanan akun']};
        const[t,s]=titles[page]||titles.dashboard;
        document.getElementById('pageTitle').textContent=t;
        document.getElementById('pageSubtitle').textContent=s;
        document.getElementById('headerActions').innerHTML='';
        document.getElementById('mainBody').innerHTML='<div class="page-content" id="pageContent"></div>';
        const r={dashboard:()=>this.renderDashboard(),langganan:()=>this.renderLangganan(),gopay:()=>this.renderGopay(),orderkouta:()=>this.renderOrderkouta(),digiflazz:()=>this.renderDigiflazz(),wagateway:()=>this.renderWaGateway(),pengaturan:()=>this.renderPengaturan()};
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
            <div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS TOKEN GOPAY</div><div class="stat-value" style="font-size:18px;color:${hasToken?'var(--green)':'var(--red)'};">${hasToken?'Token Tersimpan':'Belum Setup'}</div><div class="stat-sub">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan setup token GoPay Merchant Anda'}</div></div>${hasToken?'<button class="btn btn-danger btn-sm" onclick="App.deleteGopayToken()">Hapus Token</button>':''}</div></div>
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
                    <p style="color:var(--green);font-weight:600;margin-bottom:12px">Token berhasil didapatkan dan disimpan!</p>
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
            <div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS TOKEN ORDERKOUTA</div><div class="stat-value" style="font-size:18px;color:${hasToken?'var(--green)':'var(--red)'};">${hasToken?'Token Tersimpan':'Belum Setup'}</div><div class="stat-sub">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan setup token OrderKuota Anda'}</div></div>${hasToken?'<button class="btn btn-danger btn-sm" onclick="App.deleteOrkutToken()">Hapus Token</button>':''}</div></div>
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
                    <p style="color:var(--green);font-weight:600;margin-bottom:12px">Token berhasil didapatkan dan disimpan!</p>
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

    // DIGIFLAZZ TOOLS
    _digiEventSource: null,
    async renderDigiflazz(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const status=await UserAuth.apiFetch('/api/user/digiflazz/session-status');
        const has=status?.data?.hasSession;

        if(!has){
            // LOGIN FORM
            el.innerHTML=`<div class="page-content">
                <div class="stat-card-wide"><div class="stat-label">STATUS SESI DIGIFLAZZ</div><div class="stat-value" style="font-size:18px;color:var(--red)">Belum Login</div><div class="stat-sub">Silakan login ke akun Digiflazz Anda</div></div>
                <div class="section-title">${IC.key} Login Digiflazz</div>
                <div class="settings-section">
                    <div class="form-group"><label class="form-label">Email / Username</label><input class="form-input" id="digiUser" placeholder="email@example.com"></div>
                    <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="digiPass" type="password" placeholder="Password"></div>
                    <button class="btn btn-primary" onclick="App.digiLogin()" id="digiLoginBtn">Login</button>
                </div>
            </div>`;
            return;
        }

        // LOGGED IN — show config panel
        this._digiProfile=status.data;
        this._renderDigiConfig(el,status.data);
    },

    async _renderDigiConfig(el,profile){
        el.innerHTML=`<div class="page-content">
            <div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">SESI DIGIFLAZZ AKTIF</div><div class="stat-value" style="font-size:18px;color:var(--green)">${profile.companyName||'—'}</div><div class="stat-sub">${profile.userName||'—'} • Saldo: Rp ${(profile.balance||0).toLocaleString('id-ID')}</div></div><button class="btn btn-danger btn-sm" onclick="App.digiLogout()">Logout</button></div></div>
            <div class="section-title">${IC.chart} Konfigurasi Update Seller</div>
            <div class="settings-section" id="digiConfigSection"><div class="skeleton" style="height:100px"></div></div>
            <div id="digiTerminalWrap" style="display:none">
                <div class="section-title">${IC.chart} Log Eksekusi</div>
                <div class="digi-terminal" id="digiTerminal"></div>
            </div>
        </div>`;
        // Load dropdowns
        const [catRes,brandRes,typeRes]=await Promise.all([
            UserAuth.apiFetch('/api/user/digiflazz/categories'),
            UserAuth.apiFetch('/api/user/digiflazz/brands'),
            UserAuth.apiFetch('/api/user/digiflazz/types')
        ]);
        if(!catRes?.success){document.getElementById('digiConfigSection').innerHTML='<p style="color:var(--red)">Gagal memuat data. Session mungkin expired.</p>';return;}
        this._digiCats=catRes.data||[];
        this._digiBrands=brandRes.data||[];
        this._digiTypes=typeRes.data||[];
        this._digiSelectedTypes=[];
        document.getElementById('digiConfigSection').innerHTML=`
            <div class="form-group"><label class="form-label">Kategori</label>
                <div class="searchable-dd" id="ddCategory"><input class="form-input dd-search" placeholder="Cari kategori..." oninput="App._filterDD('ddCategory',App._digiCats,this.value)" onfocus="App._showDD('ddCategory')"><div class="dd-list"></div><input type="hidden" id="digiCategory"></div></div>
            <div class="form-group"><label class="form-label">Brand</label>
                <div class="searchable-dd" id="ddBrand"><input class="form-input dd-search" placeholder="Cari brand..." oninput="App._filterDD('ddBrand',App._digiBrands,this.value)" onfocus="App._showDD('ddBrand')"><div class="dd-list"></div><input type="hidden" id="digiBrand"></div></div>
            <div class="form-group"><label class="form-label">Type <span style="color:var(--text-muted);font-weight:400">(bisa pilih lebih dari 1)</span></label>
                <div class="searchable-dd multi" id="ddType"><input class="form-input dd-search" placeholder="Cari type..." oninput="App._filterDDMulti('ddType',App._digiTypes,this.value)" onfocus="App._showDDMulti('ddType')"><div class="dd-tags" id="ddTypeTags"></div><div class="dd-list"></div></div></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Minimal Rating</label><input class="form-input" id="digiRating" type="number" step="0.1" min="0" max="5" value="0" placeholder="0"><div class="form-hint">0 = semua rating</div></div>
                <div class="form-group"><label class="form-label">Harga Seller</label><select class="form-input" id="digiSort"><option value="termurah">Termurah</option><option value="termahal">Termahal</option><option value="random">Random Pick</option></select></div>
            </div>
            <div class="form-group" style="display:flex;flex-direction:column;gap:10px">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="digiAutoCode" checked> <span>Auto-Generate Kode Produk</span></label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="digiAutoMax" checked> <span>Max Price mengikuti harga Seller</span></label>
            </div>
            <button class="btn btn-primary" onclick="App.digiExecute()" id="digiExecBtn">Jalankan Update</button>
            <button class="btn btn-danger" onclick="App.digiStop()" id="digiStopBtn" style="display:none;margin-left:8px">Stop</button>`;
        // Init dropdowns
        this._filterDD('ddCategory',this._digiCats,'');
        this._filterDD('ddBrand',this._digiBrands,'');
        this._filterDDMulti('ddType',this._digiTypes,'');
        // Close dropdowns on outside click
        document.addEventListener('click',e=>{if(!e.target.closest('.searchable-dd')){document.querySelectorAll('.dd-list').forEach(l=>l.classList.remove('open'));}});
    },

    // Searchable dropdown helpers (single select)
    _showDD(id){document.getElementById(id).querySelector('.dd-list').classList.add('open');},
    _filterDD(id,items,q){
        const list=document.getElementById(id).querySelector('.dd-list');
        const filtered=q?items.filter(i=>i.name.toLowerCase().includes(q.toLowerCase())):items;
        list.innerHTML=filtered.length?filtered.map(i=>`<div class="dd-item" onclick="App._selectDD('${id}','${i.id}','${i.name.replace(/'/g,"\\\\'")}')"><span>${i.name}</span></div>`).join(''):'<div class="dd-item disabled">Tidak ditemukan</div>';
        list.classList.add('open');
    },
    _selectDD(id,val,name){
        const wrap=document.getElementById(id);
        wrap.querySelector('.dd-search').value=name;
        wrap.querySelector('input[type=hidden]').value=val;
        wrap.querySelector('.dd-list').classList.remove('open');
    },

    // Multi-select dropdown helpers
    _showDDMulti(id){document.getElementById(id).querySelector('.dd-list').classList.add('open');},
    _filterDDMulti(id,items,q){
        const list=document.getElementById(id).querySelector('.dd-list');
        const filtered=q?items.filter(i=>i.name.toLowerCase().includes(q.toLowerCase())):items;
        const sel=this._digiSelectedTypes||[];
        list.innerHTML=filtered.length?filtered.map(i=>`<div class="dd-item" onclick="App._toggleDDMulti('${id}','${i.id}','${i.name.replace(/'/g,"\\\\'")}')"><label style="display:flex;align-items:center;gap:8px;pointer-events:none"><input type="checkbox" ${sel.includes(i.id)?'checked':''} style="pointer-events:none"> ${i.name}</label></div>`).join(''):'<div class="dd-item disabled">Tidak ditemukan</div>';
        list.classList.add('open');
    },
    _toggleDDMulti(id,val,name){
        const idx=this._digiSelectedTypes.indexOf(val);
        if(idx>-1)this._digiSelectedTypes.splice(idx,1);else this._digiSelectedTypes.push(val);
        // Update tags
        const tagsEl=document.getElementById(id+'Tags');
        if(tagsEl)tagsEl.innerHTML=this._digiSelectedTypes.map(tid=>{const t=this._digiTypes.find(x=>x.id===tid);return t?`<span class="dd-tag">${t.name} <span onclick="event.stopPropagation();App._toggleDDMulti('${id}','${tid}','')">×</span></span>`:''}).join('');
        // Re-render list
        const q=document.getElementById(id).querySelector('.dd-search').value;
        this._filterDDMulti(id,this._digiTypes,q);
    },

    // Digiflazz actions
    async digiLogin(){
        const user=document.getElementById('digiUser').value.trim();
        const pass=document.getElementById('digiPass').value;
        if(!user||!pass)return Toast.error('Email dan password wajib diisi!');
        const btn=document.getElementById('digiLoginBtn');btn.disabled=true;btn.textContent='Logging in...';
        const r=await UserAuth.apiFetch('/api/user/digiflazz/login',{method:'POST',body:JSON.stringify({username:user,password:pass})});
        btn.disabled=false;btn.textContent='Login';
        if(!r?.success)return Toast.error(r?.message||'Gagal login');
        if(r.data?.needs2fa){
            // Show 2FA form
            const el=document.getElementById('pageContent');
            el.innerHTML=`<div class="page-content">
                <div class="stat-card-wide"><div class="stat-label">VERIFIKASI 2FA</div><div class="stat-value" style="font-size:18px;color:var(--accent-light)">Masukkan Kode Autentikasi</div><div class="stat-sub">Cek aplikasi authenticator Anda</div></div>
                <div class="settings-section">
                    <div class="form-group"><label class="form-label">Kode 2FA</label><input class="form-input" id="digi2fa" placeholder="000000" autofocus maxlength="6" style="font-family:var(--font-mono);font-size:20px;text-align:center;letter-spacing:8px"></div>
                    <button class="btn btn-primary" onclick="App.digiVerify2fa()" id="digi2faBtn">Verifikasi</button>
                </div>
            </div>`;
        }
    },
    async digiVerify2fa(){
        const code=document.getElementById('digi2fa').value.trim();
        if(!code)return Toast.error('Masukkan kode 2FA!');
        const btn=document.getElementById('digi2faBtn');btn.disabled=true;btn.textContent='Verifying...';
        const r=await UserAuth.apiFetch('/api/user/digiflazz/verify-2fa',{method:'POST',body:JSON.stringify({code})});
        btn.disabled=false;btn.textContent='Verifikasi';
        if(!r?.success)return Toast.error(r?.message||'Kode 2FA salah');
        Toast.success('Login Digiflazz berhasil!');
        this.renderDigiflazz();
    },
    async digiLogout(){
        if(!confirm('Logout dari Digiflazz?'))return;
        await UserAuth.apiFetch('/api/user/digiflazz/logout',{method:'DELETE'});
        Toast.success('Berhasil logout Digiflazz.');
        this.renderDigiflazz();
    },
    async digiExecute(){
        const catId=document.getElementById('digiCategory').value;
        const brandId=document.getElementById('digiBrand').value;
        if(!catId)return Toast.error('Pilih kategori!');
        if(!brandId)return Toast.error('Pilih brand!');
        const body={
            categoryId:catId,brandId:brandId,
            typeIds:this._digiSelectedTypes||[],
            minRating:parseFloat(document.getElementById('digiRating').value)||0,
            sortPrice:document.getElementById('digiSort').value,
            autoCode:document.getElementById('digiAutoCode').checked,
            autoMaxPrice:document.getElementById('digiAutoMax').checked
        };
        // Show terminal
        document.getElementById('digiTerminalWrap').style.display='block';
        const term=document.getElementById('digiTerminal');
        term.innerHTML='';
        document.getElementById('digiExecBtn').style.display='none';
        document.getElementById('digiStopBtn').style.display='inline-block';
        // SSE via fetch
        try{
            const token=localStorage.getItem('user_token');
            const resp=await fetch('/api/user/digiflazz/execute',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)});
            const reader=resp.body.getReader();
            const decoder=new TextDecoder();
            this._digiRunning=true;
            let buffer='';
            while(true){
                const{done,value}=await reader.read();
                if(done)break;
                buffer+=decoder.decode(value,{stream:true});
                const lines=buffer.split('\n');
                buffer=lines.pop();
                for(const line of lines){
                    if(!line.startsWith('data: '))continue;
                    try{
                        const ev=JSON.parse(line.slice(6));
                        const cls=ev.type==='success'?'log-success':ev.type==='error'?'log-error':'log-info';
                        term.innerHTML+=`<div class="log-line ${cls}">${ev.message}</div>`;
                        if(ev.detail)term.innerHTML+=`<div class="log-line log-detail">   ${ev.detail}</div>`;
                        if(ev.type==='done'){this._digiRunning=false;document.getElementById('digiStopBtn').style.display='none';document.getElementById('digiExecBtn').style.display='inline-block';}
                        term.scrollTop=term.scrollHeight;
                    }catch(e){}
                }
            }
        }catch(e){
            term.innerHTML+=`<div class="log-line log-error">❌ Koneksi terputus: ${e.message}</div>`;
        }
        this._digiRunning=false;
        document.getElementById('digiStopBtn').style.display='none';
        document.getElementById('digiExecBtn').style.display='inline-block';
    },
    digiStop(){
        if(this._digiEventSource){this._digiEventSource.close();this._digiEventSource=null;}
        this._digiRunning=false;
        const term=document.getElementById('digiTerminal');
        if(term)term.innerHTML+=`<div class="log-line log-error">Proses dihentikan oleh user.</div>`;
        document.getElementById('digiStopBtn').style.display='none';
        document.getElementById('digiExecBtn').style.display='inline-block';
    },

    // WA GATEWAY
    _waTab:'koneksi',
    async renderWaGateway(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const st=await UserAuth.apiFetch('/api/user/wa/status');
        this._waStatus=st?.data||{connected:false,status:'none'};
        this._renderWaTabs(el);
    },
    _renderWaTabs(el){
        const s=this._waStatus;
        const tabs=['koneksi','pesan','commands','grup'];
        el.innerHTML=`<div class="page-content">
            <div class="wa-tabs">${tabs.map(t=>`<button class="wa-tab${this._waTab===t?' active':''}" onclick="App._waTab='${t}';App._renderWaTabs(document.getElementById('pageContent'))">${t==='koneksi'?'Koneksi':t==='pesan'?'Pesan':t==='commands'?'Commands':t==='grup'?'Grup':t}</button>`).join('')}</div>
            <div id="waTabContent"></div>
        </div>`;
        this['_waTab_'+this._waTab]();
    },

    // TAB: KONEKSI
    _waTab_koneksi(){
        const s=this._waStatus;const el=document.getElementById('waTabContent');
        if(s.connected){
            el.innerHTML=`<div class="stat-card-wide"><div style="display:flex;align-items:center;justify-content:space-between"><div><div class="stat-label">STATUS</div><div class="stat-value" style="font-size:18px;color:var(--green)">Terhubung</div><div class="stat-sub">${s.phoneNumber||''} ${s.name?'('+s.name+')':''}</div></div><button class="btn btn-danger btn-sm" onclick="App._waDisconnect()">Disconnect</button></div></div>`;
        } else if(s.status==='saved'){
            el.innerHTML=`<div class="stat-card-wide"><div class="stat-label">STATUS</div><div class="stat-value" style="font-size:18px;color:var(--accent-light)">Session Tersimpan</div><div class="stat-sub">Klik reconnect untuk menghubungkan kembali</div></div>
            <div class="settings-section"><button class="btn btn-primary" onclick="App._waConnect()">Reconnect</button> <button class="btn btn-danger" onclick="App._waDisconnect()">Hapus Session</button></div>`;
        } else {
            el.innerHTML=`<div class="stat-card-wide"><div class="stat-label">STATUS</div><div class="stat-value" style="font-size:18px;color:var(--red)">Belum Terhubung</div></div>
            <div class="settings-section">
                <div class="section-title">${IC.key} Hubungkan WhatsApp</div>
                <div class="wa-connect-tabs"><button class="wa-tab active" id="waQrTab" onclick="App._waShowQrMode()">QR Code</button><button class="wa-tab" id="waPairTab" onclick="App._waShowPairMode()">Pairing Code</button></div>
                <div id="waConnectContent">
                    <p style="color:var(--text-muted);margin-bottom:12px">Klik tombol di bawah untuk memulai koneksi dan mendapatkan QR Code.</p>
                    <button class="btn btn-primary" onclick="App._waConnect()" id="waConnectBtn">Mulai Koneksi</button>
                    <div id="waQrBox" style="margin-top:16px"></div>
                </div>
            </div>`;
        }
    },
    _waShowQrMode(){
        document.getElementById('waQrTab').classList.add('active');document.getElementById('waPairTab').classList.remove('active');
        document.getElementById('waConnectContent').innerHTML=`<p style="color:var(--text-muted);margin-bottom:12px">Klik tombol di bawah untuk memulai koneksi dan mendapatkan QR Code.</p><button class="btn btn-primary" onclick="App._waConnect()" id="waConnectBtn">Mulai Koneksi</button><div id="waQrBox" style="margin-top:16px"></div>`;
    },
    _waShowPairMode(){
        document.getElementById('waPairTab').classList.add('active');document.getElementById('waQrTab').classList.remove('active');
        document.getElementById('waConnectContent').innerHTML=`<div class="form-group"><label class="form-label">Nomor WhatsApp</label><input class="form-input" id="waPairNumber" placeholder="628xxxxxxxxxx"></div><button class="btn btn-primary" onclick="App._waPair()" id="waPairBtn">Dapatkan Kode</button><div id="waPairResult" style="margin-top:12px"></div>`;
    },
    async _waConnect(){
        const btn=document.getElementById('waConnectBtn');if(btn){btn.disabled=true;btn.textContent='Menghubungkan...';}
        const qrBox=document.getElementById('waQrBox');if(qrBox)qrBox.innerHTML='<div class="skeleton" style="height:300px;width:300px"></div>';
        try{
            const token=localStorage.getItem('user_token');
            const resp=await fetch('/api/user/wa/connect',{headers:{'Authorization':'Bearer '+token}});
            const reader=resp.body.getReader();const decoder=new TextDecoder();let buf='';
            while(true){
                const{done,value}=await reader.read();if(done)break;
                buf+=decoder.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
                for(const line of lines){
                    if(!line.startsWith('data: '))continue;
                    try{
                        const ev=JSON.parse(line.slice(6));
                        if(ev.type==='qr'&&qrBox)qrBox.innerHTML=`<img src="${ev.image}" style="width:280px;height:280px;border-radius:8px;border:2px solid var(--border)">`;
                        if(ev.type==='connected'){Toast.success('WhatsApp terhubung!');this._waStatus={connected:true,status:'connected',phoneNumber:ev.phoneNumber,name:ev.name};this._renderWaTabs(document.getElementById('pageContent'));}
                        if(ev.type==='error')Toast.error(ev.message);
                    }catch(e){}
                }
            }
        }catch(e){Toast.error('Gagal: '+e.message);}
    },
    async _waPair(){
        const num=document.getElementById('waPairNumber').value.trim();if(!num)return Toast.error('Masukkan nomor!');
        const btn=document.getElementById('waPairBtn');btn.disabled=true;btn.textContent='Memproses...';
        const r=await UserAuth.apiFetch('/api/user/wa/pair',{method:'POST',body:JSON.stringify({phoneNumber:num})});
        btn.disabled=false;btn.textContent='Dapatkan Kode';
        if(r?.success){document.getElementById('waPairResult').innerHTML=`<div class="stat-card-wide"><div class="stat-label">PAIRING CODE</div><div class="stat-value" style="font-family:var(--font-mono);letter-spacing:4px;font-size:28px">${r.data.code}</div><div class="stat-sub">Masukkan kode ini di WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat</div></div>`;}
        else Toast.error(r?.message||'Gagal');
    },
    async _waDisconnect(){
        if(!confirm('Putuskan koneksi WhatsApp?'))return;
        await UserAuth.apiFetch('/api/user/wa/disconnect',{method:'DELETE'});
        Toast.success('WhatsApp terputus.');this._waStatus={connected:false,status:'none'};this._renderWaTabs(document.getElementById('pageContent'));
    },

    // TAB: PESAN
    _waTab_pesan(){
        const el=document.getElementById('waTabContent');
        if(!this._waStatus.connected){el.innerHTML='<div class="empty-state"><p>Hubungkan WhatsApp terlebih dahulu di tab Koneksi.</p></div>';return;}
        el.innerHTML=`
            <div class="section-title">${IC.key} Kirim Pesan</div>
            <div class="settings-section">
                <div class="form-group"><label class="form-label">Nomor Tujuan</label><input class="form-input" id="waSendTo" placeholder="628xxxxxxxxxx"></div>
                <div class="form-group"><label class="form-label">Pesan</label><textarea class="form-input" id="waSendMsg" rows="3" placeholder="Tulis pesan..."></textarea></div>
                <button class="btn btn-primary" onclick="App._waSend()" id="waSendBtn">Kirim</button>
            </div>
            <div class="section-title" style="margin-top:24px">${IC.chart} Broadcast</div>
            <div class="settings-section">
                <div class="form-group"><label class="form-label">Nomor Tujuan <span style="color:var(--text-muted);font-weight:400">(1 nomor per baris)</span></label><textarea class="form-input" id="waBcNumbers" rows="4" placeholder="628111\n628222\n628333"></textarea></div>
                <div class="form-group"><label class="form-label">Pesan</label><textarea class="form-input" id="waBcMsg" rows="3" placeholder="Tulis pesan broadcast..."></textarea></div>
                <div class="form-group"><label class="form-label">Delay (detik)</label><input class="form-input" id="waBcDelay" type="number" value="3" min="1" max="30" style="max-width:120px"></div>
                <button class="btn btn-primary" onclick="App._waBroadcast()" id="waBcBtn">Kirim Broadcast</button>
                <div id="waBcLog" style="display:none;margin-top:16px"><div class="digi-terminal" id="waBcTerminal"></div></div>
            </div>
            <div class="section-title" style="margin-top:24px">${IC.chart} Log Terkirim</div>
            <div id="waLogList"><div class="skeleton" style="height:80px"></div></div>`;
        this._loadWaLogs();
    },
    async _waSend(){
        const to=document.getElementById('waSendTo').value.trim();const msg=document.getElementById('waSendMsg').value;
        if(!to||!msg)return Toast.error('Nomor dan pesan wajib diisi!');
        const btn=document.getElementById('waSendBtn');btn.disabled=true;btn.textContent='Mengirim...';
        const r=await UserAuth.apiFetch('/api/user/wa/send',{method:'POST',body:JSON.stringify({to,message:msg})});
        btn.disabled=false;btn.textContent='Kirim';
        if(r?.success){Toast.success('Pesan terkirim!');document.getElementById('waSendMsg').value='';this._loadWaLogs();}else Toast.error(r?.message||'Gagal');
    },
    async _waBroadcast(){
        const nums=document.getElementById('waBcNumbers').value.trim().split('\n').map(n=>n.trim()).filter(Boolean);
        const msg=document.getElementById('waBcMsg').value;const delay=document.getElementById('waBcDelay').value;
        if(!nums.length||!msg)return Toast.error('Nomor dan pesan wajib diisi!');
        document.getElementById('waBcLog').style.display='block';
        const term=document.getElementById('waBcTerminal');term.innerHTML='';
        document.getElementById('waBcBtn').disabled=true;
        try{
            const token=localStorage.getItem('user_token');
            const resp=await fetch('/api/user/wa/broadcast',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({numbers:nums,message:msg,delay})});
            const reader=resp.body.getReader();const decoder=new TextDecoder();let buf='';
            while(true){
                const{done,value}=await reader.read();if(done)break;
                buf+=decoder.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
                for(const line of lines){
                    if(!line.startsWith('data: '))continue;
                    try{const ev=JSON.parse(line.slice(6));const cls=ev.type==='success'?'log-success':ev.type==='error'?'log-error':'log-info';term.innerHTML+=`<div class="log-line ${cls}">${ev.message}</div>`;term.scrollTop=term.scrollHeight;}catch(e){}
                }
            }
        }catch(e){term.innerHTML+=`<div class="log-line log-error">Error: ${e.message}</div>`;}
        document.getElementById('waBcBtn').disabled=false;this._loadWaLogs();
    },
    async _loadWaLogs(){
        const r=await UserAuth.apiFetch('/api/user/wa/logs');const el=document.getElementById('waLogList');
        if(!r?.success||!r.data?.length){el.innerHTML='<div class="empty-state" style="padding:16px"><p>Belum ada log.</p></div>';return;}
        el.innerHTML=`<div class="wa-log-list">${r.data.map(l=>{
            const t=new Date(l.time).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
            const icon=l.status==='sent'?'<span style="color:var(--green)">Terkirim</span>':'<span style="color:var(--red)">Gagal</span>';
            const to=l.to?.replace('@s.whatsapp.net','')?.replace('@g.us',' (grup)');
            return `<div class="wa-log-item"><span class="wa-log-time">${t}</span><span class="wa-log-dir badge ${l.direction==='broadcast'?'badge-accent':l.direction==='auto-reply'?'badge-purple':'badge-green'}">${l.direction}</span><span class="wa-log-to">${to}</span>${icon}</div>`;
        }).join('')}</div>`;
    },

    // TAB: COMMANDS
    _waTab_commands(){
        const el=document.getElementById('waTabContent');
        if(!this._waStatus.connected){el.innerHTML='<div class="empty-state"><p>Hubungkan WhatsApp terlebih dahulu.</p></div>';return;}
        el.innerHTML=`<div class="section-title">${IC.key} Auto-Reply Commands</div>
            <div class="settings-section">
                <button class="btn btn-primary btn-sm" onclick="App._waShowAddCmd()">Tambah Command</button>
                <div id="waCmdForm" style="display:none;margin-top:16px">
                    <div class="form-group"><label class="form-label">Trigger</label><input class="form-input" id="waCmdTrigger" placeholder=".harga"></div>
                    <div class="form-group"><label class="form-label">Tipe Matching</label><select class="form-input" id="waCmdType"><option value="exact">Exact Match</option><option value="startswith">Starts With</option><option value="contains">Contains</option></select></div>
                    <div class="form-group"><label class="form-label">Response</label><textarea class="form-input" id="waCmdResponse" rows="3" placeholder="Balasan otomatis..."></textarea></div>
                    <button class="btn btn-primary btn-sm" onclick="App._waSaveCmd()" id="waCmdSaveBtn">Simpan</button>
                    <button class="btn btn-sm" onclick="document.getElementById('waCmdForm').style.display='none'" style="margin-left:8px">Batal</button>
                    <input type="hidden" id="waCmdEditId">
                </div>
                <div id="waCmdList" style="margin-top:16px"><div class="skeleton" style="height:80px"></div></div>
            </div>`;
        this._loadWaCmds();
    },
    _waShowAddCmd(){document.getElementById('waCmdForm').style.display='block';document.getElementById('waCmdTrigger').value='';document.getElementById('waCmdResponse').value='';document.getElementById('waCmdEditId').value='';document.getElementById('waCmdType').value='exact';},
    _waEditCmd(id,trigger,response,type){document.getElementById('waCmdForm').style.display='block';document.getElementById('waCmdTrigger').value=trigger;document.getElementById('waCmdResponse').value=response;document.getElementById('waCmdEditId').value=id;document.getElementById('waCmdType').value=type||'exact';},
    async _waSaveCmd(){
        const trigger=document.getElementById('waCmdTrigger').value.trim();const response=document.getElementById('waCmdResponse').value;const type=document.getElementById('waCmdType').value;const editId=document.getElementById('waCmdEditId').value;
        if(!trigger||!response)return Toast.error('Trigger dan response wajib diisi!');
        const url=editId?`/api/user/wa/commands/${editId}`:'/api/user/wa/commands';
        const method=editId?'PUT':'POST';
        const r=await UserAuth.apiFetch(url,{method,body:JSON.stringify({trigger,response,type})});
        if(r?.success){Toast.success(editId?'Command diupdate!':'Command ditambahkan!');document.getElementById('waCmdForm').style.display='none';this._loadWaCmds();}else Toast.error(r?.message||'Gagal');
    },
    async _waDeleteCmd(id){
        if(!confirm('Hapus command ini?'))return;
        const r=await UserAuth.apiFetch(`/api/user/wa/commands/${id}`,{method:'DELETE'});
        if(r?.success){Toast.success('Command dihapus!');this._loadWaCmds();}
    },
    async _loadWaCmds(){
        const r=await UserAuth.apiFetch('/api/user/wa/commands');const el=document.getElementById('waCmdList');
        if(!r?.success||!r.data?.length){el.innerHTML='<div class="empty-state" style="padding:16px"><p>Belum ada command.</p></div>';return;}
        el.innerHTML=`<table class="data-table"><thead><tr><th>Trigger</th><th>Tipe</th><th>Response</th><th>Aksi</th></tr></thead><tbody>${r.data.map(c=>`<tr><td><code>${c.trigger}</code></td><td>${c.type}</td><td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.response}</td><td style="white-space:nowrap"><button class="btn btn-sm" onclick="App._waEditCmd('${c.id}','${c.trigger.replace(/'/g,"\\'")}',\`${c.response.replace(/`/g,"\\`")}\`,'${c.type}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="App._waDeleteCmd('${c.id}')">Hapus</button></td></tr>`).join('')}</tbody></table>`;
    },

    // TAB: GRUP
    _waTab_grup(){
        const el=document.getElementById('waTabContent');
        if(!this._waStatus.connected){el.innerHTML='<div class="empty-state"><p>Hubungkan WhatsApp terlebih dahulu.</p></div>';return;}
        el.innerHTML=`<div class="section-title">${IC.chart} Daftar Grup</div><div id="waGroupList"><div class="skeleton" style="height:100px"></div></div>`;
        this._loadWaGroups();
    },
    async _loadWaGroups(){
        const r=await UserAuth.apiFetch('/api/user/wa/groups');const el=document.getElementById('waGroupList');
        if(!r?.success||!r.data?.length){el.innerHTML='<div class="empty-state" style="padding:16px"><p>Tidak ada grup.</p></div>';return;}
        el.innerHTML=r.data.map(g=>`<div class="wa-group-card">
            <div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${g.subject}</strong><div style="font-size:12px;color:var(--text-muted)">${g.participants} anggota</div></div>
            <button class="btn btn-primary btn-sm" onclick="App._waShowGroupSend('${g.id}','${g.subject.replace(/'/g,"\\'")}')">Kirim Pesan</button></div>
        </div>`).join('');
    },
    _waShowGroupSend(gid,name){
        const el=document.getElementById('waGroupList');
        el.innerHTML=`<div class="settings-section"><div class="section-title">Kirim ke: ${name}</div>
            <div class="form-group"><textarea class="form-input" id="waGroupMsg" rows="3" placeholder="Tulis pesan..."></textarea></div>
            <button class="btn btn-primary btn-sm" onclick="App._waSendToGroup('${gid}')" id="waGroupSendBtn">Kirim</button>
            <button class="btn btn-sm" onclick="App._loadWaGroups()" style="margin-left:8px">Kembali</button></div>`;
    },
    async _waSendToGroup(gid){
        const msg=document.getElementById('waGroupMsg').value;if(!msg)return Toast.error('Pesan wajib diisi!');
        const btn=document.getElementById('waGroupSendBtn');btn.disabled=true;btn.textContent='Mengirim...';
        const r=await UserAuth.apiFetch(`/api/user/wa/groups/${gid}/send`,{method:'POST',body:JSON.stringify({message:msg})});
        btn.disabled=false;btn.textContent='Kirim';
        if(r?.success){Toast.success('Pesan terkirim ke grup!');this._loadWaGroups();}else Toast.error(r?.message||'Gagal');
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
                <div class="form-group"><label class="form-label">API Key</label><div style="display:flex;gap:8px;align-items:center"><input class="form-input" value="${u.apiKey}" disabled style="font-family:var(--font-mono);opacity:0.8"><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${u.apiKey}');Toast.success('API Key disalin!')">${IC.copy}</button></div><div class="form-hint">${u.apiKeyActive?'<span style="color:var(--green)">Aktif</span>':'<span style="color:var(--red)">Tidak aktif — Beli paket langganan untuk mengaktifkan</span>'}</div></div>
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
