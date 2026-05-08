const { sendResponse } = require('../library/response');
const { getJSON } = require('../config/redis');

/**
 * Middleware: Verifikasi session token admin
 * Cek header Authorization: Bearer <token>
 */
const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendResponse(res, 401, false, 'Akses ditolak: Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        const token = authHeader.split(' ')[1];
        const session = await getJSON(`session:${token}`);

        if (!session) {
            return sendResponse(res, 401, false, 'Akses ditolak: Session tidak valid atau sudah expired.');
        }

        // Tambahkan info admin ke request
        req.admin = session;
        req.sessionToken = token;
        next();
    } catch (err) {
        console.error('[AdminAuth] Error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan saat verifikasi session.');
    }
};

module.exports = verifyAdmin;
