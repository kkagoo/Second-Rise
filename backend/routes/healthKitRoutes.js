const express = require('express');
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const { syncToday } = require('../controllers/healthKitController');

router.post('/sync', auth, syncToday);

module.exports = router;
