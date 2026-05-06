const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const Message = require('../models/Message');
const { protect, admin } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// @route POST /api/chat/text
// @desc Send a text message and get emotion analysis
router.post('/text', protect, async (req, res) => {
  const { text } = req.body;
  try {
    // Send to ML Microservice
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/analyze/text`, { text });
    const { emotion, confidence, is_high_risk } = mlResponse.data;

    // Save to DB
    const message = await Message.create({
      user: req.user._id,
      text,
      emotion,
      confidence,
      isHighRisk: is_high_risk
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error communicating with ML service:", error.message);
    res.status(500).json({ message: 'Error analyzing text' });
  }
});

// @route POST /api/chat/voice
// @desc Send a voice message and get emotion analysis
router.post('/voice', protect, upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No audio file provided' });

    const form = new FormData();
    form.append('file', fs.createReadStream(file.path), file.originalname);

    // Send to ML Microservice
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/analyze/voice`, form, {
      headers: { ...form.getHeaders() }
    });
    const { emotion, confidence } = mlResponse.data;

    // Optional: Upload audio file to cloud storage here and get URL
    // For now, we just save the analysis result

    // Save to DB
    const message = await Message.create({
      user: req.user._id,
      audioUrl: file.path, // In real app, store cloud URL
      emotion,
      confidence
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error communicating with ML service:", error.message);
    res.status(500).json({ message: 'Error analyzing voice' });
  }
});

// @route GET /api/chat/history
// @desc Get current user's chat history
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await Message.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// @route GET /api/chat/admin/users
// @desc Admin route to get all users and their latest risk status
router.get('/admin/users', protect, admin, async (req, res) => {
  try {
    // Basic aggregation or fetching logic for admin dashboard
    const messages = await Message.find().populate('user', 'username').sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin data' });
  }
});

module.exports = router;
