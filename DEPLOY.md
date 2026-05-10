# 🚀 Panduan Deploy Odzreshop API ke VPS

Panduan lengkap untuk deploy aplikasi ke VPS (Ubuntu/Debian) dengan MySQL dan PM2.

---

## 1. Persiapan VPS

### Login ke VPS
```bash
ssh root@IP_VPS_KAMU
```

### Update sistem
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Install Node.js

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v    # v20.x.x
npm -v     # 10.x.x
```

---

## 3. Install & Setup MySQL

### Install MySQL Server
```bash
sudo apt install -y mysql-server
```

### Amankan MySQL
```bash
sudo mysql_secure_installation
```
Jawab pertanyaan:
- Set root password? → **Y** → masukkan password
- Remove anonymous users? → **Y**
- Disallow root login remotely? → **Y**
- Remove test database? → **Y**
- Reload privilege tables? → **Y**

### Buat Database & User

```bash
sudo mysql -u root -p
```

Masukkan password root, lalu jalankan:

```sql
-- Buat database
CREATE DATABASE odzreshop_api CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Buat user khusus (JANGAN pakai root untuk app!)
CREATE USER 'odzreshop'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT_KAMU';

-- Berikan akses penuh ke database
GRANT ALL PRIVILEGES ON odzreshop_api.* TO 'odzreshop'@'localhost';

-- Terapkan perubahan
FLUSH PRIVILEGES;

-- Keluar
EXIT;
```

**PENTING:** Ganti `PASSWORD_KUAT_KAMU` dengan password yang kuat! Contoh: `OdzR3sh0p#2026!Sql`

### Verifikasi koneksi
```bash
mysql -u odzreshop -p odzreshop_api
# Masukkan password → kalau berhasil masuk, MySQL siap!
EXIT;
```

---

## 4. Upload Project ke VPS

### Opsi A: Via Git (Recommended)
```bash
cd /var/www
git clone https://github.com/USERNAME/express-scalar-api.git odzreshop-api
cd odzreshop-api
```

### Opsi B: Via SCP/SFTP dari komputer lokal
```bash
scp -r ./express-scalar-api root@IP_VPS:/var/www/odzreshop-api
```

### Opsi C: Via FileZilla / WinSCP
1. Buka FileZilla → Connect ke VPS
2. Upload folder project ke `/var/www/odzreshop-api`

---

## 5. Konfigurasi Aplikasi

### Install dependencies
```bash
cd /var/www/odzreshop-api
npm install
```

### Setup file .env
```bash
nano .env
```

Isi:
```env
PORT=3000

# Redis (Upstash) — tetap untuk orders, sessions, rate limits
UPSTASH_REDIS_REST_URL=https://gorgeous-stud-73704.upstash.io
UPSTASH_REDIS_REST_TOKEN=TOKEN_REDIS_KAMU

# Admin default
ADMIN_USERNAME=admin
ADMIN_PASSWORD=PASSWORD_ADMIN_KAMU

# Session TTL (24 jam)
SESSION_TTL=86400

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=odzreshop
DB_PASS=PASSWORD_KUAT_KAMU
DB_NAME=odzreshop_api
```

Simpan: Ctrl+O → Enter → Ctrl+X

---

## 6. Jalankan Migrasi Data (Opsional)

Jika kamu sudah punya data di Redis yang perlu dipindahkan:

```bash
node migrate.js
```

Jalankan 1x saja. Aman dijalankan berulang (skip data yang sudah ada).

---

## 7. Test Jalankan

```bash
node index.js
```

Output yang benar:
```
✅ MySQL terhubung.
✅ MySQL tables ready.
✅ Redis terhubung.
🔐 Admin default berhasil dibuat (admin/admin123)
🔑 API Key default: sk-xxxx-xxxx-xxxx

══════════════════════════════════════════
  🚀 Server berjalan di port 3000
  📊 Dashboard   : http://localhost:3000/admin
  📚 API Docs    : http://localhost:3000/docs
  🗄️  Database    : MySQL (localhost:3306/odzreshop_api)
══════════════════════════════════════════
```

Stop dengan Ctrl+C setelah berhasil.

---

## 8. Install PM2 (Auto-restart 24/7)

```bash
# Install PM2 global
sudo npm install -g pm2

# Jalankan app dengan PM2
pm2 start index.js --name "odzreshop-api"

# Auto-start saat VPS reboot
pm2 startup
pm2 save

# Cek status
pm2 status
pm2 logs odzreshop-api
```

### Perintah PM2 yang sering dipakai:
```bash
pm2 status                    # Lihat status semua app
pm2 logs odzreshop-api        # Lihat log realtime
pm2 restart odzreshop-api     # Restart app
pm2 stop odzreshop-api        # Stop app
pm2 monit                     # Monitor CPU/RAM realtime
```

---

## 9. Setup Nginx (Reverse Proxy + Domain)

### Install Nginx
```bash
sudo apt install -y nginx
```

### Buat konfigurasi site
```bash
sudo nano /etc/nginx/sites-available/odzreshop-api
```

Isi:
```nginx
server {
    listen 80;
    server_name api.odzreshop.com;  # Ganti dengan domain kamu

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 10M;
}
```

Aktifkan:
```bash
sudo ln -s /etc/nginx/sites-available/odzreshop-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 10. Setup SSL HTTPS (Gratis!)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.odzreshop.com
sudo certbot renew --dry-run
```

---

## 11. Firewall

```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

**JANGAN buka port 3306 (MySQL) ke publik!**

---

## Quick Deploy (Copy-Paste)

```bash
# Install semua
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs mysql-server nginx
sudo mysql_secure_installation

# Setup MySQL
sudo mysql -u root -p
# CREATE DATABASE odzreshop_api CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
# CREATE USER 'odzreshop'@'localhost' IDENTIFIED BY 'PASSWORD';
# GRANT ALL PRIVILEGES ON odzreshop_api.* TO 'odzreshop'@'localhost';
# FLUSH PRIVILEGES; EXIT;

# Setup app
cd /var/www/odzreshop-api
npm install
nano .env
node migrate.js   # (opsional)

# Deploy
sudo npm install -g pm2
pm2 start index.js --name "odzreshop-api"
pm2 startup && pm2 save

# Nginx + SSL
sudo nano /etc/nginx/sites-available/odzreshop-api
sudo ln -s /etc/nginx/sites-available/odzreshop-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.odzreshop.com
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| MySQL connection refused | `sudo systemctl start mysql` |
| Port 3000 tidak bisa diakses | `sudo ufw status` → cek firewall |
| PM2 app crash loop | `pm2 logs odzreshop-api --lines 50` |
| Nginx 502 Bad Gateway | `pm2 status` → `pm2 restart odzreshop-api` |
| SSL error | `sudo certbot renew` |
| Tables tidak terbuat | `node -e "require('./config/database').init().then(()=>process.exit())"` |
