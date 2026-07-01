const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
// Reuse the same controller — schema is identical to Health Connect
const { syncToday } = require('../controllers/healthConnectController');

router.post('/sync', auth, syncToday);

module.exports = router;
