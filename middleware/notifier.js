const { sendRequestNotification } = require('../library/notifier');

/**
 * Middleware: Notifikasi otomatis setiap API response
 * Intercept res.json() untuk menangkap status code dan mengirim notifikasi
 */
const notifyOnResponse = (req, res, next) => {
    // Skip untuk static files, docs, admin/user pages, dan internal endpoints
    const skipPaths = ['/docs', '/admin', '/user', '/api/admin', '/api/user', '/api/site-config', '/image', '/favicon'];
    if (skipPaths.some(p => req.path.startsWith(p)) || req.path === '/') {
        return next();
    }

    // Override res.json untuk intercept response
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Kirim notifikasi secara async (tidak blocking response)
        setImmediate(() => {
            sendRequestNotification({
                statusCode: res.statusCode,
                method: req.method,
                path: req.originalUrl || req.path,
                ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'] || 'Unknown',
                apiKeyLabel: req.apiKeyInfo?.label || null,
                error: body?.success === false
                    ? `ERROR: ${body.message || 'Unknown error'}`
                    : `SUCCESS: ${req.method} ${req.originalUrl || req.path}`,
            });
        });

        return originalJson(body);
    };

    next();
};

module.exports = notifyOnResponse;
