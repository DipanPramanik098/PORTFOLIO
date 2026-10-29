const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    fullName: { type: String, default: 'Dipan Pramanik' },
    tagline: { type: String, default: 'Full Stack Developer' },
    about: { type: String, default: 'Write a short about yourself.' },
    heroImage: { type: String, default: '/images/profile.jpg' },
    resumeLink: { type: String, default: '/resume/resume.pdf' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    socials: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
    },
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);