const express = require('express');
const auth = require('../middleware/auth');
const { getHistory, getStats, getWeekStats, getUnifiedHistory, exportSessionsCSV } = require('../controllers/historyController');

const router = express.Router();
router.use(auth);
router.get('/',              getHistory);
router.get('/stats',         getStats);
router.get('/week',          getWeekStats);
router.get('/unified',       getUnifiedHistory);
router.get('/export.csv',    exportSessionsCSV);

module.exports = router;
