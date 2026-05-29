const express          = require('express');
const router           = express.Router();
const auth             = require('../middleware/auth');
const fitbitController = require('../controllers/fitbitController');

router.get('/connect',  auth, fitbitController.connect);
router.get('/callback',      fitbitController.callback);
router.get('/status',   auth, fitbitController.getStatus);
router.post('/sync',    auth, fitbitController.syncToday);
router.get('/today',    auth, fitbitController.getToday);

module.exports = router;
