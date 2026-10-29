const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const entities = require('./content-config');
const h = require('../utils/helpers');
const { verifyCsrf } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();
const EMAIL_RE = /^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/;
const isUserError = (err) => err instanceof h.UserError || err.name === 'ValidationError';

// URL-এ :id থাকলে সেটা ২৪ অক্ষরের হেক্স কিনা দেখে
router.param('id', (req, res, next, id) =>
    /^[a-f0-9]{24}$/i.test(id) ? next() : res.status(404).send('Not found')
);

/* =============== Site settings =============== */
const getSettings = async () => (await SiteSettings.findOne()) || SiteSettings.create({});

const settingsView = (b) => ({
    fullName: b.fullName, tagline: b.tagline, about: b.about,
    heroImage: b.heroImage, resumeLink: b.resumeLink,
    email: b.email, phone: b.phone, location: b.location,
    socials: { github: b.github, linkedin: b.linkedin, twitter: b.twitter, instagram: b.instagram },
});

router.get('/settings', async (req, res, next) => {
    try {
        res.render('admin/settings', { s: await getSettings(), error: null });
    } catch (err) {
        next(err);
    }
});

// ক্রম: লগইন যাচাই (আগেই হয়েছে) → ফাইল পড়া → CSRF যাচাই → আমাদের কোড
// CSRF টোকেন multipart ফর্মে ফাইলের সাথেই আসে, তাই multer আগে চালাতে হয়
router.post('/settings', uploadImage('imageFile'), verifyCsrf, async (req, res, next) => {
    const b = req.body;
    try {
        const s = await getSettings();

        // আগে সব টেক্সট যাচাই, সবার শেষে ছবি (নইলে ভুল হলে ছবি অকারণে সেভ হয়ে যেত)
        const fullName = h.text(b.fullName, 80);
        if (!fullName) throw new h.UserError('Name is required.');

        const email = h.text(b.email, 120);
        if (email && !EMAIL_RE.test(email)) throw new h.UserError('Enter a valid email address.');

        const phone = h.text(b.phone, 30);
        if (!/^[+\d\s()\-]*$/.test(phone)) throw new h.UserError('Phone can contain only digits, spaces, + ( ) and -.');

        const fields = {
            fullName,
            tagline: h.text(b.tagline, 120),
            about: h.text(b.about, 600),
            resumeLink: h.cleanResume(b.resumeLink),
            email,
            phone,
            location: h.text(b.location, 100),
            socials: {
                github: h.cleanUrl(b.github),
                linkedin: h.cleanUrl(b.linkedin),
                twitter: h.cleanUrl(b.twitter),
                instagram: h.cleanUrl(b.instagram),
            },
        };

        const oldRef = s.heroImage || '';
        const newRef = (await h.resolveImage(req, b.heroImage)) || '/images/profile.jpg';

        s.set(fields);
        s.heroImage = newRef;
        await h.withImageSwap(oldRef, newRef, () => s.save());

        req.session.flash = { type: 'ok', text: 'Settings saved.' };
        res.redirect('/admin/settings');
    } catch (err) {
        if (isUserError(err)) {
            return res.status(400).render('admin/settings', { s: settingsView(b), error: err.message });
        }
        next(err);
    }
});

/* =============== Generic CRUD =============== */
function parseFields(cfg, body) {
    const out = {};
    for (const f of cfg.fields) {
        if (f.type === 'image') continue; // ছবি আলাদাভাবে সামলানো হয়
        const raw = body[f.name];
        let v;

        if (f.type === 'number') {
            const n = parseInt(raw, 10);
            v = Number.isFinite(n) ? Math.max(-9999, Math.min(9999, n)) : 0;
        } else if (f.type === 'url') {
            v = h.cleanUrl(raw);
        } else if (f.type === 'tags') {
            v = String(raw ?? '').split(',').map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 20);
        } else {
            v = h.text(raw, f.max || (f.type === 'textarea' ? 1000 : 120));
            if (v === '' && f.fallback) v = f.fallback;
        }

        const empty = Array.isArray(v) ? v.length === 0 : v === '';
        if (f.required && empty) throw new h.UserError(`${f.label} is required.`);
        out[f.name] = v;
    }
    return out;
}

