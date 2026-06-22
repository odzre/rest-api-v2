const { sendResponse } = require('../library/response');
const { URLSearchParams } = require('url');

const nodeFetch = typeof fetch === 'undefined' ? require('node-fetch') : fetch;

// ==========================================
// OrderKuota Config (Updated v2)
// ==========================================
const API_URL = 'https://app.orderkuota.com/api/v2';
const HOST = 'app.orderkuota.com';
const USER_AGENT = 'okhttp/4.12.0';

const APP_VERSION_NAME = "26.01.15";
const APP_VERSION_CODE = "260115";
const APP_REG_ID = "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw";
const PHONE_MODEL = "CPH2269";
const PHONE_UUID = "cdzXkBynRECkAODZEHwkeV";
const PHONE_ANDROID_VERSION = "11";
const UI_MODE = "light";

function buildHeaders() {
    return {
        'Host': HOST,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
    };
}

async function okRequest(method, url, body = null) {
    try {
        const res = await nodeFetch(url, {
            method,
            headers: buildHeaders(),
            body: body ? body.toString() : null,
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return { status: res.status, ok: res.ok, data: await res.json() };
        } else {
            return { status: res.status, ok: res.ok, data: await res.text() };
        }
    } catch (e) {
        return { status: 500, ok: false, data: { success: false, message: e.message } };
    }
}

// ==========================================
// ENDPOINTS
// ==========================================

/**
 * POST /api/v5/orderkouta/get-otp-orderkouta
 * Body: { username, password }
 * Login ke OrderKuota, akan mengirim OTP ke nomor terdaftar
 */
const requestOtp = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return sendResponse(res, 400, false, 'username dan password wajib diisi.');
        }

        const payload = new URLSearchParams({
            username: username.trim(), password,
            app_reg_id: APP_REG_ID, app_version_code: APP_VERSION_CODE, app_version_name: APP_VERSION_NAME,
        });

        const result = await okRequest('POST', `${API_URL}/login`, payload);
        const d = result.data;

        if (d?.success === false) {
            return sendResponse(res, 400, false, d.message || 'Gagal login ke OrderKuota.', d.data || null);
        }

        return sendResponse(res, 200, true, d?.message || 'OTP telah dikirim ke nomor terdaftar.', d?.data || d);
    } catch (err) {
        console.error('[OrderKuota] OTP error:', err.message);
        return sendResponse(res, 500, false, 'Gagal request OTP: ' + err.message);
    }
};

/**
 * POST /api/v5/orderkouta/get-token-orderkouta
 * Body: { username, otp }
 * Verifikasi OTP dan dapatkan auth_token
 */
const getToken = async (req, res) => {
    try {
        const { username, otp } = req.body;
        if (!username || !otp) {
            return sendResponse(res, 400, false, 'username dan otp wajib diisi.');
        }

        const payload = new URLSearchParams({
            username: username.trim(), password: otp.trim(),
            app_reg_id: APP_REG_ID, app_version_code: APP_VERSION_CODE, app_version_name: APP_VERSION_NAME,
        });

        const result = await okRequest('POST', `${API_URL}/login`, payload);
        const d = result.data;

        if (d?.success === false) {
            return sendResponse(res, 400, false, d.message || 'Gagal verifikasi OTP.', d.data || null);
        }

        // Extract token from results
        const loginData = d?.results || d;
        const authToken = loginData?.token;

        if (authToken) {
            return sendResponse(res, 200, true, d?.message || 'Login berhasil.', {
                username: username.trim(),
                auth_token: authToken,
                results: loginData,
            });
        }

        return sendResponse(res, 200, true, d?.message || 'Login berhasil.', d?.data || d);
    } catch (err) {
        console.error('[OrderKuota] Token error:', err.message);
        return sendResponse(res, 500, false, 'Gagal verifikasi OTP: ' + err.message);
    }
};

/**
 * POST /api/v5/orderkouta/get-mutasi-orderkouta
 * Body: { username, auth_token, page?, jumlah?, jenis?, dari_tanggal?, ke_tanggal?, keterangan? }
 * Ambil histori transaksi QRIS
 */
const getMutasi = async (req, res) => {
    try {
        const { username, auth_token, page, jumlah, jenis, dari_tanggal, ke_tanggal, keterangan } = req.body;
        if (!username || !auth_token) {
            return sendResponse(res, 400, false, 'username dan auth_token wajib diisi.');
        }

        const userId = auth_token.split(':')[0] || null;

        const payload = new URLSearchParams({
            request_time: Date.now().toString(),
            app_reg_id: APP_REG_ID,
            phone_android_version: PHONE_ANDROID_VERSION,
            app_version_code: APP_VERSION_CODE,
            phone_uuid: PHONE_UUID,
            auth_username: username.trim(),
            auth_token,
            'requests[qris_history][jumlah]': jumlah || '',
            'requests[qris_history][jenis]': jenis || '',
            'requests[qris_history][page]': String(page || 1),
            'requests[qris_history][dari_tanggal]': dari_tanggal || '',
            'requests[qris_history][ke_tanggal]': ke_tanggal || '',
            'requests[qris_history][keterangan]': keterangan || '',
            'requests[0]': 'account',
            app_version_name: APP_VERSION_NAME,
            ui_mode: UI_MODE,
            phone_model: PHONE_MODEL,
        });

        const endpoint = userId ? `${API_URL}/qris/mutasi/${userId}` : `${API_URL}/get`;
        const result = await okRequest('POST', endpoint, payload);
        const d = result.data;

        if (d?.success === false) {
            return sendResponse(res, 400, false, d.message || 'Gagal mengambil mutasi.', d.data || null);
        }

        return sendResponse(res, 200, true, d?.message || 'Berhasil mengambil mutasi QRIS.', d?.data || d);
    } catch (err) {
        console.error('[OrderKuota] Mutasi error:', err.message);
        return sendResponse(res, 500, false, 'Gagal mengambil mutasi: ' + err.message);
    }
};

module.exports = { requestOtp, getToken, getMutasi };
