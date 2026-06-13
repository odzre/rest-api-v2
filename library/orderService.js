const crypto = require('crypto');
const { getJSON, setJSON } = require('../config/redis');
const nodeFetch = require('node-fetch');
const { URLSearchParams } = require('url');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const db = require('../config/database');
const { encrypt } = require('./crypto');

const activePollers = new Map();
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'image');

// ==========================================
// REFFID GENERATOR: ODZRE- + 12 alphanumeric
// ==========================================
function generateReffId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ODZRE-';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==========================================
// QRIS HELPERS
// ==========================================
function convertCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

function convertStaticToDynamic(amount, codeqr) {
    let qrisData = codeqr.slice(0, -4);
    const step1 = qrisData.replace("010211", "010212");
    const step2 = step1.split("5802ID");
    const amountStr = amount.toString();
    const uang = "54" + ("0" + amountStr.length).slice(-2) + amountStr + "5802ID";
    const final = step2[0] + uang + step2[1];
    return final + convertCRC16(final);
}

async function generateQrisImage(dynamicQris, req) {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const fileId = crypto.randomBytes(5).toString('hex');
    const fileName = `qris-${fileId}.png`;
    const filePath = path.join(IMAGE_DIR, fileName);

    await QRCode.toFile(filePath, dynamicQris, {
        type: 'png', width: 512, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    return {
        qris_url: `${protocol}://${host}/image/${fileName}`,
        filePath, fileName,
    };
}

// ==========================================
// REDIS ORDER CRUD
// ==========================================
async function saveOrder(reffid, data) {
    await setJSON(`order:${reffid}`, data, 7200);
}

async function getOrder(reffid) {
    return await getJSON(`order:${reffid}`);
}

async function updateOrder(reffid, updates) {
    const order = await getOrder(reffid);
    if (!order) return null;
    const updated = { ...order, ...updates };
    await setJSON(`order:${reffid}`, updated, 7200);
    return updated;
}

// ==========================================
// WEBHOOK
// ==========================================
const WEBHOOK_MAX_RETRIES = 3;
const WEBHOOK_TIMEOUT_MS = 10000; // 10 detik
const WEBHOOK_RETRY_DELAYS = [5000, 15000, 45000]; // 5s, 15s, 45s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWebhook(url, data) {
    const bodyString = JSON.stringify(data);

    for (let attempt = 0; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyString,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            console.log(`[Webhook] → ${url} [${res.status}] (attempt ${attempt + 1}/${WEBHOOK_MAX_RETRIES + 1})`);
            if (res.ok) return true;

            console.warn(`[Webhook] ⚠️ Non-2xx response (${res.status}), will retry...`);
        } catch (err) {
            const reason = err.name === 'AbortError' ? 'TIMEOUT' : err.message;
            console.error(`[Webhook] ❌ Attempt ${attempt + 1} failed → ${url}: ${reason}`);
        }

        // Retry delay (skip after last attempt)
        if (attempt < WEBHOOK_MAX_RETRIES) {
            const delay = WEBHOOK_RETRY_DELAYS[attempt] || 45000;
            console.log(`[Webhook] ⏳ Retrying in ${delay / 1000}s...`);
            await sleep(delay);
        }
    }

    console.error(`[Webhook] 🚫 All ${WEBHOOK_MAX_RETRIES + 1} attempts failed → ${url}`);
    return false;
}

// ==========================================
// POLLING CONTROL
// ==========================================
function stopPolling(reffid) {
    const poller = activePollers.get(reffid);
    if (poller) {
        clearInterval(poller.interval);
        if (poller.timeout) clearTimeout(poller.timeout);
        activePollers.delete(reffid);
        console.log(`[Order] ⏹ Stopped: ${reffid}`);
    }
}

async function handlePaid(reffid, order, txData) {
    const updated = await updateOrder(reffid, {
        status: 'PAID',
        paid_at: new Date().toISOString(),
        mutation_data: txData,
    });
    console.log(`[Order] ✅ PAID: ${reffid} - Rp${order.nominal}`);

    if (order.webhook_url) {
        await sendWebhook(order.webhook_url, {
            reffid, status: 'PAID', nominal: order.nominal,
            paid_at: updated.paid_at, mutation_data: txData,
        });
    }

    // Clean up QRIS image
    try {
        if (order.qris_file && fs.existsSync(order.qris_file)) {
            fs.unlinkSync(order.qris_file);
        }
    } catch (_) { /* ignore */ }

    stopPolling(reffid);
}

