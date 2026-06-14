/**
 * WhatsApp Gateway — Session Manager
 * Uses dynamic import() for Baileys (ESM) compatibility with CJS
 */

const path = require('path');
const fs = require('fs');
const { getJSON, setJSON, deleteKey, scanKeys, pushToList, getList } = require('../config/redis');

// Store active sessions in memory
const sessions = new Map();
// Store QR callbacks for SSE
const qrCallbacks = new Map();
// Store message logs in memory (backup, primary is Redis)
const messageLogs = new Map();

let baileys = null;
let Boom = null;
let pino = null;
let qrcode = null;

// Dynamic import for ESM modules
async function loadDeps() {
    if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
        const boomModule = await import('@hapi/boom');
        Boom = boomModule.Boom;
        pino = (await import('pino')).default;
        qrcode = require('qrcode');
    }
}

const SESSION_DIR = path.join(process.cwd(), 'wa_sessions');

function getSessionPath(userId) {
    return path.join(SESSION_DIR, `user_${userId}`);
}

// ==========================================
// REDIS KEY HELPERS
// ==========================================
const redisKey = {
    commands: (userId) => `wa:commands:${userId}`,
    logs: (userId) => `wa:logs:${userId}`,
    status: (userId) => `wa:status:${userId}`
};

// ==========================================
// COMMANDS CRUD (Redis)
// ==========================================
async function getCommands(userId) {
    return await getJSON(redisKey.commands(userId)) || [];
}

async function saveCommands(userId, commands) {
    await setJSON(redisKey.commands(userId), commands);
}

async function addCommand(userId, trigger, response, type = 'exact') {
    const commands = await getCommands(userId);
    const id = Date.now().toString(36);
    commands.push({ id, trigger: trigger.toLowerCase(), response, type, createdAt: new Date().toISOString() });
    await saveCommands(userId, commands);
    return commands;
}

async function updateCommand(userId, cmdId, trigger, response, type) {
    const commands = await getCommands(userId);
    const idx = commands.findIndex(c => c.id === cmdId);
    if (idx === -1) return null;
    commands[idx] = { ...commands[idx], trigger: trigger.toLowerCase(), response, type };
    await saveCommands(userId, commands);
    return commands;
}

async function deleteCommand(userId, cmdId) {
    let commands = await getCommands(userId);
    commands = commands.filter(c => c.id !== cmdId);
    await saveCommands(userId, commands);
    return commands;
}

// ==========================================
// LOGS (Redis)
// ==========================================
async function addLog(userId, log) {
    await pushToList(redisKey.logs(userId), {
        ...log,
        time: new Date().toISOString()
    }, 50);
}

