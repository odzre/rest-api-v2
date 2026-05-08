require('dotenv').config();

const express = require('express');
const path = require('path');
const { apiReference } = require('@scalar/express-api-reference');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { testConnection, getJSON, setJSON } = require('./config/redis');

// Routes
const adminRoutes = require('./routes/adminRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const gopayRoutes = require('./routes/gopayRoutes');
const orderkoutaRoutes = require('./routes/orderkoutaRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cekidRoutes = require('./routes/cekidRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Notifikasi otomatis ke Telegram/WhatsApp
const notifyOnResponse = require('./middleware/notifier');
app.use(notifyOnResponse);

// ==========================================
// STATIC FILES
// ==========================================
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/image', express.static(path.join(__dirname, 'public', 'image')));

// ==========================================
// ROUTES API
// ==========================================
app.use('/api/admin', adminRoutes);
app.use('/api/admin/keys', apiKeyRoutes);
app.use('/api/v5/gopay', gopayRoutes);
app.use('/api/v5/orderkouta', orderkoutaRoutes);
app.use('/api/v5/payment', paymentRoutes);
// CekID routes mounted at /api/v5 — HARUS di bawah route spesifik agar /gopay, /orderkouta, /payment cocok duluan
app.use('/api/v5', cekidRoutes);

// ==========================================
// REDIRECTS
// ==========================================
app.get('/', (req, res) => res.redirect('/docs'));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));

