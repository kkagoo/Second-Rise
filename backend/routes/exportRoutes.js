const express = require('express');
const auth = require('../middleware/auth');
const { exportCheckinCSV, exportAllDataCSV } = require('../controllers/exportController');

const router = express.Router();
router.use(auth);

router.get('/checkins.csv',  exportCheckinCSV);
router.get('/all.csv',       exportAllDataCSV);

module.exports = router;
