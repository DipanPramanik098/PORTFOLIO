const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
    {
        degree: { type: String, required: true, trim: true },
        institute: { type: String, required: true, trim: true },
        startYear: { type: String, required: true },
        endYear: { type: String, default: 'Present' },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Education', educationSchema);