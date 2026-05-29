const express             = require('express');
const router              = express.Router();
const auth                = require('../middleware/auth');
const googleFitController = require('../controllers/googleFitController');

router.get('/connect',  auth, googleFitController.connect);
router.get('/callback',      googleFitController.callback);
router.get('/status',   auth, googleFitController.getStatus);
router.post('/sync',    auth, googleFitController.syncToday);
router.get('/today',    auth, googleFitController.getToday);

module.exports = router;
