const { sendResponse } = require('../library/response');
const { getJSON, setJSON, deleteKey } = require('../config/redis');
const db = require('../config/database');
const { encrypt, decrypt } = require('../library/crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ==========================================
// HELPER: Generate 12-digit random API key
// ==========================================
function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 12; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// ==========================================
// AUTH
// ==========================================

/**
 * POST /api/user/register
 * Body: { name, email, whatsapp, password, confirm_password }
 */
const register = async (req, res) => {
    try {
        const { name, email, whatsapp, password, confirm_password } = req.body;

        if (!name || !email || !whatsapp || !password || !confirm_password) {
            return sendResponse(res, 400, false, 'Semua field wajib diisi.');
        }

        if (password !== confirm_password) {
            return sendResponse(res, 400, false, 'Password dan konfirmasi password tidak cocok.');
        }

        if (password.length < 6) {
            return sendResponse(res, 400, false, 'Password minimal 6 karakter.');
        }

        // Cek email sudah terdaftar
        const existing = await db.getOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return sendResponse(res, 400, false, 'Email sudah terdaftar.');
        }

        // Generate API Key & hash password
        const apiKey = generateApiKey();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const result = await db.run(
            'INSERT INTO users (name, email, whatsapp, password_hash, api_key, api_key_active) VALUES (?, ?, ?, ?, ?, 0)',
            [name, email, whatsapp, passwordHash, apiKey]
        );
        const userId = result.insertId;

        // Create API key record (inactive by default)
        await db.run(
            'INSERT INTO api_keys (id, `key`, label, active, expired_days, rate_limit, usage_count, user_id) VALUES (?, ?, ?, 0, 0, 1000, 0, ?)',
            [`user-${userId}`, apiKey, `${name} (User)`, userId]
        );

        return sendResponse(res, 201, true, 'Registrasi berhasil! Silakan beli paket langganan untuk mengaktifkan API Key.', {
            id: userId,
            name,
            email,
            whatsapp,
            apiKey,
            apiKeyActive: false,
        });
    } catch (err) {
        console.error('[UserAuth] Register error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/user/login
 * Body: { email, password }
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, 400, false, 'Email dan password wajib diisi.');
        }

        const foundUser = await db.getOne('SELECT * FROM users WHERE email = ?', [email]);

        if (!foundUser) {
            return sendResponse(res, 401, false, 'Email atau password salah.');
        }

        const isMatch = await bcrypt.compare(password, foundUser.password_hash);
        if (!isMatch) {
            return sendResponse(res, 401, false, 'Email atau password salah.');
        }

        // Buat session token (tetap Redis — TTL-based)
        const token = uuidv4();
        const ttl = parseInt(process.env.SESSION_TTL) || 86400;

        await setJSON(`usersession:${token}`, {
            userId: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            loginAt: new Date().toISOString(),
        }, ttl);

        return sendResponse(res, 200, true, 'Login berhasil!', {
            token,
            name: foundUser.name,
            email: foundUser.email,
            expiresIn: `${ttl} detik`,
        });
    } catch (err) {
        console.error('[UserAuth] Login error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/user/logout
 */
const logout = async (req, res) => {
    try {
        await deleteKey(`usersession:${req.userSessionToken}`);
        return sendResponse(res, 200, true, 'Logout berhasil.');
    } catch (err) {
        console.error('[UserAuth] Logout error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// PROFILE & SETTINGS
// ==========================================

/**
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        // Cek subscription expired
        let apiKeyActive = !!user.api_key_active;
        if (user.subscription_expires_at && new Date() > new Date(user.subscription_expires_at)) {
            apiKeyActive = false;
            await db.run('UPDATE users SET api_key_active = 0, subscription_plan_id = NULL, subscription_expires_at = NULL WHERE id = ?', [user.id]);
            await db.run('UPDATE api_keys SET active = 0 WHERE id = ?', [`user-${user.id}`]);
        }

        // Cek token status
        const tokens = await db.getOne('SELECT * FROM user_tokens WHERE user_id = ?', [user.id]);

        // Get feature permissions from plan
        let features = { allow_gopay: true, allow_orderkouta: true, allow_digiflazz: true, allow_wa_gateway: true, allow_alight_motion: true };
        if (user.subscription_plan_id && apiKeyActive) {
            const plan = await db.getOne('SELECT allow_gopay, allow_orderkouta, allow_digiflazz, allow_wa_gateway, allow_alight_motion FROM subscription_plans WHERE id = ?', [user.subscription_plan_id]);
            if (plan) features = { allow_gopay: !!plan.allow_gopay, allow_orderkouta: !!plan.allow_orderkouta, allow_digiflazz: !!plan.allow_digiflazz, allow_wa_gateway: !!plan.allow_wa_gateway, allow_alight_motion: !!plan.allow_alight_motion };
        } else if (!apiKeyActive) {
            // No active subscription = no restrictions (free tier, only credit watermark)
            features = { allow_gopay: true, allow_orderkouta: true, allow_digiflazz: false, allow_wa_gateway: true, allow_alight_motion: true };
        }

        return sendResponse(res, 200, true, 'Profil user.', {
            id: user.id,
            name: user.name,
            email: user.email,
            whatsapp: user.whatsapp,
            apiKey: user.api_key,
            apiKeyActive,
            subscriptionPlanId: user.subscription_plan_id,
            subscriptionExpiresAt: user.subscription_expires_at,
            hasGopayToken: !!(tokens && tokens.gopay_access_token),
            hasOrderkoutaToken: !!(tokens && tokens.orkut_auth_token),
            features,
            createdAt: user.created_at,
        });
    } catch (err) {
        console.error('[UserAuth] Profile error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * PUT /api/user/profile
 * Body: { name?, whatsapp? }
 */
const updateProfile = async (req, res) => {
    try {
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        const { name, whatsapp } = req.body;
        const newName = name || user.name;
        const newWa = whatsapp || user.whatsapp;

        await db.run('UPDATE users SET name = ?, whatsapp = ? WHERE id = ?', [newName, newWa, user.id]);

        // Update API key label if name changed
        if (name && name !== user.name) {
            await db.run('UPDATE api_keys SET label = ? WHERE id = ?', [`${name} (User)`, `user-${user.id}`]);
        }

        return sendResponse(res, 200, true, 'Profil berhasil diupdate.', {
            name: newName,
            email: user.email,
            whatsapp: newWa,
        });
    } catch (err) {
        console.error('[UserAuth] Update profile error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * PUT /api/user/password
 * Body: { current_password, new_password, confirm_password }
 */
const changePassword = async (req, res) => {
    try {
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        const { current_password, new_password, confirm_password } = req.body;

        if (!current_password || !new_password || !confirm_password) {
            return sendResponse(res, 400, false, 'Semua field wajib diisi.');
        }

        if (new_password !== confirm_password) {
            return sendResponse(res, 400, false, 'Password baru dan konfirmasi tidak cocok.');
        }

        if (new_password.length < 6) {
            return sendResponse(res, 400, false, 'Password minimal 6 karakter.');
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return sendResponse(res, 400, false, 'Password saat ini salah.');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(new_password, salt);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

        return sendResponse(res, 200, true, 'Password berhasil diubah.');
    } catch (err) {
        console.error('[UserAuth] Change password error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// DASHBOARD STATS
// ==========================================

/**
 * GET /api/user/dashboard-stats
 */
const getDashboardStats = async (req, res) => {
    try {
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        // Count API requests from request_logs (MySQL)
        const userLabel = `${user.name} (User)`;
        const logCount = await db.getOne('SELECT COUNT(*) as cnt FROM request_logs WHERE api_key_label = ?', [userLabel]);
        const totalRequests = logCount?.cnt || 0;

        // Count orders — tetap dari Redis (ephemeral)
        const { scanKeys, getJSON: redisGetJSON } = require('../config/redis');
        const orderKeys = await scanKeys('order:*');
        let gopayTotal = 0, gopaySuccess = 0, gopayExpired = 0, gopayRevenue = 0;
        let orkutTotal = 0, orkutSuccess = 0, orkutExpired = 0, orkutRevenue = 0;

        for (const key of orderKeys) {
            const order = await redisGetJSON(key);
            if (!order) continue;

            const isOwner = order._userId == user.id;
            if (!isOwner) continue;

            if (order.type === 'gomerchant') {
                gopayTotal++;
                if (order.status === 'PAID') { gopaySuccess++; gopayRevenue += order.nominal || 0; }
                if (order.status === 'EXPIRED') gopayExpired++;
            } else if (order.type === 'orkut') {
                orkutTotal++;
                if (order.status === 'PAID') { orkutSuccess++; orkutRevenue += order.nominal || 0; }
                if (order.status === 'EXPIRED') orkutExpired++;
            }
        }

        return sendResponse(res, 200, true, 'Dashboard statistics.', {
            totalRequests,
            gopayMerchant: {
                total: gopayTotal,
                success: gopaySuccess,
                expired: gopayExpired,
                revenue: gopayRevenue,
            },
            orderKuota: {
                total: orkutTotal,
                success: orkutSuccess,
                expired: orkutExpired,
                revenue: orkutRevenue,
            },
        });
    } catch (err) {
        console.error('[UserAuth] Dashboard stats error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// SUBSCRIPTION PLANS
// ==========================================

/**
 * GET /api/user/subscription-plans
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await db.query('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY sort_order ASC, id ASC');
        // Parse benefits JSON
        const parsed = plans.map(p => ({
            ...p,
            benefits: typeof p.benefits === 'string' ? JSON.parse(p.benefits) : (p.benefits || []),
        }));
        return sendResponse(res, 200, true, `${parsed.length} paket langganan tersedia.`, parsed);
    } catch (err) {
        console.error('[UserAuth] Subscription plans error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// GOPAY TOKEN MANAGEMENT
// ==========================================

/**
 * POST /api/user/gopay/save-token
 */
const saveGopayToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { access_token, refresh_token, x_uniqueid } = req.body;
        if (!access_token || !refresh_token) {
            return sendResponse(res, 400, false, 'access_token dan refresh_token wajib diisi.');
        }

        const encAt = encrypt(access_token);
        const encRt = encrypt(refresh_token);
        const encUid = x_uniqueid ? encrypt(x_uniqueid) : null;
        const now = new Date();

        // UPSERT: insert or update
        const existing = await db.getOne('SELECT id FROM user_tokens WHERE user_id = ?', [userId]);
        if (existing) {
            await db.run(
                'UPDATE user_tokens SET gopay_access_token = ?, gopay_refresh_token = ?, gopay_x_uniqueid = ?, gopay_saved_at = ? WHERE user_id = ?',
                [encAt, encRt, encUid, now, userId]
            );
        } else {
            await db.run(
                'INSERT INTO user_tokens (user_id, gopay_access_token, gopay_refresh_token, gopay_x_uniqueid, gopay_saved_at) VALUES (?, ?, ?, ?, ?)',
                [userId, encAt, encRt, encUid, now]
            );
        }

        return sendResponse(res, 200, true, 'Token GoPay Merchant berhasil disimpan (encrypted).', {
            hasGopayToken: true,
            savedAt: now.toISOString(),
        });
    } catch (err) {
        console.error('[UserAuth] Save GoPay token error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/user/gopay/token-status
 */
const getGopayTokenStatus = async (req, res) => {
    try {
        const tokens = await db.getOne('SELECT gopay_access_token, gopay_saved_at FROM user_tokens WHERE user_id = ?', [req.user.userId]);
        return sendResponse(res, 200, true, 'Status token GoPay.', {
            hasToken: !!(tokens && tokens.gopay_access_token),
            savedAt: tokens?.gopay_saved_at || null,
        });
    } catch (err) {
        console.error('[UserAuth] GoPay token status error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * DELETE /api/user/gopay/delete-token
 */
const deleteGopayToken = async (req, res) => {
    try {
        await db.run(
            'UPDATE user_tokens SET gopay_access_token = NULL, gopay_refresh_token = NULL, gopay_x_uniqueid = NULL, gopay_saved_at = NULL WHERE user_id = ?',
            [req.user.userId]
        );
        return sendResponse(res, 200, true, 'Token GoPay berhasil dihapus.');
    } catch (err) {
        console.error('[UserAuth] Delete GoPay token error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// ORDERKOUTA TOKEN MANAGEMENT
// ==========================================

/**
 * POST /api/user/orderkouta/save-token
 */
const saveOrderkoutaToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, auth_token } = req.body;
        if (!username || !auth_token) {
            return sendResponse(res, 400, false, 'username dan auth_token wajib diisi.');
        }

        const encUser = encrypt(username);
        const encToken = encrypt(auth_token);
        const now = new Date();

        const existing = await db.getOne('SELECT id FROM user_tokens WHERE user_id = ?', [userId]);
        if (existing) {
            await db.run(
                'UPDATE user_tokens SET orkut_username = ?, orkut_auth_token = ?, orkut_saved_at = ? WHERE user_id = ?',
                [encUser, encToken, now, userId]
            );
        } else {
            await db.run(
                'INSERT INTO user_tokens (user_id, orkut_username, orkut_auth_token, orkut_saved_at) VALUES (?, ?, ?, ?)',
                [userId, encUser, encToken, now]
            );
        }

        return sendResponse(res, 200, true, 'Token OrderKuota berhasil disimpan (encrypted).', {
            hasOrderkoutaToken: true,
            savedAt: now.toISOString(),
        });
    } catch (err) {
        console.error('[UserAuth] Save OrderKuota token error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/user/orderkouta/token-status
 */
const getOrderkoutaTokenStatus = async (req, res) => {
    try {
        const tokens = await db.getOne('SELECT orkut_auth_token, orkut_saved_at FROM user_tokens WHERE user_id = ?', [req.user.userId]);
        return sendResponse(res, 200, true, 'Status token OrderKuota.', {
            hasToken: !!(tokens && tokens.orkut_auth_token),
            savedAt: tokens?.orkut_saved_at || null,
        });
    } catch (err) {
        console.error('[UserAuth] OrderKuota token status error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * DELETE /api/user/orderkouta/delete-token
 */
const deleteOrderkoutaToken = async (req, res) => {
    try {
        await db.run(
            'UPDATE user_tokens SET orkut_username = NULL, orkut_auth_token = NULL, orkut_saved_at = NULL WHERE user_id = ?',
            [req.user.userId]
        );
        return sendResponse(res, 200, true, 'Token OrderKuota berhasil dihapus.');
    } catch (err) {
        console.error('[UserAuth] Delete OrderKuota token error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

// ==========================================
// ADMIN: SUBSCRIPTION PLAN MANAGEMENT
// ==========================================

/** GET /api/admin/subscription-plans */
const adminGetPlans = async (req, res) => {
    try {
        const plans = await db.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC, id ASC');
        const parsed = plans.map(p => ({
            ...p,
            benefits: typeof p.benefits === 'string' ? JSON.parse(p.benefits) : (p.benefits || []),
        }));
        return sendResponse(res, 200, true, `${parsed.length} paket langganan.`, parsed);
    } catch (err) {
        console.error('[Admin] Get plans error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** POST /api/admin/subscription-plans */
const adminCreatePlan = async (req, res) => {
    try {
        const { name, price, duration_days, description, benefits, rate_limit, allow_gopay, allow_orderkouta, allow_digiflazz, allow_wa_gateway, allow_alight_motion, sort_order } = req.body;
        if (!name || !price || !duration_days) {
            return sendResponse(res, 400, false, 'name, price, dan duration_days wajib diisi.');
        }

        const result = await db.run(
            'INSERT INTO subscription_plans (name, price, duration_days, description, benefits, rate_limit, allow_gopay, allow_orderkouta, allow_digiflazz, allow_wa_gateway, allow_alight_motion, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [name, parseInt(price), parseInt(duration_days), description || '', JSON.stringify(benefits || []), parseInt(rate_limit) || 0, allow_gopay ? 1 : 0, allow_orderkouta ? 1 : 0, allow_digiflazz ? 1 : 0, allow_wa_gateway ? 1 : 0, allow_alight_motion ? 1 : 0, parseInt(sort_order) || 0]
        );

        const plan = await db.getOne('SELECT * FROM subscription_plans WHERE id = ?', [result.insertId]);
        plan.benefits = typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : (plan.benefits || []);
        return sendResponse(res, 201, true, 'Paket langganan berhasil dibuat.', plan);
    } catch (err) {
        console.error('[Admin] Create plan error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** PUT /api/admin/subscription-plans/:id */
const adminUpdatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await db.getOne('SELECT * FROM subscription_plans WHERE id = ?', [id]);
        if (!plan) return sendResponse(res, 404, false, 'Paket tidak ditemukan.');

        const { name, price, duration_days, description, benefits, active, rate_limit, allow_gopay, allow_orderkouta, allow_digiflazz, allow_wa_gateway, allow_alight_motion, sort_order } = req.body;
        const newRateLimit = rate_limit !== undefined ? parseInt(rate_limit) : (plan.rate_limit || 0);

        await db.run(
            'UPDATE subscription_plans SET name = ?, price = ?, duration_days = ?, description = ?, benefits = ?, rate_limit = ?, allow_gopay = ?, allow_orderkouta = ?, allow_digiflazz = ?, allow_wa_gateway = ?, allow_alight_motion = ?, sort_order = ?, active = ? WHERE id = ?',
            [
                name !== undefined ? name : plan.name,
                price !== undefined ? parseInt(price) : plan.price,
                duration_days !== undefined ? parseInt(duration_days) : plan.duration_days,
                description !== undefined ? description : plan.description,
                benefits !== undefined ? JSON.stringify(benefits) : (typeof plan.benefits === 'string' ? plan.benefits : JSON.stringify(plan.benefits || [])),
                newRateLimit,
                allow_gopay !== undefined ? (allow_gopay ? 1 : 0) : (plan.allow_gopay ?? 1),
                allow_orderkouta !== undefined ? (allow_orderkouta ? 1 : 0) : (plan.allow_orderkouta ?? 1),
                allow_digiflazz !== undefined ? (allow_digiflazz ? 1 : 0) : (plan.allow_digiflazz ?? 1),
                allow_wa_gateway !== undefined ? (allow_wa_gateway ? 1 : 0) : (plan.allow_wa_gateway ?? 1),
                allow_alight_motion !== undefined ? (allow_alight_motion ? 1 : 0) : (plan.allow_alight_motion ?? 1),
                sort_order !== undefined ? parseInt(sort_order) : (plan.sort_order || 0),
                active !== undefined ? (active ? 1 : 0) : plan.active,
                id
            ]
        );

        // Auto-apply: update rate_limit ke semua API key user yang pakai plan ini
        await db.run(
            'UPDATE api_keys SET rate_limit = ? WHERE id IN (SELECT CONCAT(\'user-\', id) FROM users WHERE subscription_plan_id = ? AND api_key_active = 1)',
            [newRateLimit, id]
        );

        const updated = await db.getOne('SELECT * FROM subscription_plans WHERE id = ?', [id]);
        updated.benefits = typeof updated.benefits === 'string' ? JSON.parse(updated.benefits) : (updated.benefits || []);

        // Hitung berapa user yang ter-update
        const affected = await db.getOne('SELECT COUNT(*) as cnt FROM users WHERE subscription_plan_id = ? AND api_key_active = 1', [id]);
        const affectedCount = affected?.cnt || 0;

        return sendResponse(res, 200, true, `Paket berhasil diupdate.${affectedCount > 0 ? ` Rate limit diterapkan ke ${affectedCount} user.` : ''}`, updated);
    } catch (err) {
        console.error('[Admin] Update plan error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** DELETE /api/admin/subscription-plans/:id */
const adminDeletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await db.getOne('SELECT * FROM subscription_plans WHERE id = ?', [id]);
        if (!plan) return sendResponse(res, 404, false, 'Paket tidak ditemukan.');

        await db.run('DELETE FROM subscription_plans WHERE id = ?', [id]);
        return sendResponse(res, 200, true, 'Paket berhasil dihapus.');
    } catch (err) {
        console.error('[Admin] Delete plan error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** GET /api/admin/users-list */
const adminGetUsers = async (req, res) => {
    try {
        const users = await db.query('SELECT * FROM users ORDER BY id ASC');
        const result = [];
        for (const u of users) {
            const tokens = await db.getOne('SELECT gopay_access_token, orkut_auth_token FROM user_tokens WHERE user_id = ?', [u.id]);
            result.push({
                id: u.id,
                name: u.name,
                email: u.email,
                whatsapp: u.whatsapp,
                apiKey: u.api_key,
                apiKeyActive: !!u.api_key_active,
                subscriptionPlanId: u.subscription_plan_id,
                subscriptionExpiresAt: u.subscription_expires_at,
                hasGopayToken: !!(tokens && tokens.gopay_access_token),
                hasOrderkoutaToken: !!(tokens && tokens.orkut_auth_token),
                createdAt: u.created_at,
            });
        }
        return sendResponse(res, 200, true, `${result.length} user terdaftar.`, result);
    } catch (err) {
        console.error('[Admin] Get users error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** POST /api/admin/activate-subscription */
const adminActivateSubscription = async (req, res) => {
    try {
        const { userId, planId } = req.body;
        if (!userId || !planId) {
            return sendResponse(res, 400, false, 'userId dan planId wajib diisi.');
        }

        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        const plan = await db.getOne('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
        if (!plan) return sendResponse(res, 404, false, 'Paket tidak ditemukan.');

        const expiresAt = new Date(Date.now() + plan.duration_days * 86400000);

        await db.run(
            'UPDATE users SET api_key_active = 1, subscription_plan_id = ?, subscription_expires_at = ? WHERE id = ?',
            [plan.id, expiresAt, user.id]
        );

        await db.run('UPDATE api_keys SET active = 1, expired_days = ?, rate_limit = ?, created_at = ? WHERE id = ?', [plan.duration_days, plan.rate_limit || 0, new Date(), `user-${user.id}`]);

        return sendResponse(res, 200, true, `Langganan ${plan.name} berhasil diaktifkan untuk ${user.name}.`, {
            userId: user.id,
            userName: user.name,
            planName: plan.name,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
        console.error('[Admin] Activate subscription error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** POST /api/admin/deactivate-user */
const adminDeactivateUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

        await db.run('UPDATE users SET api_key_active = 0, subscription_plan_id = NULL, subscription_expires_at = NULL WHERE id = ?', [user.id]);
        await db.run('UPDATE api_keys SET active = 0 WHERE id = ?', [`user-${user.id}`]);

        return sendResponse(res, 200, true, `User ${user.name} berhasil dinonaktifkan.`);
    } catch (err) {
        console.error('[Admin] Deactivate user error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = {
    register, login, logout,
    getProfile, updateProfile, changePassword,
    getDashboardStats, getSubscriptionPlans,
    saveGopayToken, getGopayTokenStatus, deleteGopayToken,
    saveOrderkoutaToken, getOrderkoutaTokenStatus, deleteOrderkoutaToken,
    adminGetPlans, adminCreatePlan, adminUpdatePlan, adminDeletePlan,
    adminGetUsers, adminActivateSubscription, adminDeactivateUser,
};
