const { sendResponse } = require('../library/response');
const { getJSON, setJSON, deleteKey, scanKeys, increment } = require('../config/redis');

/**
 * GET /api/users
 * Ambil semua data pengguna dari Redis
 */
const getUsers = async (req, res) => {
    try {
        const keys = await scanKeys('user:*');
        const users = [];

        for (const key of keys) {
            const user = await getJSON(key);
            if (user) users.push(user);
        }

        // Sort by id ascending
        users.sort((a, b) => a.id - b.id);

        return sendResponse(res, 200, true, `${users.length} pengguna ditemukan.`, users);
    } catch (err) {
        console.error('[User] GetAll error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * GET /api/users/:id
 * Ambil satu pengguna berdasarkan ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getJSON(`user:${id}`);

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
 * Buat pengguna baru
 */
const createUser = async (req, res) => {
    try {
        const { name, role } = req.body;

        if (!name || !role) {
            return sendResponse(res, 400, false, 'Nama dan role wajib diisi!');
        }

        const id = await increment('counter:users');
        const newUser = {
            id,
            name,
            role,
            createdAt: new Date().toISOString()
        };

        await setJSON(`user:${id}`, newUser);

        return sendResponse(res, 201, true, 'Pengguna berhasil ditambahkan.', newUser);
    } catch (err) {
        console.error('[User] Create error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * PUT /api/users/:id
 * Update data pengguna
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getJSON(`user:${id}`);

        if (!existing) {
            return sendResponse(res, 404, false, 'Pengguna tidak ditemukan.');
        }

        const { name, role } = req.body;
        if (name) existing.name = name;
        if (role) existing.role = role;
        existing.updatedAt = new Date().toISOString();

        await setJSON(`user:${id}`, existing);

        return sendResponse(res, 200, true, 'Pengguna berhasil diupdate.', existing);
    } catch (err) {
        console.error('[User] Update error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/**
 * DELETE /api/users/:id
 * Hapus pengguna
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getJSON(`user:${id}`);

        if (!user) {
            return sendResponse(res, 404, false, 'Pengguna tidak ditemukan.');
        }

        await deleteKey(`user:${id}`);

        return sendResponse(res, 200, true, 'Pengguna berhasil dihapus.', { id: parseInt(id), name: user.name });
    } catch (err) {
        console.error('[User] Delete error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };