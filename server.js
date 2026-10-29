require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo;
const connectDB = require('./config/db');

const missing = ['MONGO_URI', 'SESSION_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`Missing environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1); // Render-এর proxy-র পেছনে আসল IP পেতে

// ---------- নিরাপত্তা header ও CSP ----------
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
                'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
                'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                'img-src': ["'self'", 'data:', 'blob:', 'https:'],
                'connect-src': ["'self'"],
                'form-action': ["'self'"],
                'frame-ancestors': ["'none'"],
                'object-src': ["'none'"],
                // লোকাল http-তে এটা চালু থাকলে CSS/JS লোডই হয় না
                'upgrade-insecure-requests': isProd ? [] : null,
            },
        },
    })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// সাধারণ ভিজিটরের জন্য সামগ্রিক সীমা (static ফাইলের পরে, তাই CSS/JS গণনায় ধরা হয় না)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// ---------- সেশন (শুধু /admin এ) ----------
const sessionMiddleware = session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, ttl: 60 * 60 * 8 }),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 8,
    },
});

app.use('/admin', sessionMiddleware, require('./routes/admin'));
app.use('/', require('./routes/main'));

// ---------- 404 ও error পেজ ----------
app.use((req, res) => {
    res.status(404).render('pages/error', { code: 404, message: 'This page could not be found.' });
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) console.error(err); // আসল error শুধু লগে, ব্যবহারকারীকে নয়

    const message =
        status === 500 ? 'Something went wrong on our side.' : 'The request could not be processed.';

    // contact ফর্ম JSON আশা করে
    if (req.path === '/contact') return res.status(status).json({ ok: false, error: message });

    res.status(status).render('pages/error', { code: status, message });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});