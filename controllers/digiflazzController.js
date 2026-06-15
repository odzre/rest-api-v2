const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const db = require('../config/database');
const { sendResponse } = require('../library/response');

const DIGI_BASE = 'https://member.digiflazz.com';
const DIGI_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Subscription check — only active subscribers can use Digiflazz
async function requireSubscription(req, res) {
    try {
        const user = await db.getOne('SELECT api_key_active, subscription_expires_at FROM users WHERE id = ?', [req.user.userId]);
        if (!user || !user.api_key_active) {
            sendResponse(res, 403, false, 'Fitur ini hanya tersedia untuk user dengan langganan aktif.');
            return false;
        }
        if (user.subscription_expires_at && new Date() > new Date(user.subscription_expires_at)) {
            sendResponse(res, 403, false, 'Langganan Anda sudah expired. Perpanjang untuk menggunakan fitur ini.');
            return false;
        }
        return true;
    } catch (e) {
        sendResponse(res, 500, false, 'Gagal memeriksa status langganan.');
        return false;
    }
}

// ==========================================
// HELPER: Buat axios client dari cookie JSON
// ==========================================
function createClient(cookieJson) {
    const jar = cookieJson ? CookieJar.fromJSON(JSON.parse(cookieJson)) : new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));
    return { client, jar };
}

async function getCsrf(jar) {
    const cookies = await jar.getCookies(DIGI_BASE);
    const xsrf = cookies.find(c => c.key === 'XSRF-TOKEN');
    return xsrf ? decodeURIComponent(xsrf.value) : '';
}

function digiHeaders(csrfToken, referer) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': DIGI_UA,
        'Referer': referer || `${DIGI_BASE}/buyer-area`,
        'X-XSRF-TOKEN': csrfToken
    };
}

