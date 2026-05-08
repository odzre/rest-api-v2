const { sendResponse } = require('../library/response');

const CEKID_BASE_URL = "https://cekid-zz.vercel.app";

// Cache game list agar tidak fetch terus-menerus
let cachedGameList = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

/**
 * Fetch game list dari API eksternal dengan caching
 */
async function fetchGameList() {
    const now = Date.now();
    if (cachedGameList && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedGameList;
    }

    const response = await fetch(`${CEKID_BASE_URL}/list-game`, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        },
    });

    const result = await response.json();

    if (result?.data && Array.isArray(result.data)) {
        cachedGameList = result.data;
        cacheTimestamp = now;
        return cachedGameList;
    }

    throw new Error('Gagal mengambil data dari API eksternal');
}

/**
 * GET /api/v5/list-game
 * Ambil daftar semua game yang tersedia untuk cek ID (dinamis dari API eksternal)
 */
const listGame = async (req, res) => {
    try {
        const games = await fetchGameList();

        const data = games.map(game => ({
            name: game.name,
            slug: game.slug,
            endpoint: `/api/v5/${game.slug}`,
            query: game.query || (game.hasZoneId ? "?id=xxxx&zone=xxxx" : "?id=xxxx"),
            hasZoneId: game.hasZoneId,
        }));

        return res.status(200).json({
            success: true,
            message: 'Daftar game berhasil diambil.',
            total: data.length,
            data,
        });
    } catch (err) {
        console.error('[CekID] List game error:', err.message);
        return sendResponse(res, 500, false, 'Gagal mengambil daftar game: ' + err.message);
    }
};

/**
 * GET /api/v5/:slug?id=xxx&zone=xxx
 * Cek username/nickname game berdasarkan User ID via cekid-zz.vercel.app
 */
const checkId = async (req, res) => {
    try {
        const { slug } = req.params;
        const { id, zone } = req.query;

        if (!id) {
            return sendResponse(res, 400, false, 'Parameter id wajib diisi.');
        }

        // Build URL ke API cekid-zz.vercel.app
        let apiUrl = `${CEKID_BASE_URL}/api/game/${slug}/?id=${encodeURIComponent(id)}`;
        if (zone) {
            apiUrl += `&zone=${encodeURIComponent(zone)}`;
        }

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            },
        });

        const result = await response.json();

        if (result?.status === true && result?.data) {
            return sendResponse(res, 200, true, result.message || 'ID game ditemukan.', {
                slug: slug,
                user_id: id,
                zone_id: zone || null,
                username: result.data.username || result.data.user_name || null,
                raw: result.data,
            });
        }

        return sendResponse(res, result?.code || 404, false, result?.message || 'ID game tidak ditemukan atau tidak valid.', {
            slug: slug,
            user_id: id,
            zone_id: zone || null,
            raw: result.data || result,
        });
    } catch (err) {
        console.error('[CekID] Check ID error:', err.message);
        return sendResponse(res, 500, false, 'Gagal cek ID game: ' + err.message);
    }
};

module.exports = { listGame, checkId };