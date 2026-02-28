const express = require('express');
const path    = require('path');
const auth    = require('../middleware/auth');

const router = express.Router();

// All video routes require auth
router.use(auth);

// GET /api/videos — return full library, optionally filtered by session_type
router.get('/', (req, res, next) => {
  try {
    const videos = require(path.join(__dirname, '../data/videos.json'));
    const { type } = req.query;
    const result = type ? videos.filter((v) => v.session_type === type) : videos;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
