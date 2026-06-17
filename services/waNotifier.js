/**
 * WA Notifier Service
 * Handles automated WhatsApp notifications for subscription events
 */
const db = require('../config/database');
const waGateway = require('./waGateway');

const SETTINGS_KEY = 'wa_notifications';

const DEFAULT_TEMPLATES = {
    payment_pending: {
        enabled: true,
        text: 'Halo *@user*, pesanan kamu untuk paket *@paket* sebesar *@nominal* sedang menunggu pembayaran.\n\nRef: @reffid\nBayar di: @url\n\nSegera selesaikan pembayaran sebelum expired.'
    },
    payment_success: {
        enabled: true,
        text: 'Pembayaran berhasil! ✅\n\nPaket *@paket* telah aktif untuk *@user*.\nNominal: *@nominal*\nBerlaku hingga: *@tanggalexpired*\nRef: @reffid\n\nTerima kasih!'
    },
    expiring_soon: {
        enabled: true,
        days_before: 3,
        text: 'Halo *@user*, langganan paket *@paket* kamu akan habis dalam *@sisawaktu*.\n\nPerpanjang sekarang: @url'
    },
    subscription_expired: {
        enabled: true,
        text: 'Halo *@user*, langganan paket *@paket* kamu telah berakhir.\n\nPerpanjang untuk tetap menggunakan layanan: @url'
    }
};

/**
 * Get notification settings from DB
 */
async function getSettings() {
    try {
        const row = await db.getOne("SELECT `value` FROM settings WHERE `key` = ?", [SETTINGS_KEY]);
        if (!row) return { admin_user_id: null, templates: DEFAULT_TEMPLATES };
        const data = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        // Merge defaults for any missing templates
        if (!data.templates) data.templates = {};
        for (const key of Object.keys(DEFAULT_TEMPLATES)) {
            if (!data.templates[key]) data.templates[key] = DEFAULT_TEMPLATES[key];
        }
        return data;
    } catch (err) {
        console.error('[WaNotifier] getSettings error:', err.message);
        return { admin_user_id: null, templates: DEFAULT_TEMPLATES };
    }
}

/**
 * Save notification settings to DB
 */
async function saveSettings(data) {
    const jsonStr = JSON.stringify(data);
    await db.run(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [SETTINGS_KEY, jsonStr]
    );
}

/**
 * Format currency
 */
function formatRp(amount) {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

/**
 * Format date to Indonesian locale
 */
function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Calculate remaining days
 */
function sisaHari(expiresAt) {
    if (!expiresAt) return '0 hari';
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} hari` : '0 hari';
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template, vars) {
    return template
        .replace(/@user/g, vars.user || '-')
        .replace(/@nominal/g, vars.nominal || '-')
        .replace(/@tanggalexpired/g, vars.tanggalexpired || '-')
        .replace(/@sisawaktu/g, vars.sisawaktu || '-')
        .replace(/@status/g, vars.status || '-')
        .replace(/@paket/g, vars.paket || '-')
        .replace(/@reffid/g, vars.reffid || '-')
        .replace(/@url/g, vars.url || '-');
}

/**
 * Send a notification by type
 * @param {string} type - payment_pending | payment_success | expiring_soon | subscription_expired
 * @param {object} vars - template variables
 * @param {string} toNumber - WA number to send to
 */
async function sendNotification(type, vars, toNumber) {
    try {
        if (!toNumber) {
            console.log(`[WaNotifier] Skip ${type}: no WA number`);
            return false;
        }

        const settings = await getSettings();
        if (!settings.admin_user_id) {
            console.log(`[WaNotifier] Skip ${type}: admin_user_id not configured`);
            return false;
        }

        const template = settings.templates?.[type];
        if (!template || !template.enabled) {
            console.log(`[WaNotifier] Skip ${type}: disabled or not found`);
            return false;
        }

        const message = replaceVariables(template.text, vars);
        await waGateway.sendMessage(settings.admin_user_id, toNumber, message);
        console.log(`[WaNotifier] Sent ${type} to ${toNumber}`);
        return true;
    } catch (err) {
        console.error(`[WaNotifier] Failed to send ${type} to ${toNumber}:`, err.message);
        return false;
    }
}

/**
 * Send payment pending notification
 */
async function notifyPaymentPending(user, order, checkoutUrl) {
    if (!user?.whatsapp) return;
    await sendNotification('payment_pending', {
        user: user.name,
        nominal: formatRp(order.nominal),
        paket: order.plan_name,
        reffid: order.reffid,
        url: checkoutUrl,
    }, user.whatsapp);
}

/**
 * Send payment success notification
 */
async function notifyPaymentSuccess(userId, order, expiresAt) {
    try {
        const user = await db.getOne('SELECT name, whatsapp FROM users WHERE id = ?', [userId]);
        if (!user?.whatsapp) return;
        await sendNotification('payment_success', {
            user: user.name,
            nominal: formatRp(order.nominal),
            paket: order.plan_name,
            reffid: order.reffid,
            tanggalexpired: formatTanggal(expiresAt),
            status: 'PAID',
        }, user.whatsapp);
    } catch (err) {
        console.error('[WaNotifier] notifyPaymentSuccess error:', err.message);
    }
}

/**
 * Cron: check expiring subscriptions and send notifications
 * Also auto-creates renewal checkout URL
 */
async function checkExpiringSubscriptions(req) {
    try {
        const settings = await getSettings();
        if (!settings.admin_user_id) return;

        const daysBefore = settings.templates?.expiring_soon?.days_before || 3;
        if (!settings.templates?.expiring_soon?.enabled) return;

        // Find users whose subscription expires within X days and are still active
        const users = await db.query(
            `SELECT u.id, u.name, u.whatsapp, u.subscription_plan_id, u.subscription_expires_at,
                    sp.name as plan_name, sp.price
             FROM users u
             LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
             WHERE u.api_key_active = 1
               AND u.subscription_expires_at IS NOT NULL
               AND u.subscription_expires_at > NOW()
               AND u.subscription_expires_at <= DATE_ADD(NOW(), INTERVAL ? DAY)
               AND u.whatsapp IS NOT NULL AND u.whatsapp != ''`,
            [daysBefore]
        );

        if (users.length === 0) return;
        console.log(`[WaNotifier] Found ${users.length} users with expiring subscriptions`);

        const host = req ? `${req.protocol}://${req.get('host')}` : process.env.BASE_URL || 'https://helper.odzre.my.id';

        for (const user of users) {
            // Check if we already notified today (use Redis)
            const { getJSON, setJSON } = require('../config/redis');
            const notifKey = `wa_notif_expiring:${user.id}:${new Date().toISOString().slice(0, 10)}`;
            const alreadySent = await getJSON(notifKey);
            if (alreadySent) continue;

            // Create renewal URL
            const renewUrl = `${host}/user/dashboard#langganan`;

            await sendNotification('expiring_soon', {
                user: user.name,
                paket: user.plan_name || 'Langganan',
                tanggalexpired: formatTanggal(user.subscription_expires_at),
                sisawaktu: sisaHari(user.subscription_expires_at),
                url: renewUrl,
            }, user.whatsapp);

            // Mark as notified today
            await setJSON(notifKey, { sent: true }, 86400);

            // Delay between sends
            await new Promise(r => setTimeout(r, 3000));
        }
    } catch (err) {
        console.error('[WaNotifier] checkExpiringSubscriptions error:', err.message);
    }
}

