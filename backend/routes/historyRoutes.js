const express = require('express');
const auth = require('../middleware/auth');
const { getHistory, getStats } = require('../controllers/historyController');

const router = express.Router();
router.use(auth);
router.get('/', getHistory);
router.get('/stats', getStats);

module.exports = router;
