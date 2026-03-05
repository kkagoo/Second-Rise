const express              = require('express');
const router               = express.Router();
const auth                 = require('../middleware/auth');
const biometricsController = require('../controllers/biometricsController');

router.get('/today', auth, biometricsController.getToday);

module.exports = router;
