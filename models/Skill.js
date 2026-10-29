const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        image: { type: String, required: true }, // skill এর আইকন/লোগো
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);