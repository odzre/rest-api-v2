const { sendResponse } = require('../library/response');
const { setJSON, deleteKey } = require('../config/redis');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getSettings, testTelegram, SETTINGS_KEY } = require('../library/notifier');

/**
 * POST /api/admin/login
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendResponse(res, 400, false, 'Username dan password wajib diisi.');
        }

        const admin = await db.getOne('SELECT * FROM admins WHERE username = ?', [username]);

        if (!admin) {
            return sendResponse(res, 401, false, 'Username atau password salah.');
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);

        if (!isMatch) {
            return sendResponse(res, 401, false, 'Username atau password salah.');
        }

        // Buat session token (tetap Redis — TTL-based)
        const token = uuidv4();
        const ttl = parseInt(process.env.SESSION_TTL) || 86400;

        await setJSON(`session:${token}`, {
            username: admin.username,
            loginAt: new Date().toISOString()
        }, ttl);

        return sendResponse(res, 200, true, 'Login berhasil!', {
            token,
            username: admin.username,
            expiresIn: `${ttl} detik`
        });
    } catch (err) {
        console.error('[Admin] Login error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/admin/logout
 */
const logout = async (req, res) => {
    try {
        await deleteKey(`session:${req.sessionToken}`);
        return sendResponse(res, 200, true, 'Logout berhasil.');
    } catch (err) {
        console.error('[Admin] Logout error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/profile
 */
const getProfile = async (req, res) => {
    try {
        const admin = await db.getOne('SELECT * FROM admins WHERE username = ?', [req.admin.username]);
        if (!admin) {
            return sendResponse(res, 404, false, 'Admin tidak ditemukan.');
        }
        return sendResponse(res, 200, true, 'Profil admin.', {
            username: admin.username,
            createdAt: admin.created_at
        });
    } catch (err) {
        console.error('[Admin] Profile error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
    try {
        const userCount = await db.getOne('SELECT COUNT(*) as cnt FROM users');
        const apiKeyCount = await db.getOne('SELECT COUNT(*) as cnt FROM api_keys');
        const activeKeyCount = await db.getOne('SELECT COUNT(*) as cnt FROM api_keys WHERE active = 1');
        const logCount = await db.getOne('SELECT COUNT(*) as cnt FROM request_logs');

        return sendResponse(res, 200, true, 'Dashboard statistics.', {
            totalUsers: userCount?.cnt || 0,
            totalApiKeys: apiKeyCount?.cnt || 0,
            activeApiKeys: activeKeyCount?.cnt || 0,
            totalRequests: logCount?.cnt || 0,
            serverUptime: Math.floor(process.uptime()),
            serverStartedAt: new Date(Date.now() - process.uptime() * 1000).toISOString()
        });
    } catch (err) {
        console.error('[Admin] Stats error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/logs
 */
const getRequestLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await db.query('SELECT * FROM request_logs ORDER BY id DESC LIMIT ?', [limit]);
        return sendResponse(res, 200, true, `${logs.length} log terbaru.`, logs);
    } catch (err) {
        console.error('[Admin] Logs error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/notification-settings
 */
const getNotificationSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        return sendResponse(res, 200, true, 'Notification settings.', settings);
    } catch (err) {
        console.error('[Admin] Notification settings error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * PUT /api/admin/notification-settings
 */
const updateNotificationSettings = async (req, res) => {
    try {
        const { enabled, telegram } = req.body;

        const settings = {
            enabled: !!enabled,
            telegram: {
                enabled: !!telegram?.enabled,
                botToken: telegram?.botToken || '',
                chatId: telegram?.chatId || '',
            },
        };

        // Upsert into settings table
        await db.run(
            'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
            [SETTINGS_KEY, JSON.stringify(settings), JSON.stringify(settings)]
        );
        return sendResponse(res, 200, true, 'Notification settings berhasil diupdate.', settings);
    } catch (err) {
        console.error('[Admin] Update notification settings error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/admin/notification-test
 */
const testNotification = async (req, res) => {
    try {
        const { botToken, chatId } = req.body;

        if (!botToken || !chatId) {
            return sendResponse(res, 400, false, 'botToken dan chatId wajib diisi.');
        }

        const success = await testTelegram(botToken, chatId);

        if (success) {
            return sendResponse(res, 200, true, 'Test notifikasi berhasil! Cek Telegram kamu.');
        } else {
            return sendResponse(res, 400, false, 'Gagal mengirim notifikasi. Cek bot token dan chat ID.');
        }
    } catch (err) {
        console.error('[Admin] Test notification error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { login, logout, getProfile, getDashboardStats, getRequestLogs, getNotificationSettings, updateNotificationSettings, testNotification };