// ==========================================
// OPENAPI SPEC
// ==========================================
const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'Express Scalar API',
        description: 'REST API dengan autentikasi API Key.\n\n**Semua endpoint membutuhkan API Key** di header `x-api-key`.\n\nUntuk mendapatkan API Key, silakan hubungi admin langsung di **08xxxx**.\n\n---\n\n## GoPay Merchant\nCek mutasi GoPay Merchant via OTP login + Order QRIS dengan auto-polling.\n\n## OrderKuota\nCek mutasi QRIS OrderKuota via OTP login + Order QRIS dengan auto-polling.\n\n## Payment\nBuat QRIS dinamis dari kode QRIS statis.\n\n## Cek ID Game\nCek username/nickname game online dari User ID.',
        version: '5.1.0'
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Local Development' }],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey', in: 'header', name: 'x-api-key',
                description: 'API Key untuk mengakses semua endpoint. Hubungi admin untuk mendapatkan key.'
            }
        }
    },
    security: [{ ApiKeyAuth: [] }],
    tags: [
        { name: 'GoPay Merchant', description: 'Login, verifikasi OTP, cek mutasi, dan order QRIS GoPay Merchant' },
        { name: 'OrderKuota', description: 'Login, verifikasi OTP, cek mutasi, dan order QRIS OrderKuota' },
        { name: 'Payment', description: 'Buat QRIS dinamis dari kode QRIS statis' },
        { name: 'Cek ID Game', description: 'Cek username/nickname game dari User ID & Zone ID' }
    ],
    paths: {
        // ====== GOPAY MERCHANT ======
        '/api/v5/gopay/get-otp-gopaymerchant': {
            post: {
                tags: ['GoPay Merchant'], summary: 'Request OTP',
                description: 'Kirim nomor HP GoPay Merchant untuk mendapatkan OTP.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['phone_number'],
                    properties: { phone_number: { type: 'string', example: '8xxxxxxxxxx', description: 'Nomor HP tanpa kode negara' } }
                }}}},
                responses: {
                    '200': { description: 'OTP dikirim. Response berisi otp_token dan x_uniqueid (wajib dipakai di get-token).' },
                    '401': { description: 'API Key tidak valid' }
                }
            }
        },
        '/api/v5/gopay/get-token-gopaymerchant': {
            post: {
                tags: ['GoPay Merchant'], summary: 'Get Token (Verifikasi OTP)',
                description: 'Kirim OTP untuk mendapatkan access_token dan refresh_token. x_uniqueid HARUS sama dengan response get-otp.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['otp', 'otp_token', 'x_uniqueid'],
                    properties: {
                        otp: { type: 'string', example: '1234' },
                        otp_token: { type: 'string', description: 'Dari response get-otp' },
                        x_uniqueid: { type: 'string', description: 'Dari response get-otp (WAJIB sama)' }
                    }
                }}}},
                responses: { '200': { description: 'Berhasil. Response berisi access_token dan refresh_token.' } }
            }
        },
        '/api/v5/gopay/get-mutasi-gopaymerchant': {
            post: {
                tags: ['GoPay Merchant'], summary: 'Get Mutasi Transaksi',
                description: 'Ambil data mutasi GoPay Merchant. Auto-refresh token jika expired.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['access_token', 'refresh_token'],
                    properties: {
                        access_token: { type: 'string', description: 'Dari get-token' },
                        refresh_token: { type: 'string', description: 'Dari get-token' },
                        x_uniqueid: { type: 'string', description: 'Opsional, recommended' },
                        size: { type: 'integer', default: 20 }
                    }
                }}}},
                responses: {
                    '200': { description: 'Data mutasi berhasil diambil. Cek token_refreshed untuk token baru.' },
                    '401': { description: 'Token expired dan refresh gagal' }
                }
            }
        },

        // ====== ORDERKOUTA ======
        '/api/v5/orderkouta/get-otp-orderkouta': {
            post: {
                tags: ['OrderKuota'], summary: 'Request OTP',
                description: 'Login ke OrderKuota dengan username dan password. OTP akan dikirim ke nomor HP terdaftar.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', description: 'Username OrderKuota' },
                        password: { type: 'string', description: 'Password OrderKuota' }
                    }
                }}}},
                responses: {
                    '200': { description: 'OTP dikirim ke nomor terdaftar.' },
                    '401': { description: 'API Key tidak valid' }
                }
            }
        },
        '/api/v5/orderkouta/get-token-orderkouta': {
            post: {
                tags: ['OrderKuota'], summary: 'Get Token (Verifikasi OTP)',
                description: 'Kirim username dan kode OTP untuk mendapatkan auth_token. Simpan auth_token untuk akses mutasi.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['username', 'otp'],
                    properties: {
                        username: { type: 'string', description: 'Username OrderKuota' },
                        otp: { type: 'string', description: 'Kode OTP yang diterima' }
                    }
                }}}},
                responses: { '200': { description: 'Berhasil. Response berisi auth_token.' } }
            }
        },
        '/api/v5/orderkouta/get-mutasi-orderkouta': {
            post: {
                tags: ['OrderKuota'], summary: 'Get Mutasi QRIS',
                description: 'Ambil histori transaksi QRIS dari OrderKuota.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['username', 'auth_token'],
                    properties: {
                        username: { type: 'string', description: 'Username OrderKuota' },
                        auth_token: { type: 'string', description: 'Token dari get-token' },
                        page: { type: 'integer', default: 1, description: 'Halaman (default: 1)' }
                    }
                }}}},
                responses: { '200': { description: 'Data mutasi QRIS berhasil diambil.' } }
            }
        },

        // ====== PAYMENT ======
        '/api/v5/payment/create-qris': {
            post: {
                tags: ['Payment'], summary: 'Buat QRIS Dinamis',
                description: 'Ubah kode QRIS statis menjadi QRIS dinamis dengan nominal tertentu. Gambar QRIS disimpan sementara dan otomatis dihapus setelah expired.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['nominal', 'code_qris'],
                    properties: {
                        nominal: { type: 'integer', example: 50000, description: 'Nominal pembayaran (Rupiah)' },
                        code_qris: { type: 'string', description: 'Kode QRIS statis (string panjang)' },
                        expired_minutes: { type: 'integer', default: 30, minimum: 1, maximum: 60, description: 'Masa berlaku dalam menit (1-60, default: 30)' }
                    }
                }}}},
                responses: {
                    '200': { description: 'QRIS berhasil dibuat', content: { 'application/json': { schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            message: { type: 'string' },
                            data: { type: 'object', properties: {
                                qris_url: { type: 'string', description: 'URL gambar QRIS (auto-delete setelah expired)' },
                                nominal: { type: 'integer' },
                                expired_minutes: { type: 'integer' },
                                expires_at: { type: 'string', format: 'date-time' },
                                qris_string: { type: 'string', description: 'QRIS string dinamis' }
                            }}
                        }
                    }}}}
                }
            }
        },

        // ====== ORDER ORDERKOUTA ======
        '/api/v5/orderkouta/order-orkut': {
            post: {
                tags: ['OrderKuota'], summary: 'Buat Order QRIS',
                description: 'Buat order QRIS dinamis dan mulai auto-polling mutasi OrderKuota setiap 25 detik. Jika pembayaran ditemukan, status berubah ke PAID dan webhook dikirim (jika diisi).',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['username', 'auth_token', 'nominal', 'code_qris'],
                    properties: {
                        username: { type: 'string', description: 'Username OrderKuota' },
                        auth_token: { type: 'string', description: 'Token dari get-token-orderkouta' },
                        nominal: { type: 'integer', example: 50000, description: 'Nominal pembayaran (Rupiah)' },
                        code_qris: { type: 'string', description: 'Kode QRIS statis' },
                        expired_minutes: { type: 'integer', default: 30, minimum: 1, maximum: 60, description: 'Masa berlaku order (1-60 menit, default: 30)' },
                        webhook_url: { type: 'string', description: 'URL webhook untuk menerima callback saat PAID/EXPIRED (opsional)' }
                    }
                }}}},
                responses: {
                    '200': { description: 'Order berhasil dibuat, response berisi reffid dan QRIS' },
                    '400': { description: 'Parameter tidak lengkap' }
                }
            }
        },
        '/api/v5/orderkouta/status-orkut': {
            get: {
                tags: ['OrderKuota'], summary: 'Cek Status Order',
                description: 'Cek status order berdasarkan reffid. Status: PENDING, PAID, atau EXPIRED.',
                parameters: [
                    { name: 'reffid', in: 'query', required: true, schema: { type: 'string' }, description: 'Reffid dari response order-orkut', example: 'ODZRE-A3F7K9B2X1M4' }
                ],
                responses: {
                    '200': { description: 'Status order ditemukan' },
                    '404': { description: 'Order tidak ditemukan' }
                }
            }
        },

        // ====== ORDER GOPAY MERCHANT ======
        '/api/v5/gopay/order-gomerchant': {
            post: {
                tags: ['GoPay Merchant'], summary: 'Buat Order QRIS',
                description: 'Buat order QRIS dinamis dan mulai auto-polling mutasi GoPay Merchant setiap 25 detik. Token otomatis di-refresh jika expired.',
                requestBody: { required: true, content: { 'application/json': { schema: {
                    type: 'object', required: ['access_token', 'refresh_token', 'nominal', 'code_qris'],
                    properties: {
                        access_token: { type: 'string', description: 'Access token GoPay Merchant' },
                        refresh_token: { type: 'string', description: 'Refresh token GoPay Merchant' },
                        x_uniqueid: { type: 'string', description: 'Unique ID (opsional, auto-generate jika kosong)' },
                        nominal: { type: 'integer', example: 50000, description: 'Nominal pembayaran (Rupiah)' },
                        code_qris: { type: 'string', description: 'Kode QRIS statis' },
                        expired_minutes: { type: 'integer', default: 30, minimum: 1, maximum: 60, description: 'Masa berlaku order (1-60 menit, default: 30)' },
                        webhook_url: { type: 'string', description: 'URL webhook untuk callback (opsional)' }
                    }
                }}}},
                responses: {
                    '200': { description: 'Order berhasil dibuat' },
                    '400': { description: 'Parameter tidak lengkap' }
                }
            }
        },
        '/api/v5/gopay/status-gomerchant': {
            get: {
                tags: ['GoPay Merchant'], summary: 'Cek Status Order',
                description: 'Cek status order berdasarkan reffid.',
                parameters: [
                    { name: 'reffid', in: 'query', required: true, schema: { type: 'string' }, description: 'Reffid dari response order-gomerchant', example: 'ODZRE-A3F7K9B2X1M4' }
                ],
                responses: {
                    '200': { description: 'Status order ditemukan' },
                    '404': { description: 'Order tidak ditemukan' }
                }
            }
        },

        // ====== CEK ID GAME ======
        '/api/v5/list-game': {
            get: {
                tags: ['Cek ID Game'], summary: 'List Game',
                description: 'Ambil daftar semua game yang tersedia untuk cek ID. Response berisi slug, nama game, endpoint, query, dan info apakah butuh zone_id.',
                responses: {
                    '200': { description: 'Daftar game berhasil diambil', content: { 'application/json': { schema: {
                        type: 'object', properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            data: { type: 'array', items: { type: 'object', properties: {
                                name: { type: 'string', example: '+ Arena Breakout (Work Fast)' },
                                slug: { type: 'string', example: 'arena-breakout-gp' },
                                endpoint: { type: 'string', example: '/api/v5/arena-breakout-gp' },
                                query: { type: 'string', example: '?id=xxxx' },
                                hasZoneId: { type: 'boolean', example: false }
                            }}}
                        }
                    }}}}
                }
            }
        },
        '/api/v5/{slug}': {
            get: {
                tags: ['Cek ID Game'], summary: 'Cek ID Game',
                description: 'Cek username/nickname game berdasarkan User ID. Beberapa game membutuhkan Zone ID tambahan (cek hasZoneId di list-game).\n\nContoh: `/api/v5/mobile-legends-mp?id=186866269&zone=6234`',
                parameters: [
                    { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Slug game (dari list-game)', example: 'mobile-legends-mp' },
                    { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'User ID game', example: '186866269' },
                    { name: 'zone', in: 'query', required: false, schema: { type: 'string' }, description: 'Zone/Server ID (jika hasZoneId = true)', example: '6234' }
                ],
                responses: {
                    '200': { description: 'Data ID game berhasil ditemukan' },
                    '400': { description: 'Parameter tidak lengkap' },
                    '404': { description: 'Game atau ID tidak ditemukan' }
                }
            }
        }
    }
};

