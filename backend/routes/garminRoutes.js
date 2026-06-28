const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const garmin     = require('../controllers/garminController');

// Public — Garmin calls these without our JWT
router.get('/callback', garmin.callback);
router.post('/webhook', garmin.webhook);

// Authenticated
router.use(auth);
router.get('/connect',    garmin.connect);
router.get('/status',     garmin.getStatus);
router.get('/today',      garmin.getToday);
router.delete('/disconnect', garmin.disconnectGarmin);

module.exports = router;
