// Membantu menyeragamkan bentuk output JSON kita
const sendResponse = (res, statusCode, success, message, data = null) => {
    const responseBody = { success, message };
    if (data) responseBody.data = data;
    return res.status(statusCode).json(responseBody);
};

module.exports = { sendResponse };