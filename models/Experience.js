const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
    {
        role: { type: String, required: true, trim: true },
        company: { type: String, required: true, trim: true },
        startDate: { type: String, required: true },
        endDate: { type: String, default: 'Present' },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Experience', experienceSchema);