// ==========================================
// SESSION STATUS
// ==========================================
const getSessionStatus = async (req, res) => {
    try {
        const allowed = await requireSubscription(req, res);
        if (!allowed) return;

        const userId = req.user.userId;
        const tokens = await db.getOne('SELECT digi_cookie, digi_saved_at FROM user_tokens WHERE user_id = ?', [userId]);

        if (!tokens || !tokens.digi_cookie) {
            return sendResponse(res, 200, true, 'Belum login Digiflazz.', { hasSession: false });
        }

        // Test apakah session masih valid
        try {
            const { client, jar } = createClient(tokens.digi_cookie);
            const csrf = await getCsrf(jar);
            const profileRes = await client.get(`${DIGI_BASE}/api/v1/buyer/account/profile`, {
                headers: digiHeaders(csrf)
            });
            const profile = profileRes.data.data;
            return sendResponse(res, 200, true, 'Session aktif.', {
                hasSession: true,
                companyName: profile.company_name,
                userName: profile.user?.name,
                balance: profile.balance,
                savedAt: tokens.digi_saved_at
            });
        } catch (e) {
            // Session expired
            await db.run('UPDATE user_tokens SET digi_cookie = NULL, digi_saved_at = NULL WHERE user_id = ?', [userId]);
            return sendResponse(res, 200, true, 'Session expired.', { hasSession: false });
        }
    } catch (err) {
        console.error('[Digiflazz] Session status error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return sendResponse(res, 400, false, 'Username dan password wajib diisi.');

        const { client, jar } = createClient(null);

        // Get initial session
        await client.get(`${DIGI_BASE}/login`, { headers: { 'User-Agent': DIGI_UA } });
        const csrf = await getCsrf(jar);

        // Login
        await client.post(`${DIGI_BASE}/login`, { username, password, remember: false }, {
            headers: digiHeaders(csrf, `${DIGI_BASE}/login`)
        });

        // Save temp cookie for 2FA step
        const tempCookie = JSON.stringify(jar.toJSON());
        const userId = req.user.userId;

        await db.run(
            `INSERT INTO user_tokens (user_id, digi_cookie) VALUES (?, ?) ON DUPLICATE KEY UPDATE digi_cookie = ?`,
            [userId, tempCookie, tempCookie]
        );

        return sendResponse(res, 200, true, 'Login berhasil. Silakan masukkan kode 2FA.', { needs2fa: true });
    } catch (err) {
        if (err.response?.status === 422) {
            return sendResponse(res, 422, false, 'Username atau password salah.');
        }
        console.error('[Digiflazz] Login error:', err.message);
        return sendResponse(res, 500, false, 'Gagal login ke Digiflazz.');
    }
};

// ==========================================
// VERIFY 2FA
// ==========================================
const verify2fa = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return sendResponse(res, 400, false, 'Kode 2FA wajib diisi.');

        const userId = req.user.userId;
        const tokens = await db.getOne('SELECT digi_cookie FROM user_tokens WHERE user_id = ?', [userId]);
        if (!tokens?.digi_cookie) return sendResponse(res, 400, false, 'Sesi login tidak ditemukan. Silakan login ulang.');

        const { client, jar } = createClient(tokens.digi_cookie);
        const csrf = await getCsrf(jar);

        // Submit 2FA
        await client.post(`${DIGI_BASE}/2fa`, { one_time_password: code }, {
            headers: digiHeaders(csrf, `${DIGI_BASE}/2fa`)
        });

        // Sync session — visit buyer-area
        await client.get(`${DIGI_BASE}/buyer-area`, {
            headers: { 'Accept': 'text/html', 'User-Agent': DIGI_UA, 'Referer': `${DIGI_BASE}/2fa` }
        });

        // Save final cookie
        const finalCookie = JSON.stringify(jar.toJSON());
        await db.run('UPDATE user_tokens SET digi_cookie = ?, digi_saved_at = NOW() WHERE user_id = ?', [finalCookie, userId]);

        // Get profile
        const newCsrf = await getCsrf(jar);
        const profileRes = await client.get(`${DIGI_BASE}/api/v1/buyer/account/profile`, {
            headers: digiHeaders(newCsrf)
        });
        const profile = profileRes.data.data;

        return sendResponse(res, 200, true, 'Verifikasi 2FA berhasil!', {
            companyName: profile.company_name,
            userName: profile.user?.name,
            balance: profile.balance
        });
    } catch (err) {
        if (err.response?.status === 422) {
            return sendResponse(res, 422, false, 'Kode 2FA salah atau sudah expired.');
        }
        console.error('[Digiflazz] 2FA error:', err.message);
        return sendResponse(res, 500, false, 'Gagal verifikasi 2FA.');
    }
};

// ==========================================
// LOGOUT
// ==========================================
const logout = async (req, res) => {
    try {
        await db.run('UPDATE user_tokens SET digi_cookie = NULL, digi_saved_at = NULL WHERE user_id = ?', [req.user.userId]);
        return sendResponse(res, 200, true, 'Logout Digiflazz berhasil.');
    } catch (err) {
        console.error('[Digiflazz] Logout error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan.');
    }
};

// ==========================================
// FETCH DATA (categories, brands, types)
// ==========================================
const fetchDigiData = (endpoint) => async (req, res) => {
    try {
        const tokens = await db.getOne('SELECT digi_cookie FROM user_tokens WHERE user_id = ?', [req.user.userId]);
        if (!tokens?.digi_cookie) return sendResponse(res, 401, false, 'Belum login Digiflazz.');

        const { client, jar } = createClient(tokens.digi_cookie);
        const csrf = await getCsrf(jar);

        const response = await client.get(`${DIGI_BASE}/api/v1/buyer/product/${endpoint}`, {
            headers: digiHeaders(csrf)
        });

        return sendResponse(res, 200, true, 'OK', response.data.data);
    } catch (err) {
        if (err.response?.status === 401) {
            await db.run('UPDATE user_tokens SET digi_cookie = NULL, digi_saved_at = NULL WHERE user_id = ?', [req.user.userId]);
            return sendResponse(res, 401, false, 'Session expired. Silakan login ulang.');
        }
        console.error(`[Digiflazz] Fetch ${endpoint} error:`, err.message);
        return sendResponse(res, 500, false, 'Gagal mengambil data.');
    }
};

