const express = require('express');
const path    = require('path');
const fs      = require('fs');
const auth    = require('../middleware/auth');

const router = express.Router();

// Load videos once at startup
const VIDEOS_PATH = path.join(__dirname, '../data/videos.json');
const videos = JSON.parse(fs.readFileSync(VIDEOS_PATH, 'utf8'));

// All video routes require auth
router.use(auth);

// GET /api/videos — return full library, optionally filtered by session_type
router.get('/', (req, res) => {
  const { type } = req.query;
  const result = type ? videos.filter((v) => v.session_type === type) : videos;
  res.json(result);
});

module.exports = router;
