const mysql = require('mysql2/promise');
require('dotenv').config();

// ==========================================
// CONNECTION POOL
// ==========================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'odzreshop_api',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Execute a query and return all rows
 */
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

/**
 * Execute a query and return the first row or null
 */
async function getOne(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
}

/**
 * Execute INSERT/UPDATE/DELETE and return result
 */
async function run(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
}

// ==========================================
// AUTO-CREATE TABLES
// ==========================================
async function init() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                whatsapp VARCHAR(50),
                password_hash VARCHAR(255) NOT NULL,
                api_key VARCHAR(50) UNIQUE NOT NULL,
                api_key_active TINYINT(1) DEFAULT 0,
                subscription_plan_id INT DEFAULT NULL,
                subscription_expires_at DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_api_key (api_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id VARCHAR(50) PRIMARY KEY,
                \`key\` VARCHAR(100) UNIQUE NOT NULL,
                label VARCHAR(255),
                active TINYINT(1) DEFAULT 1,
                expired_days INT DEFAULT 0,
                rate_limit INT DEFAULT 1000,
                usage_count INT DEFAULT 0,
                last_used DATETIME DEFAULT NULL,
                user_id INT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_key (\`key\`),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                duration_days INT NOT NULL,
                description TEXT,
                benefits JSON,
                rate_limit INT DEFAULT 0,
                active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Safe migration: tambah kolom rate_limit jika belum ada (untuk database lama)
        try {
            await conn.query('ALTER TABLE subscription_plans ADD COLUMN rate_limit INT DEFAULT 0 AFTER benefits');
            console.log('   ✅ Kolom rate_limit berhasil ditambahkan ke subscription_plans.');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
                // Kolom sudah ada, skip
            } else {
                console.error('   ⚠️ ALTER TABLE subscription_plans error:', e.message);
            }
        }

        await conn.query(`
            CREATE TABLE IF NOT EXISTS user_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                gopay_access_token TEXT DEFAULT NULL,
                gopay_refresh_token TEXT DEFAULT NULL,
                gopay_x_uniqueid TEXT DEFAULT NULL,
                gopay_saved_at DATETIME DEFAULT NULL,
                orkut_username TEXT DEFAULT NULL,
                orkut_auth_token TEXT DEFAULT NULL,
                orkut_saved_at DATETIME DEFAULT NULL,
                digi_cookie LONGTEXT DEFAULT NULL,
                digi_saved_at DATETIME DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Safe migration: tambah kolom digi_cookie jika belum ada
        try { await conn.query('ALTER TABLE user_tokens ADD COLUMN digi_cookie LONGTEXT DEFAULT NULL AFTER orkut_saved_at'); } catch(e) {}
        try { await conn.query('ALTER TABLE user_tokens ADD COLUMN digi_saved_at DATETIME DEFAULT NULL AFTER digi_cookie'); } catch(e) {}

        // Safe migration: tambah kolom feature access di subscription_plans
        try { await conn.query('ALTER TABLE subscription_plans ADD COLUMN allow_gopay TINYINT(1) DEFAULT 1 AFTER rate_limit'); } catch(e) {}
        try { await conn.query('ALTER TABLE subscription_plans ADD COLUMN allow_orderkouta TINYINT(1) DEFAULT 1 AFTER allow_gopay'); } catch(e) {}
        try { await conn.query('ALTER TABLE subscription_plans ADD COLUMN allow_digiflazz TINYINT(1) DEFAULT 1 AFTER allow_orderkouta'); } catch(e) {}
        try { await conn.query('ALTER TABLE subscription_plans ADD COLUMN allow_wa_gateway TINYINT(1) DEFAULT 1 AFTER allow_digiflazz'); } catch(e) {}
        try { await conn.query('ALTER TABLE subscription_plans ADD COLUMN sort_order INT DEFAULT 0 AFTER allow_wa_gateway'); } catch(e) {}

        await conn.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS settings (
                \`key\` VARCHAR(100) PRIMARY KEY,
                value JSON NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS request_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                method VARCHAR(10),
                path VARCHAR(500),
                api_key_label VARCHAR(255),
                status_code INT,
                ip VARCHAR(45),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        console.log('✅ MySQL tables ready.');
    } finally {
        conn.release();
    }
}

/**
 * Test koneksi MySQL
 */
async function testConnection() {
    try {
        await pool.execute('SELECT 1');
        console.log('✅ MySQL terhubung.');
        return true;
    } catch (err) {
        console.error('❌ Gagal terhubung ke MySQL:', err.message);
        return false;
    }
}

module.exports = { pool, query, getOne, run, init, testConnection };
