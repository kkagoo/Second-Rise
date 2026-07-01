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
// Reads from cached DB; only re-syncs from Google if data is >30 min old
router.get('/trends', auth, async (req, res, next) => {
  try {
    const gfProfile = db.prepare('SELECT google_fit_access_token FROM user_profiles WHERE user_id = ?').get(req.userId);
    if (gfProfile?.google_fit_access_token) {
      const lastSync = db.prepare(
        "SELECT MAX(synced_at) AS last FROM google_health_trends WHERE user_id = ?"
      ).get(req.userId);
      const ageMs = lastSync?.last
        ? Date.now() - new Date(lastSync.last + 'Z').getTime()
        : Infinity;
      if (ageMs > 30 * 60 * 1000) {          // stale if >30 min old
        await syncTrend(req.userId, 14).catch(() => {});
      }
    }
    const trend = analyzeTrends(req.userId, 14);
    res.json(trend || { patterns: [], daysOfData: 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
