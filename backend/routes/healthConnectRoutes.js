const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { syncToday } = require('../controllers/healthConnectController');

router.post('/sync', auth, syncToday);

module.exports = router;