const getCategories = fetchDigiData('category');
const getBrands = fetchDigiData('brand');
const getTypes = fetchDigiData('type');

// ==========================================
// GET PRODUCTS BY CATEGORY
// ==========================================
const getProducts = async (req, res) => {
    try {
        const tokens = await db.getOne('SELECT digi_cookie FROM user_tokens WHERE user_id = ?', [req.user.userId]);
        if (!tokens?.digi_cookie) return sendResponse(res, 401, false, 'Belum login Digiflazz.');

        const { client, jar } = createClient(tokens.digi_cookie);
        const csrf = await getCsrf(jar);

        const response = await client.get(`${DIGI_BASE}/api/v1/buyer/product/category/${req.params.categoryId}`, {
            headers: digiHeaders(csrf)
        });

        return sendResponse(res, 200, true, 'OK', response.data.data);
    } catch (err) {
        if (err.response?.status === 401) {
            await db.run('UPDATE user_tokens SET digi_cookie = NULL, digi_saved_at = NULL WHERE user_id = ?', [req.user.userId]);
            return sendResponse(res, 401, false, 'Session expired.');
        }
        console.error('[Digiflazz] Get products error:', err.message);
        return sendResponse(res, 500, false, 'Gagal mengambil produk.');
    }
};

// ==========================================
// GENERATE PRODUCT CODE
// ==========================================
function generateProductCode(productName) {
    const cleanName = productName.replace(/\./g, '').replace(/[^a-zA-Z0-9\s]/g, ' ');
    const words = cleanName.trim().split(/\s+/);
    let code = '';
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word.length > 0) {
            if (/^\d+$/.test(word)) {
                code += word;
            } else if (i === 0) {
                code += word.substring(0, 2).toUpperCase();
            } else {
                code += word[0].toUpperCase();
            }
        }
    }
    return code;
}

