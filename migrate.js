/**
 * Migration Script: Redis → MySQL
 * 
 * Jalankan 1x saja untuk memindahkan data dari Redis ke MySQL.
 * Pastikan MySQL sudah running dan database sudah dibuat.
 * 
 * Usage: node migrate.js
 */

require('dotenv').config();
const { scanKeys, getJSON } = require('./config/redis');
const db = require('./config/database');

async function migrate() {
    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  🔄 MIGRASI DATA: Redis → MySQL');
    console.log('══════════════════════════════════════════');
    console.log('');

    // 1. Test connections
    const dbOk = await db.testConnection();
    if (!dbOk) {
        console.error('❌ MySQL tidak terhubung. Pastikan XAMPP MySQL running dan .env benar.');
        process.exit(1);
    }

    // 2. Init tables
    await db.init();
    console.log('');

    let stats = { admins: 0, users: 0, apiKeys: 0, plans: 0, tokens: 0, settings: 0 };

    // ==========================================
    // MIGRATE ADMINS
    // ==========================================
    console.log('📦 Migrasi admin accounts...');
    const adminKeys = await scanKeys('admin:*');
    for (const key of adminKeys) {
        const admin = await getJSON(key);
        if (!admin || !admin.username) continue;

        try {
            const exists = await db.getOne('SELECT id FROM admins WHERE username = ?', [admin.username]);
            if (exists) {
                console.log(`   ⏭️  Admin "${admin.username}" sudah ada, skip.`);
                continue;
            }

            await db.run(
                'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
                [admin.username, admin.passwordHash, admin.createdAt || new Date().toISOString()]
            );
            stats.admins++;
            console.log(`   ✅ Admin "${admin.username}" berhasil dipindahkan.`);
        } catch (err) {
            console.error(`   ❌ Gagal migrasi admin "${admin.username}":`, err.message);
        }
    }

    // ==========================================
    // MIGRATE SUBSCRIPTION PLANS
    // ==========================================
    console.log('\n📦 Migrasi subscription plans...');
    const planKeys = await scanKeys('subplan:*');
    const planIdMap = {}; // oldId → newId mapping

    for (const key of planKeys) {
        const plan = await getJSON(key);
        if (!plan) continue;

        try {
            const result = await db.run(
                'INSERT INTO subscription_plans (name, price, duration_days, description, benefits, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    plan.name || 'Unnamed Plan',
                    parseInt(plan.price) || 0,
                    parseInt(plan.duration_days || plan.durationDays) || 30,
                    plan.description || '',
                    JSON.stringify(plan.benefits || []),
                    plan.active !== undefined ? (plan.active ? 1 : 0) : 1,
                    plan.createdAt || new Date().toISOString(),
                ]
            );
            planIdMap[plan.id] = result.insertId;
            stats.plans++;
            console.log(`   ✅ Plan "${plan.name}" (old ID: ${plan.id} → new ID: ${result.insertId})`);
        } catch (err) {
            console.error(`   ❌ Gagal migrasi plan "${plan.name}":`, err.message);
        }
    }

    // ==========================================
    // MIGRATE USERS (userauth:*)
    // ==========================================
    console.log('\n📦 Migrasi users...');
    const userKeys = await scanKeys('userauth:*');
    const userIdMap = {}; // oldId → newId mapping

    for (const key of userKeys) {
        const user = await getJSON(key);
        if (!user || !user.email) continue;

        try {
            const exists = await db.getOne('SELECT id FROM users WHERE email = ?', [user.email]);
            if (exists) {
                userIdMap[user.id] = exists.id;
                console.log(`   ⏭️  User "${user.email}" sudah ada (ID: ${exists.id}), skip.`);
                continue;
            }

            // Map subscription plan ID
            let newPlanId = null;
            if (user.subscriptionPlanId) {
                newPlanId = planIdMap[user.subscriptionPlanId] || user.subscriptionPlanId;
            }

            const result = await db.run(
                'INSERT INTO users (name, email, whatsapp, password_hash, api_key, api_key_active, subscription_plan_id, subscription_expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    user.name || 'User',
                    user.email,
                    user.whatsapp || '',
                    user.passwordHash || '',
                    user.apiKey || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    user.apiKeyActive ? 1 : 0,
                    newPlanId,
                    user.subscriptionExpiresAt || null,
                    user.createdAt || new Date().toISOString(),
                ]
            );

            const newUserId = result.insertId;
            userIdMap[user.id] = newUserId;
            stats.users++;
            console.log(`   ✅ User "${user.name}" <${user.email}> (old ID: ${user.id} → new ID: ${newUserId})`);

            // Migrate user's API key
            try {
                const existsKey = await db.getOne('SELECT id FROM api_keys WHERE id = ?', [`user-${newUserId}`]);
                if (!existsKey) {
                    await db.run(
                        'INSERT INTO api_keys (id, `key`, label, active, expired_days, rate_limit, usage_count, user_id, created_at) VALUES (?, ?, ?, ?, 0, 1000, 0, ?, ?)',
                        [
                            `user-${newUserId}`,
                            user.apiKey || `temp-${Date.now()}`,
                            `${user.name} (User)`,
                            user.apiKeyActive ? 1 : 0,
                            newUserId,
                            user.createdAt || new Date().toISOString(),
                        ]
                    );
                    console.log(`      🔑 API Key created for user #${newUserId}`);
                }
            } catch (err) {
                console.error(`      ❌ API Key error for user #${newUserId}:`, err.message);
            }

            // Migrate tokens (gopay & orkut)
            if (user.gopayTokens || user.orderkoutaTokens) {
                try {
                    const gt = user.gopayTokens || {};
                    const ot = user.orderkoutaTokens || {};

                    await db.run(
                        'INSERT INTO user_tokens (user_id, gopay_access_token, gopay_refresh_token, gopay_x_uniqueid, gopay_saved_at, orkut_username, orkut_auth_token, orkut_saved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            newUserId,
                            gt.access_token || null,
                            gt.refresh_token || null,
                            gt.x_uniqueid || null,
                            gt.savedAt || null,
                            ot.username || null,
                            ot.auth_token || null,
                            ot.savedAt || null,
                        ]
                    );
                    stats.tokens++;
                    console.log(`      🔐 Tokens migrated for user #${newUserId}`);
                } catch (err) {
                    console.error(`      ❌ Token error for user #${newUserId}:`, err.message);
                }
            }

        } catch (err) {
            console.error(`   ❌ Gagal migrasi user "${user.email}":`, err.message);
        }
    }

    // ==========================================
    // MIGRATE STANDALONE API KEYS (non-user keys)
    // ==========================================
    console.log('\n📦 Migrasi API keys (non-user)...');
    const apiKeyKeys = await scanKeys('apikey:*');

    for (const key of apiKeyKeys) {
        const apiKey = await getJSON(key);
        if (!apiKey || !apiKey.id) continue;

        // Skip user-linked keys (already migrated above)
        if (apiKey.id.startsWith('user-')) continue;

        try {
            const exists = await db.getOne('SELECT id FROM api_keys WHERE id = ?', [apiKey.id]);
            if (exists) {
                console.log(`   ⏭️  API Key "${apiKey.label}" sudah ada, skip.`);
                continue;
            }

            // Map userId if exists
            let newUserId = null;
            if (apiKey.userId && userIdMap[apiKey.userId]) {
                newUserId = userIdMap[apiKey.userId];
            }

            await db.run(
                'INSERT INTO api_keys (id, `key`, label, active, expired_days, rate_limit, usage_count, last_used, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    apiKey.id,
                    apiKey.key,
                    apiKey.label || 'Unnamed',
                    apiKey.active ? 1 : 0,
                    parseInt(apiKey.expiredDays) || 0,
                    parseInt(apiKey.rateLimit) || 0,
                    parseInt(apiKey.usageCount) || 0,
                    apiKey.lastUsed || null,
                    newUserId,
                    apiKey.createdAt || new Date().toISOString(),
                ]
            );
            stats.apiKeys++;
            console.log(`   ✅ API Key "${apiKey.label}" (${apiKey.id})`);
        } catch (err) {
            console.error(`   ❌ Gagal migrasi API Key "${apiKey.label}":`, err.message);
        }
    }

    // ==========================================
    // MIGRATE NOTIFICATION SETTINGS
    // ==========================================
    console.log('\n📦 Migrasi notification settings...');
    try {
        const notifSettings = await getJSON('settings:notification');
        if (notifSettings) {
            await db.run(
                'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
                ['notification', JSON.stringify(notifSettings), JSON.stringify(notifSettings)]
            );
            stats.settings++;
            console.log('   ✅ Notification settings berhasil dipindahkan.');
        } else {
            console.log('   ⏭️  Tidak ada notification settings di Redis.');
        }
    } catch (err) {
        console.error('   ❌ Gagal migrasi notification settings:', err.message);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  ✅ MIGRASI SELESAI!');
    console.log('══════════════════════════════════════════');
    console.log(`  👤 Admins      : ${stats.admins} dipindahkan`);
    console.log(`  👥 Users       : ${stats.users} dipindahkan`);
    console.log(`  🔑 API Keys    : ${stats.apiKeys} dipindahkan (non-user)`);
    console.log(`  📦 Plans       : ${stats.plans} dipindahkan`);
    console.log(`  🔐 Tokens      : ${stats.tokens} dipindahkan`);
    console.log(`  ⚙️  Settings    : ${stats.settings} dipindahkan`);
    console.log('══════════════════════════════════════════');
    console.log('');
    console.log('💡 Sekarang jalankan: npm start');
    console.log('');

    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