async function getLogs(userId) {
    return await getList(redisKey.logs(userId), 0, 49);
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================
async function startSession(userId, onQR, onConnected, onDisconnected) {
    await loadDeps();

    const sessionPath = getSessionPath(userId);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await baileys.useMultiFileAuthState(sessionPath);
    const { version } = await baileys.fetchLatestBaileysVersion();

    const logger = pino({ level: 'silent' });

    const sock = baileys.default({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: baileys.makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: ['Odzreshop Gateway', 'Chrome', '22.0'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true
    });

    const session = {
        sock,
        userId,
        status: 'connecting',
        phoneNumber: null,
        name: null,
        qr: null
    };

    sessions.set(userId, session);

    // Connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr: qrCode } = update;

        if (qrCode) {
            session.qr = qrCode;
            session.status = 'qr';
            try {
                const qrImage = await qrcode.toDataURL(qrCode, { width: 300, margin: 2 });
                if (onQR) onQR(qrImage, qrCode);
            } catch (e) {
                console.error('[WA Gateway] QR generate error:', e.message);
            }
        }

        if (connection === 'open') {
            session.status = 'connected';
            session.qr = null;
            const jid = baileys.jidDecode ? baileys.jidDecode(sock.user.id) : null;
            session.phoneNumber = jid ? jid.user : sock.user.id.split(':')[0].split('@')[0];
            session.name = sock.user.name || sock.user.verifiedName || '';
            console.log(`[WA Gateway] User ${userId} connected as ${session.phoneNumber}`);
            await setJSON(redisKey.status(userId), { connected: true, phone: session.phoneNumber, name: session.name });
            if (onConnected) onConnected(session);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const loggedOut = reason === baileys.DisconnectReason.loggedOut;

            console.log(`[WA Gateway] User ${userId} disconnected. Reason: ${reason}. LoggedOut: ${loggedOut}`);

            if (loggedOut) {
                // Clean up session
                sessions.delete(userId);
                await deleteKey(redisKey.status(userId));
                try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch (e) {}
                if (onDisconnected) onDisconnected('logged_out');
            } else {
                // Auto reconnect
                session.status = 'reconnecting';
                setTimeout(() => {
                    if (sessions.has(userId)) {
                        startSession(userId, onQR, onConnected, onDisconnected).catch(e => {
                            console.error(`[WA Gateway] Reconnect failed for user ${userId}:`, e.message);
                        });
                    }
                }, 3000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages for auto-reply
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const text = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            '';

        if (!text) return;

        // Check auto-reply commands
        const commands = await getCommands(userId);
        const lowerText = text.toLowerCase().trim();

        for (const cmd of commands) {
            let match = false;
            if (cmd.type === 'exact') {
                match = lowerText === cmd.trigger;
            } else if (cmd.type === 'startswith') {
                match = lowerText.startsWith(cmd.trigger);
            } else if (cmd.type === 'contains') {
                match = lowerText.includes(cmd.trigger);
            }

            if (match) {
                try {
                    await sock.sendMessage(msg.key.remoteJid, { text: cmd.response });
                    await addLog(userId, {
                        direction: 'auto-reply',
                        to: msg.key.remoteJid,
                        trigger: cmd.trigger,
                        message: cmd.response.substring(0, 100),
                        status: 'sent'
                    });
                } catch (e) {
                    console.error(`[WA Gateway] Auto-reply error:`, e.message);
                }
                break; // Only first match
            }
        }
    });

    return session;
}

async function stopSession(userId) {
    const session = sessions.get(userId);
    if (!session) return false;

    try {
        await session.sock.logout();
    } catch (e) {
        try { session.sock.end(); } catch (_) {}
    }

    sessions.delete(userId);
    await deleteKey(redisKey.status(userId));

    // Remove session files
    const sessionPath = getSessionPath(userId);
    try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch (e) {}

    return true;
}

function getSession(userId) {
    return sessions.get(userId) || null;
}

async function getStatus(userId) {
    const session = sessions.get(userId);
    if (session) {
        return {
            connected: session.status === 'connected',
            status: session.status,
            phoneNumber: session.phoneNumber,
            name: session.name
        };
    }

    // Check if session files exist (might need reconnect on server restart)
    const sessionPath = getSessionPath(userId);
    const hasFiles = fs.existsSync(path.join(sessionPath, 'creds.json'));
    if (hasFiles) {
        return { connected: false, status: 'saved', phoneNumber: null, name: null };
    }

    return { connected: false, status: 'none', phoneNumber: null, name: null };
}

// ==========================================
// SEND MESSAGE
// ==========================================
async function sendMessage(userId, to, text) {
    const session = sessions.get(userId);
    if (!session || session.status !== 'connected') {
        throw new Error('WhatsApp belum terhubung.');
    }

    // Format number
    let jid = to;
    if (!jid.includes('@')) {
        jid = jid.replace(/[^0-9]/g, '');
        if (jid.startsWith('08')) jid = '62' + jid.slice(1);
        jid = jid + '@s.whatsapp.net';
    }

    await session.sock.sendMessage(jid, { text });
    await addLog(userId, { direction: 'outgoing', to: jid, message: text.substring(0, 100), status: 'sent' });
    return { jid, status: 'sent' };
}

// ==========================================
// BROADCAST
// ==========================================
async function broadcast(userId, numbers, text, delayMs = 3000) {
    const session = sessions.get(userId);
    if (!session || session.status !== 'connected') {
        throw new Error('WhatsApp belum terhubung.');
    }

    const results = [];
    for (const num of numbers) {
        let jid = num.replace(/[^0-9]/g, '');
        if (jid.startsWith('08')) jid = '62' + jid.slice(1);
        jid = jid + '@s.whatsapp.net';

        try {
            await session.sock.sendMessage(jid, { text });
            results.push({ number: num, jid, status: 'sent' });
            await addLog(userId, { direction: 'broadcast', to: jid, message: text.substring(0, 100), status: 'sent' });
        } catch (e) {
            results.push({ number: num, jid, status: 'failed', error: e.message });
            await addLog(userId, { direction: 'broadcast', to: jid, message: text.substring(0, 100), status: 'failed' });
        }

        // Delay between messages
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    }
    return results;
}

// ==========================================
// GROUP MANAGEMENT
// ==========================================
async function getGroups(userId) {
    const session = sessions.get(userId);
    if (!session || session.status !== 'connected') {
        throw new Error('WhatsApp belum terhubung.');
    }

    const groups = await session.sock.groupFetchAllParticipating();
    return Object.values(groups).map(g => ({
        id: g.id,
        subject: g.subject,
        participants: g.participants?.length || 0,
        desc: g.desc || ''
    }));
}

async function getGroupInfo(userId, groupId) {
    const session = sessions.get(userId);
    if (!session || session.status !== 'connected') {
        throw new Error('WhatsApp belum terhubung.');
    }

    const meta = await session.sock.groupMetadata(groupId);
    return {
        id: meta.id,
        subject: meta.subject,
        desc: meta.desc || '',
        participants: meta.participants?.length || 0,
        creation: meta.creation,
        owner: meta.owner
    };
}

async function sendToGroup(userId, groupId, text) {
    const session = sessions.get(userId);
    if (!session || session.status !== 'connected') {
        throw new Error('WhatsApp belum terhubung.');
    }

    await session.sock.sendMessage(groupId, { text });
    await addLog(userId, { direction: 'group', to: groupId, message: text.substring(0, 100), status: 'sent' });
    return { groupId, status: 'sent' };
}

// ==========================================
// PAIRING CODE
// ==========================================
async function requestPairingCode(userId, phoneNumber) {
    const session = sessions.get(userId);
    if (!session) throw new Error('Session belum dimulai. Hubungkan dulu.');

    const code = await session.sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
    return code;
}

module.exports = {
    startSession,
    stopSession,
    getSession,
    getStatus,
    sendMessage,
    broadcast,
    getGroups,
    getGroupInfo,
    sendToGroup,
    requestPairingCode,
    getCommands,
    addCommand,
    updateCommand,
    deleteCommand,
    getLogs,
    sessions
};