// ==========================================
// EXECUTE UPDATE (SSE - Server-Sent Events)
// ==========================================
const executeUpdate = async (req, res) => {
    try {
        const tokens = await db.getOne('SELECT digi_cookie FROM user_tokens WHERE user_id = ?', [req.user.userId]);
        if (!tokens?.digi_cookie) {
            return res.status(401).json({ success: false, message: 'Belum login Digiflazz.' });
        }

        const { categoryId, brandId, typeIds, minRating, sortPrice, autoCode, autoMaxPrice } = req.body;
        if (!categoryId || !brandId) {
            return res.status(400).json({ success: false, message: 'Category dan Brand wajib dipilih.' });
        }

        // Setup SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const sendEvent = (type, data) => {
            res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
        };

        let aborted = false;
        req.on('close', () => { aborted = true; });

        const { client, jar } = createClient(tokens.digi_cookie);
        const csrf = await getCsrf(jar);
        const headers = digiHeaders(csrf);

        const fetchApi = async (url) => {
            const response = await client.get(url, { headers });
            return response.data.data;
        };

        // 1. Fetch products
        sendEvent('log', { message: '⏳ Mengambil daftar produk...' });
        let allProducts;
        try {
            allProducts = await fetchApi(`${DIGI_BASE}/api/v1/buyer/product/category/${categoryId}`);
        } catch (e) {
            sendEvent('error', { message: '❌ Gagal mengambil produk. Session mungkin expired.' });
            sendEvent('done', { message: 'Selesai dengan error.' });
            return res.end();
        }

        // 2. Filter by brand & type
        const selectedTypes = typeIds || [];
        let targetProducts = allProducts.filter(p => {
            if (!p.product_details?.brand || !p.product_details?.type) return false;
            const isBrand = p.product_details.brand.id === brandId;
            const isType = selectedTypes.length === 0 ? true : selectedTypes.includes(p.product_details.type.id);
            return isBrand && isType;
        });

        if (targetProducts.length === 0) {
            sendEvent('error', { message: '❌ Tidak ada produk ditemukan untuk filter tersebut.' });
            sendEvent('done', { message: 'Selesai.' });
            return res.end();
        }

        sendEvent('log', { message: `🚀 Ditemukan ${targetProducts.length} produk. Memulai update...\n` });

        let successCount = 0;
        let failCount = 0;

        // 3. Process each product
        for (let i = 0; i < targetProducts.length; i++) {
            if (aborted) {
                sendEvent('log', { message: '\n⚠️ Proses dihentikan oleh user.' });
                break;
            }

            const product = targetProducts[i];
            try {
                // Fetch sellers
                let sellers = await fetchApi(`${DIGI_BASE}/api/v1/buyer/product/seller/${product.id}`);

                // Filter by rating
                const rating = parseFloat(minRating) || 0;
                sellers = sellers.filter(s => s.reviewAvg >= rating);

                if (sellers.length === 0) {
                    sendEvent('log', { message: `⚠️ [SKIP] ${product.product} → Tidak ada seller rating ≥ ${rating}` });
                    continue;
                }

                // Sort
                if (sortPrice === 'termurah') sellers.sort((a, b) => a.price - b.price);
                else if (sortPrice === 'termahal') sellers.sort((a, b) => b.price - a.price);
                else sellers.sort(() => 0.5 - Math.random());

                const seller = sellers[0];
                const finalCode = autoCode ? generateProductCode(product.product) : product.code;
                const finalMaxPrice = autoMaxPrice ? seller.price : 0;

                const updatePayload = {
                    ...product,
                    code: finalCode,
                    max_price: finalMaxPrice,
                    price: seller.price,
                    seller: seller.seller,
                    seller_sku_id: seller.id,
                    seller_sku_id_int: seller.id_int,
                    seller_connection_type: seller.connectionType,
                    seller_sku_code: seller.seller_sku_code,
                    seller_details: seller.seller_details,
                    seller_sku_desc: seller.deskripsi,
                    status_sellerSku: seller.status_sellerSku,
                    start_cut_off: seller.start_cut_off,
                    end_cut_off: seller.end_cut_off,
                    stock: seller.stock,
                    unlimited_stock: seller.unlimited_stock,
                    faktur: seller.faktur,
                    multi: seller.multi,
                    multi_counter: seller.multi_counter,
                    status: true,
                    change: true
                };

                await client.post(`${DIGI_BASE}/api/v1/buyer/product`, updatePayload, { headers });

                successCount++;
                sendEvent('success', {
                    message: `✅ [${i + 1}/${targetProducts.length}] ${product.product}`,
                    detail: `Seller: ${seller.seller} (⭐${seller.reviewAvg}) | Harga: Rp ${seller.price.toLocaleString('id-ID')} | Kode: ${finalCode}`
                });

                // Delay 2 detik antar request
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                failCount++;
                const msg = err.response?.data?.message || err.message;
                sendEvent('error', { message: `❌ [${i + 1}/${targetProducts.length}] ${product.product} → ${msg}` });
            }
        }

        sendEvent('done', {
            message: `\n🎉 Selesai! Berhasil: ${successCount}, Gagal: ${failCount}, Total: ${targetProducts.length}`
        });
        res.end();

    } catch (err) {
        console.error('[Digiflazz] Execute error:', err.message);
        try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: '❌ Error: ' + err.message })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', message: 'Selesai dengan error.' })}\n\n`);
            res.end();
        } catch (_) {}
    }
};

module.exports = {
    getSessionStatus,
    login,
    verify2fa,
    logout,
    getCategories,
    getBrands,
    getTypes,
    getProducts,
    executeUpdate
};
