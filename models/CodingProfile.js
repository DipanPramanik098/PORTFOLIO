const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true }, // যেমন: LeetCode
    image:    { type: String, required: true },
    link:     { type: String, required: true },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodingProfile', codingProfileSchema);