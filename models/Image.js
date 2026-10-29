const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
    {
        data: { type: Buffer, required: true },       // ছবির কাঁচা বাইট
        contentType: { type: String, required: true }, // যেমন image/png
        size: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);