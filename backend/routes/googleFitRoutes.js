const express             = require('express');
const router              = express.Router();
const auth                = require('../middleware/auth');
const googleFitController = require('../controllers/googleFitController');
const { analyzeTrends }   = require('../services/trendAnalysisService');
const { syncTrend }       = require('../services/googleHealthTrendService');
const db                  = require('../db/database');

router.get('/connect',  auth, googleFitController.connect);
router.get('/callback',      googleFitController.callback);
router.get('/status',   auth, googleFitController.getStatus);
router.post('/sync',    auth, googleFitController.syncToday);
router.get('/today',    auth, googleFitController.getToday);

// 14-day trend analysis endpoint
router.get('/trends', auth, async (req, res, next) => {
  try {
    const gfProfile = db.prepare('SELECT google_fit_access_token FROM user_profiles WHERE user_id = ?').get(req.userId);
    if (gfProfile?.google_fit_access_token) {
      await syncTrend(req.userId, 14).catch(() => {});
    }
    const trend = analyzeTrends(req.userId, 14);
    res.json(trend || { patterns: [], daysOfData: 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
