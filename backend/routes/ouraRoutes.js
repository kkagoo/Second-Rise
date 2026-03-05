const express        = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const ouraController = require('../controllers/ouraController');

router.get('/connect',  auth, ouraController.connect);    // returns OAuth URL
router.get('/callback',       ouraController.callback);   // Oura redirects here (no auth)
router.get('/status',   auth, ouraController.getStatus);
router.post('/sync',    auth, ouraController.syncToday);
router.get('/today',    auth, ouraController.getToday);

module.exports = router;