app.use('/docs', apiReference({ theme: 'purple', spec: { content: openApiSpec } }));

// ==========================================
// SEED DATA
// ==========================================
const seedDefaultData = async () => {
    try {
        const existingAdmin = await getJSON(`admin:${process.env.ADMIN_USERNAME || 'admin'}`);
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);
            await setJSON(`admin:${process.env.ADMIN_USERNAME || 'admin'}`, {
                username: process.env.ADMIN_USERNAME || 'admin', passwordHash, createdAt: new Date().toISOString()
            });
            console.log('🔐 Admin default berhasil dibuat (admin/admin123)');
        } else { console.log('🔐 Admin sudah ada, skip seed.'); }

        const { scanKeys } = require('./config/redis');
        const existingKeys = await scanKeys('apikey:*');
        if (existingKeys.length === 0) {
            const defaultKey = {
                id: 'default', key: `sk-${uuidv4()}`, label: 'Default Key',
                active: true, expiredDays: 0, rateLimit: 0, expiresAt: null,
                usageCount: 0, lastUsed: null, createdAt: new Date().toISOString()
            };
            await setJSON('apikey:default', defaultKey);
            console.log(`🔑 API Key default: ${defaultKey.key}`);
        } else { console.log(`🔑 ${existingKeys.length} API key sudah ada, skip seed.`); }
    } catch (err) { console.error('⚠️  Error saat seed:', err.message, err.stack); }
};

// ==========================================
// START
// ==========================================
const startServer = async () => {
    try {
        const connected = await testConnection();
        if (!connected) console.error('⚠️  Redis tidak terhubung.');
        await seedDefaultData();
        app.listen(PORT, () => {
            console.log('');
            console.log('══════════════════════════════════════════');
            console.log(`  🚀 Server berjalan di port ${PORT}`);
            console.log(`  📊 Dashboard   : http://localhost:${PORT}/admin`);
            console.log(`  📚 API Docs    : http://localhost:${PORT}/docs`);
            console.log(`  🔗 API Base    : http://localhost:${PORT}/api/v5/`);
            console.log('══════════════════════════════════════════');
            console.log('');
        });
    } catch (err) { console.error('❌ Gagal start:', err.message, err.stack); }
};

startServer();