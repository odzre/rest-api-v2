# ⚡ Express Scalar API

REST API modern dengan **Express.js v5**, database **Upstash Redis**, autentikasi **API Key**, dan **Admin Dashboard** bergaya Scalar.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Redis](https://img.shields.io/badge/Upstash-Redis-DC382D?logo=redis&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Struktur Project](#-struktur-project)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Server](#-menjalankan-server)
- [Admin Dashboard](#-admin-dashboard)
- [API Reference](#-api-reference)
  - [Admin Auth](#1-admin-auth)
  - [API Keys Management](#2-api-keys-management)
  - [Users CRUD](#3-users-crud)
- [Scalar API Docs](#-scalar-api-docs)
- [Database Redis](#-database-redis)
- [Panduan Pengembangan](#-panduan-pengembangan)
  - [Menambah Endpoint Baru](#1-menambah-endpoint-baru)
  - [Menambah Middleware](#2-menambah-middleware)
  - [Mengubah Desain Dashboard](#3-mengubah-desain-dashboard)
  - [Menambah Halaman Dashboard](#4-menambah-halaman-dashboard)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🔐 **Admin Authentication** | Login/logout dengan session token (TTL 24 jam) |
| 🔑 **API Key Management** | Generate, revoke, hapus API key dari dashboard |
| 👥 **Users CRUD** | Tambah, edit, hapus pengguna via API + dashboard |
| 📊 **Dashboard Modern** | Dark theme bergaya Scalar dengan SPA navigation |
| 📋 **Request Logging** | Otomatis mencatat setiap request API |
| 📚 **Scalar API Docs** | Dokumentasi interaktif OpenAPI 3.1 |
| 🗄️ **Upstash Redis** | Database serverless, data persist tanpa server lokal |
| 🔄 **Auto Seed** | Data default (admin, API key, sample user) otomatis dibuat |

---

## 🛠 Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| [Express.js v5](https://expressjs.com/) | Web framework |
| [Upstash Redis](https://upstash.com/) | Serverless Redis database |
| [@scalar/express-api-reference](https://github.com/scalar/scalar) | Dokumentasi API interaktif |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Hash password admin |
| [uuid](https://github.com/uuidjs/uuid) | Generate API key & session token |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variables |
| [nodemon](https://nodemon.io/) | Hot reload saat development |

---

## 📁 Struktur Project

```
express-scalar-api/
│
├── config/
│   └── redis.js              # Koneksi Upstash Redis + helper functions
│
├── controllers/
│   ├── adminController.js    # Login, logout, profile, stats, logs
│   ├── apiKeyController.js   # CRUD API keys
│   └── userController.js     # CRUD users
│
├── middleware/
│   ├── auth.js               # Validasi API key (untuk endpoint publik)
│   └── adminAuth.js          # Validasi session token (untuk admin)
│
├── library/
│   └── response.js           # Helper format response JSON
│
├── routes/
│   ├── adminRoutes.js        # Rute admin (login, stats, logs)
│   ├── apiKeyRoutes.js       # Rute CRUD API key
│   └── userRoutes.js         # Rute CRUD users
│
├── public/                   # Frontend dashboard (static files)
│   ├── css/
│   │   └── dashboard.css     # Design system dark theme
│   ├── js/
│   │   ├── auth.js           # Client-side auth & session
│   │   └── app.js            # SPA logic & page rendering
│   ├── index.html            # Dashboard utama
│   └── login.html            # Halaman login
│
├── .env                      # Environment variables (JANGAN di-commit!)
├── .gitignore
├── index.js                  # Entry point server
├── package.json
└── README.md
```

---

## 🚀 Instalasi & Setup

### Prasyarat

- **Node.js** v18 atau lebih baru — [Download](https://nodejs.org/)
- **Akun Upstash** (gratis) — [Daftar di upstash.com](https://upstash.com/)

### Langkah-langkah

**1. Clone repository**

```bash
git clone <url-repo-kamu>
cd express-scalar-api
```

**2. Install dependencies**

```bash
npm install
```

**3. Konfigurasi environment**

Buat file `.env` di root project (atau edit yang sudah ada):

```env
PORT=3000
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_TTL=86400
```

> ⚠️ **Penting:** Ganti `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dengan credentials dari dashboard Upstash kamu.

**4. Dapatkan credentials Upstash Redis**

1. Buka [console.upstash.com](https://console.upstash.com/)
2. Buat database Redis baru (pilih region terdekat)
3. Copy **REST URL** dan **REST Token** ke file `.env`

---

## ▶️ Menjalankan Server

### Mode Development (dengan hot reload)

```bash
npm run dev
```

### Mode Production

```bash
npm start
```

### Output yang diharapkan

```
✅ Upstash Redis terhubung: PONG
🔐 Admin default berhasil dibuat (admin/admin123)
🔑 API Key default: sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

══════════════════════════════════════════
  🚀 Server berjalan di port 3000
  📊 Dashboard   : http://localhost:3000
  📚 API Docs    : http://localhost:3000/docs
══════════════════════════════════════════
```

> Saat pertama kali dijalankan, server otomatis membuat:
> - Akun admin default
> - 1 API key default
> - 2 user sample (Budi Santoso & Siti Aminah)

---

## 📊 Admin Dashboard

Buka `http://localhost:3000` di browser.

### Login

| Field | Nilai Default |
|-------|---------------|
| Username | `admin` |
| Password | `admin123` |

### Halaman Dashboard

| Halaman | Fungsi |
|---------|--------|
| **Dashboard** | Overview stats (total users, API keys, requests, uptime) + log terbaru |
| **API Keys** | Buat, copy, aktifkan/nonaktifkan, hapus API key |
| **Users** | Tambah, edit, hapus data pengguna |
| **Request Logs** | Lihat riwayat semua request API (method, path, key, IP) |
| **Scalar Docs** | Link ke halaman dokumentasi API interaktif |

---

## 📚 API Reference

Base URL: `http://localhost:3000`

### Format Response

Semua endpoint mengembalikan format JSON yang konsisten:

```json
{
  "success": true,
  "message": "Deskripsi hasil",
  "data": { }
}
```

---

### 1. Admin Auth

Endpoint untuk autentikasi admin dashboard.

#### `POST /api/admin/login`

Login dan dapatkan session token.

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil!",
  "data": {
    "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "username": "admin",
    "expiresIn": "86400 detik"
  }
}
```

#### `POST /api/admin/logout` 🔒

```bash
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Authorization: Bearer <TOKEN>"
```

#### `GET /api/admin/profile` 🔒

```bash
curl http://localhost:3000/api/admin/profile \
  -H "Authorization: Bearer <TOKEN>"
```

#### `GET /api/admin/stats` 🔒

Ambil statistik dashboard (total users, API keys, requests, uptime).

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer <TOKEN>"
```

#### `GET /api/admin/logs?limit=50` 🔒

Ambil request log terbaru. Default limit: 50, max: 200.

```bash
curl "http://localhost:3000/api/admin/logs?limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

> 🔒 = Membutuhkan header `Authorization: Bearer <TOKEN>`

---

### 2. API Keys Management

Endpoint untuk mengelola API key. Semua endpoint membutuhkan admin token.

#### `GET /api/admin/keys` 🔒

List semua API key.

```bash
curl http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer <TOKEN>"
```

#### `POST /api/admin/keys` 🔒

Buat API key baru.

```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"label": "Production Key"}'
```

**Response:**
```json
{
  "success": true,
  "message": "API Key berhasil dibuat.",
  "data": {
    "id": "a1b2c3d4",
    "key": "sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "label": "Production Key",
    "active": true,
    "usageCount": 0,
    "createdAt": "2026-05-04T09:00:00.000Z"
  }
}
```

#### `PATCH /api/admin/keys/:id/revoke` 🔒

Toggle aktif/nonaktif API key.

```bash
curl -X PATCH http://localhost:3000/api/admin/keys/a1b2c3d4/revoke \
  -H "Authorization: Bearer <TOKEN>"
```

#### `DELETE /api/admin/keys/:id` 🔒

Hapus API key secara permanen.

```bash
curl -X DELETE http://localhost:3000/api/admin/keys/a1b2c3d4 \
  -H "Authorization: Bearer <TOKEN>"
```

---

### 3. Users CRUD

Endpoint publik yang membutuhkan API key di header `x-api-key`.

#### `GET /api/users` 🔐

Ambil semua pengguna.

```bash
curl http://localhost:3000/api/users \
  -H "x-api-key: sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### `GET /api/users/:id` 🔐

Ambil pengguna berdasarkan ID.

```bash
curl http://localhost:3000/api/users/1 \
  -H "x-api-key: <API_KEY>"
```

#### `POST /api/users` 🔐

Tambah pengguna baru.

```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Andi Pratama", "role": "Editor"}'
```

#### `PUT /api/users/:id` 🔐

Update data pengguna.

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Budi Updated", "role": "SuperAdmin"}'
```

#### `DELETE /api/users/:id` 🔐

Hapus pengguna.

```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "x-api-key: <API_KEY>"
```

> 🔐 = Membutuhkan header `x-api-key: <API_KEY>`

---

## 📚 Scalar API Docs

Dokumentasi API interaktif tersedia di:

```
http://localhost:3000/docs
```

Fitur:
- Test endpoint langsung dari browser
- Lihat request/response schema
- Coba berbagai autentikasi (API Key & Bearer Token)
- Dark theme yang konsisten dengan dashboard

---

## 🗄️ Database Redis

Data disimpan di Upstash Redis dengan format key-value berikut:

| Key Pattern | Tipe | Keterangan |
|---|---|---|
| `admin:<username>` | JSON String | Data admin (username, passwordHash, createdAt) |
| `session:<token>` | JSON String | Session login (username, loginAt) — TTL: 24 jam |
| `apikey:<id>` | JSON String | Data API key (id, key, label, active, usageCount) |
| `user:<id>` | JSON String | Data pengguna (id, name, role, createdAt) |
| `requestlogs` | List | Log request API (max 200 item terbaru) |
| `counter:users` | Number | Auto-increment ID untuk user baru |

### Helper Functions (`config/redis.js`)

| Function | Kegunaan |
|----------|----------|
| `getJSON(key)` | Ambil & parse data JSON dari Redis |
| `setJSON(key, value, ttl?)` | Simpan data JSON (opsional TTL dalam detik) |
| `deleteKey(key)` | Hapus key |
| `scanKeys(pattern)` | Cari keys berdasarkan pattern (misal `user:*`) |
| `pushToList(key, value, max)` | Tambah item ke list (LIFO, auto-trim) |
| `getList(key, start, end)` | Ambil items dari list |
| `increment(key)` | Increment counter |
| `testConnection()` | Test koneksi ke Redis |

---

## 🔧 Panduan Pengembangan

### 1. Menambah Endpoint Baru

Contoh: menambah endpoint `GET /api/products`

**Step 1 — Buat Controller** (`controllers/productController.js`)

```javascript
const { sendResponse } = require('../library/response');
const { getJSON, setJSON, scanKeys, increment } = require('../config/redis');

const getProducts = async (req, res) => {
    try {
        const keys = await scanKeys('product:*');
        const products = [];
        for (const key of keys) {
            const product = await getJSON(key);
            if (product) products.push(product);
        }
        return sendResponse(res, 200, true, `${products.length} produk ditemukan.`, products);
    } catch (err) {
        return sendResponse(res, 500, false, 'Server error.');
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || !price) {
            return sendResponse(res, 400, false, 'Nama dan harga wajib diisi!');
        }
        const id = await increment('counter:products');
        const product = { id, name, price, createdAt: new Date().toISOString() };
        await setJSON(`product:${id}`, product);
        return sendResponse(res, 201, true, 'Produk ditambahkan.', product);
    } catch (err) {
        return sendResponse(res, 500, false, 'Server error.');
    }
};

module.exports = { getProducts, createProduct };
```

**Step 2 — Buat Routes** (`routes/productRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyApiKey = require('../middleware/auth');

router.use(verifyApiKey); // Proteksi dengan API key

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);

module.exports = router;
```

**Step 3 — Mount di `index.js`**

```javascript
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);
```

**Step 4 — Tambahkan ke OpenAPI spec di `index.js`**

Tambah path baru di objek `openApiSpec.paths`:

```javascript
'/api/products': {
    get: {
        tags: ['Products'],
        summary: 'Ambil semua produk',
        security: [{ ApiKeyAuth: [] }],
        responses: { '200': { description: 'OK' } }
    }
}
```

---

### 2. Menambah Middleware

Contoh: rate limiter sederhana

**Buat file** `middleware/rateLimiter.js`:

```javascript
const requestCounts = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + windowMs;
        }

        record.count++;
        requestCounts.set(key, record);

        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Terlalu banyak request. Coba lagi nanti.'
            });
        }

        next();
    };
};

module.exports = rateLimiter;
```

**Pakai di `index.js`:**

```javascript
const rateLimiter = require('./middleware/rateLimiter');
app.use('/api', rateLimiter(100, 60000)); // 100 req/menit
```

---

### 3. Mengubah Desain Dashboard

Semua styling ada di `public/css/dashboard.css`. Gunakan CSS variables di `:root` untuk mengubah tema:

```css
:root {
    --bg-primary: #0a0a0f;      /* Background utama */
    --bg-secondary: #111118;    /* Background card/sidebar */
    --accent: #8b5cf6;          /* Warna aksen (ungu) */
    --accent-light: #a78bfa;    /* Aksen terang */
    --green: #22c55e;           /* Warna sukses */
    --red: #ef4444;             /* Warna error */
    --radius: 12px;             /* Border radius */
}
```

Untuk membuat **light theme**, override variable-variable di atas:

```css
:root.light {
    --bg-primary: #f8f9fa;
    --bg-secondary: #ffffff;
    --text-primary: #1a1a2e;
    --text-secondary: #4a4a6a;
    --border: #e2e8f0;
}
```

---

### 4. Menambah Halaman Dashboard

Contoh: menambah halaman **Products** di dashboard.

**Step 1 — Tambah nav item di `public/index.html`:**

```html
<a class="nav-item" data-page="products" href="#">
    <span class="nav-icon">📦</span> Products
</a>
```

**Step 2 — Tambah renderer di `public/js/app.js`:**

```javascript
// Di dalam object App, tambah ke fungsi navigate():
const titles = {
    // ... yang sudah ada ...
    products: ['Products', 'Manajemen data produk']
};

const renderers = {
    // ... yang sudah ada ...
    products: () => this.renderProducts()
};

// Tambah method baru:
async renderProducts() {
    const el = document.getElementById('pageContent');
    // Ambil API key aktif
    const keysRes = await Auth.apiFetch('/api/admin/keys');
    const activeKey = keysRes?.data?.find(k => k.active);
    if (!activeKey) return;

    const res = await fetch('/api/products', {
        headers: { 'x-api-key': activeKey.key }
    });
    const data = await res.json();

    el.innerHTML = `<div class="table-container page-content">
        <table>
            <thead><tr><th>ID</th><th>Nama</th><th>Harga</th></tr></thead>
            <tbody>${data.data.map(p => `<tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>Rp ${p.price.toLocaleString()}</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
}
```

---

## 🔒 Environment Variables

| Variable | Default | Keterangan |
|----------|---------|-----------|
| `PORT` | `3000` | Port server |
| `UPSTASH_REDIS_REST_URL` | — | URL REST dari Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | — | Token autentikasi Upstash |
| `ADMIN_USERNAME` | `admin` | Username admin default |
| `ADMIN_PASSWORD` | `admin123` | Password admin default |
| `SESSION_TTL` | `86400` | Durasi session dalam detik (default 24 jam) |

---

## ❓ Troubleshooting

### ❌ `Gagal terhubung ke Upstash Redis`

- Pastikan `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` di `.env` sudah benar
- Cek apakah database Redis di Upstash masih aktif
- Pastikan koneksi internet tersedia

### ❌ `API Key tidak valid`

- Pastikan menggunakan API key yang aktif (cek di dashboard → API Keys)
- Key dikirim via header: `x-api-key: sk-xxxx...`
- Key yang di-revoke tidak bisa digunakan

### ❌ `Session expired`

- Login ulang di dashboard — session berlaku 24 jam (default)
- Ubah `SESSION_TTL` di `.env` untuk memperpanjang durasi

### ❌ `Port sudah digunakan`

```bash
# Ganti port di .env
PORT=3001
```

### ❌ `nodemon tidak ditemukan`

```bash
npm install -D nodemon
# atau jalankan langsung:
node index.js
```

---

## 📄 License

ISC License — Bebas digunakan dan dimodifikasi.