async function handleExpired(reffid) {
    const order = await getOrder(reffid);
    if (order && order.status === 'PENDING') {
        await updateOrder(reffid, { status: 'EXPIRED', expired_at: new Date().toISOString() });
        console.log(`[Order] ⏰ EXPIRED: ${reffid}`);

        if (order.webhook_url) {
            await sendWebhook(order.webhook_url, {
                reffid, status: 'EXPIRED', nominal: order.nominal,
                expired_at: new Date().toISOString(),
            });
        }

        try {
            if (order.qris_file && fs.existsSync(order.qris_file)) {
                fs.unlinkSync(order.qris_file);
            }
        } catch (_) { /* ignore */ }
    }
    stopPolling(reffid);
}

// ==========================================
// ORDERKOUTA POLLING
// ==========================================
const OK_API = 'https://app.orderkuota.com/api/v2';
const OK_HEADERS = { 'Host': 'app.orderkuota.com', 'User-Agent': 'okhttp/4.12.0', 'Content-Type': 'application/x-www-form-urlencoded' };
const OK_VER_NAME = '25.08.11';
const OK_VER_CODE = '250811';
const OK_REG_ID = 'cUx8YuXhS5yLKPOaY6_zv_:APA91bH7c1pEuuxtYnTgJAegkbDkj8cicnpkEEQkp0v2yr3bEfWKqIYCuNkwX_VdUjQuJ3UpP75mb72I3kowTpXGomHsspEfIaNnVabdrCEeHFG2IEWWLPU';

async function fetchOrkutMutasi(username, auth_token) {
    const userId = auth_token.split(':')[0] || null;
    const payload = new URLSearchParams({
        auth_token, auth_username: username,
        'requests[qris_history][jumlah]': '', 'requests[qris_history][jenis]': '',
        'requests[qris_history][page]': '1',
        'requests[qris_history][dari_tanggal]': '', 'requests[qris_history][ke_tanggal]': '',
        'requests[qris_history][keterangan]': '', 'requests[0]': 'account',
        app_version_name: OK_VER_NAME, app_version_code: OK_VER_CODE, app_reg_id: OK_REG_ID,
    });

    const endpoint = userId ? `${OK_API}/qris/mutasi/${userId}` : `${OK_API}/get`;
    const res = await nodeFetch(endpoint, { method: 'POST', headers: OK_HEADERS, body: payload.toString() });
    const ct = res.headers.get('content-type');
    if (ct && ct.includes('application/json')) return await res.json();
    return null;
}

function startPollingOrkut(reffid, credentials, expiredMinutes) {
    const { username, auth_token } = credentials;

    // Named poll function — dipanggil segera (first poll) dan setiap 25 detik
    const doPoll = async () => {
        try {
            const order = await getOrder(reffid);
            if (!order) {
                console.log(`[Order] ⚠️ Orkut: order ${reffid} tidak ditemukan di Redis, polling dihentikan.`);
                stopPolling(reffid);
                return;
            }
            if (order.status !== 'PENDING') {
                console.log(`[Order] ⏹ Orkut: ${reffid} status=${order.status}, polling dihentikan.`);
                stopPolling(reffid);
                return;
            }

            console.log(`[Order] 🔄 Polling orkut: ${reffid} (nominal=${order.nominal})`);
            const mutasi = await fetchOrkutMutasi(username, auth_token);

            if (!mutasi) {
                console.log(`[Order] ⚠️ Orkut: response null/non-JSON untuk ${reffid}`);
                return;
            }

            // Support berbagai struktur response Orkut API
            const qh = mutasi?.data?.qris_history || mutasi?.qris_history || {};
            const txList = qh?.results  // ← struktur aktual: qris_history.results
                || qh?.data             // fallback: qris_history.data
                || (Array.isArray(qh) ? qh : []);  // fallback: qris_history langsung array

            if (!Array.isArray(txList) || txList.length === 0) {
                console.log(`[Order] ⚠️ No Orkut TX for: ${reffid}, raw=${JSON.stringify(mutasi?.data).slice(0, 150)}`);
                return;
            }

            for (const tx of txList) {
                // Filter: hanya proses transaksi masuk (kredit / status "IN")
                const txStatus = (tx.status || '').toUpperCase();
                if (txStatus === 'OUT') continue; // skip transaksi keluar

                // Ambil nominal: prioritaskan kredit (uang masuk), lalu fallback
                const rawAmt = tx.kredit || tx.jumlah || tx.nominal || tx.amount || '0';

                // Parse: hapus titik pemisah ribuan Indonesia, lalu parse integer
                const cleaned = String(rawAmt).replace(/\./g, '').replace(/,/g, '.');
                const amt = Math.round(parseFloat(cleaned) || 0);

                if (amt === order.nominal) {
                    console.log(`[Order] ✅ PAID orkut! ${reffid} amount=${amt} (raw="${rawAmt}", status="${txStatus}")`);
                    await handlePaid(reffid, order, tx);
                    return;
                }
            }
            console.log(`[Order] ❌ No match orkut ${reffid} (nominal=${order.nominal}, checked=${txList.length} txs)`);
        } catch (err) {
            console.error(`[Order] Orkut poll error ${reffid}:`, err.message);
        }
    };

    // Jalankan poll pertama SEGERA (tanpa tunggu 25 detik pertama)
    setImmediate(doPoll);

    // Lanjutkan polling setiap 25 detik
    const interval = setInterval(doPoll, 25000);
    const timeout = setTimeout(() => handleExpired(reffid), expiredMinutes * 60 * 1000);
    activePollers.set(reffid, { interval, timeout });
    console.log(`[Order] 🚀 Polling orkut started: ${reffid} (${expiredMinutes}m, interval=25s)`);
}

