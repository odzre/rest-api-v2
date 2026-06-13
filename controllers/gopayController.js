const { sendResponse } = require('../library/response');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = "https://api.gobiz.co.id";

function getHeaders(uniqueId, token = null) {
    return {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "id",
        "authentication-type": "go-id",
        "authorization": token ? `Bearer ${token}` : "Bearer",
        "connection": "keep-alive",
        "content-type": "application/json",
        "gojek-country-code": "ID",
        "gojek-timezone": "Asia/Makassar",
        "host": "api.gobiz.co.id",
        "origin": "https://portal.gofoodmerchant.co.id",
        "referer": "https://portal.gofoodmerchant.co.id/",
        "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        "x-appid": "go-biz-web-dashboard",
        "x-appversion": "transaction-1.22.0-3d465258",
        "x-deviceos": "Web",
        "x-phonemake": "Windows 10 64-bit",
        "x-phonemodel": "Chrome 145.0.0.0 on Windows 10 64-bit",
        "x-platform": "Web",
        "x-uniqueid": uniqueId,
        "x-user-locale": "en-ID",
        "x-user-type": "merchant"
    };
}

async function gobizPost(path, body, uniqueId, token = null) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: getHeaders(uniqueId, token),
        body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
}

/**
 * POST /api/v5/gopay/get-otp
 * Body: { phone_number: "83857794217" }
 * Response includes x_uniqueid — WAJIB dipakai di get-token
 */
const requestOtp = async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) {
            return sendResponse(res, 400, false, 'phone_number wajib diisi (tanpa kode negara, contoh: 83857794217).');
        }

        const uniqueId = uuidv4();
        const payload = {
            client_id: "go-biz-web-new",
            phone_number: phone_number.replace(/^0+/, ''),
            country_code: "62"
        };

        const { status, ok, data } = await gobizPost("/goid/login/request", payload, uniqueId);

        if (!ok) {
            const errMsg = data?.errors?.[0]?.message || data?.data?.errors?.[0]?.message || 'Gagal request OTP.';
            return sendResponse(res, status, false, errMsg, data);
        }

        if (data.data?.access_token) {
            return sendResponse(res, 200, true, 'Login berhasil tanpa OTP.', {
                access_token: data.data.access_token,
                refresh_token: data.data.refresh_token || null,
                x_uniqueid: uniqueId,
                requires_otp: false
            });
        }

        if (data.data?.otp_token) {
            return sendResponse(res, 200, true, 'OTP telah dikirim ke nomor terdaftar. Gunakan x_uniqueid yang sama di endpoint get-token.', {
                requires_otp: true,
                otp_token: data.data.otp_token,
                otp_length: data.data.otp_length || 4,
                otp_expires_in: data.data.otp_expires_in || 300,
                x_uniqueid: uniqueId
            });
        }

        return sendResponse(res, 400, false, 'Response tidak dikenali dari GoPay.', data);
    } catch (err) {
        console.error('[GoPay] OTP error:', err.message);
        return sendResponse(res, 500, false, 'Gagal request OTP: ' + err.message);
    }
};

/**
 * POST /api/v5/gopay/get-token
 * Body: { otp: "1234", otp_token: "xxx", x_uniqueid: "xxx" }
 * x_uniqueid HARUS sama dengan yang dikembalikan dari get-otp
 */
const verifyOtp = async (req, res) => {
    try {
        const { otp, otp_token, x_uniqueid } = req.body;
        if (!otp || !otp_token || !x_uniqueid) {
            return sendResponse(res, 400, false, 'otp, otp_token, dan x_uniqueid wajib diisi. x_uniqueid didapat dari response get-otp.');
        }

        const payload = {
            client_id: "go-biz-web-new",
            data: { otp: String(otp), otp_token },
            grant_type: "otp"
        };

        const { status, ok, data } = await gobizPost("/goid/token", payload, x_uniqueid);

        if (!ok) {
            const errMsg = data?.errors?.[0]?.message || 'Gagal verifikasi OTP.';
            return sendResponse(res, status, false, errMsg, data);
        }

        if (data.access_token) {
            return sendResponse(res, 200, true, 'Verifikasi OTP berhasil! Simpan token ini.', {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                x_uniqueid
            });
        }

        return sendResponse(res, 400, false, 'Verifikasi OTP gagal.', data);
    } catch (err) {
        console.error('[GoPay] Verify error:', err.message);
        return sendResponse(res, 500, false, 'Gagal verifikasi OTP: ' + err.message);
    }
};

/**
 * POST /api/v5/gopay/mutasi
 * Body: { access_token, refresh_token, x_uniqueid, size? }
 */
const getMutasi = async (req, res) => {
    try {
        let { access_token, refresh_token, x_uniqueid, size } = req.body;
        if (!access_token || !refresh_token) {
            return sendResponse(res, 400, false, 'access_token dan refresh_token wajib diisi.');
        }

        // Kalau x_uniqueid tidak dikirim, generate baru (mungkin masih work)
        const uid = x_uniqueid || uuidv4();

        const transactionPayload = {
            from: 0,
            size: parseInt(size) || 20,
            sort: { time: { order: "desc" } },
            included_categories: { incoming: ["transaction_share", "action"] },
            query: [{
                clauses: [
                    {
                        op: "not",
                        clauses: [{
                            clauses: [
                                { field: "metadata.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] },
                                { field: "metadata.gopay.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] }
                            ], op: "or"
                        }]
                    },
                    { field: "metadata.transaction.status", op: "in", value: ["settlement", "capture", "refund", "partial_refund"] },
                    { op: "or", clauses: [{ op: "or", clauses: [{ field: "metadata.transaction.payment_type", op: "in", value: ["qris", "gopay", "offline_credit_card", "offline_debit_card", "credit_card"] }] }] }
                ], op: "and"
            }]
        };

        // Coba dengan access_token
        const result = await gobizPost("/journals/search", transactionPayload, uid, access_token);

        if (result.ok) {
            return sendResponse(res, 200, true, 'Berhasil mengambil data mutasi.', {
                token_refreshed: false,
                transactions: result.data
            });
        }

        // Kalau 401/403, coba refresh token
        if (result.status === 401 || result.status === 403) {
            console.log('[GoPay] Token expired, refreshing...');

            const refreshResult = await gobizPost("/goid/token", {
                client_id: "go-biz-web-new",
                grant_type: "refresh_token",
                data: { refresh_token }
            }, uid);

            if (refreshResult.ok && refreshResult.data.access_token) {
                const newAccessToken = refreshResult.data.access_token;
                const newRefreshToken = refreshResult.data.refresh_token || refresh_token;

                const retryResult = await gobizPost("/journals/search", transactionPayload, uid, newAccessToken);

                if (retryResult.ok) {
                    return sendResponse(res, 200, true, 'Berhasil (token otomatis di-refresh).', {
                        token_refreshed: true,
                        new_tokens: { access_token: newAccessToken, refresh_token: newRefreshToken },
                        transactions: retryResult.data
                    });
                }
            }

            return sendResponse(res, 401, false, 'Token expired dan refresh gagal. Login ulang via /gopay/get-otp.');
        }

        return sendResponse(res, result.status, false, 'Gagal mengambil mutasi.', result.data);
    } catch (err) {
        console.error('[GoPay] Mutasi error:', err.message);
        return sendResponse(res, 500, false, 'Gagal mengambil mutasi: ' + err.message);
    }
};

module.exports = { requestOtp, verifyOtp, getMutasi };