function toValues(cfg, item) {
    const v = {};
    cfg.fields.forEach((f) => {
        const x = item[f.name];
        v[f.name] = Array.isArray(x) ? x.join(', ') : (x ?? '');
    });
    return v;
}

Object.entries(entities).forEach(([slug, cfg]) => {
    const base = `/${slug}`;
    const imgField = cfg.fields.find((f) => f.type === 'image');
    const renderForm = (res, item, values, error, status = 200) =>
        res.status(status).render('admin/form', { slug, cfg, item, values, error });

    // তালিকা
    router.get(base, async (req, res, next) => {
        try {
            const items = await cfg.Model.find().sort({ order: 1, createdAt: -1 });
            res.render('admin/list', { slug, cfg, items, imgField });
        } catch (err) {
            next(err);
        }
    });

    // নতুন যোগের ফর্ম (এটা /:id এর আগে থাকতে হবে, নইলে "new" কে আইডি ভাবত)
    router.get(`${base}/new`, (req, res) => renderForm(res, null, {}, null));

    // এডিটের ফর্ম
    router.get(`${base}/:id`, async (req, res, next) => {
        try {
            const item = await cfg.Model.findById(req.params.id);
            if (!item) return res.status(404).send('Not found');
            renderForm(res, item, toValues(cfg, item), null);
        } catch (err) {
            next(err);
        }
    });

    // নতুন যোগ
    router.post(base, uploadImage('imageFile'), verifyCsrf, async (req, res, next) => {
        try {
            const data = parseFields(cfg, req.body);

            let newRef = '';
            if (imgField) {
                newRef = await h.resolveImage(req, req.body[imgField.name]);
                if (imgField.required && !newRef) throw new h.UserError(`${imgField.label} is required.`);
                data[imgField.name] = newRef;
            }

            await h.withImageSwap('', newRef, () => cfg.Model.create(data));
            req.session.flash = { type: 'ok', text: `${cfg.singular} added.` };
            res.redirect(`/admin${base}`);
        } catch (err) {
            if (isUserError(err)) return renderForm(res, null, req.body, err.message, 400);
            next(err);
        }
    });

    // আপডেট
    router.post(`${base}/:id`, uploadImage('imageFile'), verifyCsrf, async (req, res, next) => {
        let item = null;
        try {
            item = await cfg.Model.findById(req.params.id);
            if (!item) return res.status(404).send('Not found');

            const data = parseFields(cfg, req.body);

            let oldRef = '';
            let newRef = '';
            if (imgField) {
                oldRef = item[imgField.name] || '';
                newRef = await h.resolveImage(req, req.body[imgField.name]);
                if (imgField.required && !newRef) throw new h.UserError(`${imgField.label} is required.`);
                data[imgField.name] = newRef;
            }

            item.set(data);
            await h.withImageSwap(oldRef, newRef, () => item.save());
            req.session.flash = { type: 'ok', text: `${cfg.singular} updated.` };
            res.redirect(`/admin${base}`);
        } catch (err) {
            if (isUserError(err)) return renderForm(res, item, req.body, err.message, 400);
            next(err);
        }
    });

    // মুছে ফেলা (GET নয়, POST + CSRF টোকেন, নইলে একটা লিংকেই ডেটা মুছে যেত)
    router.post(`${base}/:id/delete`, verifyCsrf, async (req, res, next) => {
        try {
            const item = await cfg.Model.findByIdAndDelete(req.params.id);
            if (item && imgField) await h.removeMedia(item[imgField.name]);
            req.session.flash = { type: 'ok', text: `${cfg.singular} deleted.` };
            res.redirect(`/admin${base}`);
        } catch (err) {
            next(err);
        }
    });
});

module.exports = router;