const { sendResponse } = require('../library/response');
const wa = require('../services/waGateway');

// ==========================================
// STATUS
// ==========================================
const getStatus = async (req, res) => {
    try {
        const status = await wa.getStatus(req.user.userId);
        return sendResponse(res, 200, true, 'OK', status);
    } catch (err) {
        console.error('[WA] Status error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan.');
    }
};

// ==========================================
// CONNECT (SSE — stream QR code)
// ==========================================
const connect = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if already connected
        const existing = wa.getSession(userId);
        if (existing && existing.status === 'connected') {
            return sendResponse(res, 200, true, 'Sudah terhubung.', { connected: true });
        }

        // Setup SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const sendEvent = (type, data) => {
            try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); } catch (_) {}
        };

        let closed = false;
        req.on('close', () => { closed = true; });

        sendEvent('log', { message: 'Memulai koneksi WhatsApp...' });

        await wa.startSession(
            userId,
            // onQR
            (qrImage, qrRaw) => {
                if (!closed) sendEvent('qr', { image: qrImage });
            },
            // onConnected
            (session) => {
                if (!closed) {
                    sendEvent('connected', {
                        message: 'WhatsApp terhubung!',
                        phoneNumber: session.phoneNumber,
                        name: session.name
                    });
                    setTimeout(() => { try { res.end(); } catch (_) {} }, 500);
                }
            },
            // onDisconnected
            (reason) => {
                if (!closed) {
                    sendEvent('disconnected', { message: 'Koneksi terputus.', reason });
                    try { res.end(); } catch (_) {}
                }
            }
        );
    } catch (err) {
        console.error('[WA] Connect error:', err.message);
        try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
            res.end();
        } catch (_) {}
    }
};

// ==========================================
// PAIRING CODE
// ==========================================
const requestPair = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phoneNumber } = req.body;
        if (!phoneNumber) return sendResponse(res, 400, false, 'Nomor telepon wajib diisi.');

        // Start session first if not started
        let session = wa.getSession(userId);
        if (!session) {
            await wa.startSession(userId, null, null, null);
            // Wait for socket to be ready
            await new Promise(r => setTimeout(r, 3000));
        }

        const code = await wa.requestPairingCode(userId, phoneNumber);
        return sendResponse(res, 200, true, 'Pairing code berhasil dibuat.', { code });
    } catch (err) {
        console.error('[WA] Pair error:', err.message);
        return sendResponse(res, 500, false, 'Gagal membuat pairing code: ' + err.message);
    }
};

// ==========================================
// DISCONNECT
// ==========================================
const disconnect = async (req, res) => {
    try {
        await wa.stopSession(req.user.userId);
        return sendResponse(res, 200, true, 'WhatsApp berhasil diputus.');
    } catch (err) {
        console.error('[WA] Disconnect error:', err.message);
        return sendResponse(res, 500, false, 'Gagal disconnect.');
    }
};

// ==========================================
// SEND MESSAGE
// ==========================================
const sendMsg = async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) return sendResponse(res, 400, false, 'Nomor dan pesan wajib diisi.');

        const result = await wa.sendMessage(req.user.userId, to, message);
        return sendResponse(res, 200, true, 'Pesan terkirim.', result);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// ==========================================
// BROADCAST
// ==========================================
const broadcastMsg = async (req, res) => {
    try {
        const { numbers, message, delay } = req.body;
        if (!numbers || !Array.isArray(numbers) || !message) {
            return sendResponse(res, 400, false, 'Numbers (array) dan message wajib diisi.');
        }

        const delayMs = (parseInt(delay) || 3) * 1000;

        // SSE for realtime progress
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const sendEvent = (data) => {
            try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch (_) {}
        };

        const session = wa.getSession(req.user.userId);
        if (!session || session.status !== 'connected') {
            sendEvent({ type: 'error', message: 'WhatsApp belum terhubung.' });
            return res.end();
        }

        let success = 0, fail = 0;
        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i].trim();
            if (!num) continue;

            try {
                await wa.sendMessage(req.user.userId, num, message);
                success++;
                sendEvent({ type: 'success', message: `[${i + 1}/${numbers.length}] ${num} - Terkirim` });
            } catch (e) {
                fail++;
                sendEvent({ type: 'error', message: `[${i + 1}/${numbers.length}] ${num} - Gagal: ${e.message}` });
            }

            if (i < numbers.length - 1 && delayMs > 0) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }

        sendEvent({ type: 'done', message: `Selesai. Berhasil: ${success}, Gagal: ${fail}` });
        res.end();
    } catch (err) {
        try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
            res.end();
        } catch (_) {}
    }
};

// ==========================================
// GROUPS
// ==========================================
const listGroups = async (req, res) => {
    try {
        const groups = await wa.getGroups(req.user.userId);
        return sendResponse(res, 200, true, 'OK', groups);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

const groupInfo = async (req, res) => {
    try {
        const info = await wa.getGroupInfo(req.user.userId, req.params.id);
        return sendResponse(res, 200, true, 'OK', info);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

const sendToGroup = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return sendResponse(res, 400, false, 'Pesan wajib diisi.');

        const result = await wa.sendToGroup(req.user.userId, req.params.id, message);
        return sendResponse(res, 200, true, 'Pesan terkirim ke grup.', result);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// ==========================================
// COMMANDS CRUD
// ==========================================
const listCommands = async (req, res) => {
    try {
        const commands = await wa.getCommands(req.user.userId);
        return sendResponse(res, 200, true, 'OK', commands);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal memuat commands.');
    }
};

const createCommand = async (req, res) => {
    try {
        const { trigger, response, type } = req.body;
        if (!trigger || !response) return sendResponse(res, 400, false, 'Trigger dan response wajib diisi.');

        const commands = await wa.addCommand(req.user.userId, trigger, response, type || 'exact');
        return sendResponse(res, 200, true, 'Command berhasil ditambahkan.', commands);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal menambahkan command.');
    }
};

const editCommand = async (req, res) => {
    try {
        const { trigger, response, type } = req.body;
        if (!trigger || !response) return sendResponse(res, 400, false, 'Trigger dan response wajib diisi.');

        const commands = await wa.updateCommand(req.user.userId, req.params.id, trigger, response, type || 'exact');
        if (!commands) return sendResponse(res, 404, false, 'Command tidak ditemukan.');
        return sendResponse(res, 200, true, 'Command berhasil diupdate.', commands);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal update command.');
    }
};

const removeCommand = async (req, res) => {
    try {
        const commands = await wa.deleteCommand(req.user.userId, req.params.id);
        return sendResponse(res, 200, true, 'Command berhasil dihapus.', commands);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal hapus command.');
    }
};

// ==========================================
// LOGS
// ==========================================
const getWaLogs = async (req, res) => {
    try {
        const logs = await wa.getLogs(req.user.userId);
        return sendResponse(res, 200, true, 'OK', logs);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal memuat logs.');
    }
};

module.exports = {
    getStatus,
    connect,
    requestPair,
    disconnect,
    sendMsg,
    broadcastMsg,
    listGroups,
    groupInfo,
    sendToGroup,
    listCommands,
    createCommand,
    editCommand,
    removeCommand,
    getWaLogs
};
