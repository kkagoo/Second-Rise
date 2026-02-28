const express = require('express');
const auth = require('../middleware/auth');
const { submitCheckin, getTodayCheckin } = require('../controllers/checkinController');

const router = express.Router();
router.use(auth);
router.post('/', submitCheckin);
router.get('/today', getTodayCheckin);

module.exports = router;
