const express = require('express');
const router = express.Router();

const SiteSettings = require('../models/SiteSettings');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Education = require('../models/Education');
const Experience = require('../models/Experience');
const CodingProfile = require('../models/CodingProfile');
const transporter = require('../config/mailer');
const { contactLimiter } = require('../middleware/rateLimit');
const Image = require('../models/Image');

router.get('/', async (req, res) => {
    try {
        // সেটিংস না থাকলে ডিফল্ট মান দিয়ে একটা বানিয়ে নেবে
        let settings = await SiteSettings.findOne();
        if (!settings) settings = await SiteSettings.create({});

        // সব কালেকশনের ডেটা একসাথে (সমান্তরালে) আনা হচ্ছে
        const [skills, projects, education, experience, codingProfiles] =
            await Promise.all([
                Skill.find().sort({ order: 1, createdAt: 1 }),
                Project.find().sort({ order: 1, createdAt: -1 }),
                Education.find().sort({ order: 1, createdAt: -1 }),
                Experience.find().sort({ order: 1, createdAt: -1 }),
                CodingProfile.find().sort({ order: 1, createdAt: 1 }),
            ]);

        res.render('pages/home', {
            settings, skills, projects, education, experience, codingProfiles,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }
});

router.post('/contact', contactLimiter, async (req, res) => {
    const { name, email, message, website } = req.body;

    // Honeypot ভরা থাকলে বট; চুপচাপ "সফল" বলে ফেরত দিই, মেইল পাঠাই না
    if (website) return res.json({ ok: true });

    const clean = (v) => String(v || '').trim();
    const n = clean(name).replace(/[\r\n]+/g, ' ').slice(0, 80);
    const e = clean(email).slice(0, 120);
    const m = clean(message).slice(0, 2000);

    if (!n || !e || !m) {
        return res.status(400).json({ ok: false, error: 'Please fill in all fields.' });
    }
    if (!/^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/.test(e)) {
        return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    try {
        await transporter.sendMail({
            from: `"Portfolio Contact" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_TO || process.env.MAIL_USER,
            replyTo: e, // তুমি Reply চাপলে সরাসরি ভিজিটরের কাছে যাবে
            subject: `New portfolio message from ${n}`,
            text: `Name: ${n}\nEmail: ${e}\n\n${m}`,
        });
        res.json({ ok: true });
    } catch (err) {
        console.error('Mail send error:', err.message);
        res.status(500).json({ ok: false, error: 'Could not send the message. Please try again later.' });
    }
});

// ডেটাবেসে রাখা ছবি দেখায়: /media/<id>
router.get('/media/:id', async (req, res) => {
    try {
        if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).end();

        const img = await Image.findById(req.params.id).select('data contentType');
        if (!img) return res.status(404).end();

        res.set({
            'Content-Type': img.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable', // প্রতিটা ছবির আইডি অনন্য, তাই ১ বছর ক্যাশ নিরাপদ
            'X-Content-Type-Options': 'nosniff',                    // ব্রাউজারকে type অনুমান করতে মানা
        });
        res.send(Buffer.from(img.data));
    } catch (err) {
        res.status(500).end();
    }
});


module.exports = router;