const { Redis } = require('@upstash/redis');
require('dotenv').config();

// Inisialisasi koneksi Upstash Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Ambil data JSON dari Redis
 */
const getJSON = async (key) => {
    try {
        const data = await redis.get(key);
        if (data === null || data === undefined) return null;
        // Upstash SDK otomatis parse JSON
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
        console.error(`[Redis] Error get ${key}:`, err.message);
        return null;
    }
};

/**
 * Simpan data JSON ke Redis (dengan optional TTL dalam detik)
 */
const setJSON = async (key, value, ttlSeconds = null) => {
    try {
        if (ttlSeconds) {
            await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
        } else {
            await redis.set(key, JSON.stringify(value));
        }
        return true;
    } catch (err) {
        console.error(`[Redis] Error set ${key}:`, err.message);
        return false;
    }
};

/**
 * Hapus key dari Redis
 */
const deleteKey = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (err) {
        console.error(`[Redis] Error del ${key}:`, err.message);
        return false;
    }
};

/**
 * Cari semua keys berdasarkan pattern (misal: "user:*")
 */
const scanKeys = async (pattern) => {
    try {
        let cursor = 0;
        let allKeys = [];
        do {
            const result = await redis.scan(cursor, { match: pattern, count: 100 });
            cursor = result[0];
            allKeys = allKeys.concat(result[1]);
        } while (cursor != 0 && cursor !== '0');
        return allKeys;
    } catch (err) {
        console.error(`[Redis] Error scan ${pattern}:`, err.message);
        return [];
    }
};


/**
 * Tambah item ke awal list (untuk logs)
 */
const pushToList = async (key, value, maxLength = 200) => {
    try {
        await redis.lpush(key, JSON.stringify(value));
        await redis.ltrim(key, 0, maxLength - 1); // Batasi panjang list
        return true;
    } catch (err) {
        console.error(`[Redis] Error lpush ${key}:`, err.message);
        return false;
    }
};

/**
 * Ambil items dari list
 */
const getList = async (key, start = 0, end = -1) => {
    try {
        const items = await redis.lrange(key, start, end);
        return items.map(item => {
            try {
                return typeof item === 'string' ? JSON.parse(item) : item;
            } catch {
                return item;
            }
        });
    } catch (err) {
        console.error(`[Redis] Error lrange ${key}:`, err.message);
        return [];
    }
};

/**
 * Increment counter
 */
const increment = async (key) => {
    try {
        return await redis.incr(key);
    } catch (err) {
        console.error(`[Redis] Error incr ${key}:`, err.message);
        return null;
    }
};

/**
 * Test koneksi Redis
 */
const testConnection = async () => {
    try {
        const result = await redis.ping();
        console.log('✅ Upstash Redis terhubung:', result);
        return true;
    } catch (err) {
        console.error('❌ Gagal terhubung ke Upstash Redis:', err.message);
        return false;
    }
};

module.exports = {
    redis,
    getJSON,
    setJSON,
    deleteKey,
    scanKeys,
    pushToList,
    getList,
    increment,
    testConnection
};