/**
 * Cron: check expired subscriptions, deactivate and notify
 */
async function checkExpiredSubscriptions(req) {
    try {
        const settings = await getSettings();
        if (!settings.admin_user_id) return;

        // Find users whose subscription just expired (still active but past expiry)
        const users = await db.query(
            `SELECT u.id, u.name, u.whatsapp, u.subscription_plan_id, u.subscription_expires_at,
                    sp.name as plan_name
             FROM users u
             LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
             WHERE u.api_key_active = 1
               AND u.subscription_expires_at IS NOT NULL
               AND u.subscription_expires_at < NOW()`
        );

        if (users.length === 0) return;
        console.log(`[WaNotifier] Found ${users.length} expired subscriptions to deactivate`);

        const host = req ? `${req.protocol}://${req.get('host')}` : process.env.BASE_URL || 'https://helper.odzre.my.id';

        for (const user of users) {
            // Deactivate
            await db.run('UPDATE users SET api_key_active = 0 WHERE id = ?', [user.id]);
            await db.run('UPDATE api_keys SET active = 0 WHERE user_id = ?', [user.id]);
            console.log(`[WaNotifier] Deactivated user ${user.id} (${user.name})`);

            // Send notification if enabled and has WA number
            if (settings.templates?.subscription_expired?.enabled && user.whatsapp) {
                const renewUrl = `${host}/user/dashboard#langganan`;

                await sendNotification('subscription_expired', {
                    user: user.name,
                    paket: user.plan_name || 'Langganan',
                    tanggalexpired: formatTanggal(user.subscription_expires_at),
                    sisawaktu: '0 hari',
                    status: 'EXPIRED',
                    url: renewUrl,
                }, user.whatsapp);

                await new Promise(r => setTimeout(r, 3000));
            }
        }
    } catch (err) {
        console.error('[WaNotifier] checkExpiredSubscriptions error:', err.message);
    }
}

/**
 * Send broadcast to all members
 */
async function sendBroadcast(message, delayMs = 3000) {
    const settings = await getSettings();
    if (!settings.admin_user_id) throw new Error('Admin user ID belum dikonfigurasi.');

    const users = await db.query(
        "SELECT id, name, whatsapp FROM users WHERE whatsapp IS NOT NULL AND whatsapp != ''"
    );

    if (users.length === 0) throw new Error('Tidak ada user dengan nomor WhatsApp.');

    const numbers = users.map(u => u.whatsapp);
    const results = await waGateway.broadcast(settings.admin_user_id, numbers, message, delayMs);
    return { total: numbers.length, results };
}

module.exports = {
    getSettings,
    saveSettings,
    replaceVariables,
    sendNotification,
    notifyPaymentPending,
    notifyPaymentSuccess,
    checkExpiringSubscriptions,
    checkExpiredSubscriptions,
    sendBroadcast,
    DEFAULT_TEMPLATES,
};
