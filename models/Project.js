const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        image: { type: String, default: '' },
        techStack: [{ type: String, trim: true }],
        liveLink: { type: String, default: '' },
        githubLink: { type: String, default: '' },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);