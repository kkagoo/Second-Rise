const express        = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const ouraController = require('../controllers/ouraController');

router.put('/token',  auth, ouraController.saveToken);
router.post('/sync',  auth, ouraController.syncToday);
router.get('/today',  auth, ouraController.getToday);

module.exports = router;
