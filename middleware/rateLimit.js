const rateLimit = require('express-rate-limit');

// একই IP থেকে ১৫ মিনিটে সর্বোচ্চ ৫টা মেসেজ
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many messages. Please try again in a few minutes.' },
});

module.exports = { contactLimiter };