// ==========================================
// GOPAY MERCHANT POLLING
// ==========================================
const GOBIZ_URL = "https://api.gobiz.co.id";

function gopayHeaders(uniqueId, token = null) {
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
    const res = await fetch(`${GOBIZ_URL}${path}`, {
        method: "POST",
        headers: gopayHeaders(uniqueId, token),
        body: JSON.stringify(body),
    });
    return { status: res.status, ok: res.ok, data: await res.json() };
}


const GOPAY_TX_PAYLOAD = {
    from: 0, size: 20,
    sort: { time: { order: "desc" } },
    included_categories: { incoming: ["transaction_share", "action"] },
    query: [{
        clauses: [
            { op: "not", clauses: [{ clauses: [
                { field: "metadata.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] },
                { field: "metadata.gopay.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] }
            ], op: "or" }] },
            { field: "metadata.transaction.status", op: "in", value: ["settlement", "capture", "refund", "partial_refund"] },
            { op: "or", clauses: [{ op: "or", clauses: [{ field: "metadata.transaction.payment_type", op: "in", value: ["qris", "gopay", "offline_credit_card", "offline_debit_card", "credit_card"] }] }] }
        ], op: "and"
    }]
};

async function fetchGopayMutasi(accessToken, refreshToken, uniqueId) {
    const uid = uniqueId || uuidv4();
    let result = await gobizPost("/journals/search", GOPAY_TX_PAYLOAD, uid, accessToken);

    // Auto-refresh jika token expired — sama persis seperti getMutasi di gopayController
    if (result.status === 401 || result.status === 403) {
        console.log('[Order] GoPay access token expired, mencoba refresh...');

        // Panggil TANPA token (arg ke-4 tidak diisi) → header "Bearer" (bukan Bearer <expired>)
        const refreshResult = await gobizPost("/goid/token", {
            client_id: "go-biz-web-new",
            grant_type: "refresh_token",
            data: { refresh_token: refreshToken }
        }, uid);

        console.log(`[Order] GoPay refresh result: status=${refreshResult.status}, body=${JSON.stringify(refreshResult.data).slice(0, 200)}`);

        if (refreshResult.ok && refreshResult.data.access_token) {
            const newToken = refreshResult.data.access_token;
            const newRefresh = refreshResult.data.refresh_token || refreshToken;
            result = await gobizPost("/journals/search", GOPAY_TX_PAYLOAD, uid, newToken);
            return { result, newTokens: { access_token: newToken, refresh_token: newRefresh } };
        }

        // Refresh juga gagal
        console.error(`[Order] ❌ GoPay refresh token GAGAL: status=${refreshResult.status}, msg=${JSON.stringify(refreshResult.data)}`);
        console.error(`[Order] ⚠️ User perlu login ulang GoPay Merchant (OTP) untuk mendapatkan token baru.`);
    }
    return { result, newTokens: null };
}

function startPollingGomerchant(reffid, credentials, expiredMinutes) {
    let { access_token, refresh_token, x_uniqueid } = credentials;

    // Named poll function — dipanggil segera (first poll) dan setiap 25 detik
    const doPoll = async () => {
        try {
            const order = await getOrder(reffid);
            if (!order) {
                console.log(`[Order] ⚠️ GoPay: order ${reffid} tidak ditemukan di Redis, polling dihentikan.`);
                stopPolling(reffid);
                return;
            }
            if (order.status !== 'PENDING') {
                console.log(`[Order] ⏹ GoPay: ${reffid} status=${order.status}, polling dihentikan.`);
                stopPolling(reffid);
                return;
            }

            console.log(`[Order] 🔄 Polling gopay: ${reffid} (nominal=${order.nominal})`);
            const { result, newTokens } = await fetchGopayMutasi(access_token, refresh_token, x_uniqueid);

            if (newTokens) {
                access_token = newTokens.access_token;
                refresh_token = newTokens.refresh_token;

                // Simpan token baru ke Redis order
                await updateOrder(reffid, { credentials: { access_token, refresh_token, x_uniqueid } });

                // Simpan token baru ke DB (user_tokens) agar order berikutnya pakai token terbaru
                if (order._userId) {
                    try {
                        await db.run(
                            `UPDATE user_tokens
                             SET gopay_access_token = ?, gopay_refresh_token = ?, gopay_saved_at = ?
                             WHERE user_id = ?`,
                            [encrypt(access_token), encrypt(refresh_token), new Date(), order._userId]
                        );
                        console.log(`[Order] 🔑 GoPay token refreshed & saved to DB for user #${order._userId}`);
                    } catch (dbErr) {
                        console.error(`[Order] ⚠️ Gagal simpan token baru ke DB:`, dbErr.message);
                    }
                } else {
                    console.log(`[Order] 🔑 GoPay token refreshed (in-memory only, no userId linked)`);
                }
            }

            if (!result.ok) {
                console.log(`[Order] ⚠️ GoPay API error: status=${result.status}, body=${JSON.stringify(result.data).slice(0, 200)}`);
                return;
            }

            // GoBiz API mengembalikan { hits: { hits: [...], total: N } }
            const hits = result.data?.hits?.hits || result.data?.hits || [];
            const hitsArr = Array.isArray(hits) ? hits : [];
            if (hitsArr.length === 0) {
                console.log(`[Order] ⚠️ GoPay no hits for ${reffid}, raw=${JSON.stringify(result.data?.hits)?.slice(0, 120)}`);
                return;
            }

            for (const tx of hitsArr) {
                if (tx.status !== 'success' || tx.category !== 'incoming') continue;

                const rawAmt = parseInt(tx.amount || 0);
                const amtDirect = rawAmt;
                const amtDivided = Math.round(rawAmt / 100);

                if (amtDirect === order.nominal || amtDivided === order.nominal) {
                    const finalAmt = amtDirect === order.nominal ? amtDirect : amtDivided;
                    console.log(`[Order] ✅ PAID! ${reffid} raw=${rawAmt}, matched=${finalAmt}`);
                    await handlePaid(reffid, order, {
                        reference_id: tx.reference_id,
                        amount: rawAmt,
                        amount_idr: finalAmt,
                        time: tx.time,
                        status: tx.status,
                        issuer: tx.metadata?.issuer || null,
                        payment_type: tx.metadata?.transaction?.payment_type || 'qris',
                        order_id: tx.metadata?.transaction?.order_id || null,
                    });
                    return;
                }
            }
            console.log(`[Order] ❌ No match for ${reffid} (nominal=${order.nominal}, total_hits=${hitsArr.length})`);
        } catch (err) {
            console.error(`[Order] Gopay poll error ${reffid}:`, err.message);
        }
    };

    // Jalankan poll pertama SEGERA (tanpa tunggu 25 detik pertama)
    setImmediate(doPoll);

    // Lanjutkan polling setiap 25 detik
    const interval = setInterval(doPoll, 25000);
    const timeout = setTimeout(() => handleExpired(reffid), expiredMinutes * 60 * 1000);
    activePollers.set(reffid, { interval, timeout });
    console.log(`[Order] 🚀 Polling gopay started: ${reffid} (${expiredMinutes}m, interval=25s)`);
}

module.exports = {
    generateReffId, convertStaticToDynamic, generateQrisImage,
    saveOrder, getOrder, updateOrder,
    sendWebhook, stopPolling,
    startPollingOrkut, startPollingGomerchant,
};
