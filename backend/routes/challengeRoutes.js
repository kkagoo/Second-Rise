const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { createChallenge, getChallenge, joinChallenge, checkinChallenge } = require('../controllers/challengeController');

// Optional auth middleware — attaches req.userId if token present, doesn't block if absent
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (_) {}
  }
  next();
}

router.post('/',              auth,         createChallenge);  // create a challenge
router.get('/:code',          optionalAuth, getChallenge);     // public lookup (userId optional)
router.post('/:code/join',    auth,         joinChallenge);    // join a challenge
router.post('/:code/checkin', auth,         checkinChallenge); // log "I moved today"

module.exports = router;
