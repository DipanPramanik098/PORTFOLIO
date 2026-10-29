const multer = require('multer');
const { UserError } = require('../utils/helpers');

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const upload = multer({
    storage: multer.memoryStorage(), // ডিস্কে নয়, মেমরিতে রাখে (পরে MongoDB-তে যাবে)
    limits: { fileSize: 2 * 1024 * 1024, files: 1, fieldSize: 20 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED.includes(file.mimetype)) return cb(null, true);
        cb(new UserError('Only PNG, JPG, WEBP or GIF images are allowed.'));
    },
});

// multer এর error কে flash বার্তায় বদলে ফর্মে ফেরত পাঠায়
function uploadImage(field) {
    const single = upload.single(field);
    return (req, res, next) => {
        single(req, res, (err) => {
            if (!err) return next();

            let msg = 'Upload failed. Please try again.';
            if (err.code === 'LIMIT_FILE_SIZE') msg = 'The image is too large (max 2 MB).';
            else if (err instanceof UserError) msg = err.message;

            req.session.flash = { type: 'err', text: msg };
            res.redirect(req.originalUrl);
        });
    };
}

module.exports = { uploadImage };