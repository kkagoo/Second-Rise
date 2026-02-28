const express = require('express');
const auth = require('../middleware/auth');
const { getRecommendation, selectSession } = require('../controllers/recommendController');

const router = express.Router();
router.use(auth);
router.get('/', getRecommendation);
router.post('/select', selectSession);

module.exports = router;
