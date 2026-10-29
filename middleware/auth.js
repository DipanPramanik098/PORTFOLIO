const crypto = require('crypto');
const Admin = require('../models/Admin');

// প্রতিটা /admin রিকোয়েস্টের শুরুতে চলে
function adminLocals(req, res, next) {
    // CSRF টোকেন: প্রতি সেশনে একবার বানানো হয়
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;

    // Flash বার্তা: একবার দেখানোর পরই মুছে যায়
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    // বর্তমান পাথ (মেনুতে active লিংক চেনার জন্য)
    res.locals.currentPath = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';

    // লগআউটের পর Back চাপলে যেন পুরনো admin পেজ ক্যাশ থেকে না আসে
    res.set('Cache-Control', 'no-store');
    next();
}

// POST ফর্মে লুকানো _csrf ফিল্ড সেশনের টোকেনের সাথে মেলে কিনা দেখে
function verifyCsrf(req, res, next) {
    const sent = Buffer.from(String((req.body && req.body._csrf) || ''));
    const real = Buffer.from(req.session.csrfToken || '');

    if (real.length === 0 || sent.length !== real.length || !crypto.timingSafeEqual(sent, real)) {
        return res
            .status(403)
            .send('Invalid or missing security token. Go back, refresh the page and try again.');
    }
    next();
}

// লগইন করা না থাকলে /admin/login এ পাঠায়
async function requireAuth(req, res, next) {
    try {
        if (!req.session.adminId) return res.redirect('/admin/login');

        // প্রতিবার ডেটাবেসে দেখা হয় admin এখনো আছে কিনা
        const admin = await Admin.findById(req.session.adminId).select('email createdAt');
        if (!admin) return req.session.destroy(() => res.redirect('/admin/login'));

        req.admin = admin;
        res.locals.admin = admin;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { adminLocals, verifyCsrf, requireAuth };