const { sendResponse } = require('../library/response');
const db = require('../config/database');

/**
 * GET /api/users
 */
const getUsers = async (req, res) => {
    try {
        const users = await db.query('SELECT * FROM users ORDER BY id ASC');
        return sendResponse(res, 200, true, `${users.length} pengguna ditemukan.`, users);
    } catch (err) {
        console.error('[User] GetAll error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [id]);

        if (!user) {
            return sendResponse(res, 404, false, 'Pengguna tidak ditemukan.');
        }

        return sendResponse(res, 200, true, 'Pengguna ditemukan.', user);
    } catch (err) {
        console.error('[User] GetById error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * POST /api/users
 */
const createUser = async (req, res) => {
    try {
        const { name, role } = req.body;

        if (!name || !role) {
            return sendResponse(res, 400, false, 'Nama dan role wajib diisi!');
        }

        const result = await db.run(
            'INSERT INTO users (name, email, whatsapp, password_hash, api_key, api_key_active) VALUES (?, ?, ?, ?, ?, 0)',
            [name, `${name.toLowerCase().replace(/\s+/g, '')}@placeholder.com`, '', '', `temp-${Date.now()}`]
        );

        const newUser = { id: result.insertId, name, role, createdAt: new Date().toISOString() };
        return sendResponse(res, 201, true, 'Pengguna berhasil ditambahkan.', newUser);
    } catch (err) {
        console.error('[User] Create error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db.getOne('SELECT * FROM users WHERE id = ?', [id]);

        if (!existing) {
            return sendResponse(res, 404, false, 'Pengguna tidak ditemukan.');
        }

        const { name, role } = req.body;
        if (name) {
            await db.run('UPDATE users SET name = ? WHERE id = ?', [name, id]);
        }

        const updated = await db.getOne('SELECT * FROM users WHERE id = ?', [id]);
        return sendResponse(res, 200, true, 'Pengguna berhasil diupdate.', updated);
    } catch (err) {
        console.error('[User] Update error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.getOne('SELECT * FROM users WHERE id = ?', [id]);

        if (!user) {
            return sendResponse(res, 404, false, 'Pengguna tidak ditemukan.');
        }

        await db.run('DELETE FROM users WHERE id = ?', [id]);

        return sendResponse(res, 200, true, 'Pengguna berhasil dihapus.', { id: parseInt(id), name: user.name });
    } catch (err) {
        console.error('[User] Delete error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };