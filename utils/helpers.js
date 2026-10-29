const Image = require('../models/Image');

// ব্যবহারকারীর ভুলের জন্য আলাদা error (ফর্মে সুন্দর বার্তা দেখানোর জন্য)
class UserError extends Error { }

const text = (v, max = 200) => String(v ?? '').trim().slice(0, max);

// ফাইলের প্রথম কয়েক বাইট দেখে আসল ধরন চেনে। ফাইলের নাম বা ঘোষিত type বিশ্বাস করা যায় না
function detectImageType(buf) {
    if (!buf || buf.length < 12) return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return null;
}

// শুধু http/https লিংক গ্রহণ। 'javascript:...' লিংক href-এ বসলে স্ক্রিপ্ট চলে,
// <%= %> এটা আটকায় না, তাই সার্ভারেই ফিল্টার করতে হয়
function cleanUrl(value) {
    const v = String(value ?? '').trim();
    if (!v) return '';
    if (v.length > 500) throw new UserError('A link is too long (max 500 characters).');
    let u;
    try {
        u = new URL(v);
    } catch {
        throw new UserError(`"${v.slice(0, 60)}" is not a valid link. Start it with https://`);
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new UserError('Links must start with http:// or https://');
    }
    return u.href;
}

// ছবির রেফারেন্স: নিজের /media/<id>, /images/..., অথবা http(s) লিংক
function cleanImageRef(value) {
    const v = String(value ?? '').trim();
    if (!v) return '';
    if (/^\/media\/[a-f0-9]{24}$/i.test(v)) return v;
    if (/^\/images\/(?!.*\.\.)[\w.\-\/]+$/.test(v)) return v;
    return cleanUrl(v);
}

// resume: /resume/xyz.pdf অথবা http(s) লিংক
function cleanResume(value) {
    const v = String(value ?? '').trim();
    if (/^\/resume\/[\w.\-]+$/.test(v)) return v;
    return cleanUrl(v);
}

async function saveUploadedImage(file) {
    const type = detectImageType(file.buffer);
    if (!type) throw new UserError('Only PNG, JPG, WEBP or GIF images are allowed.');
    const img = await Image.create({ data: file.buffer, contentType: type, size: file.size });
    return `/media/${img._id}`;
}

// ফাইল আপলোড হলে সেটাই, নইলে টেক্সট বক্সের লিংক
async function resolveImage(req, typedValue) {
    if (req.file) return saveUploadedImage(req.file);
    return cleanImageRef(typedValue);
}

// পুরনো ছবি /media/ এর হলে ডেটাবেস থেকে মুছে দেয় (জমে থাকা অপ্রয়োজনীয় ছবি এড়াতে)
async function removeMedia(ref) {
    const m = /^\/media\/([a-f0-9]{24})$/i.exec(String(ref || ''));
    if (m) await Image.deleteOne({ _id: m[1] });
}

// সেভ সফল হলে পুরনো ছবি মোছে, ব্যর্থ হলে নতুন ছবিটা মোছে
async function withImageSwap(oldRef, newRef, saveFn) {
    try {
        await saveFn();
    } catch (err) {
        if (newRef !== oldRef) await removeMedia(newRef);
        throw err;
    }
    if (newRef !== oldRef) await removeMedia(oldRef);
}

module.exports = {
    UserError, text, cleanUrl, cleanImageRef, cleanResume,
    resolveImage, removeMedia, withImageSwap,
};