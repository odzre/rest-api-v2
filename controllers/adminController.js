const { sendResponse } = require('../library/response');
const { getJSON, setJSON, deleteKey, scanKeys } = require('../config/redis');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getSettings, testTelegram, SETTINGS_KEY } = require('../library/notifier');

/**
 * POST /api/admin/login
 * Login admin dan dapatkan session token
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendResponse(res, 400, false, 'Username dan password wajib diisi.');
        }

        const admin = await getJSON(`admin:${username}`);

        if (!admin) {
            return sendResponse(res, 401, false, 'Username atau password salah.');
        }

        const isMatch = await bcrypt.compare(password, admin.passwordHash);

        if (!isMatch) {
            return sendResponse(res, 401, false, 'Username atau password salah.');
        }

        // Buat session token
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
 * Hapus session token
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
 * Ambil profil admin yang sedang login
 */
const getProfile = async (req, res) => {
    try {
        const admin = await getJSON(`admin:${req.admin.username}`);
        if (!admin) {
            return sendResponse(res, 404, false, 'Admin tidak ditemukan.');
        }
        return sendResponse(res, 200, true, 'Profil admin.', {
            username: admin.username,
            createdAt: admin.createdAt
        });
    } catch (err) {
        console.error('[Admin] Profile error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
const getDashboardStats = async (req, res) => {
    try {
        const userKeys = await scanKeys('user:*');
        const apiKeyKeys = await scanKeys('apikey:*');

        // Hitung API key aktif
        let activeKeys = 0;
        for (const key of apiKeyKeys) {
            const data = await getJSON(key);
            if (data && data.active) activeKeys++;
        }

        // Hitung total request dari log
        const { redis } = require('../config/redis');
        const totalLogs = await redis.llen('requestlogs');

        return sendResponse(res, 200, true, 'Dashboard statistics.', {
            totalUsers: userKeys.length,
            totalApiKeys: apiKeyKeys.length,
            activeApiKeys: activeKeys,
            totalRequests: totalLogs || 0,
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
 * Ambil request logs terbaru
 */
const getRequestLogs = async (req, res) => {
    try {
        const { getList } = require('../config/redis');
        const limit = parseInt(req.query.limit) || 50;
        const logs = await getList('requestlogs', 0, limit - 1);
        return sendResponse(res, 200, true, `${logs.length} log terbaru.`, logs);
    } catch (err) {
        console.error('[Admin] Logs error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/admin/notification-settings
 * Ambil konfigurasi notifikasi
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
 * Update konfigurasi notifikasi
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

        await setJSON(SETTINGS_KEY, settings);
        return sendResponse(res, 200, true, 'Notification settings berhasil diupdate.', settings);
    } catch (err) {
        console.error('[Admin] Update notification settings error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/admin/notification-test
 * Test kirim notifikasi ke Telegram
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
