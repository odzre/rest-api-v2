const db = require('../config/database');

/**
 * Notification Service
 * Mendukung Telegram (extensible ke WhatsApp, Discord, dll)
 * Config disimpan di MySQL settings table
 */

const SETTINGS_KEY = 'notification';

/**
 * Ambil settings notifikasi dari MySQL
 */
async function getSettings() {
    try {
        const row = await db.getOne('SELECT value FROM settings WHERE `key` = ?', [SETTINGS_KEY]);
        if (!row) return { enabled: false, telegram: { enabled: false, botToken: '', chatId: '' } };
        const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        return val || { enabled: false, telegram: { enabled: false, botToken: '', chatId: '' } };
    } catch {
        return { enabled: false, telegram: { enabled: false, botToken: '', chatId: '' } };
    }
}

/**
 * Format waktu ke WIB
 */
function formatWIB(date) {
    return new Date(date).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
    });
}

/**
 * Kirim notifikasi ke Telegram
 */
async function sendTelegram(botToken, chatId, message) {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('[Notifier] Telegram error:', data.description);
        }
        return data.ok;
    } catch (err) {
        console.error('[Notifier] Telegram send error:', err.message);
        return false;
    }
}

/**
 * Kirim notifikasi request log
 * @param {object} info - { statusCode, method, path, ip, userAgent, error }
 */
async function sendRequestNotification(info) {
    try {
        const settings = await getSettings();
        if (!settings.enabled) return;

        const { statusCode, method, path, ip, userAgent, error, apiKeyLabel } = info;
        const isSuccess = statusCode >= 200 && statusCode < 400;
        const icon = isSuccess ? '✅' : '❌';
        const statusText = isSuccess ? 'SUCCESS' : 'ERROR';
        const timeWIB = formatWIB(new Date());

        const message = `${icon} <b>${statusText} [${statusCode}]</b>

<b>Endpoint:</b>
${method} ${path}

<b>Time (WIB):</b>
${timeWIB}

<b>IP Address:</b>
${ip || 'Unknown'}

<b>API Key:</b>
${apiKeyLabel || '-'}

<b>Info:</b>
${error || `${statusText}: ${method} ${path}`}

<b>User Agent:</b>
${userAgent || 'Unknown'}`;

        // Kirim ke Telegram
        if (settings.telegram?.enabled && settings.telegram.botToken && settings.telegram.chatId) {
            await sendTelegram(settings.telegram.botToken, settings.telegram.chatId, message);
        }

        // Extensible: tambah channel lain di sini
        // if (settings.whatsapp?.enabled) { ... }
        // if (settings.discord?.enabled) { ... }

    } catch (err) {
        console.error('[Notifier] Error:', err.message);
    }
}

/**
 * Test koneksi ke Telegram
 */
async function testTelegram(botToken, chatId) {
    const message = `🔔 <b>Test Notifikasi</b>

Koneksi Telegram berhasil!
Server: Odzreshop API
Waktu: ${formatWIB(new Date())}`;

    return await sendTelegram(botToken, chatId, message);
}

module.exports = { getSettings, sendRequestNotification, testTelegram, SETTINGS_KEY };
