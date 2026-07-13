const express = require('express');
const auth = require('../middleware/auth');
const { submitCheckin, getTodayCheckin, getStreak } = require('../controllers/checkinController');

const router = express.Router();
router.use(auth);
router.post('/', submitCheckin);
router.get('/today', getTodayCheckin);
router.get('/streak', getStreak);

module.exports = router;
