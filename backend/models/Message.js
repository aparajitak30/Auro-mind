const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: false },
  audioUrl: { type: String, required: false }, // if applicable
  emotion: { type: String, required: true }, // from ML service
  confidence: { type: Number, required: true }, // from ML service
  isHighRisk: { type: Boolean, default: false }, // from ML service
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
