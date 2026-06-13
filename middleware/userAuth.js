const { sendResponse } = require('../library/response');
const { getJSON } = require('../config/redis');

/**
 * Middleware: Verifikasi session token user
 * Cek header Authorization: Bearer <token>
 */
const verifyUser = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendResponse(res, 401, false, 'Akses ditolak: Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        const token = authHeader.split(' ')[1];
        const session = await getJSON(`usersession:${token}`);

        if (!session) {
            return sendResponse(res, 401, false, 'Akses ditolak: Session tidak valid atau sudah expired.');
        }

        // Tambahkan info user ke request
        req.user = session;
        req.userSessionToken = token;
        next();
    } catch (err) {
        console.error('[UserAuth] Error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan saat verifikasi session.');
    }
};

module.exports = verifyUser;
