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
        const titles={dashboard:['Dashboard','Overview transaksi Anda'],langganan:['Langganan','Paket langganan API'],gopay:['GoPay Merchant','Setup dan kelola token GoPay'],orderkouta:['OrderKuota','Setup dan kelola token OrderKuota'],digiflazz:['Digiflazz Tools','Update seller produk Digiflazz'],wagateway:['WA Gateway','Kelola WhatsApp Gateway'],alightmotion:['Alight Motion','Upgrade akun Alight Motion Premium'],pengaturan:['Pengaturan','Profil dan keamanan akun']};
        const[t,s]=titles[page]||titles.dashboard;
        document.getElementById('pageTitle').textContent=t;
        document.getElementById('pageSubtitle').textContent=s;
        document.getElementById('headerActions').innerHTML='';
        document.getElementById('mainBody').innerHTML='<div class="page-content" id="pageContent"></div>';
        const r={dashboard:()=>this.renderDashboard(),langganan:()=>this.renderLangganan(),gopay:()=>this.renderGopay(),orderkouta:()=>this.renderOrderkouta(),digiflazz:()=>this.renderDigiflazz(),wagateway:()=>this.renderWaGateway(),alightmotion:()=>this.renderAlightMotion(),pengaturan:()=>this.renderPengaturan()};
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
            const featureList=[
                {label:'GoPay Merchant',allowed:!!p.allow_gopay},
                {label:'OrderKuota',allowed:!!p.allow_orderkouta},
                {label:'Digiflazz Tools',allowed:!!p.allow_digiflazz},
                {label:'WA Gateway',allowed:!!p.allow_wa_gateway},
                {label:'Alight Motion',allowed:!!p.allow_alight_motion}
            ];
            const featureBadges=featureList.map(f=>`<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;margin:3px 4px;background:${f.allowed?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.10)'};color:${f.allowed?'var(--green,#10b981)':'var(--red,#ef4444)'};border:1px solid ${f.allowed?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.18)'}">${f.allowed?IC.check:IC.x} ${f.label}</span>`).join('');
            const featureSection=`<div style="margin-top:12px"><div style="font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text-secondary,#94a3b8)">Akses Fitur</div><div style="display:flex;flex-wrap:wrap;gap:2px">${featureBadges}</div></div>`;
            return`<div class="plan-card"><div class="plan-name">${p.name}</div><div class="plan-price">Rp ${p.price.toLocaleString('id-ID')}</div><div class="plan-duration">${p.duration_days} hari masa aktif</div><div class="plan-desc">${p.description||''}</div>${benefits?`<ul class="plan-benefits">${benefits}</ul>`:''}${featureSection}<button class="btn btn-primary plan-cta" id="buyBtn${p.id}" onclick="App.buySubscription(${p.id},'${p.name.replace(/'/g,"\\'")}')">Beli Sekarang</button></div>`;
        }).join('')}</div>`;
    },
    async buySubscription(planId,planName){
        if(!confirm(`Beli paket "${planName}"? Kamu akan diarahkan ke halaman pembayaran QRIS.`))return;
        const btn=document.getElementById('buyBtn'+planId);
        if(btn){btn.disabled=true;btn.textContent='Memproses...';}
        try{
            const r=await UserAuth.apiFetch('/api/user/checkout',{method:'POST',body:JSON.stringify({plan_id:planId})});
            if(r?.success&&r.data?.reffid){
                window.location.href=`/check-out/invoice/${r.data.reffid}`;
            }else{
                Toast.error(r?.message||'Gagal membuat checkout.');
                if(btn){btn.disabled=false;btn.textContent='Beli Sekarang';}
            }
        }catch(e){
            Toast.error('Terjadi kesalahan.');
            if(btn){btn.disabled=false;btn.textContent='Beli Sekarang';}
        }
    },

    // GOPAY MERCHANT
    _checkFeatureBlock(res,el){
        if(res?.success===false&&res?.message&&(res.message.includes('tidak tersedia')||res.message.includes('langganan')||res.message.includes('expired'))){
            el.innerHTML=`<div class="page-content"><div class="stat-card-wide"><div class="stat-label">AKSES DITOLAK</div><div class="stat-value" style="font-size:18px;color:var(--red)">Fitur Tidak Tersedia</div><div class="stat-sub">${res.message}</div></div><div class="settings-section"><p style="color:var(--text-muted)">Hubungi admin untuk mengubah paket langganan Anda.</p></div></div>`;return true;
        }return false;
    },
    async renderGopay(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const status=await UserAuth.apiFetch('/api/user/gopay/token-status');
        if(this._checkFeatureBlock(status,el))return;
        const hasToken=status?.data?.hasToken;
        const statusClass=hasToken?'success':'';
        const statusIcon=hasToken?'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
        el.innerHTML=`<div class="page-content">
            <div class="glass-card status-card ${statusClass}">
                <div class="status-line"></div>
                <div>
                    <span class="section-label">Status Token GoPay</span>
                    <div class="status-title">${statusIcon}<span>${hasToken?'Token Tersimpan':'Belum Tersimpan'}</span></div>
                    <div class="status-time">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan login untuk setup token'}</div>
                </div>
                ${hasToken?'<button class="btn-status-action" onclick="App.deleteGopayToken()">Hapus</button>':''}
            </div>
            <div class="setup-header">
                <svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Setup GoPay Merchant
            </div>
            <div class="modern-stepper">
                <div class="stepper-track"><div class="stepper-fill" id="gopayProgress"></div></div>
                <div class="stepper-nodes">
                    <div class="node-wrapper"><div class="node active" id="gopayNode1">1</div><span class="node-label">Request OTP</span></div>
                    <div class="node-wrapper"><div class="node" id="gopayNode2">2</div><span class="node-label">Verifikasi</span></div>
                    <div class="node-wrapper"><div class="node" id="gopayNode3">3</div><span class="node-label">Selesai</span></div>
                </div>
            </div>
            <div class="glass-card">
                <div class="form-section active" id="gopayPanel1">
                    <div class="form-group"><label class="form-label">Nomor HP GoPay</label><input class="form-control" id="gopayPhone" placeholder="83xxxxxxx (tanpa 0 atau 62)"></div>
                    <button class="btn-submit" onclick="App.gopayRequestOtp()" id="gopayOtpBtn"><div class="loader"></div><span class="btn-text">Kirim OTP</span></button>
                </div>
                <div class="form-section" id="gopayPanel2">
                    <div class="form-group" style="text-align:center;margin-bottom:24px">
                        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Masukkan kode OTP yang dikirim ke nomor GoPay Anda.</p>
                        <input class="form-control center-text" id="gopayOtp" placeholder="0000" maxlength="6">
                    </div>
                    <button class="btn-submit" onclick="App.gopayVerifyOtp()" id="gopayVerifyBtn"><div class="loader"></div><span class="btn-text">Verifikasi OTP</span></button>
                </div>
                <div class="form-section" id="gopayPanel3">
                    <div class="success-view">
                        <div class="success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                        <h3>Setup Berhasil!</h3>
                        <p>Token GoPay Merchant telah tersimpan dan siap digunakan untuk transaksi otomatis.</p>
                    </div>
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
        document.getElementById('gopayProgress').style.width='50%';
        document.getElementById('gopayNode1').classList.add('completed');document.getElementById('gopayNode1').classList.remove('active');
        document.getElementById('gopayNode1').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        document.getElementById('gopayNode2').classList.add('active');
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
            document.getElementById('gopayProgress').style.width='100%';
            document.getElementById('gopayNode2').classList.add('completed');document.getElementById('gopayNode2').classList.remove('active');
            document.getElementById('gopayNode2').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            document.getElementById('gopayNode3').classList.add('completed');
            document.getElementById('gopayNode3').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            document.getElementById('gopayPanel2').classList.remove('active');
            document.getElementById('gopayPanel3').classList.add('active');
            const card=document.querySelector('.status-card');if(card)card.classList.add('success');
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
        if(this._checkFeatureBlock(status,el))return;
        const hasToken=status?.data?.hasToken;
        const statusClass=hasToken?'success':'';
        const statusIcon=hasToken?'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
        el.innerHTML=`<div class="page-content">
            <div class="glass-card status-card ${statusClass}">
                <div class="status-line"></div>
                <div>
                    <span class="section-label">Status Token OrderKuota</span>
                    <div class="status-title">${statusIcon}<span>${hasToken?'Token Tersimpan':'Belum Tersimpan'}</span></div>
                    <div class="status-time">${hasToken?'Terakhir disimpan: '+(status.data.savedAt?new Date(status.data.savedAt).toLocaleString('id-ID'):'—'):'Silakan login untuk setup token'}</div>
                </div>
                ${hasToken?'<button class="btn-status-action" onclick="App.deleteOrkutToken()">Hapus</button>':''}
            </div>
            <div class="setup-header">
                <svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Setup OrderKuota
            </div>
            <div class="modern-stepper">
                <div class="stepper-track"><div class="stepper-fill" id="orkutProgress"></div></div>
                <div class="stepper-nodes">
                    <div class="node-wrapper"><div class="node active" id="orkutNode1">1</div><span class="node-label">Login</span></div>
                    <div class="node-wrapper"><div class="node" id="orkutNode2">2</div><span class="node-label">Verifikasi OTP</span></div>
                    <div class="node-wrapper"><div class="node" id="orkutNode3">3</div><span class="node-label">Selesai</span></div>
                </div>
            </div>
            <div class="glass-card">
                <div class="form-section active" id="orkutPanel1">
                    <div class="form-group"><label class="form-label">Username OrderKuota</label><input class="form-control" id="orkutUsername" placeholder="Masukkan username"></div>
                    <div class="form-group"><label class="form-label">Password OrderKuota</label><input class="form-control" type="password" id="orkutPassword" placeholder="Password"></div>
                    <button class="btn-submit" onclick="App.orkutRequestOtp()" id="orkutOtpBtn"><div class="loader"></div><span class="btn-text">Login & Kirim OTP</span></button>
                </div>
                <div class="form-section" id="orkutPanel2">
                    <div class="form-group" style="text-align:center;margin-bottom:24px">
                        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Masukkan kode OTP yang dikirim ke WhatsApp/Email Anda.</p>
                        <input class="form-control center-text" id="orkutOtp" placeholder="0000" maxlength="4">
                    </div>
                    <button class="btn-submit" onclick="App.orkutVerifyOtp()" id="orkutVerifyBtn"><div class="loader"></div><span class="btn-text">Verifikasi OTP</span></button>
                </div>
                <div class="form-section" id="orkutPanel3">
                    <div class="success-view">
                        <div class="success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                        <h3>Setup Berhasil!</h3>
                        <p>Token OrderKuota telah tersimpan dan siap digunakan untuk transaksi otomatis.</p>
                    </div>
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
        document.getElementById('orkutProgress').style.width='50%';
        document.getElementById('orkutNode1').classList.add('completed');document.getElementById('orkutNode1').classList.remove('active');
        document.getElementById('orkutNode1').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        document.getElementById('orkutNode2').classList.add('active');
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
            document.getElementById('orkutProgress').style.width='100%';
            document.getElementById('orkutNode2').classList.add('completed');document.getElementById('orkutNode2').classList.remove('active');
            document.getElementById('orkutNode2').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            document.getElementById('orkutNode3').classList.add('completed');
            document.getElementById('orkutNode3').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            document.getElementById('orkutPanel2').classList.remove('active');
            document.getElementById('orkutPanel3').classList.add('active');
            const card=document.querySelector('.status-card');if(card)card.classList.add('success');
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

        // Check subscription
        if(status?.message?.includes('langganan')||status?.message?.includes('expired')){
            el.innerHTML=`<div class="page-content"><div class="stat-card-wide"><div class="stat-label">AKSES DITOLAK</div><div class="stat-value" style="font-size:18px;color:var(--red)">Langganan Tidak Aktif</div><div class="stat-sub">${status.message}</div></div><div class="settings-section"><p style="color:var(--text-muted)">Fitur Digiflazz Tools hanya tersedia untuk user dengan langganan aktif. Silakan hubungi admin untuk mengaktifkan langganan.</p></div></div>`;
            return;
        }

        const has=status?.data?.hasSession;

        if(!has){
            // LOGIN FORM
            el.innerHTML=`<div class="page-content">
                <div class="stat-card-wide"><div class="stat-label">STATUS SESI DIGIFLAZZ</div><div class="stat-value" style="font-size:18px;color:var(--red)">Belum Login</div><div class="stat-sub">Silakan login ke akun Digiflazz Anda</div></div>
                <div class="section-title">${IC.shield} Login Digiflazz</div>
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
        const tabs=['koneksi','pesan','commands','grup','pengaturan'];
        el.innerHTML=`<div class="page-content">
            <div class="wa-tabs">${tabs.map(t=>`<button class="wa-tab${this._waTab===t?' active':''}" onclick="App._waTab='${t}';App._renderWaTabs(document.getElementById('pageContent'))">${t==='koneksi'?'Koneksi':t==='pesan'?'Pesan':t==='commands'?'Commands':t==='grup'?'Grup':t==='pengaturan'?'Pengaturan Bot':t}</button>`).join('')}</div>
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
                <div class="section-title">${IC.shield} Hubungkan WhatsApp</div>
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
            <div class="section-title">${IC.shield} Kirim Pesan</div>
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
        el.innerHTML=`<div class="section-title">${IC.shield} Auto-Reply Commands</div>
            <div class="settings-section">
                <button class="btn btn-primary btn-sm" onclick="App._waShowAddCmd()">Tambah Command</button>
                <div id="waCmdForm" style="display:none;margin-top:16px;background:var(--bg-secondary);padding:16px;border-radius:12px">
                    <div class="form-group"><label class="form-label">Trigger</label><input class="form-input" id="waCmdTrigger" placeholder=".harga"></div>
                    <div class="form-group"><label class="form-label">Tipe Matching</label><select class="form-input" id="waCmdType"><option value="exact">Exact Match</option><option value="startswith">Starts With</option><option value="contains">Contains</option></select></div>
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
                        <div class="form-group" style="margin-bottom:0"><label class="form-label">Akses Pengguna</label><select class="form-input" id="waCmdPermWho"><option value="public">Semua User (Public)</option><option value="owner">Hanya Owner</option><option value="admin">Hanya Admin Grup</option></select></div>
                        <div class="form-group" style="margin-bottom:0"><label class="form-label">Lokasi Chat</label><select class="form-input" id="waCmdPermWhere"><option value="all">Semua Tempat</option><option value="group">Hanya di Grup</option><option value="private">Hanya di Private Chat</option></select></div>
                    </div>
                    
                    <div class="form-group"><label class="form-label">Response (Bisa pakai @user, @jam, @tanggal1, @tanggal2, @botname, @storename)</label><textarea class="form-input" id="waCmdResponse" rows="4" placeholder="Balasan otomatis..."></textarea></div>
                    <button class="btn btn-primary btn-sm" onclick="App._waSaveCmd()" id="waCmdSaveBtn">Simpan</button>
                    <button class="btn btn-sm" onclick="document.getElementById('waCmdForm').style.display='none'" style="margin-left:8px;background:var(--bg-card)">Batal</button>
                    <input type="hidden" id="waCmdEditId">
                </div>
                <div id="waCmdList" style="margin-top:16px"><div class="skeleton" style="height:80px"></div></div>
            </div>`;
        this._loadWaCmds();
    },
    _waShowAddCmd(){document.getElementById('waCmdForm').style.display='block';document.getElementById('waCmdTrigger').value='';document.getElementById('waCmdResponse').value='';document.getElementById('waCmdEditId').value='';document.getElementById('waCmdType').value='exact';document.getElementById('waCmdPermWho').value='public';document.getElementById('waCmdPermWhere').value='all';},
    _waEditCmd(id,trigger,response,type,permWho,permWhere){document.getElementById('waCmdForm').style.display='block';document.getElementById('waCmdTrigger').value=trigger;document.getElementById('waCmdResponse').value=response;document.getElementById('waCmdEditId').value=id;document.getElementById('waCmdType').value=type||'exact';document.getElementById('waCmdPermWho').value=permWho||'public';document.getElementById('waCmdPermWhere').value=permWhere||'all';},
    async _waSaveCmd(){
        const trigger=document.getElementById('waCmdTrigger').value.trim();const response=document.getElementById('waCmdResponse').value;const type=document.getElementById('waCmdType').value;const editId=document.getElementById('waCmdEditId').value;
        const who=document.getElementById('waCmdPermWho').value; const where=document.getElementById('waCmdPermWhere').value;
        if(!trigger||!response)return Toast.error('Trigger dan response wajib diisi!');
        const permissions = { isOwner: who==='owner', isAdmin: who==='admin', isPublic: who==='public', isGroup: where==='group', isPrivate: where==='private' };
        const url=editId?`/api/user/wa/commands/${editId}`:'/api/user/wa/commands';
        const method=editId?'PUT':'POST';
        const r=await UserAuth.apiFetch(url,{method,body:JSON.stringify({trigger,response,type,permissions})});
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
        el.innerHTML=`<table class="data-table"><thead><tr><th>Trigger</th><th>Tipe</th><th>Akses</th><th>Response</th><th>Aksi</th></tr></thead><tbody>${r.data.map(c=>{
            const p=c.permissions||{};
            const who=p.isOwner?'owner':p.isAdmin?'admin':'public';
            const where=p.isGroup?'group':p.isPrivate?'private':'all';
            const badgeWho = who==='owner'?'<span class="badge" style="background:#ff4757;color:#fff">Owner</span>':who==='admin'?'<span class="badge" style="background:#ffa502;color:#fff">Admin</span>':'<span class="badge" style="background:#2ed573;color:#fff">Public</span>';
            const badgeWhere = where==='group'?'<span class="badge" style="background:#3742fa;color:#fff">Grup</span>':where==='private'?'<span class="badge" style="background:#747d8c;color:#fff">Private</span>':'<span class="badge" style="background:#dfe4ea;color:#2f3542">All</span>';
            return `<tr><td><code>${c.trigger}</code></td><td>${c.type}</td><td>${badgeWho} ${badgeWhere}</td><td style="max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.response}</td><td style="white-space:nowrap"><button class="btn btn-sm" onclick="App._waEditCmd('${c.id}','${c.trigger.replace(/'/g,"\\'")}',\`${c.response.replace(/`/g,"\\`")}\`,'${c.type}','${who}','${where}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="App._waDeleteCmd('${c.id}')">Hapus</button></td></tr>`;
        }).join('')}</tbody></table>`;
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
    
    // TAB: PENGATURAN
    async _waTab_pengaturan(){
        const el=document.getElementById('waTabContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        const r=await UserAuth.apiFetch('/api/user/wa/settings');
        const s=r?.data||{botName:'',storeName:'',ownerNumber:''};
        el.innerHTML=`<div class="section-title">${IC.settings} Pengaturan Bot Global</div>
            <div class="settings-section">
                <div class="form-group"><label class="form-label">Nomor Owner (Gunakan awalan 62)</label><input class="form-input" id="waSetOwner" value="${s.ownerNumber}" placeholder="628123456789"></div>
                <div class="form-group"><label class="form-label">Nama Bot (Variabel: @botname)</label><input class="form-input" id="waSetBot" value="${s.botName}" placeholder="Misal: Si Bot Keren"></div>
                <div class="form-group"><label class="form-label">Nama Store / Toko (Variabel: @storename)</label><input class="form-input" id="waSetStore" value="${s.storeName}" placeholder="Misal: Odzre Store"></div>
                <button class="btn btn-primary" onclick="App._waSaveSettings()" id="waSetBtn">Simpan Pengaturan</button>
            </div>
            <div class="info-alert" style="margin-top:16px;background:var(--bg-secondary);padding:16px;border-radius:12px">
                <strong style="color:var(--accent-light)">💡 Variabel Tersedia untuk Response Command:</strong><br><br>
                <code>@user</code> : Tag / Mention pengguna yang mengirim pesan<br>
                <code>@jam</code> : Menampilkan jam realtime (WIB)<br>
                <code>@tanggal1</code> : Menampilkan tanggal format MM/DD/YYYY<br>
                <code>@tanggal2</code> : Menampilkan tanggal format Bulan DD, YYYY<br>
                <code>@botname</code> : Menampilkan Nama Bot dari setting di atas<br>
                <code>@storename</code> : Menampilkan Nama Store dari setting di atas
            </div>`;
    },
    async _waSaveSettings(){
        const ownerNumber=document.getElementById('waSetOwner').value.replace(/[^0-9]/g,'');
        const botName=document.getElementById('waSetBot').value;
        const storeName=document.getElementById('waSetStore').value;
        const btn=document.getElementById('waSetBtn');
        btn.disabled=true; btn.textContent='Menyimpan...';
        const r=await UserAuth.apiFetch('/api/user/wa/settings',{method:'POST',body:JSON.stringify({ownerNumber,botName,storeName})});
        btn.disabled=false; btn.textContent='Simpan Pengaturan';
        if(r?.success) Toast.success('Pengaturan Bot disimpan!');
        else Toast.error(r?.message||'Gagal menyimpan pengaturan');
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
    confirmModal(){if(this._mc)this._mc();},

    // ALIGHT MOTION
    _amEmail: '',
    async renderAlightMotion(){
        const el=document.getElementById('pageContent');
        el.innerHTML='<div class="skeleton" style="height:200px"></div>';
        // Check feature access
        const check=await UserAuth.apiFetch('/api/user/profile');
        if(check?.success){
            const u=check.data;
            if(!u.features||!u.features.allow_alight_motion){
                el.innerHTML=`<div class="page-content"><div class="stat-card-wide"><div class="stat-label">AKSES DITOLAK</div><div class="stat-value" style="font-size:18px;color:var(--red)">Fitur Tidak Tersedia</div><div class="stat-sub">Fitur Alight Motion tidak tersedia di paket langganan Anda.</div></div><div class="settings-section"><p style="color:var(--text-muted)">Upgrade paket langganan Anda untuk mengakses fitur ini.</p><button class="btn btn-primary" onclick="App.navigate('langganan')" style="margin-top:12px">Lihat Paket</button></div></div>`;
                return;
            }
            if(u.subscriptionPlanId && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt)<new Date()){
                el.innerHTML=`<div class="page-content"><div class="stat-card-wide"><div class="stat-label">LANGGANAN EXPIRED</div><div class="stat-value" style="font-size:18px;color:var(--red)">Langganan Tidak Aktif</div><div class="stat-sub">Langganan Anda telah berakhir. Perpanjang untuk menggunakan fitur ini.</div></div><div class="settings-section"><button class="btn btn-primary" onclick="App.navigate('langganan')" style="margin-top:12px">Perpanjang Langganan</button></div></div>`;
                return;
            }
        }
        el.innerHTML=`<div style="max-width:600px">
            <div class="settings-section">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
                    <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:16px">Upgrade Alight Motion Premium</div>
                        <div style="color:var(--text-muted);font-size:12px">Aktifkan akun premium Alight Motion selama 1 tahun</div>
                    </div>
                </div>
                <div id="amStep1">
                    <div class="form-group">
                        <label class="form-label">Email Alight Motion</label>
                        <input class="form-input" id="amEmail" type="email" placeholder="contoh@gmail.com">
                        <div class="form-hint">Masukkan email yang terdaftar di Alight Motion</div>
                    </div>
                    <button class="btn btn-primary" id="amSendBtn" onclick="App.amSend()" style="width:100%">Kirim Verifikasi</button>
                </div>
                <div id="amStep2" style="display:none">
                    <div style="background:var(--bg-tertiary);border-radius:10px;padding:16px;margin-bottom:16px;font-size:13px;line-height:1.7">
                        <div style="font-weight:700;font-size:14px;margin-bottom:10px">Verifikasi Berhasil Dikirim!</div>
                        <div>Ikuti instruksi berikut:</div>
                        <ol style="padding-left:18px;margin:8px 0">
                            <li>Buka aplikasi <strong>Gmail</strong> di ponsel Anda</li>
                            <li>Cek <strong>Folder Spam</strong> (atau kotak masuk utama)</li>
                            <li>Cari email dari: <code style="padding:2px 6px;background:var(--bg-primary);border-radius:4px;font-size:11px">noreply@alight-creative.firebaseapp.com</code></li>
                            <li>Buka email tersebut, lalu <strong>tahan lama</strong> pada tombol <strong>Login ke Alight Creative</strong></li>
                            <li>Pilih <strong>Salin URL</strong> atau <strong>Copy Link Address</strong></li>
                            <li>Kembali ke sini dan paste link di bawah</li>
                        </ol>
                        <div style="color:var(--text-muted);font-size:11px;margin-top:8px">Email: <strong id="amEmailDisplay"></strong></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Verifikasi</label>
                        <textarea class="form-input" id="amLink" rows="3" placeholder="Paste link dari email di sini..." style="font-size:12px;font-family:var(--font-mono);resize:vertical"></textarea>
                    </div>
                    <button class="btn btn-primary" id="amVerifBtn" onclick="App.amVerif()" style="width:100%">Verifikasi Akun</button>
                    <button class="btn btn-secondary" onclick="App.amReset()" style="width:100%;margin-top:8px">Ganti Email</button>
                </div>
                <div id="amSuccess" style="display:none">
                    <div style="text-align:center;padding:24px 0">
                        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#34d399,#059669);margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style="font-weight:700;font-size:18px;margin-bottom:6px">Verifikasi Berhasil!</div>
                        <div style="color:var(--text-muted);font-size:13px;margin-bottom:16px" id="amSuccessMsg"></div>
                        <div style="background:var(--bg-tertiary);border-radius:10px;padding:16px;text-align:left;font-size:13px;line-height:1.7">
                            <div style="font-weight:600;margin-bottom:8px">Langkah Selanjutnya:</div>
                            <ol style="padding-left:18px;margin:0">
                                <li>Buka aplikasi <strong>Alight Motion</strong></li>
                                <li>Pilih opsi <strong>Masuk / Login</strong> menggunakan Email atau Akun Google</li>
                                <li>Masukkan email yang baru saja diverifikasi</li>
                                <li>Akun sekarang telah aktif <strong>Premium 1 Tahun</strong></li>
                            </ol>
                        </div>
                        <button class="btn btn-secondary" onclick="App.amReset()" style="margin-top:16px">Upgrade Email Lain</button>
                    </div>
                </div>
            </div>
        </div>`;
    },
    async amSend(){
        const email=document.getElementById('amEmail').value.trim();
        if(!email)return Toast.error('Email wajib diisi!');
        const btn=document.getElementById('amSendBtn');
        btn.disabled=true;btn.textContent='Mengirim...';
        const r=await UserAuth.apiFetch(`/api/user/alight-motion/send?email=${encodeURIComponent(email)}`);
        btn.disabled=false;btn.textContent='Kirim Verifikasi';
        if(r?.success){
            this._amEmail=email;
            document.getElementById('amStep1').style.display='none';
            document.getElementById('amStep2').style.display='block';
            document.getElementById('amEmailDisplay').textContent=email;
            Toast.success(r.message);
        }else{
            Toast.error(r?.message||'Gagal mengirim verifikasi');
        }
    },
    async amVerif(){
        const link=document.getElementById('amLink').value.trim();
        if(!link)return Toast.error('Link verifikasi wajib diisi!');
        const btn=document.getElementById('amVerifBtn');
        btn.disabled=true;btn.textContent='Memverifikasi...';
        const r=await UserAuth.apiFetch(`/api/user/alight-motion/verif?email=${encodeURIComponent(this._amEmail)}&link=${encodeURIComponent(link)}`);
        btn.disabled=false;btn.textContent='Verifikasi Akun';
        if(r?.success){
            document.getElementById('amStep2').style.display='none';
            document.getElementById('amSuccess').style.display='block';
            const dur=r.data?.duration==='1_year'?'1 Tahun':r.data?.duration||'Premium';
            document.getElementById('amSuccessMsg').innerHTML=`Email <strong>${this._amEmail}</strong> telah berhasil diverifikasi.<br>Durasi keanggotaan: <strong>${dur}</strong>`;
            Toast.success(r.message);
        }else{
            Toast.error(r?.message||'Verifikasi gagal');
        }
    },
    amReset(){
        this._amEmail='';
        document.getElementById('amStep1').style.display='block';
        document.getElementById('amStep2').style.display='none';
        document.getElementById('amSuccess').style.display='none';
        document.getElementById('amEmail').value='';
    }
};

const Toast={
    show(m,t='info'){const c=document.getElementById('toastContainer');const e=document.createElement('div');e.className=`toast toast-${t}`;e.innerHTML=`<span>${m}</span>`;c.appendChild(e);setTimeout(()=>{e.style.opacity='0';setTimeout(()=>e.remove(),300);},3000);},
    success(m){this.show(m,'success');},error(m){this.show(m,'error');},info(m){this.show(m,'info');}
};

document.addEventListener('DOMContentLoaded',()=>App.init());
