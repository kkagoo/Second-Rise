const express         = require('express');
const router          = express.Router();
const auth            = require('../middleware/auth');
const whoopController = require('../controllers/whoopController');

router.get('/connect',  auth, whoopController.connect);
router.get('/callback',      whoopController.callback);
router.get('/status',   auth, whoopController.getStatus);
router.post('/sync',    auth, whoopController.syncToday);
router.get('/today',    auth, whoopController.getToday);

module.exports = router;
