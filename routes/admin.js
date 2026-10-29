const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const Admin = require('../models/Admin');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const CodingProfile = require('../models/CodingProfile');
const Education = require('../models/Education');
const Experience = require('../models/Experience');
const { adminLocals, verifyCsrf, requireAuth } = require('../middleware/auth');

const router = express.Router();

// ইমেইল নেই এমন ইউজারের বেলায়ও bcrypt চালানোর জন্য একটা নকল hash
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const EMAIL_RE = /^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/;

// লগইনে ১৫ মিনিটে সর্বোচ্চ ১০টা ব্যর্থ চেষ্টা (সফল লগইন গণনায় ধরা হয় না)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    handler: (req, res) =>
        res.status(429).render('admin/login', {
            error: 'Too many failed attempts. Try again in 15 minutes.',
            email: '',
        }),
});

router.use(adminLocals);

// ---------- Login / Logout ----------
router.get('/login', (req, res) => {
    if (req.session.adminId) return res.redirect('/admin');
    res.render('admin/login', { error: null, email: '' });
});

router.post('/login', loginLimiter, verifyCsrf, async (req, res, next) => {
    try {
        // String() দিয়ে নিশ্চিত করা হচ্ছে ইনপুট সাধারণ টেক্সট (NoSQL injection ঠেকাতে)
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        const admin = await Admin.findOne({ email });

        // ইমেইল ভুল হোক বা পাসওয়ার্ড, সময় প্রায় একই লাগে
        const match = await bcrypt.compare(password, admin ? admin.password : DUMMY_HASH);

        if (!admin || !match) {
            return res.status(401).render('admin/login', { error: 'Wrong email or password.', email });
        }

        // লগইনের পর নতুন সেশন আইডি (session fixation ঠেকায়)
        req.session.regenerate((err) => {
            if (err) return next(err);
            req.session.adminId = admin._id.toString();
            req.session.save((err2) => (err2 ? next(err2) : res.redirect('/admin')));
        });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', verifyCsrf, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sid');
        res.redirect('/admin/login');
    });
});

// ---------- Dashboard ----------
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const [projects, skills, codingProfiles, education, experience] = await Promise.all([
            Project.countDocuments(),
            Skill.countDocuments(),
            CodingProfile.countDocuments(),
            Education.countDocuments(),
            Experience.countDocuments(),
        ]);
        res.render('admin/dashboard', {
            counts: { projects, skills, codingProfiles, education, experience },
        });
    } catch (err) {
        next(err);
    }
});

// ---------- Manage admins ----------
router.get('/admins', requireAuth, async (req, res, next) => {
    try {
        const admins = await Admin.find().sort({ createdAt: 1 }).select('email createdAt');
        res.render('admin/admins', { admins });
    } catch (err) {
        next(err);
    }
});

router.post('/admins', requireAuth, verifyCsrf, async (req, res, next) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const confirm = String(req.body.confirm || '');

        const fail = (text) => {
            req.session.flash = { type: 'err', text };
            return res.redirect('/admin/admins');
        };

        if (!EMAIL_RE.test(email)) return fail('Enter a valid email address.');
        if (password.length < 8 || password.length > 72) return fail('Password must be 8 to 72 characters.');
        if (password !== confirm) return fail('Passwords do not match.');

        try {
            await Admin.create({ email, password }); // hash করার কাজ মডেলের pre('save') করে
        } catch (err) {
            if (err.code === 11000) return fail('An admin with this email already exists.');
            throw err;
        }

        req.session.flash = { type: 'ok', text: `Admin ${email} added.` };
        res.redirect('/admin/admins');
    } catch (err) {
        next(err);
    }
});

// নিচের সব কনটেন্ট-রাউট লগইন ছাড়া খোলা যাবে না
router.use(requireAuth, require('./admin-content'));

module.exports = router;