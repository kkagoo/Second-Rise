const express    = require('express');
const auth       = require('../middleware/auth');
const withings   = require('../controllers/withingsController');

const router = express.Router();

router.get('/connect',  auth, withings.connect);
router.get('/callback',       withings.callback);   // no auth — OAuth redirect
router.post('/sync',    auth, withings.syncToday);
router.get('/today',    auth, withings.getToday);
router.get('/status',   auth, withings.getStatus);

module.exports = router;
