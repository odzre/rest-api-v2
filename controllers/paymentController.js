const { sendResponse } = require('../library/response');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

// Direktori penyimpanan QRIS
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'image');
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

// Simpan timer auto-delete di memory
const activeTimers = new Map();

// ==========================================
// QRIS HELPER FUNCTIONS
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

function generateId() {
    return crypto.randomBytes(5).toString('hex'); // 10 digit random
}

function convertStaticToDynamic(amount, codeqr) {
    let qrisData = codeqr.slice(0, -4); // Hapus CRC lama
    const step1 = qrisData.replace("010211", "010212"); // Static → Dynamic
    const step2 = step1.split("5802ID");
    const amountStr = amount.toString();
    const uang = "54" + ("0" + amountStr.length).slice(-2) + amountStr + "5802ID";
    const final = step2[0] + uang + step2[1];
    return final + convertCRC16(final);
}

// ==========================================
// ENDPOINT
// ==========================================

/**
 * POST /api/v5/payment/create-qris
 * Body: { nominal, code_qris, expired_minutes }
 */
const createQris = async (req, res) => {
    try {
        const { nominal, code_qris, expired_minutes } = req.body;

        // Validasi
        if (!nominal || !code_qris) {
            return sendResponse(res, 400, false, 'nominal dan code_qris wajib diisi.');
        }

        const amount = parseInt(nominal);
        if (isNaN(amount) || amount <= 0) {
            return sendResponse(res, 400, false, 'nominal harus angka lebih dari 0.');
        }

        let expiry = parseInt(expired_minutes) || 30;
        if (expiry < 1) expiry = 1;
        if (expiry > 60) expiry = 60;

        // Validasi code QRIS
        if (!code_qris.includes("010211") && !code_qris.includes("010212")) {
            return sendResponse(res, 400, false, 'code_qris tidak valid. Pastikan ini adalah kode QRIS yang benar.');
        }

        // Convert static QRIS → dynamic dengan nominal
        const dynamicQris = convertStaticToDynamic(amount, code_qris);

        // Generate QR code image
        const fileId = generateId();
        const fileName = `qris-${fileId}.png`;
        const filePath = path.join(IMAGE_DIR, fileName);

        await QRCode.toFile(filePath, dynamicQris, {
            type: 'png',
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });

        // Hitung expiry
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiry * 60 * 1000);

        // Auto-delete setelah expired
        const timer = setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[QRIS] Auto-deleted: ${fileName}`);
                }
            } catch (e) { /* ignore */ }
            activeTimers.delete(fileId);
        }, expiry * 60 * 1000);

        activeTimers.set(fileId, { timer, filePath, expiresAt });

        // Build URL
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol || 'http';
        const imageUrl = `${protocol}://${host}/image/${fileName}`;

        return sendResponse(res, 200, true, 'QRIS dinamis berhasil dibuat.', {
            qris_url: imageUrl,
            nominal: amount,
            expired_minutes: expiry,
            expires_at: expiresAt.toISOString(),
            qris_string: dynamicQris
        });
    } catch (err) {
        console.error('[Payment] Create QRIS error:', err.message);
        return sendResponse(res, 500, false, 'Gagal membuat QRIS: ' + err.message);
    }
};

module.exports = { createQris };
